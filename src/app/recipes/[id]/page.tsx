'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRecipes } from '@/contexts/RecipeContext';
import { useShoppingList } from '@/contexts/ShoppingListContext';
import type { Recipe, Ingredient, InstructionStep } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getDisplayUnit } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock, Users, Edit3, Trash2, Printer, ShoppingCart, Utensils, Snowflake, Loader2, AlertTriangle, HomeIcon, RefreshCw, PlusSquare, Info, EyeIcon, EyeOffIcon, Heading2, Share2, ClipboardCopy
} from 'lucide-react';


export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getRecipeById, deleteRecipe, loading: recipesLoading, addRecentlyViewed } = useRecipes();
  const { addIngredientsToShoppingList } = useShoppingList();
  const { toast } = useToast();

  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined); 
  const [multiplier, setMultiplier] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleStepImages, setVisibleStepImages] = useState<Record<string, boolean>>({});

  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recipesLoading && recipeId) {
      const foundRecipe = getRecipeById(recipeId as string);
      setRecipe(foundRecipe); 
      if (foundRecipe) {
        addRecentlyViewed(recipeId as string);
      }
      setIsLoading(false);
    }
  }, [recipeId, getRecipeById, recipesLoading, addRecentlyViewed]);
  
  const servingsDisplay = useMemo(() => {
    if (!recipe) return '';
    const calculatedServings = recipe.servings * multiplier;
    const displayServings = Number(calculatedServings.toFixed(2));
    return `${displayServings} ${recipe.servingUnit}`;
  }, [recipe, multiplier]);

  const displayedIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map(ing => ({
      ...ing,
      amount: ing.isHeading ? 0 : ing.amount * multiplier, // Don't multiply amount for headings
    }));
  }, [recipe, multiplier]);

  const toggleStepImageVisibility = (stepId: string) => {
    setVisibleStepImages(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMultiplier = parseFloat(e.target.value);
    if (!isNaN(newMultiplier) && newMultiplier > 0) {
      setMultiplier(newMultiplier);
    } else if (e.target.value === '') {
      setMultiplier(1); 
    }
  };

  const handleDelete = () => {
    if (recipe) {
      deleteRecipe(recipe.id);
      toast({
        title: "המתכון נמחק",
        description: `"${recipe.name}" הוסר.`,
        variant: 'destructive',
      });
      router.push('/');
    }
  };

  const handleAddAllToShoppingList = () => {
    if (recipe) {
      const nonOptionalAndNonHeadingIngredients = displayedIngredients.filter(ing => !ing.isOptional && !ing.isHeading);
      addIngredientsToShoppingList(nonOptionalAndNonHeadingIngredients, recipe.id, recipe.name);
      toast({
        title: "נוסף לרשימת הקניות",
        description: `רכיבים (לא אופציונליים או כותרות) עבור "${recipe.name}" (מוכפלות פי ${multiplier}) נוספו.`,
      });
    }
  };

  const handleAddSingleIngredientToShoppingList = (ingredient: Ingredient) => {
    if (recipe && !ingredient.isHeading) {
      addIngredientsToShoppingList([ingredient], recipe.id, recipe.name);
      toast({
        title: "נוסף לרשימת הקניות",
        description: `${Number(ingredient.amount.toFixed(2))} ${getDisplayUnit(ingredient.amount, ingredient.unit)} של ${ingredient.name} נוספו.`,
      });
    }
  };
  
  const handlePrint = () => {
    // Temporarily make all step images visible for printing
    const allVisible = Object.fromEntries(recipe?.instructions.map(i => [i.id, true]) || []);
    setVisibleStepImages(allVisible);

    // Allow a moment for images to render before printing
    setTimeout(() => {
      window.print();
       // Revert visibility to user's state after printing
      const originalVisibility = Object.fromEntries(
          recipe?.instructions
          .filter(i => i.imageUrl)
          .map(i => [i.id, !!visibleStepImages[i.id]]) || []
      );
      setVisibleStepImages(originalVisibility);
    }, 500);
  };

  const handleCopyRecipeText = async () => {
    if (!recipe) return;

    let textToCopy = `*${recipe.name}*\n`;
    if(recipe.source) textToCopy += `_מקור: ${recipe.source}_\n`;
    if(recipe.imageUrl) textToCopy = `תמונה: ${recipe.imageUrl}\n${textToCopy}`;
    textToCopy += '\n*רכיבים*\n';
    displayedIngredients.forEach(ing => {
      if(ing.isHeading) {
        textToCopy += `\n_${ing.name}_\n`;
      } else {
        const amount = Number(ing.amount.toFixed(2));
        const unit = getDisplayUnit(ing.amount, ing.unit);
        textToCopy += `- ${ing.name}: ${amount} ${unit}${ing.isOptional ? ' (אופציונלי)' : ''}\n`;
        if (ing.notes) textToCopy += `  _(${ing.notes})_\n`;
      }
    });
    textToCopy += '\n*הוראות*\n';
    let instructionCounter = 1;
    recipe.instructions.forEach(instr => {
       if(instr.isHeading) {
         textToCopy += `\n_${instr.text}_\n`;
       } else {
         textToCopy += `${instructionCounter}. ${instr.text}\n`;
         instructionCounter++;
       }
    });

    try {
      if (navigator.clipboard?.write && recipe.imageUrl) {
          const response = await fetch(recipe.imageUrl);
          const imageBlob = await response.blob();
          
          const reader = new FileReader();
          reader.readAsDataURL(imageBlob);
          const dataUrl = await new Promise<string>(resolve => {
              reader.onloadend = () => resolve(reader.result as string);
          });

          let htmlToCopy = `<h1>${recipe.name}</h1>`;
          if (recipe.source) htmlToCopy += `<em>מקור: ${recipe.source}</em>`;
          htmlToCopy += `<br><img src="${dataUrl}" alt="${recipe.name}" style="max-width: 500px; height: auto;" />`;
          htmlToCopy += `<h2>רכיבים</h2><ul>`;
          displayedIngredients.forEach(ing => {
              if(ing.isHeading) {
                  htmlToCopy += `</ul><h3>${ing.name}</h3><ul>`;
              } else {
                  const amount = Number(ing.amount.toFixed(2));
                  const unit = getDisplayUnit(ing.amount, ing.unit);
                  htmlToCopy += `<li><b>${ing.name}</b>: ${amount} ${unit}${ing.isOptional ? ' (אופציונלי)' : ''}${ing.notes ? ` <em>(${ing.notes})</em>` : ''}</li>`;
              }
          });
          htmlToCopy += `</ul><h2>הוראות</h2><ol>`;
          recipe.instructions.forEach(instr => {
              if (instr.isHeading) {
                htmlToCopy += `</ol><h3>${instr.text}</h3><ol>`;
              } else {
                htmlToCopy += `<li>${instr.text}</li>`;
              }
          });
          htmlToCopy += '</ol>';

          const htmlBlob = new Blob([htmlToCopy], { type: 'text/html' });
          const textBlob = new Blob([textToCopy], {type: 'text/plain' });

          await navigator.clipboard.write([new ClipboardItem({
              'text/html': htmlBlob,
              'text/plain': textBlob,
          })]);
          toast({ title: 'המתכון הועתק!', description: 'המתכון והתמונה הועתקו ללוח.' });
      } else {
         await navigator.clipboard.writeText(textToCopy);
         toast({ title: 'המתכון הועתק (טקסט בלבד)!', description: 'הדפדפן שלך אינו תומך בהעתקת תמונות.' });
      }
    } catch (err) {
      console.error('Failed to copy rich content: ', err);
      navigator.clipboard.writeText(textToCopy).then(() => {
        toast({ title: 'המתכון הועתק (טקסט בלבד)!', description: 'אירעה שגיאה בהעתקת התמונה.', variant: 'default' });
      }).catch(fallbackErr => {
        console.error('Fallback text copy failed: ', fallbackErr);
        toast({ title: 'שגיאת העתקה', description: 'לא ניתן היה להעתיק את המתכון.', variant: 'destructive' });
      });
    }
  };


  if (isLoading || recipesLoading) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-4 text-xl font-semibold text-primary">טוען מתכון...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-3xl font-headline text-destructive mb-4">מתכון לא נמצא</h2>
        <p className="text-muted-foreground font-body mb-6">מצטערים, לא הצלחנו למצוא את המתכון שחיפשתם.</p>
        <Button asChild variant="default">
          <Link href="/" className="flex items-center gap-2">
            <HomeIcon size={18} /> חזור לדף הבית
          </Link>
        </Button>
      </div>
    );
  }
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `בדוק את המתכון הזה: ${recipe.name}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(recipe.name)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;


  const totalTime = () => {
    return `${recipe.prepTime}${recipe.cookTime ? `, ${recipe.cookTime}` : ''}`;
  }

  let instructionStepCounter = 0;
  
  return (
    <div>
      <div ref={printRef}>
        <Card className="overflow-hidden shadow-xl recipe-detail-print">
          <CardHeader className="p-0 relative">
            {recipe.imageUrl && (
              <div className="w-full h-64 md:h-96 relative print-image-container">
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  layout="fill"
                  className="object-cover"
                  priority
                  unoptimized
                  data-ai-hint="recipe food photography"
                />
              </div>
            )}
            <div className={`print-header-overlay ${recipe.imageUrl ? "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end" : "p-6 bg-primary/10"}`}>
              <CardTitle className={`text-4xl md:text-5xl font-headline print-title ${recipe.imageUrl ? 'text-white' : 'text-primary'}`}>{recipe.name}</CardTitle>
              {recipe.source && <CardDescription className={`mt-1 text-lg print-source ${recipe.imageUrl ? 'text-gray-200' : 'text-muted-foreground'} font-body italic`}>מקור: {recipe.source}</CardDescription>}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center bg-secondary/30 p-4 rounded-lg">
              <div className="font-body">
                <Clock size={24} className="mx-auto mb-1 text-primary" />
                <p className="font-semibold">זמן</p>
                <p className="text-sm text-muted-foreground">{totalTime()}</p>
              </div>
              <div className="font-body">
                <Users size={24} className="mx-auto mb-1 text-primary" />
                <p className="font-semibold">מנות</p>
                <p className="text-sm text-muted-foreground">{servingsDisplay}</p>
              </div>
              <div className="font-body">
                {recipe.freezable ? <Snowflake size={24} className="mx-auto mb-1 text-primary" /> : <Utensils size={24} className="mx-auto mb-1 text-muted-foreground" />}
                <p className="font-semibold">ניתן להקפאה</p>
                <p className="text-sm text-muted-foreground">{recipe.freezable ? 'כן' : 'לא'}</p>
              </div>
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map(tag => (
                  <Badge key={tag} variant="default" className="font-body text-sm bg-accent text-accent-foreground border border-accent hover:bg-accent/90">{tag}</Badge>
                ))}
              </div>
            )}

            <Separator />

            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2 no-print">
                <h3 className="text-2xl font-headline text-primary">רכיבים</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="multiplier" className="font-body">הכפל כמויות ב:</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    value={multiplier}
                    onChange={handleMultiplierChange}
                    min="0.1"
                    step="0.1"
                    className="w-20 h-9 text-center"
                  />
                  <Button variant="outline" size="icon" onClick={() => setMultiplier(1)} title="אפס מכפיל" className="h-9 w-9">
                    <RefreshCw size={16}/>
                  </Button>
                </div>
              </div>
              <div className="space-y-1 font-body">
                {displayedIngredients.map(ingredient => (
                  ingredient.isHeading ? (
                    <h4 key={ingredient.id} className="text-lg font-semibold text-accent mt-4 mb-2 pt-2 border-t border-dashed">
                      <Heading2 size={18} className="inline-block me-2 align-middle" />
                      {ingredient.name}
                    </h4>
                  ) : (
                    <div key={ingredient.id} className="flex flex-col p-3 bg-background rounded-md shadow-sm hover:bg-secondary/20 transition-colors">
                      <div className="flex items-center w-full">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="me-2 no-print text-green-600 hover:text-green-700 hover:bg-green-500/10 h-8 w-8" 
                          onClick={() => handleAddSingleIngredientToShoppingList(ingredient)}
                          aria-label={`הוסף ${ingredient.name} לרשימת הקניות`}
                          title={`הוסף ${ingredient.name} לרשימת הקניות`}
                        >
                          <PlusSquare size={20} />
                        </Button>
                        <span className="font-semibold text-primary flex-1">
                            {ingredient.name}
                            {ingredient.isOptional && <span className="text-xs text-muted-foreground ms-1">(אופציונלי)</span>}
                        </span>
                        <span className="text-muted-foreground flex-1 text-center">
                          {Number((ingredient.amount).toFixed(2))} {getDisplayUnit(ingredient.amount, ingredient.unit)}
                        </span>
                        <span className="text-xs text-gray-400 flex-1 text-left italic no-print">
                          {multiplier !== 1 && `(מקורי: ${Number((ingredient.amount / multiplier).toFixed(2))} ${getDisplayUnit(ingredient.amount/multiplier, ingredient.unit)})`}
                        </span>
                      </div>
                      {ingredient.notes && (
                        <div className="ps-10 pt-1 text-xs text-muted-foreground/80 flex items-center">
                            <Info size={12} className="me-1.5 text-accent"/>
                            <span>{ingredient.notes}</span>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-2xl font-headline text-primary mb-3">הוראות</h3>
              <ol className="list-none space-y-4 font-body text-base md:text-lg leading-relaxed ps-0">
                {recipe.instructions.map((step) => {
                  if (step.isHeading) {
                    return (
                      <h4 key={step.id} className="text-lg font-semibold text-accent mt-4 mb-2 pt-2 border-t border-dashed">
                        <Heading2 size={18} className="inline-block me-2 align-middle" />
                        {step.text}
                      </h4>
                    );
                  }
                  instructionStepCounter++;
                  return (
                    <li key={step.id} className="pe-2 border-r-2 border-primary/50 py-2 hover:bg-primary/5 transition-colors rounded-l-md space-y-2">
                      <div className="flex">
                        <span className="font-headline text-xl text-primary me-3">{instructionStepCounter}.</span>
                        <span>{step.text}</span>
                      </div>
                      {step.imageUrl && (
                        <div className="mt-2 ms-10 space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleStepImageVisibility(step.id)} 
                            className="flex items-center gap-1.5 text-xs no-print"
                          >
                            {visibleStepImages[step.id] ? <EyeOffIcon size={14}/> : <EyeIcon size={14}/>}
                            {visibleStepImages[step.id] ? 'הסתר תמונה' : 'הצג תמונה'}
                          </Button>
                          {visibleStepImages[step.id] && (
                            <div className="relative w-[300px] h-[225px] step-image-container">
                              <Image 
                                src={step.imageUrl} 
                                alt={`תמונה עבור שלב ${instructionStepCounter}`} 
                                layout="fill"
                                className="rounded-md object-cover border shadow-sm"
                                unoptimized
                                data-ai-hint="cooking instruction photo"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-6 flex flex-col sm:flex-row justify-start items-center gap-3 border-t no-print mt-4 rounded-b-lg bg-card">
          <Button asChild variant="outline" className="w-full sm:w-auto flex items-center gap-2">
            <Link href={`/recipes/edit/${recipe.id}`}>
              <Edit3 size={18} /> ערוך
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto flex items-center gap-2">
                <Trash2 size={18} /> מחק
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription>
                  לא ניתן לבטל פעולה זו. הפעולה תמחק לצמיתות את המתכון "{recipe.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>מחק</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="ms-auto flex flex-wrap justify-end gap-2">
             <Button variant="outline" onClick={handleAddAllToShoppingList} className="flex-grow sm:flex-grow-0 flex items-center gap-2">
               <ShoppingCart size={18} /> הוסף הכל לרשימת קניות
             </Button>
             <Button variant="outline" onClick={handlePrint} size="icon" title="הדפס">
               <Printer size={18} />
             </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="שתף או הורד">
                  <Share2 size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyRecipeText} className="flex items-center gap-2 cursor-pointer">
                  <ClipboardCopy size={18} />
                  העתק מתכון (עם תמונה)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                   <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    שתף קישור ב-WhatsApp
                  </a>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <a href={emailUrl} className="flex items-center gap-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                    שתף קישור באימייל
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
    </div>
  );
}

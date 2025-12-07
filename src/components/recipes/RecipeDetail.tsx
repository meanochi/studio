
'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRecipes } from '@/contexts/RecipeContext';
import { useShoppingList } from '@/contexts/ShoppingListContext';
import type { Recipe, Ingredient, InstructionStep, MealPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getDisplayUnit, generateId } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock, Users, Edit3, Trash2, Printer, ShoppingCart, Utensils, Snowflake, Loader2, AlertTriangle, HomeIcon, RefreshCw, PlusSquare, Info, EyeIcon, EyeOffIcon, Heading2, Share2, ClipboardCopy, StickyNote, MoreVertical, CalendarPlus
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';

interface RecipeDetailProps {
    recipeId: string;
}

export default function RecipeDetail({ recipeId }: RecipeDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getRecipeById, deleteRecipe, loading: recipesLoading, addRecentlyViewed } = useRecipes();
  const { addIngredientsToShoppingList } = useShoppingList();
  const { toast } = useToast();

  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined); 
  const [multiplier, setMultiplier] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleStepImages, setVisibleStepImages] = useState<Record<string, boolean>>({});
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  
  const printRef = useRef<HTMLDivElement>(null);

  const initializeImageVisibility = useCallback((recipeToInit: Recipe) => {
    const initialVisibility: Record<string, boolean> = {};
    recipeToInit.instructions.forEach(step => {
      if (step.imageUrl && step.id) {
        initialVisibility[step.id] = true;
      }
    });
    setVisibleStepImages(initialVisibility);
  }, []);

  useEffect(() => {
    if (!recipesLoading && recipeId) {
      const foundRecipe = getRecipeById(recipeId as string);
      setRecipe(foundRecipe); 
      if (foundRecipe) {
        const planMultiplier = searchParams.get('multiplier');
        if (planMultiplier && !isNaN(Number(planMultiplier))) {
          setMultiplier(Number(planMultiplier));
        } else {
          setMultiplier(1);
        }
        addRecentlyViewed(recipeId as string);
        initializeImageVisibility(foundRecipe);
      }
      setIsLoading(false);
    }
  }, [recipeId, getRecipeById, recipesLoading, addRecentlyViewed, initializeImageVisibility, searchParams]);

  useEffect(() => {
    const plansQuery = query(collection(db, 'mealPlans'));
    const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlan));
      setMealPlans(plansData);
      if (plansData.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansData[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedPlanId]);
  
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
    setVisibleStepImages(prev => ({ ...prev, [stepId] : !prev[stepId] }));
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
    if (!recipe) return;
    const allVisible: Record<string, boolean> = {};
    recipe.instructions.forEach(step => {
      if(step.id) allVisible[step.id] = true;
    });
    const currentVisibility = { ...visibleStepImages };
    setVisibleStepImages(allVisible);
    
    setTimeout(() => {
      window.print();
      setVisibleStepImages(currentVisibility); // Restore previous state
    }, 500);
  };

  const handleCopyRecipeText = async () => {
    if (!recipe) return;

    let textToCopy = `*${recipe.name}*\n`;
    if(recipe.source) textToCopy += `_מקור: ${recipe.source}_\n`;
    const imageUrl = recipe.imageUrl;
    if(imageUrl) textToCopy = `תמונה: ${imageUrl}\n${textToCopy}`;
    textToCopy += '\n*רכיבים*\n';
    displayedIngredients.forEach(ing => {
      if(ing.isHeading) {
        textToCopy += `\n_${ing.name}_\n`;
      } else {
        const amount = Number(ing.amount.toFixed(2));
        const unit = getDisplayUnit(ing.amount, ing.unit);
        textToCopy += `- ${amount} ${unit} ${ing.name}${ing.isOptional ? ' (אופציונלי)' : ''}\n`;
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

    if (recipe.notes) {
        textToCopy += `\n*הערות*\n${recipe.notes}\n`;
    }

    try {
      if (navigator.clipboard?.write && imageUrl) {
          const response = await fetch(imageUrl);
          const imageBlob = await response.blob();
          
          let htmlToCopy = `<h1>${recipe.name}</h1>`;
          if (recipe.source) htmlToCopy += `<em>מקור: ${recipe.source}</em>`;
          
          const reader = new FileReader();
          reader.readAsDataURL(imageBlob);
          const dataUrl = await new Promise<string>(resolve => {
              reader.onloadend = () => resolve(reader.result as string);
          });
          htmlToCopy += `<br><img src="${dataUrl}" alt="${recipe.name}" style="max-width: 500px; height: auto;" />`;

          htmlToCopy += `<h2>רכיבים</h2><ul>`;
          displayedIngredients.forEach(ing => {
              if(ing.isHeading) {
                  htmlToCopy += `</ul><h3>${ing.name}</h3><ul>`;
              } else {
                  const amount = Number(ing.amount.toFixed(2));
                  const unit = getDisplayUnit(ing.amount, ing.unit);
                  htmlToCopy += `<li>${amount} ${unit} <b>${ing.name}</b>${ing.isOptional ? ' (אופציונלי)' : ''}${ing.notes ? ` <em>(${ing.notes})</em>` : ''}</li>`;
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
          if (recipe.notes) {
              htmlToCopy += `<h2>הערות</h2><p>${recipe.notes.replace(/\n/g, '<br>')}</p>`;
          }
          
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
        toast({ title: 'המתכון הועתק (טקסט וקישור לתמונה)!', description: 'אירעה שגיאה בהעתקת התמונה.', variant: 'default' });
      }).catch(fallbackErr => {
        console.error('Fallback text copy failed: ', fallbackErr);
        toast({ title: 'שגיאת העתקה', description: 'לא ניתן היה להעתיק את המתכון.', variant: 'destructive' });
      });
    }
  };
  
  const handleAddToPlan = async () => {
    if (!selectedPlanId || !recipeId) {
      toast({ title: "שגיאה", description: "אנא בחר תכנית.", variant: "destructive" });
      return;
    }
    setIsAddingToPlan(true);
    try {
      const planRef = doc(db, 'mealPlans', selectedPlanId);
      const planSnap = await getDoc(planRef);
      if (planSnap.exists()) {
        const planData = planSnap.data();
        const items = planData.items || [];
        const existingItemIndex = items.findIndex((item: any) => item.recipeId === recipeId);

        let updatedItems;
        if (existingItemIndex > -1) {
          updatedItems = [...items];
          updatedItems[existingItemIndex].multiplier += 1;
        } else {
          updatedItems = [...items, { id: generateId(), recipeId: recipeId, multiplier: 1 }];
        }
        await updateDoc(planRef, { items: updatedItems });
        
        toast({
          title: "המתכון נוסף!",
          description: `"${recipe?.name}" נוסף לתכנית "${planData.name}".`,
        });
        setIsPlanDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding recipe to plan:", error);
      toast({ title: 'שגיאה', description: 'לא ניתן היה להוסיף את המתכון לתכנית.', variant: 'destructive' });
    } finally {
      setIsAddingToPlan(false);
    }
  };
  
  const filteredMealPlans = useMemo(() => {
    if (!planSearchTerm) {
      return mealPlans;
    }
    return mealPlans.filter(plan =>
      plan.name.toLowerCase().includes(planSearchTerm.toLowerCase())
    );
  }, [mealPlans, planSearchTerm]);


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
  const hasImage = !!recipe.imageUrl;

  const totalTime = () => {
    const prep = recipe.prepTime || '';
    const cook = recipe.cookTime || '';
    if (prep && cook) return `${prep}, ${cook}`;
    return prep || cook;
  }

  let instructionStepCounter = 0;
  
  return (
    <div>
      <div ref={printRef}>
        <Card className="overflow-hidden shadow-xl recipe-detail-print">
          <CardHeader className="p-0 relative">
            {hasImage ? (
              <div className="w-full h-64 md:h-96 relative print-image-container">
                <Image
                  src={recipe.imageUrl!}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
                <div className="w-full h-64 md:h-96 relative print-image-container bg-secondary flex items-center justify-center">
                    <span className="text-primary font-headline text-7xl">{recipe.name.charAt(0)}</span>
                </div>
            )}
            <div className={`print-header-overlay ${hasImage ? "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end items-end" : "p-6 bg-primary/10 text-right"}`}>
              <div className="flex items-center gap-4 justify-end w-full">
                <CardTitle className={`w-full text-4xl md:text-5xl font-headline print-title text-right ${hasImage ? 'text-white' : 'text-primary'}`}>{recipe.name}</CardTitle>
                <Button asChild variant="outline" size="icon" className={`no-print rounded-full ${hasImage ? 'bg-white/20 text-white hover:bg-white/30 border-white/50' : 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/50'}`}>
                    <Link href={`/recipes/edit/${recipe.id}`} title="ערוך מתכון">
                        <Edit3 size={18} />
                    </Link>
                </Button>
              </div>
              {recipe.source && <CardDescription className={`w-full mt-1 text-lg print-source text-right ${hasImage ? 'text-gray-200' : 'text-muted-foreground'} font-body italic`}>מקור: {recipe.source}</CardDescription>}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6 print-main-content">
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
              <div className="flex flex-wrap justify-end gap-2">
                {recipe.tags.map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="default" className="font-body text-sm bg-accent text-accent-foreground border border-accent hover:bg-accent/90">{tag}</Badge>
                ))}
              </div>
            )}
            
            {recipe.notes && (
                <div className="text-right">
                  <h3 className="text-2xl font-headline text-primary mb-2 flex items-center justify-end gap-2">
                    <StickyNote size={22} />
                    הערות
                  </h3>
                  <div className="p-4 bg-background rounded-md border shadow-sm">
                    <p className="font-body whitespace-pre-wrap">{recipe.notes}</p>
                  </div>
                </div>
            )}

            <Separator />

            <div className="text-right">
              <div className="flex flex-col sm:flex-row-reverse justify-between items-center mb-3 gap-2 no-print">
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
                <h3 className="text-2xl font-headline text-primary">רכיבים</h3>
              </div>
              <div className="space-y-1 font-body">
                {displayedIngredients.map(ingredient => (
                  ingredient.isHeading ? (
                    <h2 key={ingredient.id} className="text-lg font-semibold text-accent mt-4 mb-2 pt-2 border-t border-dashed w-full flex items-center justify-start gap-2 ingredient-heading-print">
                      <Heading2 size={20} className="inline-block align-middle" />
                      {ingredient.name}
                    </h2>
                  ) : (
                    <div key={ingredient.id} className="block text-right p-3 bg-background rounded-md shadow-sm hover:bg-secondary/20 transition-colors ingredient-item-print">
                      <div className="flex items-center justify-between">
                         <div className="flex-grow text-right">
                            <div className="text-foreground">
                                <span className="font-semibold text-primary">{Number((ingredient.amount).toFixed(2))}</span> {getDisplayUnit(ingredient.amount, ingredient.unit)} {ingredient.name}
                                {ingredient.isOptional && <span className="text-xs text-muted-foreground mr-1">(אופציונלי)</span>}
                            </div>
                         </div>
                        <div className="flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="no-print text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8" 
                            onClick={() => handleAddSingleIngredientToShoppingList(ingredient)}
                            aria-label={`הוסף ${ingredient.name} לרשימת הקניות`}
                            title={`הוסף ${ingredient.name} לרשימת הקניות`}
                          >
                            <PlusSquare size={20} />
                          </Button>
                        </div>
                      </div>
                       <div className="text-xs text-gray-400 italic no-print mr-1">
                        {multiplier !== 1 && `(מקורי: ${Number((ingredient.amount / multiplier).toFixed(2))} ${getDisplayUnit(ingredient.amount/multiplier, ingredient.unit)})`}
                      </div>
                       {ingredient.notes && (
                        <div className="pr-4 pt-1 text-xs text-muted-foreground/80 flex items-center justify-end">
                            <Info size={12} className="ml-1.5 text-accent"/>
                            <span>{ingredient.notes}</span>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>

            <Separator />

            <div className="text-right">
              <h3 className="text-2xl font-headline text-primary mb-3">הוראות</h3>
              <ol className="list-none space-y-4 font-body text-base md:text-lg leading-relaxed ps-0">
                {recipe.instructions.map((step, index) => {
                  if (step.isHeading) {
                    return (
                      <h4 key={step.id} className="text-lg font-semibold text-accent mt-4 mb-2 pt-2 border-t border-dashed w-full flex items-center justify-end gap-2">
                        <Heading2 size={18} className="inline-block align-middle" />
                        {step.text}
                      </h4>
                    );
                  }
                  instructionStepCounter++;
                  return (
                    <li key={step.id} className="pr-2 border-r-2 border-primary/50 py-2 hover:bg-primary/5 transition-colors rounded-r-md space-y-2 instruction-step-print">
                      <div className="flex justify-start">
                         <span className="font-headline text-xl text-primary mr-3">{instructionStepCounter}.</span>
                        <p className="max-w-prose">{step.text}</p>
                      </div>
                      {step.imageUrl && step.id && (
                        <div className="mt-2 ml-10 space-y-2 flex flex-col items-start">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleStepImageVisibility(step.id!)} 
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
                                fill
                                className="rounded-md object-cover border shadow-sm"
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
      
      <div className="p-6 flex flex-col sm:flex-row-reverse justify-between items-center gap-3 border-t no-print mt-4 rounded-b-lg bg-card">
        <div className="flex-grow sm:flex-grow-0 flex items-center gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" title="מחק מתכון" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 size={18} />
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
             <Button variant="outline" onClick={handlePrint} size="icon" title="הדפס">
              <Printer size={18} />
            </Button>
             <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="הוסף לתכנית">
                        <CalendarPlus size={18} />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>הוסף מתכון לתכנית ארוחות</DialogTitle>
                    </DialogHeader>
                    {mealPlans.length > 0 ? (
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="חפש תכנית..."
                                value={planSearchTerm}
                                onChange={(e) => setPlanSearchTerm(e.target.value)}
                                className="mb-4"
                            />
                            <RadioGroup
                                value={selectedPlanId}
                                onValueChange={setSelectedPlanId}
                                className="space-y-2 max-h-60 overflow-y-auto"
                            >
                                {filteredMealPlans.map(plan => (
                                    <div key={plan.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <RadioGroupItem value={plan.id} id={plan.id} />
                                        <Label htmlFor={plan.id}>{plan.name}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {filteredMealPlans.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center">לא נמצאו תכניות תואמות.</p>
                            )}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-muted-foreground">
                            <p>לא נמצאו תכניות ארוחות.</p>
                            <Button variant="link" asChild><Link href="/meal-plans">צור תכנית חדשה</Link></Button>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">ביטול</Button></DialogClose>
                        <Button onClick={handleAddToPlan} disabled={isAddingToPlan || !selectedPlanId}>
                            {isAddingToPlan ? <Loader2 className="animate-spin" /> : "הוסף לתכנית"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
         <div className="flex-grow sm:flex-grow-0 flex items-center gap-2">
          <Button variant="outline" onClick={handleAddAllToShoppingList} className="flex-grow sm:flex-grow-0 flex items-center gap-2">
              <ShoppingCart size={18} /> הוסף הכל לרשימת קניות
          </Button>
        </div>
        </div>
    </div>
  );
}

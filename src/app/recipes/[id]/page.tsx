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
  Clock, Users, Edit3, Trash2, Printer, ShoppingCart, Utensils, Snowflake, Loader2, AlertTriangle, HomeIcon, RefreshCw, PlusSquare, Image as ImageIcon, Info, EyeIcon, EyeOffIcon
} from 'lucide-react';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getRecipeById, deleteRecipe, loading: recipesLoading } = useRecipes();
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
      setIsLoading(false);
    }
  }, [recipeId, getRecipeById, recipesLoading]);
  
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
      amount: ing.amount * multiplier,
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
      const nonOptionalIngredients = displayedIngredients.filter(ing => !ing.isOptional);
      addIngredientsToShoppingList(nonOptionalIngredients, recipe.id, recipe.name);
      toast({
        title: "נוסף לרשימת הקניות",
        description: `רכיבים (לא אופציונליים) עבור "${recipe.name}" (מוכפלות פי ${multiplier}) נוספו.`,
      });
    }
  };

  const handleAddSingleIngredientToShoppingList = (ingredient: Ingredient) => {
    if (recipe) {
      addIngredientsToShoppingList([ingredient], recipe.id, recipe.name);
      toast({
        title: "נוסף לרשימת הקניות",
        description: `${Number(ingredient.amount.toFixed(2))} ${getDisplayUnit(ingredient.amount, ingredient.unit)} של ${ingredient.name} נוספו.`,
      });
    }
  };
  
  const handlePrint = () => {
    window.print();
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

  const totalTime = () => {
    return `${recipe.prepTime}${recipe.cookTime ? `, ${recipe.cookTime}` : ''}`;
  }
  
  return (
    <div ref={printRef}>
      <Card className="overflow-hidden shadow-xl recipe-detail-print">
        <CardHeader className="p-0 relative">
          {recipe.imageUrl && (
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              width={1200}
              height={600}
              className="w-full h-64 md:h-96 object-cover"
              priority
              data-ai-hint="recipe food photography"
            />
          )}
          <div className={recipe.imageUrl ? "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end" : "p-6 bg-primary/10"}>
            <CardTitle className={`text-4xl md:text-5xl font-headline ${recipe.imageUrl ? 'text-white' : 'text-primary'}`}>{recipe.name}</CardTitle>
            {recipe.source && <CardDescription className={`mt-1 text-lg ${recipe.imageUrl ? 'text-gray-200' : 'text-muted-foreground'} font-body italic`}>מקור: {recipe.source}</CardDescription>}
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
            <ul className="list-none space-y-3 font-body ps-0">
              {displayedIngredients.map(ingredient => (
                <li key={ingredient.id} className="flex flex-col p-3 bg-background rounded-md shadow-sm hover:bg-secondary/20 transition-colors">
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
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="text-2xl font-headline text-primary mb-3">הוראות</h3>
            <ol className="list-decimal list-inside space-y-4 font-body text-base md:text-lg leading-relaxed">
              {recipe.instructions.map((step, index) => (
                <li key={step.id} className="pe-2 border-r-2 border-primary/50 py-2 hover:bg-primary/5 transition-colors rounded-l-md space-y-2">
                  <span>{step.text}</span>
                  {step.imageUrl && (
                    <div className="mt-2 ms-4 space-y-2">
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
                        <Image 
                          src={step.imageUrl} 
                          alt={`תמונה עבור שלב ${index + 1}`} 
                          width={300} 
                          height={225} 
                          className="rounded-md object-cover border shadow-sm"
                          data-ai-hint="cooking instruction photo"
                        />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>

        <CardFooter className="p-6 flex flex-col sm:flex-row justify-start items-center gap-3 border-t no-print">
          <Button variant="outline" onClick={handleAddAllToShoppingList} className="w-full sm:w-auto flex items-center gap-2">
            <ShoppingCart size={18} /> הוסף הכל לרשימת קניות
          </Button>
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto flex items-center gap-2">
            <Printer size={18} /> הדפס מתכון
          </Button>
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
        </CardFooter>
      </Card>
    </div>
  );
}

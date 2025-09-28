
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle, AlertTriangle, CalendarDays, BookOpen, Copy, ShoppingCart } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, Timestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { MealPlan, Recipe, Ingredient } from '@/types';
import { useRecipes } from '@/contexts/RecipeContext';
import { useShoppingList } from '@/contexts/ShoppingListContext';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

const MEAL_PLANS_COLLECTION = 'mealPlans';

export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  
  const { recipes, loading: recipesLoading } = useRecipes();
  const { addIngredientsToShoppingList } = useShoppingList();
  const { toast } = useToast();

  useEffect(() => {
    const plansQuery = query(collection(db, MEAL_PLANS_COLLECTION), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
      const plansData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          recipeIds: data.recipeIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setMealPlans(plansData);
      setIsLoading(false);
    }, (error) => {
      console.error('Failed to load meal plans from Firestore', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן היה לטעון את תכניות הארוחות.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) {
      toast({
        title: 'חסר שם',
        description: 'אנא תן שם לתכנית הארוחות שלך.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, MEAL_PLANS_COLLECTION), {
        name: newPlanName,
        createdAt: Timestamp.now(),
        recipeIds: [],
      });
      setNewPlanName('');
      toast({
        title: 'תכנית חדשה נוצרה!',
        description: `תכנית "${newPlanName}" נוספה.`,
      });
    } catch (error) {
      console.error('Failed to save plan to Firestore', error);
      toast({
        title: 'שגיאת שמירה',
        description: 'לא ניתן היה לשמור את התכנית. נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteDoc(doc(db, MEAL_PLANS_COLLECTION, planId));
      toast({
        title: 'התכנית נמחקה',
        variant: 'destructive'
      });
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast({
        title: 'שגיאת מחיקה',
        description: 'לא ניתן היה למחוק את התכנית.',
        variant: 'destructive',
      });
    }
  };

  const handleAddRecipeToPlan = async (planId: string, recipeId: string) => {
    if (!recipeId) return;
    try {
        const planRef = doc(db, MEAL_PLANS_COLLECTION, planId);
        await updateDoc(planRef, {
            recipeIds: arrayUnion(recipeId)
        });
        toast({
            title: "מתכון נוסף לתכנית"
        });
    } catch (error) {
        console.error("Error adding recipe to plan:", error);
        toast({ title: 'שגיאה', description: 'לא ניתן היה להוסיף את המתכון.', variant: 'destructive' });
    }
  };

  const handleDuplicateRecipeInPlan = useCallback(async (planId: string, recipeId: string) => {
    try {
      const planRef = doc(db, MEAL_PLANS_COLLECTION, planId);
      await updateDoc(planRef, {
        recipeIds: arrayUnion(recipeId)
      });
      toast({
        title: "מתכון שוכפל",
        description: "המתכון נוסף שוב לתכנית."
      });
    } catch(error) {
       console.error("Error duplicating recipe in plan:", error);
       toast({ title: 'שגיאה', description: 'לא ניתן היה לשכפל את המתכון.', variant: 'destructive' });
    }
  }, [toast]);

  const handleRemoveRecipeFromPlan = useCallback(async (plan: MealPlan, recipeId: string, indexToRemove: number) => {
      try {
        const updatedRecipeIds = [...plan.recipeIds];
        updatedRecipeIds.splice(indexToRemove, 1);
        
        const planRef = doc(db, MEAL_PLANS_COLLECTION, plan.id);
        await updateDoc(planRef, {
            recipeIds: updatedRecipeIds
        });
        toast({
            title: "מתכון הוסר מהתכנית",
            variant: "destructive"
        });
    } catch (error) {
        console.error("Error removing recipe from plan:", error);
        toast({ title: 'שגיאה', description: 'לא ניתן היה להסיר את המתכון.', variant: 'destructive' });
    }
  }, [toast]);

  const handleAddPlanToShoppingList = (plan: MealPlan) => {
    const allIngredients: { recipe: Recipe, ingredients: Ingredient[] }[] = [];
    
    plan.recipeIds.forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        const nonOptionalIngredients = recipe.ingredients.filter(ing => !ing.isOptional && !ing.isHeading);
        nonOptionalIngredients.forEach(ing => {
          addIngredientsToShoppingList([ing], recipe.id, recipe.name);
        });
      }
    });

    toast({
      title: "נוסף לרשימת קניות",
      description: `כל הרכיבים מתכנית "${plan.name}" נוספו לרשימת הקניות.`,
    });
  };

  const sortedRecipes = useMemo(() => recipes.slice().sort((a, b) => a.name.localeCompare(b.name, 'he')), [recipes]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center gap-3">
            <CalendarDays size={30} />
            צור תכנית ארוחות חדשה
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleAddPlan}>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              צור רשימות מתכונים לאירועים כמו "ארוחת שבת" או "חג הפסח".
            </p>
            <div className="flex items-center gap-2">
                <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="שם התכנית"
                className="text-base"
                disabled={isSaving}
                />
                 <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                    {isSaving ? 'יוצר...' : 'צור תכנית'}
                </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <div className="space-y-6">
        {isLoading || recipesLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ms-4 text-xl font-semibold text-primary">טוען תכניות...</p>
          </div>
        ) : mealPlans.length > 0 ? (
          mealPlans.map(plan => (
            <Card key={plan.id} className="shadow-md">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-2xl font-headline text-accent">{plan.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      נוצר ב: {format(plan.createdAt, 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAddPlanToShoppingList(plan)} className="flex items-center gap-1.5">
                      <ShoppingCart size={16} /> הוסף הכל לרשימת קניות
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 size={18} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                          <AlertDialogDescription>
                            פעולה זו תמחק את התכנית "{plan.name}" לצמיתות.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>מחק</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Select onValueChange={(recipeId) => handleAddRecipeToPlan(plan.id, recipeId)}>
                        <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="הוסף מתכון לתכנית..." />
                        </SelectTrigger>
                        <SelectContent>
                            {sortedRecipes.map(recipe => (
                                <SelectItem key={recipe.id} value={recipe.id}>
                                    {recipe.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {plan.recipeIds.length > 0 ? (
                    <ul className="space-y-2">
                        {plan.recipeIds.map((recipeId, index) => {
                            const recipe = recipes.find(r => r.id === recipeId);
                            if (!recipe) return null;
                            return (
                                <li key={`${recipeId}-${index}`} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md">
                                    <Link href={`/recipes/${recipe.id}`} className="font-semibold text-primary hover:underline flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                                        <BookOpen size={16}/> {recipe.name}
                                    </Link>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/80" onClick={() => handleDuplicateRecipeInPlan(plan.id, recipeId)} title="שכפל מתכון">
                                          <Copy size={16} />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRecipeFromPlan(plan, recipeId, index)} title="הסר מתכון">
                                          <Trash2 size={16} />
                                      </Button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">עדיין אין מתכונים בתכנית זו. הוסף מתכון מהרשימה למעלה.</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
             <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground font-body">עדיין אין תכניות ארוחות.</p>
            <p className="text-muted-foreground font-body">השתמש בטופס למעלה כדי ליצור את התכנית הראשונה.</p>
          </div>
        )}
      </div>
    </div>
  );
}

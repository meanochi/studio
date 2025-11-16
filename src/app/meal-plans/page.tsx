
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle, AlertTriangle, CalendarDays, BookOpen, ShoppingCart, Minus, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from 'firebase/firestore';
import type { MealPlan, Recipe, Ingredient, MealPlanItem } from '@/types';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from 'date-fns';
import { generateId, cn } from '@/lib/utils';
import { useHeader } from '@/contexts/HeaderContext';
import { useRouter } from 'next/navigation';

const MEAL_PLANS_COLLECTION = 'mealPlans';

export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({});
  
  const { recipes, loading: recipesLoading, getRecipeById } = useRecipes();
  const { addIngredientsToShoppingList } = useShoppingList();
  const { toast } = useToast();
  const { setActiveTab, setOpenTabs } = useHeader();
  const router = useRouter();


  const handleOpenRecipeTab = (recipeId: string, multiplier: number) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    setOpenTabs(prev => {
        if (!prev.some(tab => tab.id === recipeId)) {
            return [...prev, recipe];
        }
        return prev;
    });
    
    // Navigate to home page and set active tab
    // The query param will be picked up by the RecipeDetail component
    const url = `/?recipeId=${recipeId}&multiplier=${multiplier}`;
    router.push('/');
    
    // Needs a slight delay to allow the router to navigate before setting the active tab
    setTimeout(() => {
        setActiveTab(recipeId);
    }, 100);
  };

  useEffect(() => {
    const plansQuery = query(collection(db, MEAL_PLANS_COLLECTION), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
      const plansData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          items: data.items || [],
          createdAt: data.createdAt?.toDate(),
        } as MealPlan;
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
        items: [],
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
  
  const handleAddRecipeToPlan = async (plan: MealPlan, recipeId: string) => {
    if (!recipeId) return;
    try {
        const planRef = doc(db, MEAL_PLANS_COLLECTION, plan.id);
        const existingItemIndex = plan.items.findIndex(item => item.recipeId === recipeId);

        if (existingItemIndex > -1) {
            // If item already exists, just increment its multiplier
            const updatedItems = [...plan.items];
            updatedItems[existingItemIndex].multiplier += 1;
            await updateDoc(planRef, { items: updatedItems });
        } else {
            // Otherwise, add a new item
            const newItem: MealPlanItem = { id: generateId(), recipeId, multiplier: 1 };
            const updatedItems = [...plan.items, newItem];
            await updateDoc(planRef, { items: updatedItems });
        }
        
        setPopoverOpen(prev => ({...prev, [plan.id]: false}));
        toast({ title: "מתכון נוסף לתכנית" });
    } catch (error) {
        console.error("Error adding recipe to plan:", error);
        toast({ title: 'שגיאה', description: 'לא ניתן היה להוסיף את המתכון.', variant: 'destructive' });
    }
  };

  const handleUpdateRecipeMultiplier = useCallback(async (plan: MealPlan, itemId: string, change: number) => {
    const planRef = doc(db, MEAL_PLANS_COLLECTION, plan.id);
    const itemIndex = plan.items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return;

    const updatedItems = [...plan.items];
    const newMultiplier = updatedItems[itemIndex].multiplier + change;

    if (newMultiplier <= 0) {
      // Remove item if multiplier is 0 or less
      updatedItems.splice(itemIndex, 1);
    } else {
      updatedItems[itemIndex].multiplier = newMultiplier;
    }
    
    try {
      await updateDoc(planRef, { items: updatedItems });
    } catch (error) {
       console.error("Error updating recipe multiplier:", error);
       toast({ title: 'שגיאה', description: 'לא ניתן היה לעדכן את כמות המתכון.', variant: 'destructive' });
    }
  }, [toast]);
  
  const handleRemoveRecipeFromPlan = useCallback(async (plan: MealPlan, itemId: string) => {
    const planRef = doc(db, MEAL_PLANS_COLLECTION, plan.id);
    const updatedItems = plan.items.filter(item => item.id !== itemId);
    
    try {
        await updateDoc(planRef, { items: updatedItems });
        toast({
            title: "המתכון הוסר מהתכנית",
            variant: "destructive"
        });
    } catch (error) {
        console.error("Error removing recipe from plan:", error);
        toast({ title: 'שגיאה', description: 'לא ניתן היה להסיר את המתכון.', variant: 'destructive' });
    }
  }, [toast]);


  const handleAddPlanToShoppingList = (plan: MealPlan) => {
    plan.items.forEach(item => {
      const recipe = recipes.find(r => r.id === item.recipeId);
      if (recipe) {
        const scaledIngredients = recipe.ingredients
          .filter(ing => !ing.isOptional && !ing.isHeading)
          .map(ing => ({
            ...ing,
            amount: ing.amount * item.multiplier,
          }));
        addIngredientsToShoppingList(scaledIngredients, recipe.id, recipe.name);
      }
    });

    toast({
      title: "נוסף לרשימת קניות",
      description: `כל הרכיבים מתכנית "${plan.name}" נוספו לרשימת הקניות.`,
    });
  };

  const sortedRecipes = useMemo(() => recipes.slice().sort((a, b) => a.name.localeCompare(b.name, 'he')), [recipes]);
  
  const getPlanItemsWithRecipeData = (plan: MealPlan) => {
     if (!plan.items) return [];
     return plan.items.map(item => ({
        ...item,
        recipe: recipes.find(r => r.id === item.recipeId),
     })).filter(item => !!item.recipe); // Filter out items where recipe is not found
  };


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
              <CardHeader className="flex flex-col sm:flex-row-reverse justify-between items-start gap-2">
                  <div className="text-right w-full">
                    <CardTitle className="text-2xl font-headline text-accent">{plan.name}</CardTitle>
                    {plan.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        נוצר ב: {format(plan.createdAt, 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
                <Popover open={popoverOpen[plan.id]} onOpenChange={(isOpen) => setPopoverOpen(prev => ({...prev, [plan.id]: isOpen}))}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen[plan.id]}
                            className="w-full justify-between"
                        >
                            הוסף מתכון לתכנית...
                            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="חפש מתכון..." />
                            <CommandList>
                                <CommandEmpty>לא נמצאו מתכונים.</CommandEmpty>
                                <CommandGroup>
                                    {sortedRecipes.map((recipe) => (
                                        <CommandItem
                                            key={recipe.id}
                                            value={recipe.name}
                                            onSelect={() => handleAddRecipeToPlan(plan, recipe.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "me-2 h-4 w-4",
                                                    plan.items.some(item => item.recipeId === recipe.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {recipe.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                
                {plan.items && plan.items.length > 0 ? (
                    <ul className="space-y-2">
                        {getPlanItemsWithRecipeData(plan).map(({ id: itemId, recipe, multiplier }) => {
                            if (!recipe) return null;
                            return (
                                <li key={itemId} className="flex items-center justify-end p-2 bg-secondary/20 rounded-md gap-4">
                                     <div className="flex-grow flex items-center gap-2 justify-end">
                                        <span className="text-xs font-bold text-accent bg-accent/20 px-1.5 py-0.5 rounded-full">
                                            x{multiplier}
                                        </span>
                                        <button onClick={() => handleOpenRecipeTab(recipe.id, multiplier)} className="font-semibold text-primary hover:underline flex items-center gap-2 text-right">
                                            <BookOpen size={16}/> {recipe.name}
                                        </button>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/80" onClick={() => handleUpdateRecipeMultiplier(plan, itemId, -1)} title="הסר אחד">
                                          <Minus size={16} />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/80" onClick={() => handleUpdateRecipeMultiplier(plan, itemId, 1)} title="הוסף עוד אחד">
                                          <Plus size={16} />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRecipeFromPlan(plan, itemId)} title="הסר את המתכון מהתכנית">
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

    
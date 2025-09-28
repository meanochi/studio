
'use client';

import type { Recipe, MealPlan } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Edit3, Trash2, Eye, CalendarPlus, Loader2, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRecipes } from '@/contexts/RecipeContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc, updateDoc } from 'firebase/firestore';
import { generateId } from '@/lib/utils';


interface RecipeCardProps {
  recipe: Recipe;
  onOpen: (recipeId: string) => void;
}

export default function RecipeCard({ recipe, onOpen }: RecipeCardProps) {
  const { deleteRecipe } = useRecipes();
  const { toast } = useToast();

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);
  const [planSearchTerm, setPlanSearchTerm] = useState('');

  // Fetch meal plans when the dialog is about to open
  useEffect(() => {
    if (isPlanDialogOpen) {
      const plansQuery = query(collection(db, 'mealPlans'));
      const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
        const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlan));
        setMealPlans(plansData);
        if (plansData.length > 0 && !selectedPlanId) {
          setSelectedPlanId(plansData[0].id);
        }
      });
      return () => unsubscribe();
    }
  }, [isPlanDialogOpen, selectedPlanId]);


  const handleDelete = () => {
    deleteRecipe(recipe.id);
    toast({
      title: "המתכון נמחק",
      description: `"${recipe.name}" הוסר.`,
      variant: 'destructive',
    });
  };
  
  const handleAddToPlan = async () => {
    if (!selectedPlanId || !recipe.id) {
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
        const existingItemIndex = items.findIndex((item: any) => item.recipeId === recipe.id);

        let updatedItems;
        if (existingItemIndex > -1) {
          updatedItems = [...items];
          updatedItems[existingItemIndex].multiplier += 1;
        } else {
          updatedItems = [...items, { id: generateId(), recipeId: recipe.id, multiplier: 1 }];
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
      setPlanSearchTerm(''); // Reset search
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

  
  const totalTime = () => {
    return `${recipe.prepTime}${recipe.cookTime ? `, ${recipe.cookTime}` : ''}`;
  }

  const hasImage = !!recipe.imageUrl;

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 recipe-card-print group">
       <div onClick={() => onOpen(recipe.id)} className="cursor-pointer">
          <CardHeader className="p-0 relative">
            <div aria-label={`הצג מתכון: ${recipe.name}`} className="block w-full h-48 relative">
              {hasImage ? (
                <Image
                  src={recipe.imageUrl!}
                  alt={recipe.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                 <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <span className="text-muted-foreground font-headline text-2xl">{recipe.name.charAt(0)}</span>
                 </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
              <CardTitle className="text-2xl font-headline mb-2 truncate group-hover:text-primary" title={recipe.name}>{recipe.name}</CardTitle>
            <p className="text-sm text-muted-foreground mb-1 font-body italic">מקור: {recipe.source}</p>
            <div className="flex items-center text-sm text-muted-foreground mb-1 font-body">
              <Clock size={16} className="me-1.5 text-accent" />
              <span>{totalTime()}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mb-3 font-body">
              <Users size={16} className="me-1.5 text-accent" />
              <span>{recipe.servings} {recipe.servingUnit}</span>
            </div>
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {recipe.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="default" className="font-body text-xs bg-accent text-accent-foreground border border-accent hover:bg-accent/90">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      <CardFooter className="p-4 pt-0 flex justify-end items-center no-print mt-auto">
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Link href={`/recipes/edit/${recipe.id}`} title="ערוך מתכון">
                    <Edit3 size={16} />
                </Link>
            </Button>
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="הוסף לתכנית">
                        <CalendarPlus size={16} />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                      <DialogTitle>הוסף את "{recipe.name}" לתכנית ארוחות</DialogTitle>
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
                                  <div key={plan.id} className="flex items-center space-x-2">
                                      <RadioGroupItem value={plan.id} id={`card-${recipe.id}-${plan.id}`} />
                                      <Label htmlFor={`card-${recipe.id}-${plan.id}`}>{plan.name}</Label>
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
      </CardFooter>
    </Card>
  );
}

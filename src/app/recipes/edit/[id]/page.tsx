'use client';

import RecipeForm from '@/components/recipes/RecipeForm';
import { useRecipes } from '@/contexts/RecipeContext';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Recipe } from '@/types'; // Removed Ingredient, InstructionStep as they are part of Recipe
import type { RecipeFormData } from '@/components/recipes/RecipeSchema';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { generateId } from '@/lib/utils';

export default function EditRecipePage() {
  const { getRecipeById, updateRecipe, loading: recipesLoading } = useRecipes();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined);
  const [loadingInitial, setLoadingInitial] = useState(true); // Renamed to avoid conflict

  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!recipesLoading && recipeId) {
      const foundRecipe = getRecipeById(recipeId);
      setRecipe(foundRecipe);
      setLoadingInitial(false);
    } else if (recipesLoading) {
      setLoadingInitial(true);
    }
  }, [recipeId, getRecipeById, recipesLoading]);

  const handleSubmit = async (data: RecipeFormData) => {
    if (!recipe) return;

    // Ensure all ingredients and instructions have IDs, mapping from form data
    const processedIngredients = data.ingredients.map(ing => ({
      ...ing,
      id: ing.id || generateId(), // Ensure ID exists
    }));

    const processedInstructions = data.instructions.map(instr => ({
      ...instr,
      id: instr.id || generateId(), // Ensure ID exists
    }));
    
    const updatedRecipeData: Recipe = {
      ...recipe, 
      ...data,
      id: recipe.id, // Ensure the original ID is preserved
      ingredients: processedIngredients,
      instructions: processedInstructions,
    };

    await updateRecipe(updatedRecipeData);
    toast({
      title: "המתכון עודכן!",
      description: `"${updatedRecipeData.name}" עודכן בהצלחה.`,
    });
    router.push(`/recipes/${updatedRecipeData.id}`);
     // Error toast is handled within updateRecipe
  };

  if (loadingInitial || recipesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-4 text-xl font-semibold text-primary">טוען מתכון לעריכה...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-headline text-destructive mb-4">מתכון לא נמצא</h2>
        <p className="text-muted-foreground font-body">המתכון שאתה מנסה לערוך אינו קיים.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/">חזור לדף הבית</Link>
        </Button>
      </div>
    );
  }
  
  const initialDataForForm: RecipeFormData = {
    ...recipe,
    ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        id: ing.id || generateId(),
        amount: Number(ing.amount),
        isOptional: ing.isOptional || false,
        notes: ing.notes || '',
        isHeading: ing.isHeading || false,
    })),
    instructions: recipe.instructions.map(instr => ({
        id: instr.id || generateId(), 
        text: instr.text,
        imageUrl: instr.imageUrl || '',
        isHeading: instr.isHeading || false,
    })),
    tags: recipe.tags || [],
  };


  return (
    <div>
      <RecipeForm initialData={initialDataForForm} onSubmit={handleSubmit} isEditing={true} />
    </div>
  );
}

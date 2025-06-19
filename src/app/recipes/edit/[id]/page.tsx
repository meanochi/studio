'use client';

import RecipeForm from '@/components/recipes/RecipeForm';
import { useRecipes } from '@/contexts/RecipeContext';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Recipe, Ingredient, InstructionStep } from '@/types';
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
  const [loading, setLoading] = useState(true);

  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!recipesLoading && recipeId) {
      const foundRecipe = getRecipeById(recipeId);
      setRecipe(foundRecipe);
      setLoading(false);
    }
  }, [recipeId, getRecipeById, recipesLoading]);

  const handleSubmit = (data: RecipeFormData) => {
    if (!recipe) return;

    // Ensure all ingredients and instructions have IDs, mapping from form data
    const processedIngredients = data.ingredients.map(ing => {
      const existingIng = recipe.ingredients.find(origIng => origIng.id === ing.id || (origIng.name === ing.name && origIng.unit === ing.unit));
      return {
        ...ing,
        id: ing.id || existingIng?.id || generateId(),
      };
    });

    const processedInstructions = data.instructions.map(instr => {
      const existingInstr = recipe.instructions.find(origInstr => origInstr.id === instr.id || origInstr.text === instr.text);
      return {
        ...instr,
        id: instr.id || existingInstr?.id || generateId(),
      };
    });
    
    const updatedRecipeData: Recipe = {
      ...recipe, 
      ...data,
      ingredients: processedIngredients,
      instructions: processedInstructions,
    };

    updateRecipe(updatedRecipeData);
    toast({
      title: "המתכון עודכן!",
      description: `"${updatedRecipeData.name}" עודכן בהצלחה.`,
    });
    router.push(`/recipes/${updatedRecipeData.id}`);
  };

  if (loading || recipesLoading) {
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
  
  // Ensure initialData for form has instruction steps with IDs
  const initialDataForForm: RecipeFormData = {
    ...recipe,
    ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        amount: Number(ing.amount),
        isOptional: ing.isOptional || false,
        notes: ing.notes || '',
    })),
    instructions: recipe.instructions.map(instr => ({
        id: instr.id || generateId(), 
        text: instr.text,
        imageUrl: instr.imageUrl || '',
    })),
    tags: recipe.tags || [],
  };


  return (
    <div>
      <RecipeForm initialData={initialDataForForm} onSubmit={handleSubmit} isEditing={true} />
    </div>
  );
}

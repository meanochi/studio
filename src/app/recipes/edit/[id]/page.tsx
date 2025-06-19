'use client';

import RecipeForm from '@/components/recipes/RecipeForm';
import { useRecipes } from '@/contexts/RecipeContext';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Recipe } from '@/types';
import type { RecipeFormData } from '@/components/recipes/RecipeSchema';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    const updatedRecipeData: Recipe = {
      ...recipe, 
      ...data,
       ingredients: data.ingredients.map(ing => ({
        ...ing,
        id: ing.id || recipe.ingredients.find(origIng => origIng.name === ing.name)?.id || Math.random().toString(36).substr(2,9) 
      })),
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
  
  return (
    <div>
      <RecipeForm initialData={recipe} onSubmit={handleSubmit} isEditing={true} />
    </div>
  );
}

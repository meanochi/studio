'use client';

import RecipeForm from '@/components/recipes/RecipeForm';
import { useRecipes } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { RecipeFormData } from '@/components/recipes/RecipeSchema';

export default function AddRecipePage() {
  const { addRecipe } = useRecipes();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (data: RecipeFormData) => {
    const newRecipe = addRecipe(data);
    toast({
      title: "Recipe Added!",
      description: `"${newRecipe.name}" has been successfully added to your cookbook.`,
    });
    router.push(`/recipes/${newRecipe.id}`);
  };

  return (
    <div>
      <RecipeForm onSubmit={handleSubmit} />
    </div>
  );
}

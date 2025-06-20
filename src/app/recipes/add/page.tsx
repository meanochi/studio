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

  const handleSubmit = async (data: RecipeFormData) => {
    const newRecipe = await addRecipe(data);
    if (newRecipe) {
      toast({
        title: "המתכון נוסף!",
        description: `"${newRecipe.name}" נוסף בהצלחה לספר המתכונים שלך.`,
      });
      router.push(`/recipes/${newRecipe.id}`);
    }
    // Error toast is handled within addRecipe
  };

  return (
    <div>
      <RecipeForm 
        onSubmit={handleSubmit} 
        isEditing={false}
      />
    </div>
  );
}

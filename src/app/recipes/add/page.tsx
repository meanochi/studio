'use client';

import RecipeForm from '@/components/recipes/RecipeForm';
import { useRecipes } from '@/contexts/RecipeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { RecipeFormData } from '@/components/recipes/RecipeSchema';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AddRecipePage() {
  const { addRecipe } = useRecipes();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [initialDataFromQuery, setInitialDataFromQuery] = useState<RecipeFormData | undefined>(undefined);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsedData = JSON.parse(dataParam) as RecipeFormData;
        // Validate or transform parsedData if necessary to ensure it matches RecipeFormData
        setInitialDataFromQuery(parsedData);
      } catch (error) {
        console.error("Failed to parse recipe data from query params:", error);
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת נתונים",
          description: "לא ניתן היה לטעון את נתוני המתכון המיובאים.",
        });
      }
    }
    setIsLoadingData(false);
  }, [searchParams, toast]);

  const handleSubmit = (data: RecipeFormData) => {
    const newRecipe = addRecipe(data);
    toast({
      title: "המתכון נוסף!",
      description: `"${newRecipe.name}" נוסף בהצלחה לספר המתכונים שלך.`,
    });
    router.push(`/recipes/${newRecipe.id}`);
  };

  if (isLoadingData && searchParams.get('data')) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-4 text-xl font-semibold text-primary">טוען נתוני מתכון מיובאים...</p>
      </div>
    );
  }

  return (
    <div>
      <RecipeForm 
        onSubmit={handleSubmit} 
        initialData={initialDataFromQuery}
        isEditing={!!initialDataFromQuery} // Consider it "editing" if pre-filled
      />
    </div>
  );
}

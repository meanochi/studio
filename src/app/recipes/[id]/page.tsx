
'use client';

import RecipeDetail from '@/components/recipes/RecipeDetail';
import { useParams } from 'next/navigation';

export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  return <RecipeDetail recipeId={recipeId} />;
}

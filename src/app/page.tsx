
'use client';

import RecipeCard from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/button';
import { useRecipes } from '@/contexts/RecipeContext';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Loader2, History, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const { recipes, loading, recentlyViewed } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      recipe.ingredients.some(ingredient => ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [recipes, searchTerm]);

  const resultsText = useMemo(() => {
    if (loading) return '';
    if (searchTerm) {
      if (filteredRecipes.length === 1) {
        return `נמצא מתכון אחד`;
      }
      return `נמצאו ${filteredRecipes.length} מתכונים`;
    }
    return `סך הכל ${recipes.length} מתכונים`;
  }, [loading, searchTerm, filteredRecipes.length, recipes.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-4 text-xl font-semibold text-primary">טוען מתכונים...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-headline text-primary">המתכונים שלי</h2>
            <span className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                <BookOpen size={16} />
                {resultsText}
            </span>
        </div>
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="חפש מתכונים, תגיות או רכיבים..."
            className="pr-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="חיפוש מתכונים"
          />
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/recipes/add" className="flex items-center gap-2">
            <PlusCircle size={20} />
            הוסף מתכון חדש
          </Link>
        </Button>
      </div>

      {recentlyViewed.length > 0 && !searchTerm && (
        <div className="space-y-4">
            <h3 className="text-2xl font-headline text-primary flex items-center gap-2">
              <History size={24} />
              נצפו לאחרונה
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentlyViewed.map(recipe => (
                <RecipeCard key={`recent-${recipe.id}`} recipe={recipe} />
              ))}
            </div>
            <Separator className="my-8" />
        </div>
      )}


      {filteredRecipes.length > 0 ? (
        <div className="space-y-4">
          {recentlyViewed.length > 0 && !searchTerm && (
             <h3 className="text-2xl font-headline text-primary">כל המתכונים</h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground font-body">
            {searchTerm ? `לא נמצאו מתכונים עבור "${searchTerm}".` : "עדיין לא הוספת מתכונים."}
          </p>
          {!searchTerm && (
            <Button asChild variant="link" className="mt-4 text-lg">
              <Link href="/recipes/add">
                רוצה להוסיף את הראשון שלך?
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

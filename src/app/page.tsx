'use client';

import RecipeCard from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/button';
import { useRecipes } from '@/contexts/RecipeContext';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';

export default function HomePage() {
  const { recipes, loading } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      recipe.ingredients.some(ingredient => ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [recipes, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl font-semibold text-primary">Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <h2 className="text-3xl font-headline text-primary">My Recipes</h2>
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recipes, tags, or ingredients..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search recipes"
          />
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/recipes/add" className="flex items-center gap-2">
            <PlusCircle size={20} />
            Add New Recipe
          </Link>
        </Button>
      </div>

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground font-body">
            {searchTerm ? `No recipes found for "${searchTerm}".` : "You haven't added any recipes yet."}
          </p>
          {!searchTerm && (
            <Button asChild variant="link" className="mt-4 text-lg">
              <Link href="/recipes/add">
                Why not add your first one?
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

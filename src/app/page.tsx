
'use client';

import RecipeCard from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/button';
import { useRecipes } from '@/contexts/RecipeContext';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Loader2, BookOpen, X, Home } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Recipe } from '@/types';
import RecipeDetail from '@/components/recipes/RecipeDetail';
import { useHeader } from '@/contexts/HeaderContext';
import { useSearchParams, useRouter } from 'next/navigation';

export default function HomePage() {
  const { recipes, loading, getRecipeById } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const { activeTab, setActiveTab, openTabs, setOpenTabs, setHeaderContent } = useHeader();
  
  // Effect to handle opening recipe from URL param
  useEffect(() => {
    const recipeId = searchParams.get('recipeId');
    if (recipeId) {
      handleOpenRecipeTab(recipeId);
      // Clean the URL
      router.replace('/', { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const headerTabs = (
      <div className="flex justify-start items-center gap-2 p-1 bg-card rounded-lg shadow overflow-x-auto">
         <TabsList className="grid-flow-col auto-cols-max justify-start">
            <TabsTrigger value="home" className="flex items-center gap-2">
                <Home size={16}/> בית
            </TabsTrigger>
            {openTabs.map(recipe => (
                <TabsTrigger key={recipe.id} value={recipe.id} className="relative group pe-8">
                   <span className="truncate max-w-[150px]">{recipe.name}</span>
                   <div
                     role="button"
                     aria-label={`Close tab for ${recipe.name}`}
                     className="absolute end-0.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full opacity-50 group-hover:opacity-100 group-hover:bg-muted flex items-center justify-center"
                     onClick={(e) => handleCloseTab(recipe.id, e)}
                   >
                       <X size={14}/>
                   </div>
                </TabsTrigger>
            ))}
         </TabsList>
      </div>
    );
    
    setHeaderContent(headerTabs);

    // Cleanup function
    return () => {
        setHeaderContent(null);
    }
  }, [openTabs, setHeaderContent, activeTab, handleCloseTab, setActiveTab]);


  const handleOpenRecipeTab = (recipeId: string) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    if (!openTabs.some(tab => tab.id === recipeId)) {
      setOpenTabs(prev => [...prev, recipe]);
    }
    setActiveTab(recipeId);
  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleCloseTab(recipeId: string, e: React.MouseEvent) {
    e.stopPropagation(); 
    
    const tabIndex = openTabs.findIndex(tab => tab.id === recipeId);
    if (tabIndex === -1) return;

    // After closing a tab, determine the new active tab
    if (activeTab === recipeId) {
       const newOpenTabs = openTabs.filter(tab => tab.id !== recipeId);
       if (newOpenTabs.length > 0) {
         // If there was a tab before the closed one, activate it. Otherwise, activate the new first tab.
         const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
         setActiveTab(newOpenTabs[newActiveIndex]?.id || 'home');
       } else {
         // If no tabs are left, go to home
         setActiveTab('home');
       }
    }
    
    setOpenTabs(prev => prev.filter(tab => tab.id !== recipeId));
  };


  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      (recipe.source && recipe.source.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm))) ||
      recipe.ingredients.some(ingredient => ingredient.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (recipe.notes && recipe.notes.toLowerCase().includes(lowerCaseSearchTerm)) ||
      recipe.instructions.some(instruction => instruction.text.toLowerCase().includes(lowerCaseSearchTerm))
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
    <>
      <TabsContent value="home" className="mt-6">
          <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-4 mb-6 text-right">
            <Button asChild className="w-auto flex-shrink-0">
                <Link href="/recipes/add" className="flex items-center gap-2">
                <PlusCircle size={20} />
                הוסף מתכון חדש
                </Link>
            </Button>
            <div className="relative w-full sm:max-w-md flex-grow">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder="חפש מתכונים, תגיות או רכיבים..."
                className="ps-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="חיפוש מתכונים"
                />
            </div>
            <div className="text-right">
                <h2 className="text-3xl font-headline text-primary">המתכונים שלי</h2>
                <span className="text-sm text-muted-foreground font-body flex items-center justify-end gap-1.5 mt-1">
                    <BookOpen size={16} />
                    {resultsText}
                </span>
            </div>
          </div>
         
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} onOpen={handleOpenRecipeTab} />
              ))}
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
      </TabsContent>
      {openTabs.map(recipe => (
        <TabsContent key={recipe.id} value={recipe.id} className="mt-6">
            <RecipeDetail recipeId={recipe.id} />
        </TabsContent>
      ))}
    </>
  );
}

'use client';

import type { Recipe, Ingredient, InstructionStep } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { generateId } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { RecipeFormData } from '@/components/recipes/RecipeSchema';
import initialRecipes from '@/lib/initial-recipes';
import { db } from '@/lib/firebase'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipeData: RecipeFormData) => Promise<Recipe | null>;
  updateRecipe: (updatedRecipe: Recipe) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  getRecipeById: (recipeId: string) => Recipe | undefined;
  loading: boolean;
  recentlyViewed: Recipe[];
  addRecentlyViewed: (recipeId: string) => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const RECIPES_STORAGE_KEY = 'recipes';
const RECENTLY_VIEWED_KEY = 'recentlyViewedRecipeIds';
const MAX_RECENTLY_VIEWED = 8;

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [recentlyViewed, setRecentlyViewed] = useState<Recipe[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

useEffect(() => {
  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // 1. ניסיון טעינה מהענן (Firebase)
      const querySnapshot = await getDocs(collection(db, "recipes"));
      const recipesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      
      setRecipes(recipesData);
      
      // 2. עדכון הגיבוי המקומי למקרה של חוסר אינטרנט בעתיד
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipesData));
    } catch (error) {
      console.error("Firebase fetch failed, trying localStorage:", error);
      // 3. גיבוי: אם אין אינטרנט, טען מהזיכרון המקומי
      const stored = localStorage.getItem(RECIPES_STORAGE_KEY);
      if (stored) {
        setRecipes(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  fetchRecipes();
}, []); // מערך תלות ריק מבטיח שזה ירוץ רק פעם אחת בטעינת האתר
// 
//   useEffect(() => {
//     try {
//       localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
//     } catch (error) {
//       console.error("Failed to save recipes to localStorage", error);
//     }
//   }, [recipes]);
  
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (storedIds) {
        setRecentlyViewedIds(JSON.parse(storedIds));
      }
    } catch (error) {
      console.error("Failed to parse recently viewed recipes from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (recipes.length > 0) {
      const viewedRecipes = recentlyViewedIds
        .map(id => recipes.find(recipe => recipe.id === id))
        .filter((recipe): recipe is Recipe => !!recipe);
      setRecentlyViewed(viewedRecipes);
    }
  }, [recentlyViewedIds, recipes]);
useEffect(() => {
  const fetchRecipes = async () => {
    const querySnapshot = await getDocs(collection(db, "recipes"));
    const recipesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Recipe[];
    setRecipes(recipesData);
  };
  fetchRecipes();
}, []);

  const addRecentlyViewed = useCallback((recipeId: string) => {
    setRecentlyViewedIds(prevIds => {
      const newIds = [recipeId, ...prevIds.filter(id => id !== recipeId)];
      const trimmedIds = newIds.slice(0, MAX_RECENTLY_VIEWED);
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(trimmedIds));
      } catch (error) {
        console.error("Failed to save recently viewed recipes to localStorage", error);
      }
      return trimmedIds;
    });
  }, []);


  const addRecipe = async (recipeData: RecipeFormData): Promise<Recipe | null> => {
    const isDuplicate = recipes.some(
      (recipe) => recipe.name.toLowerCase() === recipeData.name.toLowerCase() && recipe.source?.toLowerCase() === (recipeData.source || '').toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "מתכון כפול",
        description: `מתכון בשם "${recipeData.name}" עם אותו מקור כבר קיים.`,
        variant: "destructive",
      });
      return null;
    }
    
    const newRecipe: Recipe = {
      id: generateId(),
      ...recipeData,
      source: recipeData.source || null,
      cookTime: recipeData.cookTime || null,
      imageUrl: recipeData.imageUrl || null,
      tags: recipeData.tags || [],
      notes: recipeData.notes || null,
      ingredients: (recipeData.ingredients || []).map(ing => ({
        ...ing,
        id: ing.id || generateId(),
        amount: ing.isHeading ? undefined : (ing.amount ?? 0),
        unit: ing.isHeading ? undefined : (ing.unit ?? ''),
        notes: ing.isHeading ? null : (ing.notes || null),
      })),
      instructions: (recipeData.instructions || []).map(instr => ({
        ...instr,
        id: instr.id || generateId(),
        imageUrl: instr.isHeading ? null : (instr.imageUrl || null)
      }))
    };
    
    setRecipes(prevRecipes => [...prevRecipes, newRecipe]);
    return newRecipe;
  };

  const updateRecipe = async (updatedRecipe: Recipe) => {
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe => (recipe.id === updatedRecipe.id ? updatedRecipe : recipe))
    );
  };

  const deleteRecipe = async (recipeId: string) => {
    setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
  };

  const getRecipeById = useCallback((recipeId: string): Recipe | undefined => {
    return recipes.find(recipe => recipe.id === recipeId);
  }, [recipes]);

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe, getRecipeById, loading, recentlyViewed, addRecentlyViewed }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};


'use client';

import type { Recipe, Ingredient, InstructionStep } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { generateId } from '@/lib/utils';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy,
  // Timestamp // Optional: if you want to use server timestamps
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipeData: RecipeFormData) => Promise<Recipe | null>;
  updateRecipe: (updatedRecipe: Recipe) => Promise<void>; // Return type changed to Promise
  deleteRecipe: (recipeId: string) => Promise<void>; // Return type changed to Promise
  getRecipeById: (recipeId: string) => Recipe | undefined;
  loading: boolean;
  recentlyViewed: Recipe[];
  addRecentlyViewed: (recipeId: string) => void;
}
// Note: Changed addRecipe to accept RecipeFormData for consistency
import type { RecipeFormData } from '@/components/recipes/RecipeSchema';


const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const RECENTLY_VIEWED_KEY = 'recentlyViewedRecipeIds';
const MAX_RECENTLY_VIEWED = 3;

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [recentlyViewed, setRecentlyViewed] = useState<Recipe[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  // Load recently viewed from localStorage on initial load
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

  // Update recently viewed recipes when IDs or the main recipes list change
  useEffect(() => {
    if (recipes.length > 0) {
      const viewedRecipes = recentlyViewedIds
        .map(id => recipes.find(recipe => recipe.id === id))
        .filter((recipe): recipe is Recipe => !!recipe);
      setRecentlyViewed(viewedRecipes);
    }
  }, [recentlyViewedIds, recipes]);


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


  useEffect(() => {
    setLoading(true);
    const recipesCollectionRef = collection(db, 'recipes');
    const q = query(recipesCollectionRef, orderBy('name', 'asc')); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recipesData = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          name: data.name || "Unnamed Recipe",
          source: data.source ?? null,
          prepTime: data.prepTime || "N/A",
          cookTime: data.cookTime ?? null,
          servings: typeof data.servings === 'number' ? data.servings : 1,
          servingUnit: data.servingUnit || "unit",
          freezable: typeof data.freezable === 'boolean' ? data.freezable : false,
          imageUrl: data.imageUrl ?? null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          notes: data.notes ?? null,
          ingredients: (Array.isArray(data.ingredients) ? data.ingredients : []).map((ing: any): Ingredient => ({
            id: ing.id || generateId(),
            name: ing.name || "",
            isHeading: typeof ing.isHeading === 'boolean' ? ing.isHeading : false,
            amount: (typeof ing.isHeading === 'boolean' && ing.isHeading) ? 0 : (typeof ing.amount === 'number' ? ing.amount : 0), // Amount is 0 for heading
            unit: (typeof ing.isHeading === 'boolean' && ing.isHeading) ? "" : (ing.unit || ""), // Unit is "" for heading
            isOptional: (typeof ing.isHeading === 'boolean' && ing.isHeading) ? false : (typeof ing.isOptional === 'boolean' ? ing.isOptional : false),
            notes: (typeof ing.isHeading === 'boolean' && ing.isHeading) ? '' : (ing.notes ?? ''),
          })),
          instructions: (Array.isArray(data.instructions) ? data.instructions : []).map((instr: any): InstructionStep => ({
            id: instr.id || generateId(),
            text: instr.text || "",
            isHeading: typeof instr.isHeading === 'boolean' ? instr.isHeading : false,
            imageUrl: (typeof instr.isHeading === 'boolean' && instr.isHeading) ? null : (instr.imageUrl ?? null),
          })),
        } as Recipe;
      });
      setRecipes(recipesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching recipes from Firestore: ", error);
      toast({
        title: "שגיאה בטעינת מתכונים",
        description: "לא ניתן היה לטעון מתכונים ממסד הנתונים. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const addRecipe = async (recipeData: RecipeFormData): Promise<Recipe | null> => {
    
    // Check for duplicates
    const isDuplicate = recipes.some(
      (recipe) => recipe.name.toLowerCase() === recipeData.name.toLowerCase() && recipe.source?.toLowerCase() === recipeData.source?.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "מתכון כפול",
        description: `מתכון בשם "${recipeData.name}" עם אותו מקור כבר קיים.`,
        variant: "destructive",
      });
      return null;
    }

    try {
        const ingredientsWithIds = recipeData.ingredients.map(ing => ({
          ...ing,
          id: ing.id || generateId(),
          amount: ing.isHeading ? 0 : ing.amount!,
          unit: ing.isHeading ? '' : ing.unit!,
          isOptional: ing.isHeading ? false : ing.isOptional,
          notes: ing.isHeading ? '' : ing.notes,
        }));

        const instructionsWithIds = recipeData.instructions.map(instr => ({
            ...instr,
            id: instr.id || generateId(),
            imageUrl: instr.isHeading ? null : instr.imageUrl
        }));
      
      const recipeForFirestore = {
        ...recipeData,
        source: recipeData.source || null,
        cookTime: recipeData.cookTime || null,
        imageUrl: recipeData.imageUrl || null,
        tags: recipeData.tags || [],
        notes: recipeData.notes || null,
        ingredients: ingredientsWithIds,
        instructions: instructionsWithIds
      };

      const docRef = await addDoc(collection(db, 'recipes'), recipeForFirestore);
      const newRecipe: Recipe = {
        id: docRef.id,
        name: recipeForFirestore.name,
        source: recipeForFirestore.source,
        prepTime: recipeForFirestore.prepTime,
        cookTime: recipeForFirestore.cookTime,
        servings: recipeForFirestore.servings,
        servingUnit: recipeForFirestore.servingUnit,
        freezable: recipeForFirestore.freezable,
        imageUrl: recipeForFirestore.imageUrl,
        tags: recipeForFirestore.tags,
        notes: recipeForFirestore.notes,
        ingredients: recipeForFirestore.ingredients.map(ing => ({
            ...ing,
            id: ing.id,
            isOptional: ing.isOptional || false,
            notes: ing.notes || null,
            isHeading: ing.isHeading || false,
        })),
        instructions: recipeForFirestore.instructions.map(instr => ({
            ...instr,
            id: instr.id,
            imageUrl: instr.imageUrl || null,
            isHeading: instr.isHeading || false,
        })),
      };
      return newRecipe;
    } catch (error) {
      console.error("Error adding recipe to Firestore: ", error);
      toast({
        title: "שגיאה בהוספת מתכון",
        description: "לא ניתן היה לשמור את המתכון. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRecipe = async (updatedRecipe: Recipe) => {
    try {
      const recipeRef = doc(db, 'recipes', updatedRecipe.id);
      const dataToUpdate = {
        name: updatedRecipe.name,
        source: updatedRecipe.source ?? null,
        prepTime: updatedRecipe.prepTime,
        cookTime: updatedRecipe.cookTime ?? null,
        servings: updatedRecipe.servings,
        servingUnit: updatedRecipe.servingUnit,
        freezable: updatedRecipe.freezable ?? false,
        imageUrl: updatedRecipe.imageUrl ?? null,
        tags: updatedRecipe.tags || [],
        notes: updatedRecipe.notes ?? null,
        ingredients: (updatedRecipe.ingredients || []).map(ing => ({
          id: ing.id || generateId(),
          name: ing.name || "",
          isHeading: ing.isHeading || false,
          amount: ing.isHeading ? 0 : (typeof ing.amount === 'number' ? ing.amount : 0),
          unit: ing.isHeading ? "" : (ing.unit || ""),
          isOptional: ing.isHeading ? false : (ing.isOptional || false),
          notes: ing.isHeading ? "" : (ing.notes ?? ''),
        })),
        instructions: (updatedRecipe.instructions || []).map(instr => ({
          id: instr.id || generateId(),
          text: instr.text || "",
          isHeading: instr.isHeading || false,
          imageUrl: instr.isHeading ? null : (instr.imageUrl ?? null),
        })),
      };
      
      await updateDoc(recipeRef, dataToUpdate);
    } catch (error) {
      console.error("Error updating recipe in Firestore: ", error);
      toast({
        title: "שגיאה בעדכון מתכון",
        description: "לא ניתן היה לעדכן את המתכון. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const recipeRef = doc(db, 'recipes', recipeId);
      await deleteDoc(recipeRef);
    } catch (error)
       {
      console.error("Error deleting recipe from Firestore: ", error);
       toast({
        title: "שגיאה במחיקת מתכון",
        description: "לא ניתן היה למחוק את המתכון. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
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

    
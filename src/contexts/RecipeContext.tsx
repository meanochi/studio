'use client';

import type { Recipe, Ingredient, InstructionStep } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  Timestamp // Optional: if you want to use server timestamps
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'ingredients' | 'instructions'> & { 
    ingredients: Omit<Ingredient, 'id'>[],
    instructions: Omit<InstructionStep, 'id'>[] 
  }) => Promise<Recipe | null>; // Return type changed to Promise
  updateRecipe: (updatedRecipe: Recipe) => Promise<void>; // Return type changed to Promise
  deleteRecipe: (recipeId: string) => Promise<void>; // Return type changed to Promise
  getRecipeById: (recipeId: string) => Recipe | undefined;
  loading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const recipesCollectionRef = collection(db, 'recipes');
    // Consider adding orderBy if you want consistent ordering, e.g., by name or a timestamp
    const q = query(recipesCollectionRef, orderBy('name', 'asc')); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recipesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure ingredients and instructions arrays exist and map them
          ingredients: (data.ingredients || []).map((ing: Ingredient) => ({ ...ing, id: ing.id || generateId() })),
          instructions: (data.instructions || []).map((instr: InstructionStep) => ({ ...instr, id: instr.id || generateId() })),
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

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);


  const addRecipe = async (recipeData: Omit<Recipe, 'id' | 'ingredients' | 'instructions'> & { 
    ingredients: Omit<Ingredient, 'id'>[],
    instructions: Omit<InstructionStep, 'id'>[] 
  }): Promise<Recipe | null> => {
    try {
      const newRecipeData = {
        ...recipeData,
        ingredients: recipeData.ingredients.map(ing => ({ ...ing, id: ing.id || generateId(), isHeading: ing.isHeading || false })),
        instructions: recipeData.instructions.map(instr => ({ ...instr, id: instr.id || generateId(), isHeading: instr.isHeading || false })),
        // Optional: add createdAt timestamp
        // createdAt: Timestamp.now(), 
      };
      const docRef = await addDoc(collection(db, 'recipes'), newRecipeData);
      return { ...newRecipeData, id: docRef.id } as Recipe;
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
      // Prepare data for Firestore, ensuring sub-objects are plain JS objects
      const dataToUpdate = {
        ...updatedRecipe,
        ingredients: updatedRecipe.ingredients.map(ing => ({ ...ing, id: ing.id || generateId(), isHeading: ing.isHeading || false })),
        instructions: updatedRecipe.instructions.map(instr => ({ ...instr, id: instr.id || generateId(), isHeading: instr.isHeading || false })),
      };
      delete (dataToUpdate as any).id; // Don't store the id field within the document itself if it's the doc id
      
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
    } catch (error) {
      console.error("Error deleting recipe from Firestore: ", error);
       toast({
        title: "שגיאה במחיקת מתכון",
        description: "לא ניתן היה למחוק את המתכון. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const getRecipeById = (recipeId: string): Recipe | undefined => {
    return recipes.find(recipe => recipe.id === recipeId);
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe, getRecipeById, loading }}>
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

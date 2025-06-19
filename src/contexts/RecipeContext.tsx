'use client';

import type { Recipe, Ingredient } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateId } from '@/lib/utils';

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'ingredients'> & { ingredients: Omit<Ingredient, 'id'>[] }) => Recipe;
  updateRecipe: (updatedRecipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  getRecipeById: (recipeId: string) => Recipe | undefined;
  loading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const initialRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Classic Chocolate Chip Cookies',
    source: 'Grandma\'s Old Cookbook',
    prepTime: '20 minutes',
    cookTime: '10-12 minutes',
    servings: 24,
    servingUnit: 'cookies',
    freezable: true,
    ingredients: [
      { id: generateId(), name: 'All-purpose flour', amount: 2.25, unit: 'cups' },
      { id: generateId(), name: 'Baking soda', amount: 1, unit: 'tsp' },
      { id: generateId(), name: 'Salt', amount: 1, unit: 'tsp' },
      { id: generateId(), name: 'Unsalted butter, softened', amount: 1, unit: 'cup' },
      { id: generateId(), name: 'Granulated sugar', amount: 0.75, unit: 'cup' },
      { id: generateId(), name: 'Brown sugar, packed', amount: 0.75, unit: 'cup' },
      { id: generateId(), name: 'Large eggs', amount: 2, unit: '' },
      { id: generateId(), name: 'Vanilla extract', amount: 1, unit: 'tsp' },
      { id: generateId(), name: 'Semi-sweet chocolate chips', amount: 2, unit: 'cups' },
    ],
    instructions: [
      'Preheat oven to 375°F (190°C).',
      'Combine flour, baking soda, and salt in a small bowl.',
      'Beat butter, granulated sugar, and brown sugar in a large mixer bowl until creamy.',
      'Beat in eggs one at a time, then stir in vanilla extract.',
      'Gradually beat in flour mixture.',
      'Stir in chocolate chips.',
      'Drop rounded tablespoons onto ungreased baking sheets.',
      'Bake for 9-11 minutes or until golden brown.',
      'Cool on baking sheets for 2 minutes; remove to wire racks to cool completely.',
    ],
    imageUrl: 'https://placehold.co/600x400.png',
    tags: ['dessert', 'baking', 'cookies'],
  },
  {
    id: '2',
    name: 'Simple Tomato Pasta',
    source: 'Family Favorite',
    prepTime: '10 minutes',
    cookTime: '20 minutes',
    servings: 4,
    servingUnit: 'servings',
    freezable: false,
    ingredients: [
      { id: generateId(), name: 'Pasta (e.g., spaghetti)', amount: 400, unit: 'g' },
      { id: generateId(), name: 'Canned chopped tomatoes', amount: 1, unit: 'can (400g)' },
      { id: generateId(), name: 'Onion, chopped', amount: 1, unit: '' },
      { id: generateId(), name: 'Garlic cloves, minced', amount: 2, unit: '' },
      { id: generateId(), name: 'Olive oil', amount: 2, unit: 'tbsp' },
      { id: generateId(), name: 'Dried oregano', amount: 1, unit: 'tsp' },
      { id: generateId(), name: 'Salt and pepper', amount: 1, unit: 'to taste' },
      { id: generateId(), name: 'Fresh basil, chopped (optional)', amount: 1, unit: 'handful' },
    ],
    instructions: [
      'Cook pasta according to package directions.',
      'While pasta cooks, heat olive oil in a large skillet over medium heat.',
      'Add onion and cook until softened, about 5 minutes.',
      'Add garlic and cook for another minute until fragrant.',
      'Stir in chopped tomatoes and oregano. Season with salt and pepper.',
      'Bring to a simmer and cook for 10-15 minutes, stirring occasionally.',
      'Drain pasta and add it to the skillet with the sauce. Toss to combine.',
      'Serve immediately, garnished with fresh basil if desired.',
    ],
    imageUrl: 'https://placehold.co/600x400.png',
    tags: ['main course', 'pasta', 'vegetarian', 'quick'],
  }
];


export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRecipes = localStorage.getItem('familyCookbookRecipes');
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      } else {
        // Initialize with sample data if no recipes are in localStorage
        setRecipes(initialRecipes);
        localStorage.setItem('familyCookbookRecipes', JSON.stringify(initialRecipes));
      }
    } catch (error) {
      console.error("Failed to load recipes from localStorage", error);
      setRecipes(initialRecipes); // Fallback to initial if localStorage fails
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) { // Only save if not in initial loading phase
      try {
        localStorage.setItem('familyCookbookRecipes', JSON.stringify(recipes));
      } catch (error) {
        console.error("Failed to save recipes to localStorage", error);
      }
    }
  }, [recipes, loading]);

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'ingredients'> & { ingredients: Omit<Ingredient, 'id'>[] }): Recipe => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: generateId(),
      ingredients: recipeData.ingredients.map(ing => ({ ...ing, id: generateId() })),
    };
    setRecipes(prevRecipes => [...prevRecipes, newRecipe]);
    return newRecipe;
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe => (recipe.id === updatedRecipe.id ? updatedRecipe : recipe))
    );
  };

  const deleteRecipe = (recipeId: string) => {
    setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
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

'use client';

import type { Recipe, Ingredient, InstructionStep } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateId } from '@/lib/utils';

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'ingredients' | 'instructions'> & { 
    ingredients: Omit<Ingredient, 'id'>[],
    instructions: Omit<InstructionStep, 'id'>[] 
  }) => Recipe;
  updateRecipe: (updatedRecipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  getRecipeById: (recipeId: string) => Recipe | undefined;
  loading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const initialRecipes: Recipe[] = [
  {
    id: '1',
    name: 'עוגיות שוקולד צ\'יפס קלאסיות',
    source: 'ספר המתכונים הישן של סבתא',
    prepTime: '20 דקות',
    cookTime: '10-12 דקות',
    servings: 24,
    servingUnit: 'עוגיות',
    freezable: true,
    ingredients: [
      { id: generateId(), name: 'קמח לכל מטרה', amount: 2.25, unit: 'כוסות', isHeading: false },
      { id: generateId(), name: 'סודה לשתייה', amount: 1, unit: 'כפית', isHeading: false },
      { id: generateId(), name: 'מלח', amount: 1, unit: 'כפית', isHeading: false },
      { id: generateId(), name: 'חמאה לא מלוחה, רכה', amount: 1, unit: 'כוס', isHeading: false },
      { id: generateId(), name: 'סוכר לבן', amount: 0.75, unit: 'כוס', isHeading: false },
      { id: generateId(), name: 'סוכר חום, דחוס', amount: 0.75, unit: 'כוס', isHeading: false },
      { id: generateId(), name: 'ביצים גדולות', amount: 2, unit: 'יחידות', isHeading: false },
      { id: generateId(), name: 'תמצית וניל', amount: 1, unit: 'כפית', isHeading: false },
      { id: generateId(), name: 'שוקולד צ\'יפס מריר למחצה', amount: 2, unit: 'כוסות', isOptional: false, notes: 'אפשר גם שוקולד חלב', isHeading: false },
    ],
    instructions: [
      { id: generateId(), text: 'חממו תנור מראש ל-190°C (375°F).', imageUrl: 'https://placehold.co/300x200.png?text=Step+1', isHeading: false },
      { id: generateId(), text: 'ערבבו קמח, סודה לשתייה ומלח בקערה קטנה.', isHeading: false },
      { id: generateId(), text: 'הקציפו חמאה, סוכר לבן וסוכר חום בקערת מיקסר גדולה עד לקבלת תערובת קרמית.', isHeading: false },
      { id: generateId(), text: 'הוסיפו את הביצים אחת אחת, ולאחר מכן ערבבו פנימה את תמצית הווניל.', isHeading: false },
      { id: generateId(), text: 'הוסיפו בהדרגה את תערובת הקמח.', isHeading: false },
      { id: generateId(), text: 'ערבבו פנימה את השוקולד צ\'יפס.', isHeading: false },
      { id: generateId(), text: 'צרו כדורים בעזרת כף גלידה או כף רגילה והניחו על תבניות אפייה לא משומנות.', isHeading: false },
      { id: generateId(), text: 'אפו במשך 9-11 דקות או עד להזהבה.', isHeading: false },
      { id: generateId(), text: 'צננו על תבניות האפייה למשך 2 דקות; העבירו לרשתות צינון להתקררות מלאה.', isHeading: false },
    ],
    imageUrl: 'https://placehold.co/600x400.png',
    tags: ['קינוח', 'אפייה', 'עוגיות'],
  },
  {
    id: '2',
    name: 'פסטה עגבניות פשוטה',
    source: 'האהוב על המשפחה',
    prepTime: '10 דקות',
    cookTime: '20 דקות',
    servings: 4,
    servingUnit: 'מנות',
    freezable: false,
    ingredients: [
      { id: generateId(), name: 'פסטה (לדוגמה, ספגטי)', amount: 400, unit: 'גרם', isHeading: false },
      { id: generateId(), name: 'עגבניות מרוסקות משומרות', amount: 1, unit: 'קופסה (400 גרם)', isHeading: false },
      { id: generateId(), name: 'בצל, קצוץ', amount: 1, unit: 'יחידות', isHeading: false },
      { id: generateId(), name: 'שיני שום, כתושות', amount: 2, unit: 'יחידות', isHeading: false },
      { id: generateId(), name: 'שמן זית', amount: 2, unit: 'כפות', isHeading: false },
      { id: generateId(), name: 'אורגנו מיובש', amount: 1, unit: 'כפית', isHeading: false },
      { id: generateId(), name: 'מלח ופלפל', amount: 1, unit: 'לפי הטעם', isOptional: true, isHeading: false },
      { id: generateId(), name: 'בזיליקום טרי, קצוץ', amount: 1, unit: 'חופן', isOptional: true, notes: 'מומלץ מאוד לטעם משופר', isHeading: false },
    ],
    instructions: [
      { id: generateId(), text: 'בשלו את הפסטה לפי הוראות היצרן.', isHeading: false },
      { id: generateId(), text: 'בזמן שהפסטה מתבשלת, חממו שמן זית במחבת גדולה על אש בינונית.', isHeading: false },
      { id: generateId(), text: 'הוסיפו בצל ובשלו עד שהוא מתרכך, כ-5 דקות.', isHeading: false },
      { id: generateId(), text: 'הוסיפו שום ובשלו עוד דקה עד שעולה ריח.', isHeading: false },
      { id: generateId(), text: 'ערבבו פנימה עגבניות מרוסקות ואורגנו. תבלו במלח ופלפל.', isHeading: false },
      { id: generateId(), text: 'הביאו לרתיחה ובשלו על אש נמוכה במשך 10-15 דקות, תוך ערבוב מדי פעם.', isHeading: false },
      { id: generateId(), text: 'סננו את הפסטה והוסיפו אותה למחבת עם הרוטב. ערבבו היטב.', isHeading: false },
      { id: generateId(), text: 'הגישו מיד, מקושט בבזיליקום טרי אם רוצים.', isHeading: false },
    ],
    imageUrl: 'https://placehold.co/600x400.png',
    tags: ['מנה עיקרית', 'פסטה', 'צמחוני', 'מהיר'],
  }
];


export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRecipes = localStorage.getItem('familyCookbookRecipes');
      if (storedRecipes) {
        const parsedRecipes = JSON.parse(storedRecipes).map((recipe: Recipe) => ({
          ...recipe,
          ingredients: recipe.ingredients.map(ing => ({ ...ing, isHeading: ing.isHeading || false })),
          instructions: recipe.instructions.map(instr => ({ ...instr, isHeading: instr.isHeading || false })),
        }));
        setRecipes(parsedRecipes);
      } else {
        const recipesWithDefaults = initialRecipes.map(recipe => ({
            ...recipe,
            ingredients: recipe.ingredients.map(ing => ({ ...ing, isHeading: ing.isHeading || false })),
            instructions: recipe.instructions.map(instr => ({ ...instr, isHeading: instr.isHeading || false })),
        }));
        setRecipes(recipesWithDefaults);
        localStorage.setItem('familyCookbookRecipes', JSON.stringify(recipesWithDefaults));
      }
    } catch (error) {
      console.error("Failed to load recipes from localStorage", error);
      const recipesWithDefaults = initialRecipes.map(recipe => ({
          ...recipe,
          ingredients: recipe.ingredients.map(ing => ({ ...ing, isHeading: ing.isHeading || false })),
          instructions: recipe.instructions.map(instr => ({ ...instr, isHeading: instr.isHeading || false })),
      }));
      setRecipes(recipesWithDefaults);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) { 
      try {
        localStorage.setItem('familyCookbookRecipes', JSON.stringify(recipes));
      } catch (error) {
        console.error("Failed to save recipes to localStorage", error);
      }
    }
  }, [recipes, loading]);

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'ingredients' | 'instructions'> & { 
    ingredients: Omit<Ingredient, 'id'>[],
    instructions: Omit<InstructionStep, 'id'>[] 
  }): Recipe => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: generateId(),
      ingredients: recipeData.ingredients.map(ing => ({ ...ing, id: ing.id || generateId(), isHeading: ing.isHeading || false })),
      instructions: recipeData.instructions.map(instr => ({ ...instr, id: instr.id || generateId(), isHeading: instr.isHeading || false })),
    };
    setRecipes(prevRecipes => [...prevRecipes, newRecipe]);
    return newRecipe;
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
     const fullUpdatedRecipe: Recipe = {
      ...updatedRecipe,
      ingredients: updatedRecipe.ingredients.map(ing => ({ ...ing, id: ing.id || generateId(), isHeading: ing.isHeading || false })),
      instructions: updatedRecipe.instructions.map(instr => ({ ...instr, id: instr.id || generateId(), isHeading: instr.isHeading || false })),
    };
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe => (recipe.id === fullUpdatedRecipe.id ? fullUpdatedRecipe : recipe))
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

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
    name: 'עוגיות שוקולד צ\'יפס קלאסיות',
    source: 'ספר המתכונים הישן של סבתא',
    prepTime: '20 דקות',
    cookTime: '10-12 דקות',
    servings: 24,
    servingUnit: 'עוגיות',
    freezable: true,
    ingredients: [
      { id: generateId(), name: 'קמח לכל מטרה', amount: 2.25, unit: 'כוסות' },
      { id: generateId(), name: 'סודה לשתייה', amount: 1, unit: 'כפית' },
      { id: generateId(), name: 'מלח', amount: 1, unit: 'כפית' },
      { id: generateId(), name: 'חמאה לא מלוחה, רכה', amount: 1, unit: 'כוס' },
      { id: generateId(), name: 'סוכר לבן', amount: 0.75, unit: 'כוס' },
      { id: generateId(), name: 'סוכר חום, דחוס', amount: 0.75, unit: 'כוס' },
      { id: generateId(), name: 'ביצים גדולות', amount: 2, unit: '' },
      { id: generateId(), name: 'תמצית וניל', amount: 1, unit: 'כפית' },
      { id: generateId(), name: 'שוקולד צ\'יפס מריר למחצה', amount: 2, unit: 'כוסות' },
    ],
    instructions: [
      'חממו תנור מראש ל-190°C (375°F).',
      'ערבבו קמח, סודה לשתייה ומלח בקערה קטנה.',
      'הקציפו חמאה, סוכר לבן וסוכר חום בקערת מיקסר גדולה עד לקבלת תערובת קרמית.',
      'הוסיפו את הביצים אחת אחת, ולאחר מכן ערבבו פנימה את תמצית הווניל.',
      'הוסיפו בהדרגה את תערובת הקמח.',
      'ערבבו פנימה את השוקולד צ\'יפס.',
      'צרו כדורים בעזרת כף גלידה או כף רגילה והניחו על תבניות אפייה לא משומנות.',
      'אפו במשך 9-11 דקות או עד להזהבה.',
      'צננו על תבניות האפייה למשך 2 דקות; העבירו לרשתות צינון להתקררות מלאה.',
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
      { id: generateId(), name: 'פסטה (לדוגמה, ספגטי)', amount: 400, unit: 'גרם' },
      { id: generateId(), name: 'עגבניות מרוסקות משומרות', amount: 1, unit: 'קופסה (400 גרם)' },
      { id: generateId(), name: 'בצל, קצוץ', amount: 1, unit: '' },
      { id: generateId(), name: 'שיני שום, כתושות', amount: 2, unit: '' },
      { id: generateId(), name: 'שמן זית', amount: 2, unit: 'כפות' },
      { id: generateId(), name: 'אורגנו מיובש', amount: 1, unit: 'כפית' },
      { id: generateId(), name: 'מלח ופלפל', amount: 1, unit: 'לפי הטעם' },
      { id: generateId(), name: 'בזיליקום טרי, קצוץ (אופציונלי)', amount: 1, unit: 'חופן' },
    ],
    instructions: [
      'בשלו את הפסטה לפי הוראות היצרן.',
      'בזמן שהפסטה מתבשלת, חממו שמן זית במחבת גדולה על אש בינונית.',
      'הוסיפו בצל ובשלו עד שהוא מתרכך, כ-5 דקות.',
      'הוסיפו שום ובשלו עוד דקה עד שעולה ריח.',
      'ערבבו פנימה עגבניות מרוסקות ואורגנו. תבלו במלח ופלפל.',
      'הביאו לרתיחה ובשלו על אש נמוכה במשך 10-15 דקות, תוך ערבוב מדי פעם.',
      'סננו את הפסטה והוסיפו אותה למחבת עם הרוטב. ערבבו היטב.',
      'הגישו מיד, מקושט בבזיליקום טרי אם רוצים.',
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
        setRecipes(JSON.parse(storedRecipes));
      } else {
        setRecipes(initialRecipes);
        localStorage.setItem('familyCookbookRecipes', JSON.stringify(initialRecipes));
      }
    } catch (error) {
      console.error("Failed to load recipes from localStorage", error);
      setRecipes(initialRecipes); 
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

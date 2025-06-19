'use client';

import type { ShoppingListItem, Ingredient } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateId } from '@/lib/utils';

interface ShoppingListContextType {
  shoppingList: ShoppingListItem[];
  addIngredientsToShoppingList: (ingredients: Ingredient[], recipeId?: string, recipeName?: string) => void;
  removeFromShoppingList: (itemId: string) => void;
  clearShoppingList: () => void;
  updateItemAmount: (itemId: string, newAmount: number) => void;
  loading: boolean;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export const ShoppingListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedShoppingList = localStorage.getItem('familyCookbookShoppingList');
      if (storedShoppingList) {
        setShoppingList(JSON.parse(storedShoppingList));
      }
    } catch (error) {
      console.error("Failed to load shopping list from localStorage", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('familyCookbookShoppingList', JSON.stringify(shoppingList));
      } catch (error) {
        console.error("Failed to save shopping list to localStorage", error);
      }
    }
  }, [shoppingList, loading]);

  const addIngredientsToShoppingList = (ingredients: Ingredient[], recipeId?: string, recipeName?: string) => {
    setShoppingList(prevList => {
      const newList = [...prevList];
      ingredients.forEach(ingredientFromRecipe => {
        const existingItemIndex = newList.findIndex(
          item => item.name.toLowerCase() === ingredientFromRecipe.name.toLowerCase() && 
                  item.unit.toLowerCase() === ingredientFromRecipe.unit.toLowerCase()
        );

        if (existingItemIndex > -1) {
          newList[existingItemIndex].amount += ingredientFromRecipe.amount;
          // Consolidate recipeName: if multiple recipes contribute, show "Multiple Recipes"
          if (recipeName && newList[existingItemIndex].recipeName && newList[existingItemIndex].recipeName !== recipeName && newList[existingItemIndex].recipeName !== "מתכונים שונים") {
            newList[existingItemIndex].recipeName = "מתכונים שונים";
          } else if (recipeName && !newList[existingItemIndex].recipeName) {
            // If existing item has no recipe name, assign the current one
            newList[existingItemIndex].recipeName = recipeName;
          }
          // Similarly, recipeId could be updated if needed, e.g., to store an array of source recipe IDs
        } else {
          newList.push({ 
            id: generateId(), // Generate a new unique ID for the shopping list item
            name: ingredientFromRecipe.name,
            amount: ingredientFromRecipe.amount,
            unit: ingredientFromRecipe.unit,
            originalIngredientId: ingredientFromRecipe.id, // Keep track of one of the source ingredient ids
            recipeId, 
            recipeName 
          });
        }
      });
      return newList;
    });
  };

  const removeFromShoppingList = (itemId: string) => {
    setShoppingList(prevList => prevList.filter(item => item.id !== itemId));
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };
  
  const updateItemAmount = (itemId: string, newAmount: number) => {
    setShoppingList(prevList => 
      prevList.map(item => 
        item.id === itemId ? { ...item, amount: Math.max(0, newAmount) } : item
      ).filter(item => item.amount > 0) 
    );
  };

  return (
    <ShoppingListContext.Provider value={{ shoppingList, addIngredientsToShoppingList, removeFromShoppingList, clearShoppingList, updateItemAmount, loading }}>
      {children}
    </ShoppingListContext.Provider>
  );
};

export const useShoppingList = (): ShoppingListContextType => {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
};

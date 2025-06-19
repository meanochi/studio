'use client';

import type { ShoppingListItem, Ingredient } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateId } from '@/lib/utils';

interface ShoppingListContextType {
  shoppingList: ShoppingListItem[];
  addIngredientsToShoppingList: (ingredients: Ingredient[], recipeId?: string, recipeName?: string) => void;
  removeFromShoppingList: (itemId: string) => void; // Removes a single item by its unique ID
  removeItemsByNameFromShoppingList: (itemName: string) => void; // Removes all items matching a name
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
                  item.unit.toLowerCase() === ingredientFromRecipe.unit.toLowerCase() &&
                  (item.recipeId === recipeId || !item.recipeId || !recipeId) // Try to consolidate better if recipeId matches or is generic
        );

        if (existingItemIndex > -1) {
          newList[existingItemIndex].amount += ingredientFromRecipe.amount;
          // Consolidate recipeName
          if (recipeName && newList[existingItemIndex].recipeName && newList[existingItemIndex].recipeName !== recipeName && newList[existingItemIndex].recipeName !== "מתכונים שונים") {
            newList[existingItemIndex].recipeName = "מתכונים שונים";
          } else if (recipeName && !newList[existingItemIndex].recipeName) {
            newList[existingItemIndex].recipeName = recipeName;
          }
          // Update recipeId if it makes sense (e.g., if the existing one was generic)
          if (recipeId && !newList[existingItemIndex].recipeId) {
            newList[existingItemIndex].recipeId = recipeId;
          }

        } else {
          newList.push({ 
            id: generateId(), 
            name: ingredientFromRecipe.name,
            amount: ingredientFromRecipe.amount,
            unit: ingredientFromRecipe.unit,
            originalIngredientId: ingredientFromRecipe.id, 
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

  const removeItemsByNameFromShoppingList = (itemName: string) => {
    setShoppingList(prevList =>
      prevList.filter(item => item.name.toLowerCase() !== itemName.toLowerCase())
    );
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };
  
  const updateItemAmount = (itemId: string, newAmount: number) => {
    setShoppingList(prevList => 
      prevList.map(item => 
        item.id === itemId ? { ...item, amount: Math.max(0, newAmount) } : item
      ).filter(item => item.amount > 0) // Optionally remove item if amount becomes 0
    );
  };

  return (
    <ShoppingListContext.Provider value={{ shoppingList, addIngredientsToShoppingList, removeFromShoppingList, removeItemsByNameFromShoppingList, clearShoppingList, updateItemAmount, loading }}>
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

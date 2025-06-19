'use client';

import type { ShoppingListItem, Ingredient } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
      ingredients.forEach(ingredient => {
        const existingItemIndex = newList.findIndex(
          item => item.name.toLowerCase() === ingredient.name.toLowerCase() && item.unit.toLowerCase() === ingredient.unit.toLowerCase()
        );
        if (existingItemIndex > -1) {
          newList[existingItemIndex].amount += ingredient.amount;
        } else {
          newList.push({ ...ingredient, recipeId, recipeName });
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
      ).filter(item => item.amount > 0) // Optionally remove if amount is 0
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

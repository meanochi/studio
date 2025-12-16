'use client';

import type { ShoppingListItem, Ingredient } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ManualShoppingListItem {
  name: string;
  amount: number;
  unit: string;
}

interface ShoppingListContextType {
  shoppingList: ShoppingListItem[];
  addIngredientsToShoppingList: (ingredients: Ingredient[], recipeId?: string, recipeName?: string) => void;
  addManualItemToShoppingList: (item: ManualShoppingListItem) => void;
  removeFromShoppingList: (itemId: string) => void;
  removeItemsByNameFromShoppingList: (itemName: string) => void;
  clearShoppingList: () => void;
  updateItemAmount: (itemId: string, newAmount: number) => void;
  loading: boolean;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

const SHOPPING_LIST_STORAGE_KEY = 'shoppingList';

export const ShoppingListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedList = localStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
      if (storedList) {
        setShoppingList(JSON.parse(storedList));
      }
    } catch (error) {
      console.error("Failed to load shopping list from localStorage", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(shoppingList));
    } catch (error) {
      console.error("Failed to save shopping list to localStorage", error);
    }
  }, [shoppingList]);

  const addIngredientsToShoppingList = (ingredients: Ingredient[], recipeId?: string, recipeName?: string) => {
    const newItems: ShoppingListItem[] = ingredients
      .filter(ingredient => !ingredient.isHeading && ingredient.amount !== undefined && ingredient.unit !== undefined)
      .map(ingredient => ({
        id: `${ingredient.id}-${Date.now()}`,
        name: ingredient.name,
        amount: ingredient.amount!,
        unit: ingredient.unit!,
        originalIngredientId: ingredient.id,
        recipeId: recipeId || null,
        recipeName: recipeName || null,
      }));

    setShoppingList(prevList => [...prevList, ...newItems]);
  };
  
  const addManualItemToShoppingList = (item: ManualShoppingListItem) => {
    const newItem: ShoppingListItem = {
      id: `manual-${Date.now()}`,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      originalIngredientId: null,
      recipeId: null,
      recipeName: 'נוסף ידנית'
    };
    setShoppingList(prevList => [...prevList, newItem]);
  };

  const removeFromShoppingList = (itemId: string) => {
    setShoppingList(prevList => prevList.filter(item => item.id !== itemId));
  };
  
  const removeItemsByNameFromShoppingList = (itemName: string) => {
    setShoppingList(prevList => prevList.filter(item => item.name.toLowerCase() !== itemName.toLowerCase()));
  }

  const clearShoppingList = () => {
    setShoppingList([]);
  };

  const updateItemAmount = (itemId: string, newAmount: number) => {
    if (newAmount <= 0) {
      removeFromShoppingList(itemId);
      return;
    }
    setShoppingList(prevList =>
      prevList.map(item => (item.id === itemId ? { ...item, amount: newAmount } : item))
    );
  };


  return (
    <ShoppingListContext.Provider value={{ shoppingList, addIngredientsToShoppingList, addManualItemToShoppingList, removeFromShoppingList, removeItemsByNameFromShoppingList, clearShoppingList, updateItemAmount, loading }}>
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

'use client';

import type { ShoppingListItem, Ingredient } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirestore } from '@/firebase/provider';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ManualShoppingListItem {
  name: string;
  amount: number;
  unit: string;
}

interface ShoppingListContextType {
  shoppingList: ShoppingListItem[];
  addIngredientsToShoppingList: (ingredients: Ingredient[], recipeId?: string, recipeName?: string) => Promise<void>;
  addManualItemToShoppingList: (item: ManualShoppingListItem) => Promise<void>;
  removeFromShoppingList: (itemId: string) => Promise<void>;
  removeItemsByNameFromShoppingList: (itemName: string) => Promise<void>;
  clearShoppingList: () => Promise<void>;
  updateItemAmount: (itemId: string, newAmount: number) => Promise<void>;
  loading: boolean;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export const ShoppingListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const shoppingListCollectionRef = collection(db, 'shoppingListItems');
    const q = query(shoppingListCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listData = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          name: data.name || "Unknown Item",
          amount: typeof data.amount === 'number' ? data.amount : 0,
          unit: data.unit || "",
          originalIngredientId: data.originalIngredientId || null,
          recipeId: data.recipeId || null,
          recipeName: data.recipeName || null,
        } as ShoppingListItem;
      });
      setShoppingList(listData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching shopping list from Firestore: ", error);
      toast({
        title: "שגיאה בטעינת רשימת הקניות",
        description: "לא ניתן היה לטעון את רשימת הקניות. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, db]);

  const addIngredientsToShoppingList = async (ingredients: Ingredient[], recipeId?: string, recipeName?: string) => {
    if (!db) return;
    const batch = writeBatch(db);
    ingredients.forEach(ingredient => {
      if (ingredient.isHeading || ingredient.amount === undefined || ingredient.unit === undefined) {
        return; // Skip headings and ingredients without amount/unit
      }
      const newItem: Omit<ShoppingListItem, 'id'> = {
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        originalIngredientId: ingredient.id || null,
        recipeId: recipeId || null,
        recipeName: recipeName || null,
      };
      const docRef = doc(collection(db, 'shoppingListItems')); // Firestore will generate ID
      batch.set(docRef, newItem);
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error adding ingredients to shopping list in Firestore: ", error);
      toast({
        title: "שגיאה בהוספת פריטים לרשימה",
        description: "לא ניתן היה להוסיף פריטים לרשימת הקניות. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const addManualItemToShoppingList = async (item: ManualShoppingListItem) => {
    if (!db) return;
    try {
      const newItem: Omit<ShoppingListItem, 'id'> = {
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        recipeName: 'נוסף ידנית'
      };
      await addDoc(collection(db, 'shoppingListItems'), newItem);
    } catch (error) {
       console.error("Error adding manual item to shopping list in Firestore: ", error);
      toast({
        title: "שגיאה בהוספת פריט",
        description: "לא ניתן היה להוסיף את הפריט. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  }

  const removeFromShoppingList = async (itemId: string) => {
    if (!db) return;
    try {
      const itemRef = doc(db, 'shoppingListItems', itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error("Error removing item from shopping list in Firestore: ", error);
      toast({
        title: "שגיאה בהסרת פריט",
        description: "לא ניתן היה להסיר את הפריט מרשימת הקניות. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const removeItemsByNameFromShoppingList = async (itemName: string) => {
    if (!db) return;
    const q = query(collection(db, 'shoppingListItems'), where('name', '==', itemName));
    try {
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error(`Error removing items by name "${itemName}" from Firestore: `, error);
      toast({
        title: "שגיאה בהסרת פריטים",
        description: `לא ניתן היה להסיר פריטים עם השם "${itemName}". נסה שוב מאוחר יותר.`,
        variant: "destructive",
      });
    }
  };

  const clearShoppingList = async () => {
    if (!db) return;
    try {
      const shoppingListCollectionRef = collection(db, 'shoppingListItems');
      const querySnapshot = await getDocs(shoppingListCollectionRef);
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing shopping list in Firestore: ", error);
      toast({
        title: "שגיאה בניקוי הרשימה",
        description: "לא ניתן היה לנקות את רשימת הקניות. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };
  
  const updateItemAmount = async (itemId: string, newAmount: number) => {
    if (!db) return;
    if (newAmount <= 0) {
      // If new amount is zero or less, remove the item
      await removeFromShoppingList(itemId);
      return;
    }
    try {
      const itemRef = doc(db, 'shoppingListItems', itemId);
      await updateDoc(itemRef, { amount: newAmount });
    } catch (error) {
      console.error("Error updating item amount in Firestore: ", error);
      toast({
        title: "שגיאה בעדכון כמות",
        description: "לא ניתן היה לעדכן את כמות הפריט. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
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

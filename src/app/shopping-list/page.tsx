
'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { ShoppingListItem } from '@/types';
import { useShoppingList } from '@/contexts/ShoppingListContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ShoppingBasket, XCircle, Loader2, Printer, PlusCircle } from 'lucide-react';
import { getDisplayUnit } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface GroupedShoppingItem {
  name: string; 
  items: ShoppingListItem[]; 
  displayAmount: string; 
  recipeName?: string; 
}

export default function ShoppingListPage() {
  const { shoppingList, removeItemsByNameFromShoppingList, clearShoppingList, loading, addManualItemToShoppingList } = useShoppingList();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number | string>(1);
  const [newItemUnit, setNewItemUnit] = useState('יחידות');


  const groupedItems = useMemo(() => {
    if (loading) return [];
    const groupsByName: { [key: string]: ShoppingListItem[] } = {};
    
    shoppingList.forEach(item => {
      const normalizedName = item.name.trim().toLowerCase();
      if (!groupsByName[normalizedName]) {
        groupsByName[normalizedName] = [];
      }
      groupsByName[normalizedName].push(item);
    });
    
    return Object.entries(groupsByName).map(([normalizedName, nameGroupItems]) => {
      const firstItemInGroup = nameGroupItems[0];
      
      const unitsMap: { [unitKey: string]: { totalAmount: number, originalUnitDisplay: string } } = {};
      nameGroupItems.forEach(item => {
        const unitKey = item.unit.trim().toLowerCase();
        if (!unitsMap[unitKey]) {
          unitsMap[unitKey] = { totalAmount: 0, originalUnitDisplay: item.unit };
        }
        unitsMap[unitKey].totalAmount += item.amount;
      });

      const displayAmountParts = Object.values(unitsMap).map(unitData => 
        `${Number(unitData.totalAmount.toFixed(2))} ${getDisplayUnit(unitData.totalAmount, unitData.originalUnitDisplay)}`
      );
      const displayAmount = displayAmountParts.join(' + ');
      
      let representativeRecipeName = firstItemInGroup.recipeName;
      const uniqueRecipeNames = new Set(nameGroupItems.map(i => i.recipeName).filter(Boolean));
      if (uniqueRecipeNames.size > 1) {
        representativeRecipeName = "מתכונים שונים";
      } else if (uniqueRecipeNames.size === 1) {
        representativeRecipeName = uniqueRecipeNames.values().next().value;
      }

      return {
        name: firstItemInGroup.name, 
        items: nameGroupItems, 
        displayAmount,
        recipeName: representativeRecipeName,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [shoppingList, loading]);

  const handleClearList = () => {
    clearShoppingList();
    toast({
      title: "רשימת הקניות נוקתה",
      description: "כל הפריטים הוסרו מרשימת הקניות שלך.",
      variant: 'destructive',
    });
  };

  const handleRemoveGroup = (groupName: string) => {
    removeItemsByNameFromShoppingList(groupName);
    toast({
      title: "הפריטים הוסרו",
      description: `כל הפריטים עבור "${groupName}" הוסרו מרשימת הקניות שלך.`,
      variant: 'destructive',
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemAmount || +newItemAmount <= 0) {
      toast({
        title: "פרטים חסרים",
        description: "אנא מלא שם פריט וכמות חיובית.",
        variant: "destructive"
      });
      return;
    }
    addManualItemToShoppingList({
      name: newItemName.trim(),
      amount: Number(newItemAmount),
      unit: newItemUnit.trim() || 'יחידות'
    });
    // Reset form
    setNewItemName('');
    setNewItemAmount(1);
    setNewItemUnit('יחידות');
    toast({
      title: "פריט נוסף!",
      description: `${newItemName} נוסף לרשימת הקניות.`,
    })
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-4 text-xl font-semibold text-primary">טוען רשימת קניות...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto shopping-list-print-container" ref={printRef}>
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-3xl font-headline text-primary flex items-center gap-2">
            <ShoppingBasket size={32} /> רשימת קניות
          </CardTitle>
          <div className="flex items-center gap-2 no-print">
            {groupedItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
                <Printer size={16} /> הדפס רשימה
              </Button>
            )}
            {groupedItems.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex items-center gap-1.5">
                    <XCircle size={16} /> נקה הכל
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>לנקות את רשימת הקניות?</AlertDialogTitle>
                    <AlertDialogDescription>
                      פעולה זו תסיר את כל הפריטים מרשימת הקניות שלך. לא ניתן לבטל פעולה זו.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearList}>נקה רשימה</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddManualItem} className="mb-6 space-y-3 no-print">
            <h3 className="text-lg font-headline text-primary">הוסף פריט ידנית</h3>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:w-1/2">
                <Label htmlFor="itemName">שם הפריט</Label>
                <Input id="itemName" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="לדוגמה: נייר אפייה" required/>
              </div>
              <div className="w-full sm:w-1/4">
                <Label htmlFor="itemAmount">כמות</Label>
                <Input id="itemAmount" type="number" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value ? Number(e.target.value) : '')} min="0.1" step="any" required/>
              </div>
              <div className="w-full sm:w-1/4">
                <Label htmlFor="itemUnit">יחידה</Label>
                <Input id="itemUnit" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} placeholder="לדוגמה: יחידות"/>
              </div>
              <Button type="submit" className="w-full sm:w-auto flex items-center gap-2">
                <PlusCircle size={18} /> הוסף
              </Button>
            </div>
          </form>

          {groupedItems.length > 0 && <Separator className="my-6" />}
          
          {groupedItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground font-body">רשימת הקניות שלך ריקה.</p>
              <Button asChild variant="link" className="mt-4 text-lg no-print">
                <Link href="/">עיין במתכונים כדי להוסיף רכיבים</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3 font-body">
              {groupedItems.map(group => (
                <li key={group.name} className="flex items-center justify-between p-3 bg-secondary/20 rounded-md shadow-sm hover:bg-secondary/40 transition-colors">
                  <div className="flex-grow">
                    <span className="font-semibold text-lg text-primary item-name-print">{group.name}</span>
                    <div className="text-sm text-muted-foreground item-amount-unit-print">
                      {group.displayAmount}
                    </div>
                    {group.recipeName && <span className="text-xs text-muted-foreground/80 block italic item-recipe-print"> (עבור {group.recipeName})</span>}
                  </div>
                  <div className="no-print">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveGroup(group.name)} 
                      aria-label={`הסר את כל הפריטים של ${group.name}`} 
                      className="text-destructive hover:bg-destructive/10"
                      title={`הסר את ${group.name}`}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        {groupedItems.length > 0 && (
          <CardFooter className="border-t pt-6 no-print">
            <p className="text-sm text-muted-foreground font-body">
              סך הפריטים (לפני איחוד יחידות): {shoppingList.length}. סוגי פריטים (מאוחדים לפי שם): {groupedItems.length}.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { ShoppingListItem } from '@/types';
import { useShoppingList } from '@/contexts/ShoppingListContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ShoppingBasket, XCircle, Loader2, Printer, PlusCircle, Share2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const generateShoppingListText = () => {
    let text = '*רשימת קניות*\n\n';
    groupedItems.forEach(group => {
      text += `- ${group.name} (${group.displayAmount})\n`;
    });
    return text;
  };
  
  const handleShare = (platform: 'whatsapp' | 'email') => {
    const listText = generateShoppingListText();
    const encodedText = encodeURIComponent(listText);
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } else if (platform === 'email') {
      const subject = encodeURIComponent('רשימת קניות');
      window.location.href = `mailto:?subject=${subject}&body=${encodedText}`;
    }
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
              <>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                        <Share2 size={16} /> שתף
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                         שתף ב-WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('email')}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                         שלח באימייל
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
                  <Printer size={16} /> הדפס
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex items-center gap-1.5">
                      <XCircle size={16} /> נקה
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
              </>
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

          {groupedItems.length > 0 && <Separator className="my-4" />}
          
          {groupedItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground font-body">רשימת הקניות שלך ריקה.</p>
              <Button asChild variant="link" className="mt-4 text-lg no-print">
                <Link href="/">עיין במתכונים כדי להוסיף רכיבים</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-1 font-body">
              {groupedItems.map(group => (
                <li key={group.name} className="flex items-center justify-between p-2 border-b border-dashed">
                  <div className="flex-shrink-0 no-print">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveGroup(group.name)} 
                      aria-label={`הסר את כל הפריטים של ${group.name}`} 
                      className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                      title={`הסר את ${group.name}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className="flex-grow text-right me-2">
                     <span className="font-semibold text-primary item-name-print">{group.name}</span>
                     <span className="text-muted-foreground item-amount-unit-print"> - {group.displayAmount}</span>
                     {group.recipeName && <span className="text-xs text-muted-foreground/80 block italic item-recipe-print"> (עבור {group.recipeName})</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        {groupedItems.length > 0 && (
          <CardFooter className="border-t pt-4 mt-4 no-print">
            <p className="text-xs text-muted-foreground font-body">
              סה"כ {groupedItems.length} סוגי פריטים.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

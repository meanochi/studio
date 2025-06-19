'use client';

import { useShoppingList } from '@/contexts/ShoppingListContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingBasket, XCircle, Loader2 } from 'lucide-react';
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

export default function ShoppingListPage() {
  const { shoppingList, removeFromShoppingList, clearShoppingList, updateItemAmount, loading } = useShoppingList();
  const { toast } = useToast();

  const handleClearList = () => {
    clearShoppingList();
    toast({
      title: "רשימת הקניות נוקתה",
      description: "כל הפריטים הוסרו מרשימת הקניות שלך.",
      variant: 'destructive',
    });
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeFromShoppingList(itemId);
    toast({
      title: "הפריט הוסר",
      description: `"${itemName}" הוסר מרשימת הקניות שלך.`,
      variant: 'destructive',
    });
  };

  const handleAmountChange = (itemId: string, newAmount: string) => {
    const amount = parseFloat(newAmount);
    if (!isNaN(amount)) {
      updateItemAmount(itemId, amount);
    }
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
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-3xl font-headline text-primary flex items-center gap-2">
            <ShoppingBasket size={32} /> רשימת קניות
          </CardTitle>
          {shoppingList.length > 0 && (
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
        </CardHeader>
        <CardContent>
          {shoppingList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground font-body">רשימת הקניות שלך ריקה.</p>
              <Button asChild variant="link" className="mt-4 text-lg">
                <Link href="/">עיין במתכונים כדי להוסיף רכיבים</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3 font-body">
              {shoppingList.map(item => (
                <li key={item.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-md shadow-sm hover:bg-secondary/40 transition-colors">
                  <div className="flex-grow">
                    <span className="font-semibold text-lg text-primary-foreground">{item.name}</span>
                    {item.recipeName && <span className="text-xs text-muted-foreground block italic"> (עבור {item.recipeName})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleAmountChange(item.id, e.target.value)}
                      className="w-20 h-8 text-sm text-center"
                      min="0.01"
                      step="0.01"
                      aria-label={`כמות עבור ${item.name}`}
                    />
                    <span className="text-sm text-muted-foreground w-16 truncate" title={item.unit}>{item.unit}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id, item.name)} aria-label={`הסר את ${item.name}`} className="text-destructive hover:bg-destructive/10">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        {shoppingList.length > 0 && (
          <CardFooter className="border-t pt-6">
            <p className="text-sm text-muted-foreground font-body">
              יש לך {shoppingList.length} פריט(ים) ברשימת הקניות.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

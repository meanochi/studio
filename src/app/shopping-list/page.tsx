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
      title: "Shopping List Cleared",
      description: "All items have been removed from your shopping list.",
    });
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeFromShoppingList(itemId);
    toast({
      title: "Item Removed",
      description: `"${itemName}" has been removed from your shopping list.`,
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
        <p className="ml-4 text-xl font-semibold text-primary">Loading shopping list...</p>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-3xl font-headline text-primary flex items-center gap-2">
            <ShoppingBasket size={32} /> Shopping List
          </CardTitle>
          {shoppingList.length > 0 && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-1.5">
                  <XCircle size={16} /> Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Shopping List?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all items from your shopping list. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearList}>Clear List</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {shoppingList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground font-body">Your shopping list is empty.</p>
              <Button asChild variant="link" className="mt-4 text-lg">
                <Link href="/">Browse recipes to add ingredients</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3 font-body">
              {shoppingList.map(item => (
                <li key={item.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-md shadow-sm hover:bg-secondary/40 transition-colors">
                  <div className="flex-grow">
                    <span className="font-semibold text-lg text-primary-foreground">{item.name}</span>
                    {item.recipeName && <span className="text-xs text-muted-foreground block italic"> (for {item.recipeName})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleAmountChange(item.id, e.target.value)}
                      className="w-20 h-8 text-sm text-center"
                      min="0.01"
                      step="0.01"
                      aria-label={`Amount for ${item.name}`}
                    />
                    <span className="text-sm text-muted-foreground w-16 truncate" title={item.unit}>{item.unit}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id, item.name)} aria-label={`Remove ${item.name}`} className="text-destructive hover:bg-destructive/10">
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
              You have {shoppingList.length} item(s) in your shopping list.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

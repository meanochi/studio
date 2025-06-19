'use client';

import { useEffect, useState, useRef }_ from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRecipes } from '@/contexts/RecipeContext';
import { useShoppingList } from '@/contexts/ShoppingListContext';
import type { Recipe, Ingredient } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
  Clock, Users, Edit3, Trash2, Printer, ShoppingCart, CheckSquare, Square, Utensils, Snowflake, ChevronsUpDown, Loader2, AlertTriangle, HomeIcon
} from 'lucide-react';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getRecipeById, deleteRecipe, loading: recipesLoading } = useRecipes();
  const { addIngredientsToShoppingList } = useShoppingList();
  const { toast } = useToast();

  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined); // undefined for loading, null for not found
  const [isAmountsDoubled, setIsAmountsDoubled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recipesLoading && recipeId) {
      const foundRecipe = getRecipeById(recipeId as string);
      setRecipe(foundRecipe); // Will be undefined if not found, then becomes null
      setIsLoading(false);
    }
  }, [recipeId, getRecipeById, recipesLoading]);

  const displayedIngredients = recipe?.ingredients.map(ing => ({
    ...ing,
    amount: isAmountsDoubled ? ing.amount * 2 : ing.amount,
  })) || [];

  const handleDelete = () => {
    if (recipe) {
      deleteRecipe(recipe.id);
      toast({
        title: "Recipe Deleted",
        description: `"${recipe.name}" has been removed.`,
      });
      router.push('/');
    }
  };

  const handleToggleDoubleAmounts = () => {
    setIsAmountsDoubled(!isAmountsDoubled);
  };

  const handleAddToShoppingList = () => {
    if (recipe) {
      addIngredientsToShoppingList(displayedIngredients, recipe.id, recipe.name);
      toast({
        title: "Added to Shopping List",
        description: `${isAmountsDoubled ? 'Doubled' : 'Original'} amounts for "${recipe.name}" added.`,
      });
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (isLoading || recipesLoading) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl font-semibold text-primary">Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-3xl font-headline text-destructive mb-4">Recipe Not Found</h2>
        <p className="text-muted-foreground font-body mb-6">Sorry, we couldn't find the recipe you're looking for.</p>
        <Button asChild variant="default">
          <Link href="/" className="flex items-center gap-2">
            <HomeIcon size={18} /> Go back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const totalTime = () => {
    return `${recipe.prepTime}${recipe.cookTime ? `, ${recipe.cookTime}` : ''}`;
  }

  return (
    <div ref={printRef}>
      <Card className="overflow-hidden shadow-xl recipe-detail-print">
        <CardHeader className="p-0 relative">
          {recipe.imageUrl && (
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              width={1200}
              height={600}
              className="w-full h-64 md:h-96 object-cover"
              priority
              data-ai-hint="recipe food"
            />
          )}
          <div className={recipe.imageUrl ? "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end" : "p-6 bg-primary/10"}>
            <CardTitle className={`text-4xl md:text-5xl font-headline ${recipe.imageUrl ? 'text-white' : 'text-primary'}`}>{recipe.name}</CardTitle>
            {recipe.source && <CardDescription className={`mt-1 text-lg ${recipe.imageUrl ? 'text-gray-200' : 'text-muted-foreground'} font-body italic`}>Source: {recipe.source}</CardDescription>}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center bg-secondary/30 p-4 rounded-lg">
            <div className="font-body">
              <Clock size={24} className="mx-auto mb-1 text-primary" />
              <p className="font-semibold">Time</p>
              <p className="text-sm text-muted-foreground">{totalTime()}</p>
            </div>
            <div className="font-body">
              <Users size={24} className="mx-auto mb-1 text-primary" />
              <p className="font-semibold">Servings</p>
              <p className="text-sm text-muted-foreground">{isAmountsDoubled ? recipe.servings * 2 : recipe.servings} {recipe.servingUnit}</p>
            </div>
            <div className="font-body">
              {recipe.freezable ? <Snowflake size={24} className="mx-auto mb-1 text-primary" /> : <Utensils size={24} className="mx-auto mb-1 text-muted-foreground" />}
              <p className="font-semibold">Freezable</p>
              <p className="text-sm text-muted-foreground">{recipe.freezable ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(tag => (
                <Badge key={tag} variant="outline" className="font-body text-sm bg-accent/10 text-accent-foreground border-accent hover:bg-accent/20">{tag}</Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Ingredients Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-2xl font-headline text-primary">Ingredients</h3>
              <Button variant="outline" size="sm" onClick={handleToggleDoubleAmounts} className="flex items-center gap-1.5 no-print">
                <ChevronsUpDown size={16} /> {isAmountsDoubled ? 'Original Amounts' : 'Double Amounts'}
              </Button>
            </div>
            <ul className="list-none space-y-2 font-body pl-0">
              {displayedIngredients.map(ingredient => (
                <li key={ingredient.id} className="flex items-center p-2 bg-background rounded-md shadow-sm hover:bg-secondary/20 transition-colors">
                  <span className="font-semibold text-primary w-1/3">{ingredient.name}</span>
                  <span className="text-muted-foreground w-1/3 text-center">{ingredient.amount} {ingredient.unit}</span>
                  <span className="text-xs text-gray-400 w-1/3 text-right italic">
                    {isAmountsDoubled && `(Original: ${ingredient.amount / 2} ${ingredient.unit})`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Instructions Section */}
          <div>
            <h3 className="text-2xl font-headline text-primary mb-3">Instructions</h3>
            <ol className="list-decimal list-inside space-y-3 font-body text-base md:text-lg leading-relaxed">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="pl-2 border-l-2 border-primary/50 py-1 hover:bg-primary/5 transition-colors rounded-r-md">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>

        <CardFooter className="p-6 flex flex-col sm:flex-row justify-end items-center gap-3 border-t no-print">
          <Button variant="outline" onClick={handleAddToShoppingList} className="w-full sm:w-auto flex items-center gap-2">
            <ShoppingCart size={18} /> Add to Shopping List
          </Button>
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto flex items-center gap-2">
            <Printer size={18} /> Print Recipe
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto flex items-center gap-2">
            <Link href={`/recipes/edit/${recipe.id}`}>
              <Edit3 size={18} /> Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto flex items-center gap-2">
                <Trash2 size={18} /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the recipe "{recipe.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

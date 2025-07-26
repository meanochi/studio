
'use client';

import type { Recipe } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Edit3, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { useRecipes } from '@/contexts/RecipeContext';
import { useToast } from '@/hooks/use-toast';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { deleteRecipe } = useRecipes();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteRecipe(recipe.id);
    toast({
      title: "המתכון נמחק",
      description: `"${recipe.name}" הוסר.`,
      variant: 'destructive',
    });
  };
  
  const totalTime = () => {
    return `${recipe.prepTime}${recipe.cookTime ? `, ${recipe.cookTime}` : ''}`;
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 recipe-card-print">
      <CardHeader className="p-0 relative">
        <Link href={`/recipes/${recipe.id}`} aria-label={`הצג מתכון: ${recipe.name}`}>
          <Image
            src={recipe.imageUrl || 'https://images.unsplash.com/photo-1556911220-e15b29be8c9f?w=600&h=400&fit=crop&q=80'}
            alt={recipe.name}
            width={600}
            height={400}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="cooking baking"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/recipes/${recipe.id}`} className="hover:text-primary">
          <CardTitle className="text-2xl font-headline mb-2 truncate" title={recipe.name}>{recipe.name}</CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground mb-1 font-body italic">מקור: {recipe.source}</p>
        <div className="flex items-center text-sm text-muted-foreground mb-1 font-body">
          <Clock size={16} className="me-1.5 text-accent" />
          <span>{totalTime()}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mb-3 font-body">
          <Users size={16} className="me-1.5 text-accent" />
          <span>{recipe.servings} {recipe.servingUnit}</span>
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {recipe.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="default" className="font-body text-xs bg-accent text-accent-foreground border border-accent hover:bg-accent/90">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row justify-between items-center gap-2 no-print">
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href={`/recipes/${recipe.id}`} className="flex items-center gap-1">
            <Eye size={16} /> הצג
          </Link>
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Link href={`/recipes/edit/${recipe.id}`} className="flex items-center gap-1">
              <Edit3 size={16} /> ערוך
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex-1 sm:flex-none flex items-center gap-1">
                <Trash2 size={16} /> מחק
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription>
                  לא ניתן לבטל פעולה זו. הפעולה תמחק לצמיתות את המתכון "{recipe.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>מחק</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

    
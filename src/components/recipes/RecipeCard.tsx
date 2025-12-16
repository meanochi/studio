'use client';

import type { Recipe } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Edit3, Trash2, Eye, CalendarPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRecipes } from '@/contexts/RecipeContext';
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
import React from 'react';


interface RecipeCardProps {
  recipe: Recipe;
  onOpen: (recipeId: string) => void;
}

export default function RecipeCard({ recipe, onOpen }: RecipeCardProps) {
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

  const hasImage = !!recipe.imageUrl;

  return (
    <Card className="flex-start flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 recipe-card-print group">
       <div onClick={() => onOpen(recipe.id)} className="cursor-pointer">
          <CardHeader className="p-0 relative">
            <div aria-label={`הצג מתכון: ${recipe.name}`} className="block w-full h-48 relative">
              {hasImage ? (
                <Image
                  src={recipe.imageUrl!}
                  alt={recipe.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                 <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <span className="text-muted-foreground font-headline text-2xl">{recipe.name.charAt(0)}</span>
                 </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
              <CardTitle className="text-2xl font-headline mb-2 truncate group-hover:text-primary" title={recipe.name}>{recipe.name}</CardTitle>
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
                {recipe.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="default" className="font-body text-xs bg-accent text-accent-foreground border border-accent hover:bg-accent/90">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      <CardFooter className="p-4 pt-0 flex justify-end items-center no-print mt-auto">
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Link href={`/recipes/edit/${recipe.id}`} title="ערוך מתכון">
                    <Edit3 size={16} />
                </Link>
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" title="מחק מתכון">
                      <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                            פעולה זו תמחק את המתכון "{recipe.name}" לצמיתות.
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

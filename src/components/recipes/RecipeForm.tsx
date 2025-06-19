'use client';

import type { Recipe } from '@/types';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema, RecipeFormData, IngredientFormData } from './RecipeSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { useState } from 'react'; // Added useState import

interface RecipeFormProps {
  initialData?: Recipe;
  onSubmit: (data: RecipeFormData) => void;
  isEditing?: boolean;
}

export default function RecipeForm({ initialData, onSubmit, isEditing = false }: RecipeFormProps) {
  const defaultValues: Partial<RecipeFormData> = initialData
    ? {
        ...initialData,
        ingredients: initialData.ingredients.map(ing => ({ ...ing, amount: Number(ing.amount) })), // ensure amount is number
        tags: initialData.tags || [],
      }
    : {
        name: '',
        source: '',
        prepTime: '',
        cookTime: '',
        servings: 1,
        servingUnit: 'serving',
        freezable: false,
        ingredients: [{ name: '', amount: 1, unit: '' }],
        instructions: [''],
        imageUrl: '',
        tags: [],
      };
  
  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction } = useFieldArray({
    control: form.control,
    name: "instructions",
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: "tags",
  });
  
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() !== '' && !(form.getValues('tags') || []).includes(newTag.trim())) {
      appendTag(newTag.trim());
      setNewTag('');
    }
  };


  const handleSubmit = (data: RecipeFormData) => {
    const processedData = {
        ...data,
        imageUrl: data.imageUrl?.trim() === '' ? undefined : data.imageUrl,
        ingredients: data.ingredients.map(ing => ({ ...ing, id: ing.id || generateId() })),
    };
    onSubmit(processedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">
              {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Chocolate Chip Cookies" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., Grandma's Cookbook" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Times and Servings */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prep Time</FormLabel>
                    <FormControl><Input placeholder="e.g., 20 minutes" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cookTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cook Time (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., 10-12 minutes" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servings</FormLabel>
                    <FormControl><Input type="number" min="1" placeholder="e.g., 24" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Unit</FormLabel>
                    <FormControl><Input placeholder="e.g., cookies" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Image URL and Freezable */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><ImageIcon size={18} /> Image URL (Optional)</FormLabel>
                        <FormControl><Input placeholder="https://example.com/image.jpg" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="freezable"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm h-full mt-auto">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>Good for freezing?</FormLabel>
                        </div>
                    </FormItem>
                    )}
                />
            </div>


            {/* Ingredients */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">Ingredients</h3>
              {ingredientFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end p-3 border rounded-md shadow-sm">
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.name`}
                    render={({ field: f }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>Name</FormLabel>}
                        <FormControl><Input placeholder="e.g., Flour" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.amount`}
                    render={({ field: f }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>Amount</FormLabel>}
                        <FormControl><Input type="number" step="0.01" placeholder="e.g., 2.25" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.unit`}
                    render={({ field: f }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>Unit</FormLabel>}
                        <FormControl><Input placeholder="e.g., cups" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)} aria-label="Remove ingredient" className="text-destructive hover:bg-destructive/10">
                    <Trash2 size={20} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendIngredient({ name: '', amount: 1, unit: '' })} className="flex items-center gap-2">
                <PlusCircle size={18} /> Add Ingredient
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">Instructions</h3>
              {instructionFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md shadow-sm">
                   <span className="font-headline text-lg text-primary pt-2">{index + 1}.</span>
                  <FormField
                    control={form.control}
                    name={`instructions.${index}`}
                    render={({ field: f }) => (
                      <FormItem className="flex-grow">
                        <FormControl><Textarea placeholder={`Step ${index + 1}`} {...f} rows={2} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeInstruction(index)} aria-label="Remove instruction" className="text-destructive hover:bg-destructive/10 mt-1.5">
                    <Trash2 size={20} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendInstruction('')} className="flex items-center gap-2">
                <PlusCircle size={18} /> Add Step
              </Button>
            </div>
            
            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">Tags (Optional)</h3>
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Add a tag (e.g., dessert)" 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag();}}}
                  className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={handleAddTag} className="flex items-center gap-2">
                  <PlusCircle size={18} /> Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-1 bg-accent/20 text-accent-foreground px-2 py-1 rounded-md">
                    <span>{form.getValues(`tags.${index}`)}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTag(index)} aria-label="Remove tag" className="h-5 w-5 text-accent-foreground/70 hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full md:w-auto flex items-center gap-2">
              <Save size={20} /> {isEditing ? 'Save Changes' : 'Add Recipe'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

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
import { useState } from 'react';

interface RecipeFormProps {
  initialData?: Recipe;
  onSubmit: (data: RecipeFormData) => void;
  isEditing?: boolean;
}

export default function RecipeForm({ initialData, onSubmit, isEditing = false }: RecipeFormProps) {
  const defaultValues: Partial<RecipeFormData> = initialData
    ? {
        ...initialData,
        ingredients: initialData.ingredients.map(ing => ({ ...ing, amount: Number(ing.amount) })), 
        tags: initialData.tags || [],
      }
    : {
        name: '',
        source: '',
        prepTime: '',
        cookTime: '',
        servings: 1,
        servingUnit: 'מנה',
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
              {isEditing ? 'ערוך מתכון' : 'הוסף מתכון חדש'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם המתכון</FormLabel>
                    <FormControl><Input placeholder="לדוגמה, עוגיות שוקולד צ'יפס" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מקור (אופציונלי)</FormLabel>
                    <FormControl><Input placeholder="לדוגמה, ספר המתכונים של סבתא" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>זמן הכנה</FormLabel>
                    <FormControl><Input placeholder="לדוגמה, 20 דקות" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cookTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>זמן בישול (אופציונלי)</FormLabel>
                    <FormControl><Input placeholder="לדוגמה, 10-12 דקות" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מנות</FormLabel>
                    <FormControl><Input type="number" min="1" placeholder="לדוגמה, 24" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>יחידת מידה למנה</FormLabel>
                    <FormControl><Input placeholder="לדוגמה, עוגיות" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><ImageIcon size={18} /> כתובת URL של תמונה (אופציונלי)</FormLabel>
                        <FormControl><Input placeholder="https://example.com/image.jpg" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="freezable"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 rtl:space-x-reverse space-y-0 rounded-md border p-4 shadow-sm h-full mt-auto">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>טוב להקפאה?</FormLabel>
                        </div>
                    </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">רכיבים</h3>
              {ingredientFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end p-3 border rounded-md shadow-sm">
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.name`}
                    render={({ field: f }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>שם</FormLabel>}
                        <FormControl><Input placeholder="לדוגמה, קמח" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.amount`}
                    render={({ field: f }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>כמות</FormLabel>}
                        <FormControl><Input type="number" step="0.01" placeholder="לדוגמה, 2.25" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.unit`}
                    render={({ field: f }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>יחידה</FormLabel>}
                        <FormControl><Input placeholder="לדוגמה, כוסות" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)} aria-label="הסר רכיב" className="text-destructive hover:bg-destructive/10">
                    <Trash2 size={20} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendIngredient({ name: '', amount: 1, unit: '' })} className="flex items-center gap-2">
                <PlusCircle size={18} /> הוסף רכיב
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">הוראות</h3>
              {instructionFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md shadow-sm">
                   <span className="font-headline text-lg text-primary pt-2">{index + 1}.</span>
                  <FormField
                    control={form.control}
                    name={`instructions.${index}`}
                    render={({ field: f }) => (
                      <FormItem className="flex-grow">
                        <FormControl><Textarea placeholder={`שלב ${index + 1}`} {...f} rows={2} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeInstruction(index)} aria-label="הסר הוראה" className="text-destructive hover:bg-destructive/10 mt-1.5">
                    <Trash2 size={20} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendInstruction('')} className="flex items-center gap-2">
                <PlusCircle size={18} /> הוסף שלב
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">תגיות (אופציונלי)</h3>
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="הוסף תגית (לדוגמה, קינוח)" 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag();}}}
                  className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={handleAddTag} className="flex items-center gap-2">
                  <PlusCircle size={18} /> הוסף תגית
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-1 bg-accent/20 text-accent-foreground ps-2 pe-1 py-1 rounded-md">
                    <span>{form.getValues(`tags.${index}`)}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTag(index)} aria-label="הסר תגית" className="h-5 w-5 text-accent-foreground/70 hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full md:w-auto flex items-center gap-2">
              <Save size={20} /> {isEditing ? 'שמור שינויים' : 'הוסף מתכון'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

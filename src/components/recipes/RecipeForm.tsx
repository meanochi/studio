'use client';

import type { Recipe, Ingredient, InstructionStep } from '@/types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema, RecipeFormData, IngredientFormData, InstructionStepFormData } from './RecipeSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2, Save, Image as ImageIcon, UploadCloud, X, FileText, StickyNote, Loader2 } from 'lucide-react';
import NextImage from 'next/image';
import { generateId } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';

interface RecipeFormProps {
  initialData?: RecipeFormData; // Use RecipeFormData for consistency
  onSubmit: (data: RecipeFormData) => void;
  isEditing?: boolean;
}

export default function RecipeForm({ initialData, onSubmit, isEditing = false }: RecipeFormProps) {
  
  const defaultValues: RecipeFormData = initialData
    ? {
        ...initialData,
        ingredients: initialData.ingredients.map(ing => ({ 
            ...ing, 
            id: ing.id || generateId(), 
            amount: Number(ing.amount),
            isOptional: ing.isOptional || false,
            notes: ing.notes || '',
        })), 
        instructions: initialData.instructions.map(instr => ({
            ...instr,
            id: instr.id || generateId(),
            text: instr.text || '',
            imageUrl: instr.imageUrl || '',
        })),
        tags: initialData.tags || [],
        imageUrl: initialData.imageUrl || '',
      }
    : {
        name: '',
        source: '',
        prepTime: '',
        cookTime: '',
        servings: 1,
        servingUnit: 'מנה',
        freezable: false,
        ingredients: [{ id: generateId(), name: '', amount: 1, unit: '', isOptional: false, notes: '' }],
        instructions: [{ id: generateId(), text: '', imageUrl: '' }],
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
  const [recipeImagePreview, setRecipeImagePreview] = useState<string | null>(null);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);
  
  // State for instruction image previews
  const [instructionImagePreviews, setInstructionImagePreviews] = useState<(string | null)[]>([]);
  const instructionFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialData?.imageUrl) {
      setRecipeImagePreview(initialData.imageUrl);
    }
    if (initialData?.instructions) {
        setInstructionImagePreviews(initialData.instructions.map(instr => instr.imageUrl || null));
        instructionFileInputRefs.current = initialData.instructions.map(() => null);
    } else {
        setInstructionImagePreviews(defaultValues.instructions.map(instr => instr.imageUrl || null));
        instructionFileInputRefs.current = defaultValues.instructions.map(() => null);
    }
  }, [initialData]);


  const handleAddTag = () => {
    if (newTag.trim() !== '' && !(form.getValues('tags') || []).includes(newTag.trim())) {
      appendTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleRecipeImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        form.setError('imageUrl', { type: 'manual', message: 'הקובץ גדול מדי (מקסימום 2MB)' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setRecipeImagePreview(result);
        form.setValue('imageUrl', result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveRecipeImage = () => {
    setRecipeImagePreview(null);
    form.setValue('imageUrl', '', { shouldValidate: true });
    if (recipeFileInputRef.current) {
      recipeFileInputRef.current.value = '';
    }
  };

  const handleInstructionImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB limit for step images
        form.setError(`instructions.${index}.imageUrl`, { type: 'manual', message: 'קובץ גדול מדי (1MB מקס)' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const newPreviews = [...instructionImagePreviews];
        newPreviews[index] = result;
        setInstructionImagePreviews(newPreviews);
        form.setValue(`instructions.${index}.imageUrl`, result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveInstructionImage = (index: number) => {
    const newPreviews = [...instructionImagePreviews];
    newPreviews[index] = null;
    setInstructionImagePreviews(newPreviews);
    form.setValue(`instructions.${index}.imageUrl`, '', { shouldValidate: true });
    const currentRef = instructionFileInputRefs.current[index];
    if (currentRef) {
      currentRef.value = '';
    }
  };
  
  useEffect(() => {
    // Ensure instructionImagePreviews array has the correct length
    const currentInstructionCount = form.getValues('instructions')?.length || 0;
    if (instructionImagePreviews.length !== currentInstructionCount) {
      const newPreviews = Array(currentInstructionCount).fill(null);
      const newRefs = Array(currentInstructionCount).fill(null);
      form.getValues('instructions').forEach((instr, i) => {
        newPreviews[i] = instr.imageUrl || null;
      });
      setInstructionImagePreviews(newPreviews);
      instructionFileInputRefs.current = newRefs;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('instructions')]);


  const handleSubmitForm = (data: RecipeFormData) => {
    const processedData: RecipeFormData = {
        ...data,
        imageUrl: data.imageUrl?.trim() === '' ? undefined : data.imageUrl,
        ingredients: data.ingredients.map(ing => ({ 
            ...ing, 
            id: ing.id || generateId(),
            notes: ing.notes?.trim() === '' ? undefined : ing.notes,
        })),
        instructions: data.instructions.map(instr => ({
            ...instr,
            id: instr.id || generateId(),
            imageUrl: instr.imageUrl?.trim() === '' ? undefined : instr.imageUrl,
        })),
    };
    onSubmit(processedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">
              {isEditing ? 'ערוך מתכון' : 'הוסף מתכון חדש'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipe Name and Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>שם המתכון</FormLabel><FormControl><Input placeholder="לדוגמה, עוגיות שוקולד צ'יפס" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="source" render={({ field }) => (
                  <FormItem><FormLabel>מקור (אופציונלי)</FormLabel><FormControl><Input placeholder="לדוגמה, ספר המתכונים של סבתא" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>

            {/* Prep Time, Cook Time, Servings, Serving Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField control={form.control} name="prepTime" render={({ field }) => (
                  <FormItem><FormLabel>זמן הכנה</FormLabel><FormControl><Input placeholder="לדוגמה, 20 דקות" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="cookTime" render={({ field }) => (
                  <FormItem><FormLabel>זמן בישול (אופציונלי)</FormLabel><FormControl><Input placeholder="לדוגמה, 10-12 דקות" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="servings" render={({ field }) => (
                  <FormItem><FormLabel>מנות</FormLabel><FormControl><Input type="number" min="1" placeholder="לדוגמה, 24" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="servingUnit" render={({ field }) => (
                  <FormItem><FormLabel>יחידת מידה למנה</FormLabel><FormControl><Input placeholder="לדוגמה, עוגיות" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            
            {/* Recipe Image and Freezable Checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2"><ImageIcon size={18} /> תמונת מתכון ראשית</FormLabel>
                {recipeImagePreview ? (
                  <div className="relative group"><NextImage src={recipeImagePreview} alt="תצוגה מקדימה של תמונה" width={200} height={200} className="rounded-md object-cover w-full max-h-64 border" data-ai-hint="recipe food" /><Button type="button" variant="destructive" size="icon" onClick={handleRemoveRecipeImage} className="absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity h-8 w-8"><X size={16} /></Button></div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-input rounded-md cursor-pointer hover:border-primary transition-colors" onClick={() => recipeFileInputRef.current?.click()}><UploadCloud size={40} className="text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">גרור ושחרר או לחץ להעלאה</p><p className="text-xs text-muted-foreground">(עד 2MB)</p></div>
                )}
                <Input type="file" accept="image/*" onChange={handleRecipeImageUpload} className="hidden" ref={recipeFileInputRef}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem className="mt-2"><FormLabel className="sr-only">כתובת URL של תמונה</FormLabel><FormControl><Input placeholder="או הדבק כתובת URL של תמונה" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); setRecipeImagePreview(e.target.value); }} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="freezable" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 rtl:space-x-reverse space-y-0 rounded-md border p-4 shadow-sm h-fit mt-auto"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>טוב להקפאה?</FormLabel></div></FormItem>
              )}/>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">רכיבים</h3>
              {ingredientFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md shadow-sm space-y-3 bg-secondary/10">
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-x-3 gap-y-2 items-end">
                    <FormField control={form.control} name={`ingredients.${index}.name`} render={({ field: f }) => (
                        <FormItem>{index === 0 && <FormLabel>שם הרכיב</FormLabel>}<FormControl><Input placeholder="לדוגמה, קמח" {...f} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name={`ingredients.${index}.amount`} render={({ field: f }) => (
                        <FormItem>{index === 0 && <FormLabel>כמות</FormLabel>}<FormControl><Input type="number" step="0.01" placeholder="לדוגמה, 2.25" {...f} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name={`ingredients.${index}.unit`} render={({ field: f }) => (
                        <FormItem>{index === 0 && <FormLabel>יחידה</FormLabel>}<FormControl><Input placeholder="כוסות, גרמים, כפיות" {...f} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)} aria-label="הסר רכיב" className="text-destructive hover:bg-destructive/10 self-center md:self-end"><Trash2 size={20} /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                    <FormField control={form.control} name={`ingredients.${index}.notes`} render={({ field: f }) => (
                        <FormItem><FormLabel className="text-xs flex items-center gap-1"><StickyNote size={14}/> הערות/אלטרנטיבה (אופציונלי)</FormLabel><FormControl><Input placeholder="לדוגמה, אפשר לוותר או להחליף ב..." {...f} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name={`ingredients.${index}.isOptional`} render={({ field: f }) => (
                        <FormItem className="flex flex-row items-center space-x-2 rtl:space-x-reverse pt-5"><FormControl><Checkbox checked={f.value} onCheckedChange={f.onChange} /></FormControl><FormLabel className="font-normal">רכיב אופציונלי</FormLabel></FormItem>
                    )}/>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendIngredient({ id: generateId(), name: '', amount: 1, unit: '', isOptional: false, notes: '' })} className="flex items-center gap-2"><PlusCircle size={18} /> הוסף רכיב</Button>
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">הוראות הכנה</h3>
              {instructionFields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-3 p-4 border rounded-md shadow-sm bg-secondary/10">
                  <div className="flex items-start gap-2">
                    <span className="font-headline text-lg text-primary pt-2">{index + 1}.</span>
                    <FormField control={form.control} name={`instructions.${index}.text`} render={({ field: f }) => (
                        <FormItem className="flex-grow"><FormLabel className="sr-only">תיאור השלב</FormLabel><FormControl><Textarea placeholder={`שלב ${index + 1}`} {...f} rows={3} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeInstruction(index)} aria-label="הסר הוראה" className="text-destructive hover:bg-destructive/10 mt-1.5"><Trash2 size={20} /></Button>
                  </div>
                  <div className="ms-6 space-y-2">
                     <FormLabel className="text-xs flex items-center gap-1"><ImageIcon size={14}/> תמונת שלב (אופציונלי)</FormLabel>
                    {instructionImagePreviews[index] ? (
                      <div className="relative group w-48 h-32">
                        <NextImage src={instructionImagePreviews[index]!} alt={`תצוגה מקדימה שלב ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="cooking step" />
                        <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveInstructionImage(index)} className="absolute top-1 right-1 opacity-70 group-hover:opacity-100 transition-opacity h-6 w-6"><X size={14} /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-48 h-24 border-2 border-dashed border-input rounded-md cursor-pointer hover:border-primary transition-colors text-xs p-2" onClick={() => instructionFileInputRefs.current[index]?.click()}>
                        <UploadCloud size={24} className="text-muted-foreground me-2" /> לחץ להעלאת תמונה לשלב
                      </div>
                    )}
                    <Input type="file" accept="image/*" onChange={(e) => handleInstructionImageUpload(index, e)} className="hidden" ref={el => instructionFileInputRefs.current[index] = el} />
                    <FormField control={form.control} name={`instructions.${index}.imageUrl`} render={({ field: f }) => (
                        <FormItem className="mt-1"><FormLabel className="sr-only">כתובת URL</FormLabel><FormControl><Input placeholder="או הדבק URL של תמונת שלב" {...f} value={f.value ?? ''} onChange={(e) => {f.onChange(e); const newPreviews = [...instructionImagePreviews]; newPreviews[index] = e.target.value; setInstructionImagePreviews(newPreviews); }} className="text-xs h-8" /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => { appendInstruction({ id: generateId(), text: '', imageUrl: '' }); setInstructionImagePreviews(prev => [...prev, null]); }} className="flex items-center gap-2"><PlusCircle size={18} /> הוסף שלב</Button>
            </div>
            
            {/* Tags Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">תגיות (אופציונלי)</h3>
              <div className="flex gap-2 items-center">
                <Input placeholder="הוסף תגית (לדוגמה, קינוח)" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag();}}} className="flex-grow"/>
                <Button type="button" variant="outline" onClick={handleAddTag} className="flex items-center gap-2"><PlusCircle size={18} /> הוסף תגית</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-1 bg-accent/30 text-accent-foreground ps-2 pe-1 py-1 rounded-md border border-accent/70">
                    <span>{form.getValues(`tags.${index}`)}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTag(index)} aria-label="הסר תגית" className="h-5 w-5 text-accent-foreground/70 hover:text-destructive"><Trash2 size={14} /></Button>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full md:w-auto flex items-center gap-2" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <><Loader2 className="animate-spin me-2"/>מעבד...</> : <><Save size={20} /> {isEditing ? 'שמור שינויים' : 'הוסף מתכון'}</>}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

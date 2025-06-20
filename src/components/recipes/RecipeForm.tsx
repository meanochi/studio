
'use client';

import type { Recipe } from '@/types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema, RecipeFormData } from './RecipeSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2, Save, Image as ImageIcon, UploadCloud, X, FileText, StickyNote, Loader2, ChevronDown, ChevronUp, Heading2 } from 'lucide-react';
import NextImage from 'next/image';
import { generateId } from '@/lib/utils';
import React, { useState, useEffect, useRef, useMemo } from 'react';

interface RecipeFormProps {
  initialData?: RecipeFormData;
  onSubmit: (data: RecipeFormData) => void;
  isEditing?: boolean;
}

export default function RecipeForm({ initialData, onSubmit, isEditing = false }: RecipeFormProps) {

  const defaultFormValues = useMemo<RecipeFormData>(() => {
    return initialData
      ? {
          ...initialData,
          ingredients: initialData.ingredients.map(ing => ({
              ...ing,
              id: ing.id || generateId(),
              amount: Number(ing.amount),
              isOptional: ing.isOptional || false,
              notes: ing.notes || '',
              isHeading: ing.isHeading || false,
          })),
          instructions: initialData.instructions.map(instr => ({
              ...instr,
              id: instr.id || generateId(),
              text: instr.text || '',
              imageUrl: instr.imageUrl || '',
              isHeading: instr.isHeading || false,
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
          ingredients: [{ id: generateId(), name: '', amount: 1, unit: 'יחידות', isOptional: false, notes: '', isHeading: false }],
          instructions: [{ id: generateId(), text: '', imageUrl: '', isHeading: false }],
          imageUrl: '',
          tags: [],
        };
  }, [initialData]);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: defaultFormValues,
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

  const [instructionImagePreviews, setInstructionImagePreviews] = useState<(string | null)[]>([]);
  const instructionFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [visibleInstructionImageInputs, setVisibleInstructionImageInputs] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (defaultFormValues.imageUrl) {
      setRecipeImagePreview(defaultFormValues.imageUrl);
    }
    const initialVisibleStates: Record<string, boolean> = {};
    const initialPreviews: (string | null)[] = [];

    defaultFormValues.instructions.forEach(instr => {
        initialVisibleStates[instr.id || ''] = !!instr.imageUrl; // Show if URL exists
        initialPreviews.push(instr.imageUrl || null);
    });

    setInstructionImagePreviews(initialPreviews);
    setVisibleInstructionImageInputs(initialVisibleStates);
    instructionFileInputRefs.current = defaultFormValues.instructions.map(() => null);
    form.reset(defaultFormValues);
  }, [defaultFormValues, form]);


  const toggleInstructionImageInputVisibility = (instructionId: string) => {
    setVisibleInstructionImageInputs(prev => ({
      ...prev,
      [instructionId]: !prev[instructionId]
    }));
  };

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
  
  const handleAddIngredient = (isHeading = false) => {
    appendIngredient({ 
      id: generateId(), 
      name: '', 
      amount: isHeading ? undefined : 1, 
      unit: isHeading ? undefined : 'יחידות', 
      isOptional: false, 
      notes: '', 
      isHeading 
    });
  };

  const handleAddInstruction = (isHeading = false) => {
    const newId = generateId();
    appendInstruction({ id: newId, text: '', imageUrl: '', isHeading });
    if (!isHeading) {
        setInstructionImagePreviews(prev => [...prev, null]);
        setVisibleInstructionImageInputs(prev => ({...prev, [newId]: false }));
        instructionFileInputRefs.current = [...instructionFileInputRefs.current, null];
    } else {
        // For headings, no preview/visibility state needed for image
        setInstructionImagePreviews(prev => [...prev, null]); // Maintain array length
        instructionFileInputRefs.current = [...instructionFileInputRefs.current, null]; // Maintain array length
    }
  };

  const handleRemoveInstruction = (index: number) => {
    const instructionIdToRemove = instructionFields[index]?.id;

    const newPreviews = instructionImagePreviews.filter((_, i) => i !== index);
    const newRefs = instructionFileInputRefs.current.filter((_, i) => i !== index);
    let newVisibleStates = { ...visibleInstructionImageInputs };
    if (instructionIdToRemove) {
      delete newVisibleStates[instructionIdToRemove];
    }
    
    removeInstruction(index); 

    setInstructionImagePreviews(newPreviews);
    setVisibleInstructionImageInputs(newVisibleStates);
    instructionFileInputRefs.current = newRefs;
  };


  const handleSubmitForm = (data: RecipeFormData) => {
    const processedData: RecipeFormData = {
        ...data,
        imageUrl: data.imageUrl?.trim() === '' ? undefined : data.imageUrl,
        ingredients: data.ingredients.map(ing => ({
            ...ing,
            id: ing.id || generateId(),
            notes: ing.isHeading ? undefined : (ing.notes?.trim() === '' ? undefined : ing.notes),
            amount: ing.isHeading ? 0 : Number(ing.amount), // Store 0 for amount if heading, or actual if not
            unit: ing.isHeading ? '' : ing.unit, // Store empty string for unit if heading
            isOptional: ing.isHeading ? undefined : ing.isOptional,
        })),
        instructions: data.instructions.map(instr => ({
            ...instr,
            id: instr.id || generateId(),
            imageUrl: instr.isHeading ? undefined : (instr.imageUrl?.trim() === '' ? undefined : instr.imageUrl),
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
                  <FormItem><FormLabel>מנות</FormLabel><FormControl><Input type="number" min="1" placeholder="לדוגמה, 24" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 1)}/></FormControl><FormMessage /></FormItem>
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
              {ingredientFields.map((item, index) => {
                const isHeading = form.watch(`ingredients.${index}.isHeading`);
                return (
                <div key={item.id} className="p-4 border rounded-md shadow-sm space-y-3 bg-secondary/10">
                  <div className="flex justify-between items-start">
                    <FormField 
                      control={form.control}
                      name={`ingredients.${index}.isHeading`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 rtl:space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                // Optionally reset/clear other fields if switching to heading
                                if (checked) {
                                  form.setValue(`ingredients.${index}.amount`, undefined);
                                  form.setValue(`ingredients.${index}.unit`, undefined);
                                  form.setValue(`ingredients.${index}.notes`, '');
                                  form.setValue(`ingredients.${index}.isOptional`, false);
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">כותרת משנה?</FormLabel>
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)} aria-label="הסר פריט" className="text-destructive hover:bg-destructive/10"><Trash2 size={20} /></Button>
                  </div>

                  <FormField control={form.control} name={`ingredients.${index}.name`} render={({ field: f }) => (
                      <FormItem><FormLabel>{isHeading ? 'טקסט כותרת' : 'שם הרכיב'}</FormLabel><FormControl><Input placeholder={isHeading ? "לדוגמה, לבצק" : "לדוגמה, קמח"} {...f} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  
                  {!isHeading && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2 items-end">
                        <FormField control={form.control} name={`ingredients.${index}.amount`} render={({ field: f }) => (
                            <FormItem><FormLabel>כמות</FormLabel><FormControl><Input type="number" step="0.01" placeholder="לדוגמה, 2.25" {...f} onChange={e => f.onChange(parseFloat(e.target.value) || '')} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`ingredients.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>יחידה</FormLabel><FormControl><Input placeholder="לדוגמה, כוסות" {...f} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                        <FormField control={form.control} name={`ingredients.${index}.notes`} render={({ field: f }) => (
                            <FormItem><FormLabel className="text-xs flex items-center gap-1"><StickyNote size={14}/> הערות/אלטרנטיבה (אופציונלי)</FormLabel><FormControl><Input placeholder="לדוגמה, אפשר לוותר או להחליף ב..." {...f} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`ingredients.${index}.isOptional`} render={({ field: f }) => (
                            <FormItem className="flex flex-row items-center space-x-2 rtl:space-x-reverse pt-5"><FormControl><Checkbox checked={f.value} onCheckedChange={f.onChange} /></FormControl><FormLabel className="font-normal">רכיב אופציונלי</FormLabel></FormItem>
                        )}/>
                      </div>
                    </>
                  )}
                </div>
              )})}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleAddIngredient(false)} className="flex items-center gap-2"><PlusCircle size={18} /> הוסף רכיב</Button>
                <Button type="button" variant="outline" onClick={() => handleAddIngredient(true)} className="flex items-center gap-2"><Heading2 size={18} /> הוסף כותרת רכיבים</Button>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">הוראות הכנה</h3>
              {instructionFields.map((item, index) => {
                const isHeading = form.watch(`instructions.${index}.isHeading`);
                return (
                <div key={item.id} className="flex flex-col gap-3 p-4 border rounded-md shadow-sm bg-secondary/10">
                  <div className="flex justify-between items-start">
                     <FormField 
                      control={form.control}
                      name={`instructions.${index}.isHeading`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 rtl:space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked && item.id) { // If becoming a heading, hide image input
                                   setVisibleInstructionImageInputs(prev => ({...prev, [item.id!]: false}));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">כותרת משנה?</FormLabel>
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInstruction(index)} aria-label="הסר הוראה" className="text-destructive hover:bg-destructive/10 mt-1.5"><Trash2 size={20} /></Button>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    {!isHeading && <span className="font-headline text-lg text-primary pt-2">{instructionFields.filter(f => !form.getValues(`instructions.${instructionFields.indexOf(f)}.isHeading`)).indexOf(item) + 1}.</span>}
                    <FormField control={form.control} name={`instructions.${index}.text`} render={({ field: f }) => (
                        <FormItem className="flex-grow"><FormLabel className="sr-only">{isHeading ? 'טקסט כותרת' : 'תיאור השלב'}</FormLabel><FormControl><Textarea placeholder={isHeading ? "לדוגמה, הכנת הציפוי" :`שלב ${index + 1}`} {...f} rows={isHeading ? 1:3} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>

                  {!isHeading && item.id && (
                    <div className="ms-6 space-y-2">
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleInstructionImageInputVisibility(item.id!)}
                          className="flex items-center gap-1.5 text-xs"
                      >
                          <ImageIcon size={14}/>
                          {visibleInstructionImageInputs[item.id!] ? 'הסתר אפשרויות תמונה' : 'הוסף/שנה תמונת שלב'}
                          {visibleInstructionImageInputs[item.id!] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </Button>

                      {visibleInstructionImageInputs[item.id!] && (
                          <div className="border-t pt-3 mt-2 space-y-2">
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
                              <Input type="file" accept="image/*" onChange={(e) => handleInstructionImageUpload(index, e)} className="hidden" ref={el => { if(instructionFileInputRefs.current) instructionFileInputRefs.current[index] = el; }} />
                              <FormField control={form.control} name={`instructions.${index}.imageUrl`} render={({ field: f }) => (
                                  <FormItem className="mt-1"><FormLabel className="sr-only">כתובת URL</FormLabel><FormControl><Input placeholder="או הדבק URL של תמונת שלב" {...f} value={f.value ?? ''} onChange={(e) => {f.onChange(e); const newPreviews = [...instructionImagePreviews]; newPreviews[index] = e.target.value; setInstructionImagePreviews(newPreviews); }} className="text-xs h-8" /></FormControl><FormMessage /></FormItem>
                              )}/>
                          </div>
                      )}
                    </div>
                  )}
                </div>
              )})}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleAddInstruction(false)} className="flex items-center gap-2"><PlusCircle size={18} /> הוסף שלב</Button>
                <Button type="button" variant="outline" onClick={() => handleAddInstruction(true)} className="flex items-center gap-2"><Heading2 size={18} /> הוסף כותרת הוראות</Button>
              </div>
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
                  <div key={field.id} className="flex items-center gap-1 bg-accent text-accent-foreground ps-2 pe-1 py-1 rounded-md border border-accent hover:bg-accent/90">
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

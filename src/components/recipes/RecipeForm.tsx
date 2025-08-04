
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
import { PlusCircle, Trash2, Save, Image as ImageIcon, UploadCloud, X, FileText, StickyNote, Loader2, ChevronDown, ChevronUp, Heading2, Wand2, Edit, Bot } from 'lucide-react';
import NextImage from 'next/image';
import { generateId } from '@/lib/utils';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseIngredient } from '@/ai/flows/parse-ingredient-flow';
import { parseRecipe } from '@/ai/flows/parse-recipe-flow';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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
              amount: ing.isHeading ? undefined : Number(ing.amount),
              unit: ing.isHeading ? undefined : ing.unit,
              isOptional: ing.isHeading ? false : (ing.isOptional || false),
              notes: ing.isHeading ? '' : (ing.notes || ''),
              isHeading: ing.isHeading || false,
          })),
          instructions: initialData.instructions.map(instr => ({
              ...instr,
              id: instr.id || generateId(),
              text: instr.text || '',
              imageUrl: instr.isHeading ? '' : (instr.imageUrl || ''),
              isHeading: instr.isHeading || false,
          })),
          tags: initialData.tags || [],
          imageUrl: initialData.imageUrl || '',
          notes: initialData.notes || '',
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
          notes: '',
        };
  }, [initialData]);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: defaultFormValues,
  });
  
  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient, replace: replaceIngredients } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction, replace: replaceInstructions } = useFieldArray({
    control: form.control,
    name: "instructions",
  });

  const { fields: tagFields, append: appendTag, remove: removeTag, replace: replaceTags } = useFieldArray({
    control: form.control,
    name: "tags",
  });

  const [newTag, setNewTag] = useState('');
  const [recipeImagePreview, setRecipeImagePreview] = useState<string | null>(null);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);

  const [instructionImagePreviews, setInstructionImagePreviews] = useState<(string | null)[]>([]);
  const instructionFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [visibleInstructionImageInputs, setVisibleInstructionImageInputs] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const [smartAddIngredient, setSmartAddIngredient] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [addMode, setAddMode] = useState<'smart' | 'manual'>('smart');

  const [fullRecipeText, setFullRecipeText] = useState('');
  const [isParsingRecipe, setIsParsingRecipe] = useState(false);
  const [isParseRecipeDialogOpen, setIsParseRecipeDialogOpen] = useState(false);

  useEffect(() => {
    form.reset(defaultFormValues);
  }, [defaultFormValues, form]);


  useEffect(() => {
    if (initialData?.imageUrl) {
      setRecipeImagePreview(initialData.imageUrl);
    }
    const initialVisibleStates: Record<string, boolean> = {};
    const initialPreviews: (string | null)[] = [];

    initialData?.instructions.forEach(instr => {
        initialVisibleStates[instr.id || ''] = !!instr.imageUrl; // Show if URL exists
        initialPreviews.push(instr.imageUrl || null);
    });

    setInstructionImagePreviews(initialPreviews);
    setVisibleInstructionImageInputs(initialVisibleStates);
    if(initialData?.instructions) {
      instructionFileInputRefs.current = initialData.instructions.map(() => null);
    }
  }, [initialData]);


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

  const handleSmartAddIngredient = async () => {
    if (!smartAddIngredient.trim()) return;
    setIsParsing(true);
    try {
      const result = await parseIngredient({ ingredientLine: smartAddIngredient });
      appendIngredient({
        id: generateId(),
        name: result.name.replace(/-/g, ' '), // Replace hyphens back to spaces for display
        amount: result.amount,
        unit: result.unit,
        isOptional: false,
        notes: '',
        isHeading: false,
      });
      setSmartAddIngredient('');
    } catch (error) {
      console.error('Failed to parse ingredient:', error);
      toast({
        title: 'שגיאת פיענוח',
        description: 'לא הצלחתי להבין את הרכיב. אנא נסה להוסיף אותו ידנית.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddInstruction = (isHeading = false) => {
    const newId = generateId();
    appendInstruction({ id: newId, text: '', imageUrl: '', isHeading });
    
    setInstructionImagePreviews(prev => [...prev, null]);
    instructionFileInputRefs.current = [...instructionFileInputRefs.current, null];
    if (!isHeading) {
        setVisibleInstructionImageInputs(prev => ({...prev, [newId]: false }));
    }
  };

  const handleRemoveInstruction = (index: number) => {
    const instructionIdToRemove = instructionFields[index]?.id;
    removeInstruction(index); 

    setInstructionImagePreviews(prev => prev.filter((_, i) => i !== index));
    instructionFileInputRefs.current = instructionFileInputRefs.current.filter((_, i) => i !== index);
    if (instructionIdToRemove) {
      setVisibleInstructionImageInputs(prev => {
        const newState = {...prev};
        delete newState[instructionIdToRemove];
        return newState;
      });
    }
  };
  
  const handleParseFullRecipe = async () => {
    if (!fullRecipeText.trim()) return;
    setIsParsingRecipe(true);
    try {
      const result = await parseRecipe({ recipeText: fullRecipeText });

      // Use form.reset to update the entire form state
      form.reset({
        ...result,
        ingredients: result.ingredients.map(ing => ({ ...ing, id: generateId() })),
        instructions: result.instructions.map(instr => ({ ...instr, id: generateId() })),
      });

      // Update previews for images
      setRecipeImagePreview(result.imageUrl || null);
      const newInstructionPreviews = result.instructions.map(i => i.imageUrl || null);
      setInstructionImagePreviews(newInstructionPreviews);


      toast({
        title: 'המתכון פוענח בהצלחה!',
        description: 'בדוק את השדות הממולאים ולחץ על שמירה.',
      });
      setIsParseRecipeDialogOpen(false); // Close dialog on success
      setFullRecipeText('');
    } catch (error) {
      console.error("Failed to parse recipe:", error);
      toast({
        title: 'שגיאת פיענוח',
        description: 'לא הצלחתי לפענח את המתכון. אנא ודא שהטקסט בפורמט תקין ונסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsParsingRecipe(false);
    }
  };


  const handleSubmitForm = (data: RecipeFormData) => {
    const processedData: RecipeFormData = {
        ...data,
        imageUrl: data.imageUrl?.trim() === '' ? undefined : data.imageUrl,
        notes: data.notes?.trim() === '' ? undefined : data.notes,
        ingredients: data.ingredients.map(ing => ({
            ...ing,
            id: ing.id || generateId(),
            notes: ing.isHeading ? undefined : (ing.notes?.trim() === '' ? undefined : ing.notes),
            amount: ing.isHeading ? 0 : Number(ing.amount), 
            unit: ing.isHeading ? '' : ing.unit, 
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
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-3xl font-headline text-primary">
              {isEditing ? 'ערוך מתכון' : 'הוסף מתכון חדש'}
            </CardTitle>
            {!isEditing && (
              <Dialog open={isParseRecipeDialogOpen} onOpenChange={setIsParseRecipeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Bot size={18} /> יבא מתכון מטקסט
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>יבא מתכון מטקסט בעזרת AI</DialogTitle>
                    <DialogDescription>
                      הדבק את המתכון המלא למטה. הבינה המלאכותית תנסה לפענח אותו ולמלא את השדות בטופס עבורך.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Textarea
                      placeholder="הדבק כאן את המתכון המלא שלך..."
                      rows={15}
                      value={fullRecipeText}
                      onChange={(e) => setFullRecipeText(e.target.value)}
                      disabled={isParsingRecipe}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="secondary" disabled={isParsingRecipe}>
                         ביטול
                       </Button>
                     </DialogClose>
                    <Button type="button" onClick={handleParseFullRecipe} disabled={isParsingRecipe || !fullRecipeText.trim()}>
                      {isParsingRecipe ? <><Loader2 className="animate-spin me-2" /> מפענח...</> : 'צור מתכון'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
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
              <div className="flex flex-col gap-4">
                <FormField control={form.control} name="freezable" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 rtl:space-x-reverse space-y-0 rounded-md border p-4 shadow-sm h-fit"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>טוב להקפאה?</FormLabel></div></FormItem>
                )}/>
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><StickyNote size={18}/> הערות למתכון (אופציונלי)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="הערות כלליות על המתכון, טיפים, או הצעות הגשה..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">רכיבים</h3>
              {ingredientFields.map((item, index) => {
                const isHeading = form.watch(`ingredients.${index}.isHeading`);
                return (
                <div key={item.id} className="p-4 border rounded-md shadow-sm bg-secondary/10 space-y-3">
                  {/* Line 1: Name, Amount, Unit (if not heading) OR Name (if heading) */}
                  <div className={`grid gap-x-4 gap-y-3 items-end ${isHeading ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[2fr_1fr_1fr]'}`}>
                    <FormField control={form.control} name={`ingredients.${index}.name`} render={({ field: f }) => (
                        <FormItem><FormLabel>{isHeading ? 'טקסט כותרת' : 'שם הרכיב'}</FormLabel><FormControl><Input placeholder={isHeading ? "לדוגמה, לבצק" : "לדוגמה, קמח"} {...f} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    {!isHeading && (
                      <>
                        <FormField control={form.control} name={`ingredients.${index}.amount`} render={({ field: f }) => (
                            <FormItem><FormLabel>כמות</FormLabel><FormControl><Input type="number" step="0.5" placeholder="לדוגמה, 2.5" {...f} onChange={e => f.onChange(parseFloat(e.target.value) || '')} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`ingredients.${index}.unit`} render={({ field: f }) => (
                            <FormItem><FormLabel>יחידה</FormLabel><FormControl><Input placeholder="לדוגמה, כוסות" {...f} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </>
                    )}
                  </div>

                  {/* Line 2: Controls */}
                  <div className="flex items-center gap-3 pt-2">
                    <FormField 
                      control={form.control}
                      name={`ingredients.${index}.isHeading`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 rtl:space-x-reverse py-0 my-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue(`ingredients.${index}.amount`, undefined);
                                  form.setValue(`ingredients.${index}.unit`, undefined);
                                  form.setValue(`ingredients.${index}.notes`, '');
                                  form.setValue(`ingredients.${index}.isOptional`, false);
                                } else {
                                   if (form.getValues(`ingredients.${index}.amount`) === undefined) form.setValue(`ingredients.${index}.amount`, 1);
                                   if (form.getValues(`ingredients.${index}.unit`) === undefined) form.setValue(`ingredients.${index}.unit`, 'יחידות');
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-xs text-muted-foreground hover:cursor-pointer">כותרת?</FormLabel>
                        </FormItem>
                      )}
                    />
                    {!isHeading && (
                      <>
                        <FormField control={form.control} name={`ingredients.${index}.isOptional`} render={({ field: f }) => (
                            <FormItem className="flex flex-row items-center space-x-2 rtl:space-x-reverse"><FormControl><Checkbox checked={f.value} onCheckedChange={f.onChange} /></FormControl><FormLabel className="font-normal text-xs text-muted-foreground">אופציונלי?</FormLabel></FormItem>
                        )}/>
                        <FormField control={form.control} name={`ingredients.${index}.notes`} render={({ field: f }) => (
                            <FormItem className="flex-grow"><FormLabel className="sr-only">הערות</FormLabel><FormControl><Input className="text-xs h-8" placeholder="הערות/אלטרנטיבה (אופציונלי)" {...f} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)} aria-label="הסר רכיב" className="ms-auto text-destructive hover:bg-destructive/10 w-8 h-8"><Trash2 size={16} /></Button>
                  </div>
                </div>
              )})}

              {addMode === 'smart' ? (
                <div className="p-4 border-2 border-dashed rounded-md bg-secondary/10 space-y-3">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="smart-add-ingredient" className="flex items-center gap-2 text-accent font-semibold">
                            <Wand2 size={18} /> הוספה חכמה
                        </Label>
                        <Button variant="link" size="sm" onClick={() => setAddMode('manual')} className="text-xs h-auto p-0">
                          <Edit size={12} className="me-1"/> עבור להוספה ידנית
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input 
                            id="smart-add-ingredient"
                            placeholder="הכנס רכיב בשורה אחת, לדוגמה: 2.5 כוסות קמח"
                            value={smartAddIngredient}
                            onChange={(e) => setSmartAddIngredient(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSmartAddIngredient();}}}
                            disabled={isParsing}
                        />
                        <Button type="button" onClick={handleSmartAddIngredient} disabled={isParsing || !smartAddIngredient.trim()}>
                            {isParsing ? <Loader2 className="animate-spin" /> : 'הוסף'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        תבנית: כמות, יחידה, שם. לשמות עם רווחים, השתמש במקף. לדוגמה: 1 ק"ג אבקת-סוכר.
                    </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => handleAddIngredient(false)} className="flex items-center gap-2"><PlusCircle size={18} /> הוסף רכיב</Button>
                  <Button type="button" variant="outline" onClick={() => handleAddIngredient(true)} className="flex items-center gap-2"><Heading2 size={18} /> הוסף כותרת רכיבים</Button>
                  <Button variant="link" size="sm" onClick={() => setAddMode('smart')} className="text-xs h-auto p-0">
                    <Wand2 size={12} className="me-1" /> עבור להוספה חכמה
                  </Button>
                </div>
              )}
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-headline text-primary">הוראות הכנה</h3>
              {instructionFields.map((item, index) => {
                const isHeading = form.watch(`instructions.${index}.isHeading`);
                const instructionId = item.id || '';
                return (
                <div key={item.id} className="flex flex-col gap-3 p-4 border rounded-md shadow-sm bg-secondary/10">
                  <div className="flex justify-between items-center">
                     <FormField 
                      control={form.control}
                      name={`instructions.${index}.isHeading`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 rtl:space-x-reverse py-0 my-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked && item.id) { 
                                   setVisibleInstructionImageInputs(prev => ({...prev, [item.id!]: false}));
                                   form.setValue(`instructions.${index}.imageUrl`, ''); // Clear image URL if it becomes a heading
                                   const newPreviews = [...instructionImagePreviews];
                                   newPreviews[index] = null;
                                   setInstructionImagePreviews(newPreviews);
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-xs text-muted-foreground hover:cursor-pointer">כותרת?</FormLabel>
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInstruction(index)} aria-label="הסר הוראה" className="text-destructive hover:bg-destructive/10 w-8 h-8"><Trash2 size={16} /></Button>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    {!isHeading && <span className="font-headline text-lg text-primary pt-2 select-none">{instructionFields.filter((f, i) => !form.getValues(`instructions.${i}.isHeading`)).indexOf(item) + 1}.</span>}
                    <FormField control={form.control} name={`instructions.${index}.text`} render={({ field: f }) => (
                        <FormItem className="flex-grow"><FormLabel className="sr-only">{isHeading ? 'טקסט כותרת' : 'תיאור השלב'}</FormLabel><FormControl><Textarea placeholder={isHeading ? "לדוגמה, הכנת הציפוי" :`תיאור השלב`} {...f} rows={isHeading ? 1:3} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>

                  {!isHeading && instructionId && (
                    <div className="ms-6 space-y-2">
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleInstructionImageInputVisibility(instructionId)}
                          className="flex items-center gap-1.5 text-xs"
                      >
                          <ImageIcon size={14}/>
                          {visibleInstructionImageInputs[instructionId] ? 'הסתר אפשרויות תמונה' : 'הוסף/שנה תמונת שלב'}
                          {visibleInstructionImageInputs[instructionId] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </Button>

                      {visibleInstructionImageInputs[instructionId] && (
                          <div className="border-t pt-3 mt-2 space-y-2">
                              {instructionImagePreviews[index] ? (
                              <div className="relative group w-48 h-32">
                                  <NextImage src={instructionImagePreviews[index]!} alt={`תצוגה מקדימה שלב`} layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="cooking step"/>
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

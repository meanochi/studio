'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { parseRecipeFromText, type ParseRecipeFromTextOutput } from '@/ai/flows/parse-recipe-from-text-flow';
import type { RecipeFormData } from '@/components/recipes/RecipeSchema';

// Dynamically import pdfjs-dist to avoid SSR issues
let pdfjsLib: any = null;

export default function ImportRecipePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [parsedRecipeData, setParsedRecipeData] = useState<ParseRecipeFromTextOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    import('pdfjs-dist/build/pdf.mjs')
      .then(pdfjs => {
        pdfjsLib = pdfjs;
        // The workerSrc path needs to be relative to where the app is served from.
        // Assuming pdf.worker.min.mjs will be in the public folder.
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      })
      .catch(err => {
        console.error("Failed to load pdfjs-dist:", err);
        setError("שגיאה בטעינת רכיב ה-PDF. נסה לרענן את הדף.");
      });
  }, []);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        setParsedRecipeData(null);
        setExtractedText(null);
      } else {
        setFile(null);
        setError('אנא בחר קובץ PDF בלבד.');
        toast({ variant: 'destructive', title: 'סוג קובץ שגוי', description: 'אנא בחר קובץ PDF בלבד.' });
      }
    }
  };

  const extractTextFromPdf = useCallback(async (pdfFile: File): Promise<string> => {
    if (!pdfjsLib) {
      throw new Error("PDF library is not loaded yet.");
    }
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\\n';
    }
    return fullText;
  }, []);

  const handleParseRecipe = async () => {
    if (!file) {
      setError('אנא בחר קובץ PDF לייבוא.');
      return;
    }
    if (!pdfjsLib) {
      setError('רכיב ה-PDF עדיין נטען. נסה שוב בעוד רגע.');
      toast({ variant: 'destructive', title: 'רכיב PDF לא טעון', description: 'נסה שוב בעוד מספר רגעים.' });
      return;
    }

    setIsParsing(true);
    setError(null);
    setParsedRecipeData(null);

    try {
      const text = await extractTextFromPdf(file);
      setExtractedText(text);

      if (!text.trim()) {
        throw new Error("לא חולץ טקסט מה-PDF, או שהקובץ ריק.");
      }

      const result = await parseRecipeFromText({ recipeText: text });
      
      if (!result || !result.name) { // Basic check for successful parsing
        throw new Error("הבינה המלאכותית לא הצליחה לעבד את המתכון מהטקסט שחולץ. נסה קובץ אחר או בדוק את הפורמט.");
      }
      
      setParsedRecipeData(result);
      toast({
        title: 'המתכון עובד בהצלחה!',
        description: `זוהה המתכון: ${result.name}. לחץ על "ערוך ושמור" לבדיקה ושמירה.`,
        variant: 'default',
        className: 'bg-green-500 border-green-600 text-white'
      });

    } catch (err: any) {
      console.error('Error parsing recipe:', err);
      const errorMessage = err.message || 'אירעה שגיאה בעת עיבוד המתכון.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'שגיאה בעיבוד', description: errorMessage });
      setParsedRecipeData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleEditAndSave = () => {
    if (parsedRecipeData) {
      // Prepare data for query param, ensuring types match RecipeFormData
      const recipeToPass: Partial<RecipeFormData> = {
        name: parsedRecipeData.name || '',
        source: parsedRecipeData.source || '',
        prepTime: parsedRecipeData.prepTime || '',
        cookTime: parsedRecipeData.cookTime || '',
        servings: typeof parsedRecipeData.servings === 'number' ? parsedRecipeData.servings : 1,
        servingUnit: parsedRecipeData.servingUnit || 'מנה',
        freezable: typeof parsedRecipeData.freezable === 'boolean' ? parsedRecipeData.freezable : false,
        ingredients: parsedRecipeData.ingredients?.map(ing => ({
            name: ing.name || '',
            amount: typeof ing.amount === 'number' ? ing.amount : 1,
            unit: ing.unit || ''
        })) || [{ name: '', amount: 1, unit: '' }],
        instructions: parsedRecipeData.instructions?.filter(instr => typeof instr === 'string') || [''],
        tags: parsedRecipeData.tags?.filter(tag => typeof tag === 'string') || [],
        imageUrl: parsedRecipeData.imageUrl || '',
      };
      const queryParams = new URLSearchParams({ data: JSON.stringify(recipeToPass) });
      router.push(`/recipes/add?${queryParams.toString()}`);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary flex items-center gap-2">
          <FileUp size={32} /> ייבוא מתכון מקובץ PDF
        </CardTitle>
        <CardDescription>
          העלה קובץ PDF של מתכון, והמערכת תנסה לחלץ את הפרטים בעזרת בינה מלאכותית.
          <br />
          <strong className="text-primary">חשוב:</strong> התוצאות הטובות ביותר יתקבלו מקבצי PDF המכילים טקסט (לא תמונות של טקסט) ובפורמט עקבי.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="pdf-upload" className="text-lg font-medium">בחר קובץ PDF</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="mt-2"
            disabled={isParsing}
          />
          {file && <p className="text-sm text-muted-foreground mt-1">קובץ נבחר: {file.name}</p>}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-center gap-2">
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        )}

        {isParsing && (
          <div className="flex items-center justify-center p-6 space-x-3 rtl:space-x-reverse">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg text-primary font-semibold">מעבד את ה-PDF והמתכון...</p>
          </div>
        )}

        {parsedRecipeData && !isParsing && (
          <div className="p-4 bg-green-500/10 border border-green-500 text-green-700 rounded-md space-y-3">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <CheckCircle size={24} />
              <p>המתכון עובד בהצלחה!</p>
            </div>
            <p><strong className="font-medium">שם המתכון שזוהה:</strong> {parsedRecipeData.name}</p>
            <p className="text-sm">בדוק את הפרטים ולחץ על "ערוך ושמור" להוספת המתכון לספר המתכונים שלך.</p>
            <Button onClick={handleEditAndSave} className="w-full mt-2">
              ערוך ושמור מתכון ({parsedRecipeData.name})
            </Button>
          </div>
        )}
        
        {extractedText && !isParsing && !parsedRecipeData && !error && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500 text-yellow-700 rounded-md">
                <p><strong className="font-medium">העיבוד הסתיים אך לא זוהה מתכון מלא.</strong></p>
                <p className="text-sm">ייתכן שהפורמט אינו נתמך היטב. תוכל לנסות קובץ אחר.</p>
            </div>
        )}

      </CardContent>
      <CardFooter>
        <Button
          onClick={handleParseRecipe}
          disabled={!file || isParsing}
          className="w-full text-lg py-6"
        >
          {isParsing ? (
            <>
              <Loader2 className="me-2 h-5 w-5 animate-spin" />
              מעבד...
            </>
          ) : (
            <>
              <FileUp className="me-2 h-5 w-5" />
              התחל עיבוד PDF
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, StickyNote } from 'lucide-react';

const NOTES_STORAGE_KEY = 'generalNotes';

export default function NotesPage() {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load notes from localStorage on initial render
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    } catch (error) {
      console.error('Failed to load notes from localStorage', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן היה לטעון את ההערות.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, notes);
      toast({
        title: 'נשמר!',
        description: 'ההערות שלך נשמרו בהצלחה.',
      });
    } catch (error) {
      console.error('Failed to save notes to localStorage', error);
      toast({
        title: 'שגיאת שמירה',
        description: 'לא ניתן היה לשמור את ההערות שלך. אנא נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsSaving(false), 500); // Simulate saving delay
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-4 text-xl font-semibold text-primary">טוען הערות...</p>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary flex items-center gap-3">
          <StickyNote size={30} />
          הערות כלליות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          זהו האזור האישי שלך לרשום כל דבר שתרצה - המרות מידות, כללים להוספת מתכונים, רעיונות, או כל דבר אחר שעולה על דעתך. ההערות נשמרות מקומית על הדפדפן שלך.
        </p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="כתוב כאן את ההערות שלך..."
          rows={15}
          className="text-base"
        />
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          {isSaving ? 'שומר...' : 'שמור הערות'}
        </Button>
      </CardContent>
    </Card>
  );
}

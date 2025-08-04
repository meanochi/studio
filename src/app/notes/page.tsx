
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, StickyNote } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

const NOTES_DOC_ID = 'general';
const NOTES_COLLECTION = 'notes';

export default function NotesPage() {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load notes from Firestore on initial render
  useEffect(() => {
    const notesDocRef = doc(db, NOTES_COLLECTION, NOTES_DOC_ID);

    const unsubscribe = onSnapshot(notesDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setNotes(docSnap.data().content || '');
      } else {
        // If the document doesn't exist, it means no notes have been saved yet.
        setNotes('');
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Failed to load notes from Firestore', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן היה לטעון את ההערות ממסד הנתונים.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const notesDocRef = doc(db, NOTES_COLLECTION, NOTES_DOC_ID);
      await setDoc(notesDocRef, { content: notes });
      toast({
        title: 'נשמר!',
        description: 'ההערות שלך נשמרו בהצלחה וזמינות לכולם.',
      });
    } catch (error) {
      console.error('Failed to save notes to Firestore', error);
      toast({
        title: 'שגיאת שמירה',
        description: 'לא ניתן היה לשמור את ההערות שלך. אנא נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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
          זהו האזור המשותף לרשום כל דבר שתרצו - המרות מידות, כללים להוספת מתכונים, רעיונות, או כל דבר אחר שעולה על דעתך. ההערות נשמרות בענן וזמינות לכל המשתמשים.
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

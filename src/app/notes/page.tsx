
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, StickyNote, Trash2, PlusCircle, AlertTriangle, Calculator } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Note } from '@/types';
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
import { format } from 'date-fns';


const NOTES_COLLECTION = 'notes';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const notesQuery = query(collection(db, NOTES_COLLECTION), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setNotes(notesData);
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

    return () => unsubscribe();
  }, [toast]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast({
        title: 'חסרים פרטים',
        description: 'אנא מלא כותרת ותוכן להערה.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, NOTES_COLLECTION), {
        title: newNoteTitle,
        content: newNoteContent,
        createdAt: Timestamp.now(),
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      toast({
        title: 'הערה נוספה!',
        description: 'ההערה שלך נשמרה בהצלחה וזמינה לכולם.',
      });
    } catch (error) {
      console.error('Failed to save note to Firestore', error);
      toast({
        title: 'שגיאת שמירה',
        description: 'לא ניתן היה לשמור את ההערה שלך. אנא נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
      toast({
        title: 'הערה נמחקה',
        variant: 'destructive'
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast({
        title: 'שגיאת מחיקה',
        description: 'לא ניתן היה למחוק את ההערה.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-3xl font-headline text-primary flex items-center gap-3">
            <StickyNote size={30} />
            הוסף הערה חדשה
          </CardTitle>
          <Button asChild variant="outline">
            <Link href="/converter" className="flex items-center gap-2">
              <Calculator size={18} />
              ממיר מידות
            </Link>
          </Button>
        </CardHeader>
        <form onSubmit={handleAddNote}>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              הוסף הערה חדשה לרשימה המשותפת - המרות מידות, כללים, רעיונות, וכו'.
            </p>
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="כותרת ההערה"
              className="text-base"
              disabled={isSaving}
            />
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="כתוב כאן את תוכן ההערה..."
              rows={5}
              className="text-base"
              disabled={isSaving}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <PlusCircle />}
              {isSaving ? 'שומר...' : 'הוסף הערה'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ms-4 text-xl font-semibold text-primary">טוען הערות...</p>
          </div>
        ) : notes.length > 0 ? (
          notes.map(note => (
            <Card key={note.id} className="shadow-md">
              <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-headline text-accent">{note.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      נוצר ב: {format(note.createdAt, 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <Trash2 size={18} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                          פעולה זו תמחק את ההערה "{note.title}" לצמיתות.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteNote(note.id)}>מחק</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
             <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground font-body">עדיין אין הערות.</p>
            <p className="text-muted-foreground font-body">השתמש בטופס למעלה כדי להוסיף את ההערה הראשונה.</p>
          </div>
        )}
      </div>
    </div>
  );
}

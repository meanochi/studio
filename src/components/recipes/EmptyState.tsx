'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookHeart, PlusCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  showSearchReset?: boolean;
  onSearchReset?: () => void;
}

export default function EmptyState({ showSearchReset = false, onSearchReset }: EmptyStateProps) {

  if (showSearchReset) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground font-body mb-4">
          לא נמצאו מתכונים שתואמים את החיפוש שלך.
        </p>
        <Button variant="outline" onClick={onSearchReset}>
          <RotateCcw size={16} className="me-2" />
          אפס חיפוש
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center shadow-lg bg-secondary/10 border-primary/20">
            <CardHeader>
                <BookHeart size={50} className="mx-auto text-primary" />
                <CardTitle className="text-3xl font-headline text-primary pt-2">
                    ברוכים הבאים לספר המתכונים!
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground font-body text-lg">
                    כאן יופיעו כל המתכונים שלכם אחרי שתוסיפו אותם.
                </p>
                <Button asChild size="lg">
                    <Link href="/recipes/add" className="flex items-center gap-2">
                        <PlusCircle size={20} />
                        הוסף מתכון ראשון
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}

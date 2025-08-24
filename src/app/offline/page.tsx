
'use client';

import { AlertTriangle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <WifiOff className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline text-primary mb-4">אתה כרגע לא מחובר</h1>
      <p className="text-lg text-muted-foreground font-body max-w-md mb-8">
        נראה שאין לך חיבור לאינטרנט. חלק מהתכונות עשויות לא לעבוד, אבל אתה עדיין יכול לגלוש בתוכן שנטען בעבר.
      </p>
      <Button onClick={handleReload} size="lg">
        נסה לטעון מחדש
      </Button>
    </div>
  );
}

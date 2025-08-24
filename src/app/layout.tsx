import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppProviders from '@/contexts/AppProviders';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata, Viewport } from 'next';

// הגדרת המטא-דאטה הנכונה
export const metadata: Metadata = {
  title: 'Family Cookbook',
  description: 'מקום לכל המתכונים המשפחתיים שלך',
  manifest: '/manifest.json', // <-- תיקון הנתיב והסיומת
  icons: {
    icon: '/icons/iconi.png',
    apple: '/icons/iconi.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#E07A5F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        {/*
          הסרנו את תג ה-link הידני.
          Next.js יוסיף אותו אוטומטית על סמך אובייקט ה-metadata.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AppProviders>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
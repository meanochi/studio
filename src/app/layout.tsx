import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppProviders from '@/contexts/AppProviders';
import Header from '@/components/layout/Header';
import { ChefHat } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Family Cookbook',
  description: 'מקום לכל המתכונים המשפחתיים שלך',
  manifest: '/manifest.json',
  themeColor: '#E07A5F',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
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
          <footer className="bg-primary/10 text-primary py-6 text-center no-print">
            <div className="container mx-auto flex justify-center items-center gap-2">
              <ChefHat size={20} />
              <p className="text-sm font-body">&copy; {new Date().getFullYear()} Family Cookbook. נצרו את המורשת הקולינרית שלכם.</p>
            </div>
          </footer>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppProviders from '@/contexts/AppProviders';
import Header from '@/components/layout/Header';
import { ChefHat } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Family Cookbook',
  description: 'A place for all your family recipes',
  icons: {
    icon: '/favicon.ico', // Assuming a favicon might be added later
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
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
              <p className="text-sm font-body">&copy; {new Date().getFullYear()} Family Cookbook. Cherish your culinary heritage.</p>
            </div>
          </footer>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}

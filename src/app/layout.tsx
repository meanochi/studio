'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Providers } from './providers';
import { Belleza, Rubik } from 'next/font/google';
import { Suspense } from 'react';
import { FirebaseClientProvider } from '@/firebase';


const belleza = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-belleza',
});

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={`${belleza.variable} ${rubik.variable}`}>
      <head>
        <title>Lopiansky's Cookbook</title>
        <meta name="description" content="מקום לכל המתכונים המשפחתיים שלך" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/iconi.png" />
        <link rel="apple-touch-icon" href="/icons/iconi.png" />
        <meta name="theme-color" content="#E07A5F" />
      </head>
      <body className="font-body antialiased">
       <FirebaseClientProvider>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
              </main>
              <Footer />
              <Toaster />
            </div>
          </Providers>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}


'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { HeaderProvider, useHeader } from '@/contexts/HeaderContext';
import { Tabs } from '@/components/ui/tabs';
import { Belleza, Rubik } from 'next/font/google';

// Font configuration
const belleza = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-belleza',
});

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
});


// Metadata and Viewport cannot be used in a client component.
// We will keep them here, but for them to work, we'd need a different structure.
// This is a tradeoff for the dynamic header content.
/*
export const metadata: Metadata = {
  title: "Lopiansky's Cookbook",
  description: 'מקום לכל המתכונים המשפחתיים שלך',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/iconi.png',
    apple: '/icons/iconi.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#E07A5F',
};
*/

function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useHeader();
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      <Toaster />
    </Tabs>
  );
}

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
        <Providers>
          <HeaderProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </HeaderProvider>
        </Providers>
      </body>
    </html>
  );
}

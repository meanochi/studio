import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppProviders from '@/contexts/AppProviders';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const chefHatIcon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M18 10.37V4.5h-1.5v5.87M15.5 8.62V4.5h-1.5v4.12M13 11.25V4.5h-1.5v6.75M3 14.25h18v-2.62c0-1-1-1.87-2.25-1.87H5.25C4 9.75 3 10.62 3 11.62v2.63z'/><path d='M6.75 18.75C5.25 18.75 4.5 17.25 4.5 16.5v-2.25h15v2.25c0 .75-.75 2.25-2.25 2.25h-10.5z'/><path d='M12 4.5V2.25'/></svg>`;

export const metadata: Metadata = {
  title: 'Family Cookbook',
  description: 'מקום לכל המתכונים המשפחתיים שלך',
  manifest: '/manifest.json',
  themeColor: '#E07A5F',
  icons: {
    icon: chefHatIcon,
    apple: chefHatIcon,
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
          <Footer />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}

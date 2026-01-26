'use client';

import Link from 'next/link';
import { ChefHat, Home, ShoppingCart, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AuthButton } from "@/components/AuthButton";

const navItems = [
  { href: '/', label: 'בית', icon: Home },
  { href: '/shopping-list', label: 'רשימת קניות', icon: ShoppingCart },
  { href: '/meal-plans', label: 'תכנון', icon: CalendarDays },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
        <Link href="/" className="flex items-center gap-2 mb-2 sm:mb-0 hover:opacity-90 transition-opacity">
          <h1 className="text-3xl font-headline">Lopiansky's Cookbook</h1>
          <ChefHat size={36} />
        </Link>
        <AuthButton />
        <nav>
          <ul className="flex items-center space-x-1 sm:space-x-2 rtl:space-x">
            {navItems.map(item => (
              <li key={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "hover:bg-primary-foreground/10 text-primary-foreground",
                    pathname === item.href ? 'bg-primary-foreground/20 font-semibold' : ''
                  )}
                  asChild
                >
                  <Link href={item.href} className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-base">
                    <item.icon size={18} className="hidden sm:inline-block" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

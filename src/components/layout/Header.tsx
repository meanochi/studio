'use client';

import Link from 'next/link';
import { ChefHat, Home, ShoppingCart, CalendarDays, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const navItems = [
  { href: '/', label: 'בית', icon: Home },
  { href: '/shopping-list', label: 'רשימת קניות', icon: ShoppingCart },
  { href: '/meal-plans', label: 'תכנון', icon: CalendarDays },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      toast({ title: 'התנתקת בהצלחה' });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: 'התנתקות נכשלה', variant: 'destructive'});
    }
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
        <Link href="/" className="flex items-center gap-2 mb-2 sm:mb-0 hover:opacity-90 transition-opacity">
          <h1 className="text-3xl font-headline">Lopiansky's Cookbook</h1>
          <ChefHat size={36} />
        </Link>
        <div className="flex items-center gap-2">
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
            <div className="w-px h-6 bg-primary-foreground/30 mx-2"></div>
            {isUserLoading ? (
                 <div className="h-8 w-20 rounded-md animate-pulse bg-primary-foreground/20" />
            ) : user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 hover:bg-primary-foreground/10 text-primary-foreground">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary-foreground text-primary text-lg">
                                    {user.photoURL || user.displayName?.charAt(0) || <UserCircle size={20}/>}
                                </AvatarFallback>
                            </Avatar>
                           <span className="hidden sm:inline">{user.displayName || user.email}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <LogOut className="me-2 h-4 w-4" />
                            <span>התנתק</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <div className="flex items-center gap-1">
                     <Button variant="ghost" asChild className="hover:bg-primary-foreground/10 text-primary-foreground">
                        <Link href="/login">התחבר</Link>
                    </Button>
                     <Button variant="secondary" asChild className="text-primary bg-primary-foreground hover:bg-primary-foreground/90">
                        <Link href="/signup">הירשם</Link>
                    </Button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
}

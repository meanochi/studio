'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, UserPlus } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const signupSchema = z.object({
  email: z.string().email('אנא הזן כתובת אימייל חוקית'),
  password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'החשבון נוצר בהצלחה!',
        description: 'כעת תועבר לדף הבית.',
      });
      router.push('/');
    } catch (error: any) {
      console.error('Signup failed:', error);
      let errorMessage = 'אירעה שגיאה. נסה שוב.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'כתובת האימייל כבר בשימוש.';
      }
      toast({
        title: 'הרשמה נכשלה',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary flex items-center justify-center gap-3">
            <UserPlus />
            יצירת חשבון
          </CardTitle>
          <CardDescription>הצטרף ונהל את ספר המתכונים שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (לפחות 6 תווים)"
                {...register('password')}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  יוצר חשבון...
                </>
              ) : (
                'הירשם'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            כבר יש לך חשבון?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              התחבר כאן
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

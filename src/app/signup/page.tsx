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
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const signupSchema = z
  .object({
    username: z.string().min(3, 'שם המשתמש חייב להכיל לפחות 3 תווים'),
    email: z.string().email('אנא הזן כתובת אימייל חוקית'),
    password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים'),
    confirmPassword: z.string(),
    avatar: z.string().min(1, 'אנא בחר סמל'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const avatars = ['🧑‍🍳', '🍲', '🍰', '🥑', '🥕', '🥖'];

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const db = useFirestore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      avatar: '🧑‍🍳',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.username,
        photoURL: data.avatar, // Storing emoji as photoURL
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: data.username,
        email: data.email,
        avatar: data.avatar,
      });

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
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary flex items-center justify-center gap-3">
            <UserPlus />
            יצירת חשבון
          </CardTitle>
          <CardDescription>הצטרף ונהל את ספר המתכונים שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">שם משתמש</Label>
              <Input
                id="username"
                type="text"
                placeholder="השם שיוצג למשתמשים אחרים"
                {...register('username')}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>

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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <Label>בחר סמל (אווטאר)</Label>
              <RadioGroup
                defaultValue={avatars[0]}
                className="grid grid-cols-6 gap-2"
                onValueChange={(value) => control.setValue('avatar', value)}
              >
                {avatars.map((avatar, index) => (
                  <Label
                    key={index}
                    htmlFor={`avatar-${index}`}
                    className="flex items-center justify-center text-4xl p-2 border-2 rounded-full cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value={avatar} id={`avatar-${index}`} className="sr-only" />
                    {avatar}
                  </Label>
                ))}
              </RadioGroup>
              {errors.avatar && <p className="text-sm text-destructive">{errors.avatar.message}</p>}
            </div>

            <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
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

"use client";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // משתמש ב-Shadcn שכבר יש לך

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  return user ? (
    <div className="flex items-center gap-2">
      <span className="text-sm">שלום, {user.displayName}</span>
      <Button onClick={logout} variant="outline" size="sm">יציאה</Button>
    </div>
  ) : (
    <Button onClick={login} size="sm">התחברות עם גוגל</Button>
  );
}
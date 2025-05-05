// app/login/page.tsx
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/utils/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.push('/dashboard');
        }
      }
    );

    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <AuthForm />
    </div>
  );
}
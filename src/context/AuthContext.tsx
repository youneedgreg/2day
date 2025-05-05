/* eslint-disable @typescript-eslint/no-explicit-any */
// context/AuthContext.tsx
"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/utils/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getInitialSession() {
      try {
        setIsLoading(true);
        
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
          }
        );
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getInitialSession();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out", {
        description: "You have been signed out successfully."
      });
    } catch (error: any) {
      toast.error("Sign out error", {
        description: error.message || "An error occurred during sign out."
      });
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
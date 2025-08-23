import { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function AuthObserver({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      // User is not authenticated, but we don't redirect anymore.
      // The UI will adapt based on the auth state.
    }
  }, [session, loading, router]);

  return <>{children}</>;
}

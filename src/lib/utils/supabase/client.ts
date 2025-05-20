// lib/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Set session to expire after 5 hours (18000 seconds)
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Configure session settings
        storageKey: '2day-auth-token',
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key)
            }
            return null
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value)
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key)
            }
          },
        },
        // Custom session configuration
        flowType: 'pkce',
      },
      // Global settings
      global: {
        headers: {
          'X-Client-Info': '2day-app',
        },
      },
    }
  )
}
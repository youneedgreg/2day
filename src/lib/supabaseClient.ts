// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Define types for database
export type Database = {
  public: {
    tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
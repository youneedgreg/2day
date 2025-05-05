// utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define your database types
export type Database = {
  public: {
    tables: {
      todos: {
        Row: {
          id: string;
          title: string;
          completed: boolean;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          completed?: boolean;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          completed?: boolean;
          user_id?: string;
        };
      };
      // Define other tables here
    };
  };
};
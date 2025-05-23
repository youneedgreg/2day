import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './supabaseClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const createClient = () => createBrowserClient<Database>(supabaseUrl, supabaseAnonKey); 
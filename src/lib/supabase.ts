import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl && typeof window !== 'undefined') {
  throw new Error('Missing environment variable VITE_SUPABASE_URL. Set it in .env.local.');
}

if (!supabaseAnonKey && typeof window !== 'undefined') {
  throw new Error('Missing environment variable VITE_SUPABASE_PUBLISHABLE_KEY. Set it in .env.local.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

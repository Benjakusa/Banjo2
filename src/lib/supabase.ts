import { createClient } from '@supabase/supabase-js';

// Credentials are loaded ONLY from environment variables.
// .env is git-ignored and is never committed. Provide values via
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase is not configured: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Running in offline mock mode.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

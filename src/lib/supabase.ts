import { createClient } from '@supabase/supabase-js';

// Credentials are loaded ONLY from environment variables.
// .env is git-ignored and is never committed. Provide values via
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env.
//
// NOTE: the vendor name appears only here, in this module, and in the
// VITE_* env keys -- never in any user-facing string.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Archive backend is not configured: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Running in offline mock mode.'
  );
}

// The client constructor rejects an empty URL or key, so in offline mock mode
// we hand it inert placeholders instead of letting the import throw and take
// the whole app down with it. Every call site checks isSupabaseConfigured
// first, so these values never reach the network.
const OFFLINE_URL = 'http://127.0.0.1:54321';
const OFFLINE_KEY = 'offline-anon-placeholder';

export const supabase = createClient(supabaseUrl || OFFLINE_URL, supabaseAnonKey || OFFLINE_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);


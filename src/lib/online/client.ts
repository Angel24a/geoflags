import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// GeoFlags' Supabase project. The publishable key is meant to ship inside the app:
// access is limited by the row level security rules in supabase/schema.sql.
const DEFAULT_URL = 'https://octhrztpcljpdopdimrj.supabase.co';
const DEFAULT_KEY = 'sb_publishable_qsunbnEBmpX6oKli6YJOlw_o9kjHHti';

// Can be overridden at build time (EXPO_PUBLIC_* env vars, e.g. GitHub secrets or a local .env).
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const onlineConfigured = !!(URL && KEY);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!URL || !KEY) throw new Error('El modo online no está configurado');
  client ??= createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

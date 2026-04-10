import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env.local or Vercel environment variables');
}

export const supabase = createClient(
  url  ?? 'https://fimwqcqaynjrpepkfjwh.supabase.co',
  key  ?? 'sb_publishable_LBlZ8uG4aVswQLAnaRpkGA_70VsrMnP',
);

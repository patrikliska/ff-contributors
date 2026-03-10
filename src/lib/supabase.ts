import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(url, key);

// ── DB row shapes ─────────────────────────────────────────────
export interface TeamRow {
  name: string;
  color: string;
}

export interface PersonRow {
  display_name: string;
  git_names: string[];
  team: string | null;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIG_ERROR =
  "缺少 Supabase 环境变量，请先复制 .env.example 并填写 VITE_SUPABASE_URL 与 VITE_SUPABASE_PUBLISHABLE_KEY（或兼容使用 VITE_SUPABASE_ANON_KEY）。";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  const validatedUrl = supabaseUrl;
  const validatedKey = supabaseKey;

  if (!validatedUrl || !validatedKey) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(validatedUrl, validatedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return cachedClient;
}

import { createClient } from "@supabase/supabase-js";

/** Server-only Supabase client for trusted API routes. Never import in app UI. */
export function createServerSupabaseClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

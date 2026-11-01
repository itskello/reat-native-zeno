import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

type ClerkTokenGetter = () => Promise<string | null>;

type SupabaseRuntimeConfig = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

/**
 * Creates a Supabase client that uses Clerk as the only session provider.
 * Call this from an authenticated feature and pass Clerk's `getToken`.
 * The publishable key is safe for the app; database policies enforce access.
 */
export function createZenoSupabaseClient(getToken: ClerkTokenGetter) {
  const extra = (Constants.expoConfig?.extra ?? {}) as SupabaseRuntimeConfig;
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    extra.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Add its project URL and publishable key to the app environment."
    );
  }

  return createClient(url, publishableKey, {
    accessToken: getToken,
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

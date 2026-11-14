import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Returns a Supabase client configured with the service role key.
 * This client bypasses RLS policies and must only be used inside secure server-side routes
 * after the host identity has been authenticated and verified.
 */
export function getHostServiceRoleClient(): SupabaseClient | null {
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim();

  if (!serviceRoleKey) {
    console.warn("Notice: SUPABASE_SERVICE_ROLE_KEY not configured on host server.");
    return null;
  }

  const { url } = getSupabaseConfig();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}


import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Returns a Supabase client with service_role permissions if SUPABASE_SERVICE_ROLE_KEY is present,
 * otherwise falls back to the server-side client with user/anon session.
 */
export async function getAdminOrServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();

  if (serviceRoleKey && url) {
    return createSupabaseClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return createServerClient();
}

/** Privileged database operations must fail closed without the server-only key. */
export function getServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for secure payment confirmation.");
  }
  const { url } = getSupabaseConfig();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}


import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

let loggedMissingServiceRoleWarning = false;

/**
 * Returns a Supabase client with service_role permissions if SUPABASE_SERVICE_ROLE_KEY is present,
 * otherwise logs an explicit diagnostic and falls back to the RLS-scoped server client.
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

  if (!loggedMissingServiceRoleWarning) {
    loggedMissingServiceRoleWarning = true;
    const msg =
      "[Supabase] SUPABASE_SERVICE_ROLE_KEY is not configured; falling back to RLS-scoped server client.";
    if (process.env.NODE_ENV === "production") {
      console.error(msg);
    } else {
      console.warn(msg);
    }
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


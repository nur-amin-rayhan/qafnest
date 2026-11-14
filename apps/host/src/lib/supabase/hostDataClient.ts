import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

/** Use the active host identity for Supabase RLS, including Firebase phone users. */
export async function createHostDataClient(options: { useFirebaseAuth?: boolean } = {}) {
  if (!options.useFirebaseAuth) return createClient();
  if (!isFirebaseConfigured()) throw new Error("Firebase phone authentication is not configured.");

  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) throw new Error("Your host session expired. Sign in again to continue.");
  const { url, key } = getSupabaseConfig();
  return createSupabaseJsClient(url, key, {
    accessToken: () => firebaseUser.getIdToken(),
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

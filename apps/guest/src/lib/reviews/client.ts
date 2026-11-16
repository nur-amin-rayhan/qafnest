import type { Session } from "@supabase/supabase-js";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function getReviewAuthorizationHeaders(session: Session | null): Promise<Record<string, string>> {
  return getGuestAuthorizationHeaders(session);
}

export async function createFirebaseReviewDataClient() {
  if (!isFirebaseConfigured()) return null;
  try {
    const firebaseUser = getFirebaseAuth().currentUser;
    if (!firebaseUser) return null;
    const { url, key } = getSupabaseConfig();
    return createSupabaseJsClient(url, key, {
      accessToken: () => firebaseUser.getIdToken(),
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch {
    return null;
  }
}

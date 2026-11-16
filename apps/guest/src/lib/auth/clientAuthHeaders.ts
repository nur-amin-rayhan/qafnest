"use client";

import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

/**
 * Builds an Authorization header from either an active Supabase session
 * or an initialized Firebase Phone Auth user (waiting for IndexedDB hydration if needed).
 */
export async function getGuestAuthorizationHeaders(
  session?: Session | null
): Promise<Record<string, string>> {
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }

  if (isFirebaseConfigured()) {
    try {
      const fbAuth = getFirebaseAuth();
      const readyAuth = fbAuth as unknown as { authStateReady?: () => Promise<void> };
      if (typeof readyAuth.authStateReady === "function") {
        await readyAuth.authStateReady();
      }
      if (fbAuth.currentUser) {
        const token = await fbAuth.currentUser.getIdToken();
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      }
    } catch {}
  }

  if (session === undefined) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        return { Authorization: `Bearer ${data.session.access_token}` };
      }
    } catch {}
  }

  return {};
}

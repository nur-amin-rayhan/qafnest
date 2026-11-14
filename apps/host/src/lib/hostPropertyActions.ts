"use client";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { createClient } from "@/lib/supabase/client";

/**
 * Resolves authentication headers for Host API requests across Firebase phone
 * sessions, Supabase email/password sessions, and local dev host sessions.
 */
export async function getHostRequestHeaders(userId?: string): Promise<Record<string, string>> {
  let authToken: string | undefined;
  try {
    if (isFirebaseConfigured()) {
      const fbUser = getFirebaseAuth().currentUser;
      if (fbUser) authToken = await fbUser.getIdToken();
    }
    if (!authToken) {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        authToken = data.session.access_token;
      }
    }
  } catch {
    // Ignore client token lookup failures; cookies or dev header may still authenticate.
  }

  return {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(userId ? { "x-dev-host-id": userId } : {}),
  };
}

/**
 * Deletes a host-owned property via `/api/host/properties/[id]`, throwing a
 * localized message when blocked (e.g., active confirmed bookings) or unauthorized.
 */
export async function deleteHostPropertyRequest(
  propertyId: string,
  userId?: string,
  lang: "ar" | "en" = "en"
): Promise<void> {
  const headers = await getHostRequestHeaders(userId);
  const res = await fetch(`/api/host/properties/${encodeURIComponent(propertyId)}`, {
    method: "DELETE",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    message_ar?: string;
    code?: string;
  };
  if (!res.ok) {
    const localized =
      lang === "ar"
        ? data.message_ar ||
          (data.code === "active_bookings_exist"
            ? "لا يمكن حذف هذا العقار لوجود حجوزات قائمة أو مؤكدة قادمة."
            : "تعذر حذف العقار. يرجى المحاولة مرة أخرى.")
        : data.message || "Could not delete this property. Please try again.";
    throw new Error(localized);
  }
}

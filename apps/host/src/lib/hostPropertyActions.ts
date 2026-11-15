"use client";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { createClient } from "@/lib/supabase/client";
import type {
  PropertyDeletionEligibility,
  PropertyDeletionReasonCode,
  PropertyDeletionRequestSummary,
} from "@qafnest/shared";

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

export interface PropertyDeletionStatusResponse {
  unitCode: string;
  eligibility: PropertyDeletionEligibility;
  pendingRequest: PropertyDeletionRequestSummary | null;
  latestRequest: PropertyDeletionRequestSummary | null;
}

/**
 * Fetches live reservation-blocking eligibility and any pending deletion request for a property.
 */
export async function fetchPropertyDeletionStatus(
  propertyId: string,
  userId?: string
): Promise<PropertyDeletionStatusResponse> {
  const headers = await getHostRequestHeaders(userId);
  const res = await fetch(
    `/api/host/properties/${encodeURIComponent(propertyId)}/deletion-request`,
    { headers, cache: "no-store" }
  );
  const data = (await res.json().catch(() => ({}))) as Partial<PropertyDeletionStatusResponse> & {
    message?: string;
  };
  if (!res.ok || !data.eligibility) {
    throw new Error(data.message || "Could not verify active reservations for this property.");
  }
  return {
    unitCode: String(data.unitCode || ""),
    eligibility: data.eligibility,
    pendingRequest: data.pendingRequest || null,
    latestRequest: data.latestRequest || null,
  };
}

/**
 * Submits a property removal request (with mandatory reason) for Admin review.
 * Blocked when active/upcoming/unchecked-out/unsettled reservations exist.
 */
export async function deleteHostPropertyRequest(params: {
  propertyId: string;
  userId?: string;
  reasonCode: PropertyDeletionReasonCode;
  reasonDetails: string;
  lang?: "ar" | "en";
}): Promise<{
  pendingReview: boolean;
  message: string;
  request: PropertyDeletionRequestSummary | null;
}> {
  const { propertyId, userId, reasonCode, reasonDetails, lang = "en" } = params;
  const headers = await getHostRequestHeaders(userId);
  const res = await fetch(
    `/api/host/properties/${encodeURIComponent(propertyId)}/deletion-request`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reasonCode, reasonDetails }),
    }
  );
  const data = (await res.json().catch(() => ({}))) as {
    pendingReview?: boolean;
    message?: string;
    message_ar?: string;
    code?: string;
    request?: PropertyDeletionRequestSummary | null;
  };
  if (!res.ok) {
    const localized =
      lang === "ar"
        ? data.message_ar ||
          (data.code === "active_bookings_exist"
            ? "لا يمكن حذف هذا العقار أو طلب إزالته لوجود حجوزات نشطة أو قائمة عليه."
            : "تعذر إرسال طلب حذف العقار. يرجى التحقق من السبب والمحاولة مجدداً.")
        : data.message || "Could not submit property deletion request.";
    throw new Error(localized);
  }
  return {
    pendingReview: Boolean(data.pendingReview ?? true),
    message:
      lang === "ar"
        ? data.message_ar || "تم إرسال طلب الحذف لمراجعة الإدارة بنجاح."
        : data.message || "Deletion request submitted for admin review.",
    request: data.request || null,
  };
}

/**
 * Allows the host to withdraw a pending property deletion request prior to admin approval.
 */
export async function withdrawPropertyDeletionRequest(
  propertyId: string,
  userId?: string,
  lang: "ar" | "en" = "en"
): Promise<string> {
  const headers = await getHostRequestHeaders(userId);
  const res = await fetch(
    `/api/host/properties/${encodeURIComponent(propertyId)}/deletion-request`,
    {
      method: "DELETE",
      headers,
    }
  );
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    message_ar?: string;
  };
  if (!res.ok) {
    throw new Error(
      lang === "ar"
        ? data.message_ar || "تعذر سحب طلب الحذف."
        : data.message || "Could not withdraw deletion request."
    );
  }
  return lang === "ar"
    ? data.message_ar || "تم سحب طلب الحذف بنجاح."
    : data.message || "Deletion request withdrawn.";
}

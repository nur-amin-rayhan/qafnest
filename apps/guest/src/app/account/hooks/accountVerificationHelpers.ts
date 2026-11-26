"use client";

import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/context/AuthContext";
import { saveStoredFirebaseProfile, getStoredFirebaseProfile } from "@/lib/firebase/client";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";

export async function verifySaudiDocument({
  type,
  rawId,
  fullName,
  phone,
  session,
  language,
}: {
  type: "national_id" | "iqama";
  rawId: string;
  fullName?: string;
  phone?: string;
  session: Session | null;
  language: string;
}): Promise<{ success: boolean; message: string; fullName?: string; isError?: boolean }> {
  try {
    const authHeaders = await getReviewAuthorizationHeaders(session);
    const res = await fetch("/api/profile/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      credentials: "same-origin",
      body: JSON.stringify({ type, id_number: rawId, full_name: fullName, phone }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const ref =
        data.verification_reference || (type === "national_id" ? "NAFATH-SA" : "YAQEEN-IQ");
      const fetchedName =
        typeof data.verified_name === "string" && data.verified_name.trim()
          ? data.verified_name.trim()
          : typeof data.full_name === "string" && data.full_name.trim()
          ? data.full_name.trim()
          : undefined;
      const message =
        type === "national_id"
          ? language === "ar"
            ? `تم التحقق من الهوية الوطنية ومزامنة الاسم عبر نفاذ / علم يقين (${ref})`
            : `National ID verified and name synced via Nafath / Elm Yaqeen (${ref})`
          : language === "ar"
          ? `تم التحقق من هوية مقيم (الإقامة) ومزامنة الاسم عبر نفاذ / علم يقين (${ref})`
          : `Iqama verified and name synced via Nafath / Elm Yaqeen (${ref})`;
      return { success: true, message, fullName: fetchedName };
    } else {
      return {
        success: false,
        message:
          data.error ||
          (language === "ar"
            ? type === "national_id"
              ? "تعذر التحقق من الهوية"
              : "تعذر التحقق من الإقامة"
            : "Verification failed"),
        isError: true,
      };
    }
  } catch {
    return {
      success: false,
      isError: true,
      message:
        language === "ar"
          ? "تعذر الاتصال بخدمة نفاذ / علم يقين. يرجى المحاولة لاحقاً."
          : "Nafath / Elm Yaqeen service could not be reached. Please try again.",
    };
  }
}

export async function persistProfileRecord({
  user,
  session,
  supabase,
  editFullName,
  editPhone,
  trimmedEmail,
  trimmedNationalId,
  trimmedIqama,
  primaryIdType,
  editCity,
}: {
  user: User | null;
  session: Session | null;
  supabase: SupabaseClient;
  editFullName: string;
  editPhone: string;
  trimmedEmail: string;
  trimmedNationalId: string;
  trimmedIqama: string;
  primaryIdType: "national_id" | "iqama";
  editCity: string;
  nationalIdVerified?: boolean;
  iqamaVerified?: boolean;
  emailVerified?: boolean;
  isVerified?: boolean;
}): Promise<void> {
  if (user?.id) {
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: editFullName.trim(),
          contact_email: trimmedEmail,
          city: editCity,
          id_type: primaryIdType,
        },
      });
    } catch {}

    try {
      const parts = editFullName.trim().split(/\s+/).filter(Boolean);
      saveStoredFirebaseProfile(user.id, {
        first_name: parts[0] || "",
        last_name: parts.slice(1).join(" ") || "",
        full_name: editFullName.trim(),
        contact_email: trimmedEmail,
        phone: editPhone.trim(),
        city: editCity,
      });
    } catch {}
  }

  const authHeaders = await getReviewAuthorizationHeaders(session);
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      full_name: editFullName.trim(),
      email: trimmedEmail,
      phone: editPhone.trim(),
      national_id: trimmedNationalId,
      iqama: trimmedIqama,
      id_type: primaryIdType,
      city: editCity,
    }),
  });
  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errData.error || "Failed to persist profile changes");
  }
}

export function validateProfileFields({
  fullName,
  email,
  nationalId,
  iqama,
  language,
}: {
  fullName: string;
  email: string;
  nationalId: string;
  iqama: string;
  language: string;
}): { email?: string; national_id?: string; iqama?: string; full_name?: string } {
  const errors: { email?: string; national_id?: string; iqama?: string; full_name?: string } = {};
  if (!fullName.trim()) {
    errors.full_name = language === "ar" ? "الاسم الكامل مطلوب" : "Full name is required";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = language === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format";
  }
  if (nationalId && !/^1\d{9}$/.test(nationalId)) {
    errors.national_id =
      language === "ar"
        ? "الهوية الوطنية يجب أن تتكون من 10 أرقام وتبدأ بالرقم 1"
        : "National ID must be 10 digits starting with 1";
  }
  if (iqama && !/^2\d{9}$/.test(iqama)) {
    errors.iqama =
      language === "ar"
        ? "رقم الإقامة يجب أن يتكون من 10 أرقام ويبدأ بالرقم 2"
        : "Iqama number must be 10 digits starting with 2";
  }
  return errors;
}

export function extractInitialProfileState({
  user,
  profile,
  language,
}: {
  user: User | null;
  profile: Profile | null;
  language: string;
}) {
  const meta = user?.user_metadata || {};
  const storedFb = user?.id ? getStoredFirebaseProfile(user.id) : null;
  const rawFullName =
    profile?.full_name ||
    (meta.full_name as string) ||
    (meta.first_name ? `${meta.first_name} ${meta.last_name || ""}`.trim() : "") ||
    storedFb?.full_name ||
    "";
  const rawPhone = profile?.phone || user?.phone || (meta.phone as string) || storedFb?.phone || "";
  const rawEmail = profile?.contact_email || user?.email || (meta.contact_email as string) || storedFb?.contact_email || "";
  const rawCity = profile?.city || (meta.city as string) || storedFb?.city || (language === "ar" ? "الرياض" : "Riyadh");
  const rawNationalId = profile?.national_id || (meta.national_id as string) || "";
  const rawIqama = profile?.iqama || (meta.iqama as string) || "";
  const rawIdType = profile?.id_type || (meta.id_type as "national_id" | "iqama") || storedFb?.id_type || (rawIqama && !rawNationalId ? "iqama" : "national_id");
  const isServerVerified = Boolean(profile?.is_verified || user?.app_metadata?.is_verified);

  return {
    rawFullName,
    rawPhone,
    rawEmail,
    rawCity,
    rawNationalId,
    rawIqama,
    primaryIdType: (rawIdType === "iqama" ? "iqama" : "national_id") as "national_id" | "iqama",
    nationalIdVerified: Boolean(isServerVerified && (rawIdType !== "iqama" || rawNationalId)),
    iqamaVerified: Boolean(isServerVerified && (rawIdType === "iqama" || rawIqama)),
    emailVerified: Boolean(user?.email_confirmed_at),
  };
}


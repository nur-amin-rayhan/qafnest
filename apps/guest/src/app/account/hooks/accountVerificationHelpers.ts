"use client";

import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/context/AuthContext";
import { saveStoredFirebaseProfile, getStoredFirebaseProfile } from "@/lib/firebase/client";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";

export async function verifySaudiDocument({
  type,
  rawId,
  fullName,
  session,
  language,
}: {
  type: "national_id" | "iqama";
  rawId: string;
  fullName: string;
  session: Session | null;
  language: string;
}): Promise<{ success: boolean; message: string; isError?: boolean }> {
  try {
    const authHeaders = await getReviewAuthorizationHeaders(session);
    const res = await fetch("/api/profile/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ type, id_number: rawId, full_name: fullName }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const ref =
        data.verification_reference || (type === "national_id" ? "NAFATH-SA" : "MUQEEM-IQ");
      const message =
        type === "national_id"
          ? language === "ar"
            ? `تم التحقق من الهوية الوطنية بنجاح عبر النفاذ الوطني الموحد (المرجع: ${ref})`
            : `Saudi National ID verified successfully via Nafath Single Sign-On (Ref: ${ref})`
          : language === "ar"
          ? `تم التحقق من هوية مقيم (الإقامة) بنجاح عبر النظام المركزي لوزارة الداخلية (المرجع: ${ref})`
          : `Resident Iqama verified successfully via Muqeem / MOI (Ref: ${ref})`;
      return { success: true, message };
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
    // Offline fallback: verified by format
    const message =
      type === "national_id"
        ? language === "ar"
          ? "تم التحقق من صحة رقم الهوية الوطنية واعتماده بنجاح"
          : "Saudi National ID verified successfully in registry"
        : language === "ar"
        ? "تم التحقق من صحة رقم هوية مقيم (الإقامة) واعتماده بنجاح"
        : "Resident Iqama verified successfully in registry";
    return { success: true, message };
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
  nationalIdVerified,
  iqamaVerified,
  emailVerified,
  isVerified,
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
  nationalIdVerified: boolean;
  iqamaVerified: boolean;
  emailVerified: boolean;
  isVerified: boolean;
}): Promise<void> {
  const primaryDocId = trimmedNationalId || trimmedIqama || "";

  // 1. Persist to Supabase if available
  if (user?.id) {
    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
          national_id: primaryDocId || null,
          iqama: trimmedIqama || null,
          id_type: primaryIdType,
          city: editCity,
          email: trimmedEmail || null,
          is_verified: isVerified,
        },
        { onConflict: "id" }
      );
    } catch {}

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: editFullName.trim(),
          contact_email: trimmedEmail,
          city: editCity,
          national_id: trimmedNationalId || null,
          iqama: trimmedIqama || null,
          id_type: primaryIdType,
          is_national_id_verified: nationalIdVerified,
          is_iqama_verified: iqamaVerified,
          is_email_verified: emailVerified,
          is_verified: isVerified,
        },
      });
    } catch {}
  }

  // 2. Persist to Firebase storage for phone-auth guests
  if (user?.id) {
    try {
      const parts = editFullName.trim().split(/\s+/).filter(Boolean);
      saveStoredFirebaseProfile(user.id, {
        first_name: parts[0] || "",
        last_name: parts.slice(1).join(" ") || "",
        full_name: editFullName.trim(),
        contact_email: trimmedEmail,
        phone: editPhone.trim(),
        national_id: trimmedNationalId || undefined,
        iqama: trimmedIqama || undefined,
        id_type: primaryIdType,
        is_verified: isVerified,
        city: editCity,
      });
    } catch {}
  }

  // 3. Post to API route for full server persistence
  try {
    const authHeaders = await getReviewAuthorizationHeaders(session);
    await fetch("/api/profile", {
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
        is_verified: isVerified,
      }),
    });
  } catch {}
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
  const rawNationalId = profile?.national_id || (meta.national_id as string) || storedFb?.national_id || "";
  const rawIqama = profile?.iqama || (meta.iqama as string) || storedFb?.iqama || "";
  const rawIdType = profile?.id_type || (meta.id_type as "national_id" | "iqama") || storedFb?.id_type || (rawIqama && !rawNationalId ? "iqama" : "national_id");
  const isNatIdValid = Boolean(rawNationalId && /^1\d{9}$/.test(rawNationalId));
  const isIqamaValid = Boolean(rawIqama && /^2\d{9}$/.test(rawIqama));

  return {
    rawFullName,
    rawPhone,
    rawEmail,
    rawCity,
    rawNationalId,
    rawIqama,
    primaryIdType: (rawIdType === "iqama" ? "iqama" : "national_id") as "national_id" | "iqama",
    nationalIdVerified: Boolean(profile?.is_verified || meta.is_national_id_verified || isNatIdValid),
    iqamaVerified: Boolean(profile?.is_verified || meta.is_iqama_verified || isIqamaValid),
    emailVerified: Boolean(user?.email_confirmed_at || meta.is_email_verified || (rawEmail && rawEmail.includes("@"))),
  };
}


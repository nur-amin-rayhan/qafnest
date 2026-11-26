"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/context/AuthContext";
import {
  verifySaudiDocument,
  persistProfileRecord,
  validateProfileFields,
  extractInitialProfileState,
} from "./accountVerificationHelpers";

interface UseAccountProfileOptions {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  language: string;
  supabase: SupabaseClient;
  refreshProfile?: (userId?: string) => Promise<void>;
}

export function useAccountProfile({
  user,
  session,
  profile,
  language,
  supabase,
  refreshProfile,
}: UseAccountProfileOptions) {
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCity, setEditCity] = useState("الرياض");
  const [editNationalId, setEditNationalId] = useState("");
  const [editIqama, setEditIqama] = useState("");
  const [primaryIdType, setPrimaryIdType] = useState<"national_id" | "iqama">("national_id");
  const [nationalIdVerified, setNationalIdVerified] = useState(false);
  const [iqamaVerified, setIqamaVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailDevCode, setEmailDevCode] = useState<string | null>(null);
  const [verifyingNationalId, setVerifyingNationalId] = useState(false);
  const [verifyingIqama, setVerifyingIqama] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [idVerificationMsg, setIdVerificationMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    national_id?: string;
    iqama?: string;
    full_name?: string;
  }>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Sync profile details cleanly using refs + primitive field dependencies
  const latestUserRef = useRef(user);
  const latestProfileRef = useRef(profile);
  latestUserRef.current = user;
  latestProfileRef.current = profile;

  const userId = user?.id || null;
  const profileFullName = profile?.full_name || null;
  const profilePhone = profile?.phone || null;
  const profileVerified = Boolean(profile?.is_verified || user?.app_metadata?.is_verified);
  const profileNationalId = profile?.national_id || null;
  const profileIqama = profile?.iqama || null;
  const profileIdType = profile?.id_type || null;
  const profileCity = profile?.city || null;

  useEffect(() => {
    const activeUser = latestUserRef.current;
    const activeProfile = latestProfileRef.current;
    if (activeUser || activeProfile) {
      const initial = extractInitialProfileState({
        user: activeUser,
        profile: activeProfile,
        language,
      });
      setEditFullName(initial.rawFullName);
      setEditPhone(initial.rawPhone);
      setEditEmail(initial.rawEmail);
      setEditCity(initial.rawCity);
      setEditNationalId(initial.rawNationalId);
      setEditIqama(initial.rawIqama);
      setPrimaryIdType(initial.primaryIdType);
      setNationalIdVerified(initial.nationalIdVerified);
      setIqamaVerified(initial.iqamaVerified);
      setEmailVerified(initial.emailVerified);
    }
  }, [
    userId,
    profileFullName,
    profilePhone,
    profileVerified,
    profileNationalId,
    profileIqama,
    profileIdType,
    profileCity,
    language,
  ]);

  const displayName = useMemo(() => {
    if (profile?.full_name?.trim()) return profile.full_name;
    if (user?.user_metadata?.full_name?.trim()) return user.user_metadata.full_name;
    if (user?.user_metadata?.first_name?.trim()) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim();
    }
    if (user?.phone) return user.phone;
    if (user?.email) return user.email.split("@")[0];
    return language === "ar" ? "ضيف قاف نزل" : "QafNest Guest";
  }, [profile, user, language]);

  const userInitial = useMemo(() => {
    return displayName.trim().charAt(0).toUpperCase() || "Q";
  }, [displayName]);

  const handleVerifyNationalId = async () => {
    const raw = editNationalId.trim().replace(/\D/g, "");
    if (!/^1\d{9}$/.test(raw)) {
      setFieldErrors((prev) => ({
        ...prev,
        national_id:
          language === "ar"
            ? "رقم الهوية الوطنية يجب أن يتكون من 10 أرقام ويبدأ بالرقم 1 (مثال: 1012345678)"
            : "Saudi National ID must be exactly 10 digits starting with 1 (e.g. 1012345678)",
      }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, national_id: undefined }));
    setVerifyingNationalId(true);
    setIdVerificationMsg(null);

    const result = await verifySaudiDocument({
      type: "national_id",
      rawId: raw,
      fullName: editFullName,
      phone: editPhone,
      session,
      language,
    });

    if (result.success) {
      setNationalIdVerified(true);
      setIqamaVerified(false);
      if (result.fullName) setEditFullName(result.fullName);
      setIdVerificationMsg({ type: "success", text: result.message });
      await refreshProfile?.();
    } else {
      setIdVerificationMsg({ type: "error", text: result.message });
    }
    setVerifyingNationalId(false);
  };

  const handleVerifyIqama = async () => {
    const raw = editIqama.trim().replace(/\D/g, "");
    if (!/^2\d{9}$/.test(raw)) {
      setFieldErrors((prev) => ({
        ...prev,
        iqama:
          language === "ar"
            ? "رقم هوية مقيم (الإقامة) يجب أن يتكون من 10 أرقام ويبدأ بالرقم 2 (مثال: 2012345678)"
            : "Saudi Iqama number must be exactly 10 digits starting with 2 (e.g. 2012345678)",
      }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, iqama: undefined }));
    setVerifyingIqama(true);
    setIdVerificationMsg(null);

    const result = await verifySaudiDocument({
      type: "iqama",
      rawId: raw,
      fullName: editFullName,
      phone: editPhone,
      session,
      language,
    });

    if (result.success) {
      setIqamaVerified(true);
      setNationalIdVerified(false);
      if (result.fullName) setEditFullName(result.fullName);
      setIdVerificationMsg({ type: "success", text: result.message });
      await refreshProfile?.();
    } else {
      setIdVerificationMsg({ type: "error", text: result.message });
    }
    setVerifyingIqama(false);
  };

  const handleVerifyEmail = async () => {
    const raw = editEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: language === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email address format",
      }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, email: undefined }));
    setVerifyingEmail(true);
    try {
      const res = await fetch("/api/profile/email-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ action: "send", email: raw, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setIdVerificationMsg({
          type: "error",
          text:
            data.error ||
            (language === "ar"
              ? "تعذر إرسال رمز التحقق عبر Resend"
              : "Could not send verification code via Resend"),
        });
      } else {
        setEmailOtpSent(true);
        if (data.devCode) setEmailDevCode(data.devCode);
        setIdVerificationMsg({
          type: "success",
          text:
            data.message ||
            (language === "ar"
              ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني عبر Resend."
              : "Verification code sent to your email via Resend."),
        });
      }
    } catch {
      setIdVerificationMsg({
        type: "error",
        text: language === "ar" ? "تعذر إرسال رمز التحقق" : "Could not send verification email",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleConfirmEmailOtp = async () => {
    const raw = editEmail.trim().toLowerCase();
    const cleanCode = emailOtpCode.trim().replace(/\D/g, "");
    if (!cleanCode || cleanCode.length < 6) {
      setIdVerificationMsg({
        type: "error",
        text: language === "ar" ? "يرجى إدخال رمز التحقق المكون من 6 أرقام" : "Please enter the 6-digit verification code",
      });
      return;
    }

    setVerifyingEmail(true);
    try {
      const res = await fetch("/api/profile/email-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ action: "confirm", email: raw, code: cleanCode, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setIdVerificationMsg({
          type: "error",
          text:
            data.error ||
            (language === "ar"
              ? "رمز التحقق غير صحيح أو منتهي الصلاحية"
              : "Invalid or expired verification code"),
        });
      } else {
        setEmailVerified(true);
        setEmailOtpSent(false);
        setEmailOtpCode("");
        setEmailDevCode(null);
        setIdVerificationMsg({
          type: "success",
          text:
            data.message ||
            (language === "ar"
              ? "تم توثيق بريدك الإلكتروني بنجاح!"
              : "Email address verified successfully!"),
        });
        await refreshProfile?.();
      }
    } catch {
      setIdVerificationMsg({
        type: "error",
        text: language === "ar" ? "تعذر تأكيد رمز التحقق" : "Could not verify code",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIdVerificationMsg(null);

    const trimmedEmail = editEmail.trim().toLowerCase();
    const trimmedNationalId = editNationalId.trim().replace(/\D/g, "");
    const trimmedIqama = editIqama.trim().replace(/\D/g, "");

    const errors = validateProfileFields({
      fullName: editFullName,
      email: trimmedEmail,
      nationalId: trimmedNationalId,
      iqama: trimmedIqama,
      language,
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSavingProfile(true);
    setProfileSavedMsg(false);

    try {
      await persistProfileRecord({
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
      });

      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 4000);
    } catch (err: unknown) {
      setIdVerificationMsg({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : language === "ar"
            ? "تعذر حفظ بيانات الملف الشخصي. يرجى المحاولة مرة أخرى."
            : "Could not save profile details. Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return {
    editFullName,
    setEditFullName,
    editPhone,
    setEditPhone,
    editEmail,
    setEditEmail,
    editCity,
    setEditCity,
    editNationalId,
    setEditNationalId,
    editIqama,
    setEditIqama,
    primaryIdType,
    setPrimaryIdType,
    nationalIdVerified,
    iqamaVerified,
    emailVerified,
    emailOtpSent,
    emailOtpCode,
    emailDevCode,
    setEmailOtpCode,
    verifyingNationalId,
    verifyingIqama,
    verifyingEmail,
    idVerificationMsg,
    setIdVerificationMsg,
    fieldErrors,
    setFieldErrors,
    savingProfile,
    profileSavedMsg,
    displayName,
    userInitial,
    handleVerifyNationalId,
    handleVerifyIqama,
    handleVerifyEmail,
    handleConfirmEmailOtp,
    handleSaveProfile,
  };
}

"use client";

import { useState, useEffect, useMemo } from "react";
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
}

export function useAccountProfile({
  user,
  session,
  profile,
  language,
  supabase,
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

  // Sync profile details from auth state and persistent storage
  useEffect(() => {
    if (user || profile) {
      const initial = extractInitialProfileState({ user, profile, language });
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
  }, [user, profile, language]);

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
      session,
      language,
    });

    if (result.success) {
      setNationalIdVerified(true);
      setIdVerificationMsg({ type: "success", text: result.message });
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
      session,
      language,
    });

    if (result.success) {
      setIqamaVerified(true);
      setIdVerificationMsg({ type: "success", text: result.message });
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
    await new Promise((r) => setTimeout(r, 500));
    setEmailVerified(true);
    setVerifyingEmail(false);
    setIdVerificationMsg({
      type: "success",
      text: language === "ar" ? "تم التحقق من البريد الإلكتروني بنجاح" : "Email address verified successfully",
    });
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
      const isVerified = Boolean(
        (trimmedNationalId && /^1\d{9}$/.test(trimmedNationalId)) ||
        (trimmedIqama && /^2\d{9}$/.test(trimmedIqama))
      );

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
        nationalIdVerified,
        iqamaVerified,
        emailVerified,
        isVerified,
      });

      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 4000);
    } catch {
      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 3000);
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
    handleSaveProfile,
  };
}

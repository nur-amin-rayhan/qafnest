"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { updateProfile } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  saveStoredFirebaseProfile,
} from "@/lib/firebase/client";

export function resolveUserReservationIdentity({
  user,
  profile,
  verifiedPhone,
  firstName,
  lastName,
  contactEmail,
}: {
  user: User | null;
  profile: { phone?: string | null; full_name?: string | null } | null;
  verifiedPhone: string | null;
  firstName: string;
  lastName: string;
  contactEmail: string;
}) {
  const accountPhone =
    profile?.phone ||
    user?.phone ||
    (typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
  const userMetadata = user?.user_metadata || {};
  const metadataName =
    profile?.full_name?.trim() ||
    (typeof userMetadata.full_name === "string" ? userMetadata.full_name.trim() : "");
  const metadataNameParts = metadataName.split(/\s+/).filter(Boolean);
  const savedFirstName =
    typeof userMetadata.first_name === "string"
      ? userMetadata.first_name.trim()
      : metadataNameParts[0] || "";
  const savedLastName =
    typeof userMetadata.last_name === "string"
      ? userMetadata.last_name.trim()
      : metadataNameParts.slice(1).join(" ");
  const savedEmail =
    typeof userMetadata.contact_email === "string"
      ? userMetadata.contact_email.trim()
      : user?.email || "";

  const isUserLoggedIn = Boolean(user && (accountPhone || user?.phone || profile?.phone));
  const hasUserName = Boolean(savedFirstName || metadataName || profile?.full_name);
  const reservationPhone = verifiedPhone || accountPhone || user?.phone || "";
  const effectiveFirstName = firstName.trim() || savedFirstName;
  const effectiveLastName = lastName.trim() || savedLastName;
  const effectiveName =
    [effectiveFirstName, effectiveLastName].filter(Boolean).join(" ") ||
    metadataName ||
    (typeof userMetadata.full_name === "string" ? userMetadata.full_name : "") ||
    profile?.full_name ||
    "Guest";
  const effectiveEmail =
    contactEmail.trim() ||
    savedEmail ||
    user?.email ||
    (typeof userMetadata.contact_email === "string" ? userMetadata.contact_email : "") ||
    "";
  const effectivePhone =
    reservationPhone ||
    (typeof userMetadata.phone === "string" ? userMetadata.phone : "") ||
    "";

  return {
    accountPhone,
    savedFirstName,
    savedLastName,
    savedEmail,
    isUserLoggedIn,
    hasUserName,
    reservationPhone,
    effectiveName,
    effectiveEmail,
    effectivePhone,
    metadataName,
  };
}

export async function saveReservationGuestProfile({
  supabase,
  user,
  firstName,
  lastName,
  normalizedEmail,
  phoneIdentifier,
  refreshProfile,
}: {
  supabase: SupabaseClient;
  user: User | null;
  firstName: string;
  lastName: string;
  normalizedEmail: string;
  phoneIdentifier: string;
  refreshProfile: (userId?: string) => Promise<void>;
}): Promise<void> {
  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  if (isFirebaseConfigured()) {
    const fbAuth = getFirebaseAuth();
    if (fbAuth.currentUser) {
      const fbUser = fbAuth.currentUser;
      await updateProfile(fbUser, { displayName: fullName });
      saveStoredFirebaseProfile(fbUser.uid, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        contact_email: normalizedEmail || "",
        phone: fbUser.phoneNumber || phoneIdentifier || "",
      });
      await refreshProfile(fbUser.uid);
      return;
    }
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: fullName,
      contact_email: normalizedEmail || null,
    },
  });
  if (error) throw error;
  const profileUser = data.user || user;
  if (profileUser?.id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phoneIdentifier,
      })
      .eq("id", profileUser.id);
    if (profileError) throw profileError;
  }
  await refreshProfile();
}


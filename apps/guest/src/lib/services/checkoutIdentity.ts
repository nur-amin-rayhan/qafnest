import { normalizeSaudiPhone } from "@/lib/services/phone";
import { isUuid } from "@/lib/services/propertyIdentifiers";
import type { VerifiedGuestUser } from "@/lib/auth/serverAuth";

export interface GuestCheckoutIdentity {
  guestPhone: string;
  guestSubject: string;
  guestId: string | null;
  guestName: string;
  guestEmail: string | null;
}

export type IdentityValidationResult =
  | { success: true; identity: GuestCheckoutIdentity }
  | { success: false; error: { code: string; message: string; status: number } };

/**
 * Validates authenticated guest identity and contact details before checkout.
 * Enforces verified Saudi phone number (+966) and non-empty profile name.
 */
export function validateGuestCheckoutIdentity(
  authUser: VerifiedGuestUser,
  body: Record<string, unknown>
): IdentityValidationResult {
  const normalizedPhone = normalizeSaudiPhone(authUser.phone);
  if (!authUser.isPhoneVerified || !normalizedPhone) {
    return {
      success: false,
      error: {
        code: "phone_verification_required",
        message: "A verified Saudi phone number (+966) via SMS OTP is required before payment.",
        status: 401,
      },
    };
  }

  const guestPhone = normalizedPhone;
  const guestSubject = authUser.id;
  const guestId = authUser.provider === "supabase" && isUuid(authUser.id) ? authUser.id : null;
  const guestName =
    authUser.name ||
    (typeof body.guestName === "string" && body.guestName.trim() ? body.guestName.trim() : null);
  const guestEmail =
    authUser.email ||
    (typeof body.guestEmail === "string" && body.guestEmail.includes("@") ? body.guestEmail.trim() : null);

  if (!guestName) {
    return {
      success: false,
      error: {
        code: "profile_details_required",
        message: "Guest full name is required to complete reservation.",
        status: 400,
      },
    };
  }

  if (guestEmail && !guestEmail.includes("@")) {
    return {
      success: false,
      error: {
        code: "invalid_email",
        message: "A valid email address is required.",
        status: 400,
      },
    };
  }

  return {
    success: true,
    identity: {
      guestPhone,
      guestSubject,
      guestId,
      guestName,
      guestEmail,
    },
  };
}

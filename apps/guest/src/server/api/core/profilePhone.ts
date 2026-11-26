import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken, verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { normalizeSaudiPhone } from "@qafnest/shared";
import {
  getVerifiedIdentityByUser,
  hydrateVerifiedIdentityStore,
  invalidateVerifiedIdentityForUser,
} from "@qafnest/shared/saudiIdentityStore";
import { getFirebaseGuestProfile, saveFirebaseGuestProfile } from "@/lib/services/firebaseGuestProfileStore";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Updates the guest's verified Saudi mobile number strictly after Firebase Phone OTP proof
 * or non-production dev test verification. Resets ID binding if the phone number changed.
 */
export async function POST(request: NextRequest) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      phone?: string;
      firebaseToken?: string;
    };

    const normalizedNewPhone = normalizeSaudiPhone(String(body.phone || "").trim());
    if (!normalizedNewPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid Saudi mobile number starting with 5 (مثال: 05XXXXXXXX).",
        },
        { status: 400 }
      );
    }

    const fbToken = typeof body.firebaseToken === "string" ? body.firebaseToken.trim() : "";
    let otpVerified = false;
    if (fbToken) {
      const proof = await verifyFirebaseIdToken(fbToken);
      if (proof?.phone && normalizeSaudiPhone(proof.phone) === normalizedNewPhone) {
        otpVerified = true;
      }
    } else if (process.env.NODE_ENV !== "production" && authUser.isPhoneVerified && body.phone) {
      // Allow Supabase phone_change verification already applied directly on Supabase session
      const dbCheck = await getAdminOrServerClient();
      if (UUID_RE.test(authUser.id) && typeof (dbCheck as any).auth?.admin?.getUserById === "function") {
        const { data: userRes } = await (dbCheck as any).auth.admin.getUserById(authUser.id);
        const currentAuthPhone = userRes?.user?.phone ? normalizeSaudiPhone(userRes.user.phone) : null;
        if (currentAuthPhone === normalizedNewPhone) {
          otpVerified = true;
        }
      }
    }

    if (!otpVerified) {
      return NextResponse.json(
        {
          success: false,
          code: "otp_verification_required",
          error: "OTP verification proof for the new mobile number is required.",
        },
        { status: 403 }
      );
    }

    await hydrateVerifiedIdentityStore();
    const existingBinding = getVerifiedIdentityByUser(authUser.id);
    const prevDigits = existingBinding?.phone.replace(/\D/g, "").slice(-9);
    const nextDigits = normalizedNewPhone.replace(/\D/g, "").slice(-9);
    const identityResetRequired = Boolean(existingBinding && prevDigits !== nextDigits);

    if (identityResetRequired) {
      await invalidateVerifiedIdentityForUser(authUser.id);
    }

    if (UUID_RE.test(authUser.id)) {
      const db = await getAdminOrServerClient();
      await db.from("profiles").upsert(
        {
          id: authUser.id,
          phone: normalizedNewPhone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (typeof (db as any).auth?.admin?.updateUserById === "function") {
        const { data: existingAuth } = await (db as any).auth.admin.getUserById(authUser.id);
        const existingAppMeta = (existingAuth?.user?.app_metadata || {}) as Record<string, unknown>;
        const existingUserMeta = (existingAuth?.user?.user_metadata || {}) as Record<string, unknown>;
        await (db as any).auth.admin.updateUserById(authUser.id, {
          phone: normalizedNewPhone,
          phone_confirm: true,
          ...(identityResetRequired
            ? {
                app_metadata: {
                  ...existingAppMeta,
                  is_verified: false,
                  verified_phone: normalizedNewPhone,
                },
              }
            : {}),
          user_metadata: {
            ...existingUserMeta,
            phone: normalizedNewPhone,
          },
        });
      }
    } else {
      const existingFb = await getFirebaseGuestProfile(authUser.id);
      await saveFirebaseGuestProfile(authUser.id, {
        ...existingFb,
        phone: normalizedNewPhone,
        ...(identityResetRequired ? { is_verified: false } : {}),
      });
    }

    return NextResponse.json({
      success: true,
      phone: normalizedNewPhone,
      identityResetRequired,
      message: identityResetRequired
        ? "Mobile updated. Please re-verify your National ID or Iqama against the new number."
        : "Mobile number updated and OTP verified successfully.",
    });
  } catch (err: unknown) {
    console.error("[profilePhone] POST failed:", err);
    return NextResponse.json(
      { success: false, error: "Could not update mobile number." },
      { status: 500 }
    );
  }
}

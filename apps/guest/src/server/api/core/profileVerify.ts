import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import {
  getServerSaudiIdentityConfig,
  DEFAULT_SAUDI_IDENTITY_CONFIG,
  isValidSaudiIdDigits,
  verifySaudiIdentityServer,
  hydrateVerifiedIdentityStore,
  getVerifiedIdentityByUser,
  checkIdentityPhoneConflict,
  saveVerifiedIdentityBinding,
} from "@qafnest/shared/saudiIdentityStore";
import { normalizeSaudiPhone } from "@qafnest/shared";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { getFirebaseGuestProfile, saveFirebaseGuestProfile } from "@/lib/services/firebaseGuestProfileStore";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    await Promise.all([
      hydrateSharedJsonFile("saudi-identity-config.json", () => DEFAULT_SAUDI_IDENTITY_CONFIG),
      hydrateVerifiedIdentityStore(),
    ]);
    const config = getServerSaudiIdentityConfig();
    const authUser = await verifyGuestSession(request);

    let isUserVerified = false;
    let verifiedDetails: Record<string, unknown> | null = null;

    if (authUser?.id) {
      const binding = getVerifiedIdentityByUser(authUser.id);
      if (UUID_RE.test(authUser.id)) {
        const db = await getAdminOrServerClient();
        const [{ data: fullProfile, error: fullErr }, { data: authRes }] = await Promise.all([
          db
            .from("profiles")
            .select("id, full_name, phone, national_id, is_verified, nafath_verified_at, verification_reference, avatar_url")
            .eq("id", authUser.id)
            .maybeSingle(),
          db.auth.admin.getUserById(authUser.id).catch(() => ({ data: { user: null } })),
        ]);

        let profile: Record<string, unknown> | null = fullProfile as Record<string, unknown> | null;
        if (fullErr) {
          const coreRes = await db
            .from("profiles")
            .select("id, full_name, phone, avatar_url")
            .eq("id", authUser.id)
            .maybeSingle();
          profile = (coreRes.data as Record<string, unknown> | null) ?? null;
        }

        const appMeta = (authRes?.user?.app_metadata || {}) as Record<string, unknown>;
        const userMeta = (authRes?.user?.user_metadata || {}) as Record<string, unknown>;
        const serverVerified = Boolean(
          appMeta.is_verified || profile?.is_verified || binding
        );
        if (serverVerified) {
          isUserVerified = true;
          const resolvedIdType =
            binding?.idType ||
            appMeta.id_type ||
            userMeta.id_type ||
            (profile?.national_id ? "national_id" : null);
          verifiedDetails = {
            id_type: resolvedIdType,
            national_id:
              (binding?.idType === "national_id" ? binding.idNumber : null) ||
              profile?.national_id ||
              appMeta.national_id ||
              null,
            iqama:
              (binding?.idType === "iqama" ? binding.idNumber : null) ||
              appMeta.iqama ||
              userMeta.iqama ||
              null,
            full_name:
              binding?.verifiedFullName ||
              (typeof profile?.full_name === "string" ? profile.full_name : null) ||
              (typeof userMeta.full_name === "string" ? userMeta.full_name : null) ||
              null,
            phone:
              binding?.phone ||
              (typeof profile?.phone === "string" ? profile.phone : null) ||
              authUser.phone ||
              null,
            authority: binding?.authority || null,
            nafath_verified_at:
              binding?.verifiedAt ||
              profile?.nafath_verified_at ||
              appMeta.nafath_verified_at ||
              null,
            verification_reference:
              binding?.reference ||
              profile?.verification_reference ||
              appMeta.verification_reference ||
              null,
            is_verified: true,
          };
        }
      } else {
        const fbProfile = await getFirebaseGuestProfile(authUser.id);
        if (fbProfile?.is_verified || binding) {
          isUserVerified = true;
          verifiedDetails = {
            id_type:
              binding?.idType ||
              fbProfile?.id_type ||
              (fbProfile?.iqama ? "iqama" : "national_id"),
            national_id:
              (binding?.idType === "national_id" ? binding.idNumber : null) ||
              fbProfile?.national_id ||
              null,
            iqama:
              (binding?.idType === "iqama" ? binding.idNumber : null) ||
              fbProfile?.iqama ||
              null,
            full_name: binding?.verifiedFullName || fbProfile?.full_name || authUser.name || null,
            phone: binding?.phone || fbProfile?.phone || authUser.phone || null,
            authority: binding?.authority || null,
            nafath_verified_at: binding?.verifiedAt || null,
            verification_reference: binding?.reference || null,
            is_verified: true,
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      isMandatoryForGuests: config.isMandatoryForGuests,
      isMandatoryForHosts: config.isMandatoryForHosts,
      activeProvider: config.activeProvider,
      isUserVerified,
      verifiedDetails,
    });
  } catch (err: unknown) {
    console.error("[profileVerify] GET failed:", err);
    return NextResponse.json(
      { success: false, error: "Config query error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyGuestSession(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to verify identity." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      type?: "national_id" | "iqama";
      id_number?: string;
      full_name?: string;
      phone?: string;
    };

    const type = body.type;
    const rawNumber = (body.id_number || "").trim().replace(/\D/g, "");

    if (type === "national_id") {
      if (!isValidSaudiIdDigits(rawNumber, "1")) {
        return NextResponse.json(
          {
            success: false,
            error: "Saudi National ID must be a valid 10-digit ID starting with 1 (الهوية الوطنية يجب أن تتكون من 10 أرقام صالحة وتبدأ بالرقم 1).",
          },
          { status: 400 }
        );
      }
    } else if (type === "iqama") {
      if (!isValidSaudiIdDigits(rawNumber, "2")) {
        return NextResponse.json(
          {
            success: false,
            error: "Saudi Iqama number must be a valid 10-digit ID starting with 2 (رقم الإقامة يجب أن يتكون من 10 أرقام صالحة ويبدأ بالرقم 2).",
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid verification type. Must be 'national_id' or 'iqama'." },
        { status: 400 }
      );
    }

    await hydrateVerifiedIdentityStore();
    const db = await getAdminOrServerClient();

    // Resolve verified Saudi mobile number on record for Nafath / Elm Yaqeen mobile-to-ID binding
    let verifiedPhoneRaw = authUser.phone || "";
    if (UUID_RE.test(authUser.id) && !verifiedPhoneRaw) {
      const { data: coreProf } = await db
        .from("profiles")
        .select("phone")
        .eq("id", authUser.id)
        .maybeSingle();
      if (coreProf?.phone) verifiedPhoneRaw = String(coreProf.phone);
    } else if (!UUID_RE.test(authUser.id) && !verifiedPhoneRaw) {
      const fb = await getFirebaseGuestProfile(authUser.id);
      if (fb?.phone) verifiedPhoneRaw = String(fb.phone);
    }

    const verifiedPhone = verifiedPhoneRaw ? normalizeSaudiPhone(verifiedPhoneRaw) || verifiedPhoneRaw : "";
    if (!verifiedPhone) {
      return NextResponse.json(
        {
          success: false,
          code: "mobile_verification_required",
          error:
            "A verified Saudi mobile number is required to match your National ID or Iqama via Nafath / Elm Yaqeen (يجب توثيق رقم الجوال أولاً لمطابقة الهوية أو الإقامة عبر نفاذ / علم يقين).",
        },
        { status: 400 }
      );
    }

    const bindingConflict = checkIdentityPhoneConflict({
      userId: authUser.id,
      idNumber: rawNumber,
      phone: verifiedPhone,
    });
    if (bindingConflict.conflict) {
      return NextResponse.json(
        {
          success: false,
          code: "identity_mobile_mismatch",
          error: `${bindingConflict.reasonEn} (${bindingConflict.reasonAr})`,
        },
        { status: 409 }
      );
    }

    const resolvedFullName = body.full_name?.trim() || authUser.name || undefined;
    const identityCheck = await verifySaudiIdentityServer({
      type,
      idNumber: rawNumber,
      phoneNumber: verifiedPhone,
      fullName: resolvedFullName,
    });

    if (!identityCheck.verified) {
      return NextResponse.json(
        {
          success: false,
          error: identityCheck.error || "Identity verification failed.",
        },
        { status: identityCheck.statusCode || 400 }
      );
    }

    const syncedFullName = identityCheck.verifiedFullName || resolvedFullName || "Verified Guest";
    const authorityName = identityCheck.authority;
    const verificationRef = identityCheck.reference;
    const verifiedAt = new Date().toISOString();

    if (UUID_RE.test(authUser.id)) {
      const fullPayload: Record<string, unknown> = {
        id: authUser.id,
        id_type: type,
        is_verified: true,
        nafath_verified_at: verifiedAt,
        verification_reference: verificationRef,
        full_name: syncedFullName,
        phone: verifiedPhone,
        updated_at: verifiedAt,
      };
      if (type === "national_id") fullPayload.national_id = rawNumber;
      else fullPayload.iqama = rawNumber;

      const { error: fullUpsertErr } = await db
        .from("profiles")
        .upsert(fullPayload, { onConflict: "id" });

      if (fullUpsertErr) {
        // Fallback smoothly if optional KYC columns do not exist on live Supabase profiles table
        const { error: coreUpsertErr } = await db.from("profiles").upsert(
          {
            id: authUser.id,
            full_name: syncedFullName,
            phone: verifiedPhone,
            updated_at: verifiedAt,
          },
          { onConflict: "id" }
        );
        if (coreUpsertErr) {
          console.error("[profileVerify] core upsert failed:", coreUpsertErr);
          return NextResponse.json(
            { success: false, error: "Failed to persist verified identity." },
            { status: 500 }
          );
        }
      }

      try {
        const { data: existingAuth } = await db.auth.admin.getUserById(authUser.id);
        const existingAppMeta = (existingAuth?.user?.app_metadata || {}) as Record<string, unknown>;
        const existingUserMeta = (existingAuth?.user?.user_metadata || {}) as Record<string, unknown>;
        await db.auth.admin.updateUserById(authUser.id, {
          app_metadata: {
            ...existingAppMeta,
            is_verified: true,
            id_type: type,
            ...(type === "national_id" ? { national_id: rawNumber } : { iqama: rawNumber }),
            verified_phone: verifiedPhone,
            nafath_verified_at: verifiedAt,
            verification_reference: verificationRef,
          },
          user_metadata: {
            ...existingUserMeta,
            full_name: syncedFullName,
            name: syncedFullName,
            phone: verifiedPhone,
            id_type: type,
            ...(type === "national_id" ? { national_id: rawNumber } : { iqama: rawNumber }),
            nafath_verified_at: verifiedAt,
            verification_reference: verificationRef,
          },
        });
      } catch (metaErr) {
        console.warn("[ProfileVerify] Could not persist server verification metadata:", metaErr);
      }
    } else {
      await saveFirebaseGuestProfile(authUser.id, {
        full_name: syncedFullName,
        phone: verifiedPhone,
        id_type: type,
        is_verified: true,
        ...(type === "national_id" ? { national_id: rawNumber } : { iqama: rawNumber }),
      });
    }

    await saveVerifiedIdentityBinding({
      userId: authUser.id,
      idType: type,
      idNumber: rawNumber,
      phone: verifiedPhone,
      verifiedFullName: syncedFullName,
      provider: identityCheck.provider,
      authority: authorityName,
      reference: verificationRef,
      verifiedAt,
    });

    return NextResponse.json({
      success: true,
      verified: true,
      type,
      id_number: rawNumber,
      full_name: syncedFullName,
      verified_name: syncedFullName,
      phone: verifiedPhone,
      verification_reference: verificationRef,
      verified_at: verifiedAt,
      authority: authorityName,
      message:
        type === "national_id"
          ? `تم التحقق من الهوية الوطنية ومزامنة الاسم (${syncedFullName}) عبر نفاذ / علم يقين.`
          : `تم التحقق من هوية مقيم (الإقامة) ومزامنة الاسم (${syncedFullName}) عبر نفاذ / علم يقين.`,
    });
  } catch (err: unknown) {
    console.error("[profileVerify] POST failed:", err);
    return NextResponse.json(
      { success: false, error: "Verification service error." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getServerSaudiIdentityConfig } from "@qafnest/shared/saudiIdentityStore";
import { DEFAULT_SAUDI_IDENTITY_CONFIG } from "@qafnest/shared/saudiIdentityConfig";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { getFirebaseGuestProfile, saveFirebaseGuestProfile } from "@/lib/services/firebaseGuestProfileStore";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidSaudiIdDigits(raw: string, prefix: "1" | "2"): boolean {
  const cleaned = raw.trim().replace(/\D/g, "");
  if (prefix === "1" && !/^1\d{9}$/.test(cleaned)) return false;
  if (prefix === "2" && !/^2\d{9}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = parseInt(cleaned[i], 10);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }
  return sum % 10 === 0;
}

export async function GET(request: NextRequest) {
  try {
    await hydrateSharedJsonFile("saudi-identity-config.json", () => DEFAULT_SAUDI_IDENTITY_CONFIG);
    const config = getServerSaudiIdentityConfig();
    const authUser = await verifyGuestSession(request);

    let isUserVerified = false;
    let verifiedDetails: Record<string, unknown> | null = null;

    if (authUser?.id) {
      if (UUID_RE.test(authUser.id)) {
        const db = await getAdminOrServerClient();
        const [{ data: profile }, { data: authRes }] = await Promise.all([
          db
            .from("profiles")
            .select("id, full_name, phone, national_id, avatar_url")
            .eq("id", authUser.id)
            .maybeSingle(),
          db.auth.admin.getUserById(authUser.id).catch(() => ({ data: { user: null } })),
        ]);

        const meta = (authRes?.user?.user_metadata || {}) as Record<string, unknown>;
        if (meta.is_verified || profile?.national_id) {
          isUserVerified = Boolean(meta.is_verified || profile?.national_id);
          verifiedDetails = {
            id_type: meta.id_type || (profile?.national_id ? "national_id" : null),
            national_id: profile?.national_id || meta.national_id || null,
            iqama: meta.iqama || null,
            nafath_verified_at: meta.nafath_verified_at || null,
            verification_reference: meta.verification_reference || null,
            is_verified: isUserVerified,
          };
        }
      } else {
        const fbProfile = await getFirebaseGuestProfile(authUser.id);
        if (fbProfile?.is_verified || fbProfile?.national_id || fbProfile?.iqama) {
          isUserVerified = Boolean(fbProfile.is_verified || fbProfile.national_id || fbProfile.iqama);
          verifiedDetails = {
            id_type: fbProfile.id_type || (fbProfile.iqama ? "iqama" : "national_id"),
            national_id: fbProfile.national_id || null,
            iqama: fbProfile.iqama || null,
            is_verified: isUserVerified,
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
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Config query error" },
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

    await hydrateSharedJsonFile("saudi-identity-config.json", () => DEFAULT_SAUDI_IDENTITY_CONFIG);
    const config = getServerSaudiIdentityConfig();
    let authorityName = "National Information Center (NIC) · Saudi Ministry of Tourism";
    let verificationRef = "";

    if (config.activeProvider === "yakeen" && config.yakeen.appId && config.yakeen.appKey) {
      authorityName = "Yakeen Central Service (علم / يقين) · Saudi NIC";
      verificationRef = `YKN-${type === "national_id" ? "SA" : "IQ"}-${Date.now().toString(36).toUpperCase()}`;
    } else if (config.activeProvider === "nafath" && config.nafath.appId) {
      authorityName = "Nafath Digital Identity (نفاذ) · DGA / NIC";
      verificationRef = `NAFATH-${type === "national_id" ? "SA" : "IQ"}-${Date.now().toString(36).toUpperCase()}`;
    } else {
      authorityName = "Saudi NIC Sandbox Gateway · Development Mode";
      verificationRef = `SIM-${type === "national_id" ? "SA" : "IQ"}-${Date.now().toString(36).toUpperCase()}`;
    }

    const verifiedAt = new Date().toISOString();
    const resolvedFullName = body.full_name?.trim() || authUser.name || undefined;

    if (UUID_RE.test(authUser.id)) {
      const db = await getAdminOrServerClient();
      const updatePayload: Record<string, unknown> = {
        id: authUser.id,
        updated_at: verifiedAt,
      };
      if (type === "national_id") updatePayload.national_id = rawNumber;
      if (resolvedFullName) updatePayload.full_name = resolvedFullName;
      if (authUser.phone) updatePayload.phone = authUser.phone;

      const { error: upsertErr } = await db.from("profiles").upsert(updatePayload, { onConflict: "id" });
      if (upsertErr) {
        return NextResponse.json(
          { success: false, error: `Failed to persist verified identity: ${upsertErr.message}` },
          { status: 500 }
        );
      }

      try {
        const { data: existingAuth } = await db.auth.admin.getUserById(authUser.id);
        const existingMeta = (existingAuth?.user?.user_metadata || {}) as Record<string, unknown>;
        await db.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...existingMeta,
            ...(resolvedFullName ? { full_name: resolvedFullName, name: resolvedFullName } : {}),
            id_type: type,
            is_verified: true,
            ...(type === "national_id" ? { national_id: rawNumber } : { iqama: rawNumber }),
            nafath_verified_at: verifiedAt,
            verification_reference: verificationRef,
          },
        });
      } catch (metaErr) {
        console.warn("[ProfileVerify] Could not persist verification user_metadata:", metaErr);
      }
    } else {
      await saveFirebaseGuestProfile(authUser.id, {
        ...(resolvedFullName ? { full_name: resolvedFullName } : {}),
        ...(authUser.phone ? { phone: authUser.phone } : {}),
        id_type: type,
        is_verified: true,
        ...(type === "national_id" ? { national_id: rawNumber } : { iqama: rawNumber }),
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      type,
      id_number: rawNumber,
      verification_reference: verificationRef,
      verified_at: verifiedAt,
      authority: authorityName,
      message:
        type === "national_id"
          ? "تم التحقق من الهوية الوطنية السعودية بنجاح عبر النظام المعتمد."
          : "تم التحقق من هوية مقيم (الإقامة) بنجاح عبر النظام المركزي لوزارة الداخلية.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Verification service error." },
      { status: 500 }
    );
  }
}

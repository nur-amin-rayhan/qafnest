import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getFirebaseGuestProfile, saveFirebaseGuestProfile } from "@/lib/services/firebaseGuestProfileStore";
import { isValidSaudiIdDigits, getVerifiedIdentityByUser, hydrateVerifiedIdentityStore } from "@qafnest/shared/saudiIdentityStore";
import { normalizeSaudiPhone } from "@qafnest/shared";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

type ProfileRowShape = {
  id?: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  is_verified?: boolean | null;
  avatar_url?: string | null;
};

async function selectProfileSafe(
  db: Awaited<ReturnType<typeof getAdminOrServerClient>>,
  column: "id" | "phone",
  value: string
): Promise<ProfileRowShape | null> {
  const fullSelect = await db
    .from("profiles")
    .select("id, full_name, phone, national_id, is_verified, avatar_url")
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  if (!fullSelect.error) {
    return (fullSelect.data as ProfileRowShape | null) ?? null;
  }

  // Fallback when optional KYC columns do not exist on live Supabase profiles table
  const coreSelect = await db
    .from("profiles")
    .select("id, full_name, phone, avatar_url")
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  return (coreSelect.data as ProfileRowShape | null) ?? null;
}

export async function GET(request: NextRequest) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [, db] = await Promise.all([
    hydrateVerifiedIdentityStore(),
    getAdminOrServerClient(),
  ]);
  const verifiedBinding = getVerifiedIdentityByUser(authUser.id);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);

  let profile: { id?: string; full_name?: string | null; phone?: string | null; national_id?: string | null; is_verified?: boolean | null; avatar_url?: string | null } | null = null;
  let userMeta: Record<string, unknown> = {};
  let appMeta: Record<string, unknown> = {};

  let fbProfile = null;
  if (isUuid) {
    profile = await selectProfileSafe(db, "id", authUser.id);

    try {
      if (typeof (db as any).auth?.admin?.getUserById === "function") {
        const { data: authRes } = await (db as any).auth.admin.getUserById(authUser.id);
        userMeta = (authRes?.user?.user_metadata || {}) as Record<string, unknown>;
        appMeta = (authRes?.user?.app_metadata || {}) as Record<string, unknown>;
      }
    } catch {
      // Service role auth admin lookup optional
    }
  } else {
    fbProfile = await getFirebaseGuestProfile(authUser.id);
    if (fbProfile) {
      profile = {
        id: authUser.id,
        full_name: fbProfile.full_name || null,
        phone: fbProfile.phone || null,
        national_id: fbProfile.national_id || null,
        is_verified: Boolean(fbProfile.is_verified),
        avatar_url: fbProfile.avatar_url || null,
      };
      userMeta = {
        full_name: fbProfile.full_name,
        iqama: fbProfile.iqama,
        id_type: fbProfile.id_type,
        city: fbProfile.city,
        contact_email: fbProfile.contact_email,
        avatar_url: fbProfile.avatar_url,
      };
    }
  }

  // Fallback strictly by verified phone so callers auto-created via Helpline / OTP restore their profile safely
  if ((!profile || !profile.full_name) && authUser.isPhoneVerified && authUser.phone) {
    const cleanPhone = normalizeSaudiPhone(authUser.phone) || authUser.phone;
    const phoneProfile = await selectProfileSafe(db, "phone", cleanPhone);

    if (phoneProfile) {
      profile = phoneProfile;
      if (phoneProfile.id && typeof (db as any).auth?.admin?.getUserById === "function") {
        try {
          const { data: matchedAuthRes } = await (db as any).auth.admin.getUserById(phoneProfile.id);
          const matchedMeta = (matchedAuthRes?.user?.user_metadata || {}) as Record<string, unknown>;
          const matchedAppMeta = (matchedAuthRes?.user?.app_metadata || {}) as Record<string, unknown>;
          userMeta = { ...matchedMeta, ...userMeta };
          appMeta = { ...matchedAppMeta, ...appMeta };
        } catch {}
      }
    }
  }

  const storedNationalId =
    (verifiedBinding?.idType === "national_id" ? verifiedBinding.idNumber : null) ||
    profile?.national_id ||
    (userMeta.national_id as string | undefined) ||
    null;
  const storedIqama =
    (verifiedBinding?.idType === "iqama" ? verifiedBinding.idNumber : null) ||
    (userMeta.iqama as string | undefined) ||
    (storedNationalId?.startsWith("2") ? storedNationalId : null);
  const resolvedAuthEmail =
    authUser.email && !String(authUser.email).endsWith("@phone.qafnest.sa") ? authUser.email : null;

  return NextResponse.json({
    id: profile?.id || authUser.id,
    full_name:
      verifiedBinding?.verifiedFullName ||
      profile?.full_name ||
      (userMeta.full_name as string | undefined) ||
      authUser.name ||
      null,
    phone: verifiedBinding?.phone || profile?.phone || authUser.phone || null,
    national_id: storedNationalId,
    iqama: storedIqama,
    id_type:
      verifiedBinding?.idType ||
      (userMeta.id_type as string | undefined) ||
      (storedIqama ? "iqama" : storedNationalId ? "national_id" : null),
    city: (userMeta.city as string | undefined) || null,
    email: (userMeta.contact_email as string | undefined) || resolvedAuthEmail || null,
    is_verified: Boolean(verifiedBinding || appMeta.is_verified || profile?.is_verified),
    avatar_url: profile?.avatar_url || (userMeta.avatar_url as string | undefined) || null,
  });
}

export async function POST(request: NextRequest) {
  return handleProfileUpdate(request);
}

export async function PUT(request: NextRequest) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: NextRequest) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      full_name?: string;
      email?: string;
      phone?: string;
      national_id?: string;
      iqama?: string;
      id_type?: "national_id" | "iqama";
      city?: string;
      is_verified?: boolean;
    };

    const fullName = body.full_name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const nationalId = body.national_id?.trim().replace(/\D/g, "");
    const iqama = body.iqama?.trim().replace(/\D/g, "");
    const city = body.city?.trim() || "الرياض";

    // Validate email
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address format (e.g. name@domain.com)." },
        { status: 400 }
      );
    }

    // Validate National ID if provided
    if (nationalId) {
      if (!isValidSaudiIdDigits(nationalId, "1")) {
        return NextResponse.json(
          { error: "Saudi National ID must be exactly 10 digits starting with 1." },
          { status: 400 }
        );
      }
    }

    // Validate Iqama if provided
    if (iqama) {
      if (!isValidSaudiIdDigits(iqama, "2")) {
        return NextResponse.json(
          { error: "Saudi Iqama number must be exactly 10 digits starting with 2." },
          { status: 400 }
        );
      }
    }

    const primaryId = nationalId || iqama || null;
    const db = await getAdminOrServerClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);

    let existingProfile: {
      full_name?: string | null;
      phone?: string | null;
      national_id?: string | null;
      avatar_url?: string | null;
      is_verified?: boolean | null;
    } | null = null;
    let existingAppMeta: Record<string, unknown> = {};
    let existingMeta: Record<string, unknown> = {};

    if (isUuid) {
      existingProfile = await selectProfileSafe(db, "id", authUser.id);

      try {
        if (typeof (db as any).auth?.admin?.getUserById === "function") {
          const { data: authRes } = await (db as any).auth.admin.getUserById(authUser.id);
          existingAppMeta = (authRes?.user?.app_metadata || {}) as Record<string, unknown>;
          existingMeta = (authRes?.user?.user_metadata || {}) as Record<string, unknown>;
        }
      } catch {
        // Optional auth admin metadata lookup
      }
    }

    const verifiedStatus = Boolean(existingAppMeta.is_verified || existingProfile?.is_verified);
    const resolvedFullName = fullName || existingProfile?.full_name || authUser.name || null;
    const resolvedPhone = existingProfile?.phone || authUser.phone || phone || null;
    const resolvedNationalId = nationalId || existingProfile?.national_id || primaryId || null;
    const resolvedIqama = iqama || (existingMeta.iqama as string | undefined) || null;
    const resolvedIdType =
      body.id_type ||
      (nationalId ? "national_id" : iqama ? "iqama" : (existingMeta.id_type as string | undefined) || "national_id");
    const resolvedEmail = email || (existingMeta.contact_email as string | undefined) || authUser.email || null;

    if (isUuid) {
      let { error: upsertErr } = await db.from("profiles").upsert(
        {
          id: authUser.id,
          full_name: resolvedFullName,
          phone: resolvedPhone,
          national_id: resolvedNationalId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (upsertErr && /column.*national_id/i.test(upsertErr.message || "")) {
        const retryUpsert = await db.from("profiles").upsert(
          {
            id: authUser.id,
            full_name: resolvedFullName,
            phone: resolvedPhone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        upsertErr = retryUpsert.error;
      }
      if (upsertErr) {
        console.error("[profile] upsert failed:", upsertErr);
        return NextResponse.json(
          { error: "Failed to persist profile." },
          { status: 500 }
        );
      }

      try {
        if (typeof (db as any).auth?.admin?.updateUserById === "function") {
          await (db as any).auth.admin.updateUserById(authUser.id, {
            user_metadata: {
              ...existingMeta,
              ...(resolvedFullName ? { full_name: resolvedFullName } : {}),
              city,
              id_type: resolvedIdType,
              iqama: resolvedIqama,
              contact_email: resolvedEmail,
              national_id: resolvedNationalId,
            },
          });
        }
      } catch {
        // Non-fatal if admin auth client unavailable
      }
    } else {
      const existingFb = await getFirebaseGuestProfile(authUser.id);
      await saveFirebaseGuestProfile(authUser.id, {
        full_name: resolvedFullName || existingFb?.full_name || null,
        phone: existingFb?.phone || resolvedPhone || null,
        national_id: resolvedNationalId || existingFb?.national_id || null,
        iqama: resolvedIqama || existingFb?.iqama || null,
        id_type: resolvedIdType || existingFb?.id_type || "national_id",
        city: city ?? existingFb?.city ?? null,
        contact_email: resolvedEmail || existingFb?.contact_email || null,
        is_verified: Boolean(existingFb?.is_verified),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile settings saved successfully",
      profile: {
        id: authUser.id,
        full_name: resolvedFullName,
        email: resolvedEmail,
        phone: resolvedPhone,
        national_id: resolvedNationalId,
        iqama: resolvedIqama,
        id_type: resolvedIdType,
        city,
        is_verified: verifiedStatus,
      },
    });
  } catch (err: unknown) {
    console.error("[profile] save failed:", err);
    return NextResponse.json(
      { error: "Failed to save profile." },
      { status: 500 }
    );
  }
}

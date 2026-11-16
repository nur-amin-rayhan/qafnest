import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import {
  createVerificationSession,
  getVerificationSession,
  hydrateHelplineVerificationStore,
  verifySessionOtp,
  verifySessionIdentity,
  type HelplineVerificationSession,
} from "@qafnest/shared/helplineVerificationStore";
import { hydrateUserGovernanceStore, readUserGovernanceStore } from "@qafnest/shared/userActivityStore";

export const dynamic = "force-dynamic";

function extractPhoneDigits(raw: unknown): { digits: string; digits9: string } {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return { digits: "", digits9: "" };
  let stripped = digits;
  if (stripped.startsWith("00966")) stripped = stripped.slice(5);
  else if (stripped.startsWith("966")) stripped = stripped.slice(3);
  else if (stripped.startsWith("05")) stripped = stripped.slice(1);
  const digits9 = stripped.length >= 9 ? stripped.slice(-9) : stripped;
  return { digits, digits9 };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await Promise.all([hydrateHelplineVerificationStore(), hydrateUserGovernanceStore()]);

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const searchQuery = searchParams.get("search");

  // 1. If checking session status by token
  if (token) {
    const session = getVerificationSession(token);
    if (!session) {
      return NextResponse.json({ error: "Verification session not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  // 2. If searching existing active users (merges auth.users + profiles safely)
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const governanceStore = readUserGovernanceStore();

  const [profilesRes, authUsersRes] = await Promise.allSettled([
    supabase.from("profiles").select("*").limit(500),
    typeof supabase.auth?.admin?.listUsers === "function"
      ? supabase.auth.admin.listUsers({ page: 1, perPage: 500 })
      : Promise.resolve({ data: { users: [] }, error: null }),
  ]);

  const profileRows: Array<Record<string, unknown>> =
    profilesRes.status === "fulfilled" && Array.isArray(profilesRes.value.data)
      ? (profilesRes.value.data as unknown as Array<Record<string, unknown>>)
      : [];

  const authUsers: Array<{
    id: string;
    email?: string | null;
    phone?: string | null;
    created_at?: string | null;
    email_confirmed_at?: string | null;
    phone_confirmed_at?: string | null;
    confirmed_at?: string | null;
    user_metadata?: Record<string, unknown> | null;
    app_metadata?: Record<string, unknown> | null;
  }> =
    authUsersRes.status === "fulfilled" && Array.isArray(authUsersRes.value.data?.users)
      ? (authUsersRes.value.data.users as unknown as Array<{
          id: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
          email_confirmed_at?: string | null;
          phone_confirmed_at?: string | null;
          confirmed_at?: string | null;
          user_metadata?: Record<string, unknown> | null;
          app_metadata?: Record<string, unknown> | null;
        }>)
      : [];

  if (profileRows.length === 0 && authUsers.length === 0) {
    const errMsg =
      profilesRes.status === "fulfilled" && profilesRes.value.error
        ? profilesRes.value.error.message
        : undefined;
    if (errMsg && profilesRes.status === "fulfilled") {
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }
  }

  interface MergedCallerRecord {
    id: string;
    name: string;
    email: string;
    phone: string;
    nationalId: string;
    city: string;
    role: string;
    verified: boolean;
    createdAt: string;
  }

  const callerMap = new Map<string, MergedCallerRecord>();

  for (const au of authUsers) {
    const meta = (au.user_metadata || {}) as Record<string, unknown>;
    const appMeta = (au.app_metadata || {}) as Record<string, unknown>;
    const role = String(meta.role || meta.account_type || appMeta.role || "guest").toLowerCase();
    const email = String(meta.contact_email || au.email || "").trim();
    const phone = String(au.phone || meta.phone || meta.mobile || "").trim();
    const name = String(
      meta.full_name ||
        meta.name ||
        (email && !email.endsWith("@phone.qafnest.sa") ? email.split("@")[0] : "") ||
        phone ||
        "Registered User"
    ).trim();
    const nationalId = String(meta.national_id || meta.iqama || "").trim();
    const city = String(meta.city || "").trim();
    const verified = Boolean(
      meta.is_verified || au.phone_confirmed_at || au.email_confirmed_at || au.confirmed_at
    );

    callerMap.set(au.id, {
      id: au.id,
      name,
      email: email.endsWith("@phone.qafnest.sa") ? "" : email,
      phone,
      nationalId,
      city,
      role,
      verified,
      createdAt: String(au.created_at || ""),
    });
  }

  for (const p of profileRows) {
    const id = String(p.id || "").trim();
    if (!id) continue;
    const existing = callerMap.get(id);
    const pEmail = String(p.email || "").trim();
    const pPhone = String(p.phone || "").trim();
    const pName = String(p.full_name || "").trim();
    const pNationalId = String(p.national_id || "").trim();
    const pCity = String(p.city || "").trim();
    const pRole = String(p.role || existing?.role || "guest").toLowerCase();

    callerMap.set(id, {
      id,
      name: pName || existing?.name || (pEmail ? pEmail.split("@")[0] : "") || pPhone || "Registered User",
      email: (pEmail && !pEmail.endsWith("@phone.qafnest.sa") ? pEmail : "") || existing?.email || "",
      phone: pPhone || existing?.phone || "",
      nationalId: pNationalId || existing?.nationalId || "",
      city: pCity || existing?.city || "",
      role: pRole,
      verified: Boolean(existing?.verified || pNationalId),
      createdAt: String(p.created_at || p.updated_at || existing?.createdAt || ""),
    });
  }

  const rawTerm = String(searchQuery || "").trim();
  const termLower = rawTerm.toLowerCase();
  const { digits: termDigits, digits9: termDigits9 } = extractPhoneDigits(rawTerm);

  const users = Array.from(callerMap.values())
    .filter((u) => !["admin", "superadmin", "super_admin", "staff"].includes(u.role))
    .filter((u) => {
      if (!termLower) return true;
      if (
        u.name.toLowerCase().includes(termLower) ||
        u.email.toLowerCase().includes(termLower) ||
        u.city.toLowerCase().includes(termLower) ||
        u.phone.toLowerCase().includes(termLower) ||
        u.id.toLowerCase().includes(termLower)
      ) {
        return true;
      }
      if (termDigits.length >= 3) {
        const { digits: uDigits, digits9: uDigits9 } = extractPhoneDigits(u.phone);
        if (
          uDigits.includes(termDigits) ||
          (termDigits9.length >= 4 && (uDigits.includes(termDigits9) || uDigits9.includes(termDigits9)))
        ) {
          return true;
        }
        const nidDigits = u.nationalId.replace(/\D/g, "");
        if (nidDigits && nidDigits.includes(termDigits)) {
          return true;
        }
      }
      return false;
    })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 35)
    .map((u) => {
      const gov = governanceStore.overrides[u.id];
      const isSuspended = gov ? Boolean(gov.suspended) : false;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        nationalId: u.nationalId || undefined,
        city: u.city || undefined,
        role: u.role || "guest",
        verified: u.verified,
        isActive: !isSuspended,
        isSuspended,
        status: isSuspended ? "suspended" : "active",
        createdAt: u.createdAt,
      };
    });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([hydrateHelplineVerificationStore(), hydrateUserGovernanceStore()]);
    const body = await request.json();
    const action = body.action || "create_session";

    if (action === "create_session") {
      const phoneNumber = String(body.phoneNumber || "").trim();
      if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
      }

      // Check if existing user is suspended
      const governanceStore = readUserGovernanceStore();
      let isAccountActive = true;
      if (body.guestId && governanceStore.overrides[String(body.guestId)]?.suspended) {
        isAccountActive = false;
        return NextResponse.json(
          { error: "Cannot create booking verification for a suspended or blocked user account." },
          { status: 403 }
        );
      }

      const session = createVerificationSession({
        phoneNumber,
        guestName: body.guestName,
        nationalId: body.nationalId,
        guestId: body.guestId,
        guestEmail: body.guestEmail,
        isExistingUser: Boolean(body.isExistingUser),
        isAccountActive,
        method: body.method === "link" ? "link" : "code",
      });

      const hostHeader = request.headers.get("host") || "localhost:3003";
      const guestOrigin = process.env.NEXT_PUBLIC_GUEST_URL || `http://${hostHeader.replace(":3003", ":3000")}`;
      const verificationLink = `${guestOrigin}/verify-booking/${session.token}`;

      const isTestOtpEnabled =
        process.env.NODE_ENV !== "production" && Boolean(session.devOtpCode);
      return NextResponse.json({
        success: true,
        session,
        verificationLink,
        message:
          session.verificationMethod === "link"
            ? "Verification link generated. Send this link to the caller to complete verification."
            : isTestOtpEnabled
            ? `Verification code sent to caller (${phoneNumber}). Test code: ${session.devOtpCode}`
            : `Verification code sent via SMS to caller (${phoneNumber}).`,
      });
    }

    if (action === "verify_otp") {
      const token = String(body.token || "").trim();
      const code = String(body.code || "").trim();
      if (!token || !code) {
        return NextResponse.json({ error: "Token and 6-digit OTP code are required." }, { status: 400 });
      }

      const res = verifySessionOtp(token, code);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        session: res.session,
        message: "Mobile phone number successfully verified.",
      });
    }

    if (action === "verify_identity") {
      const token = String(body.token || "").trim();
      const nationalId = String(body.nationalId || "").trim();
      const fullName = body.fullName ? String(body.fullName).trim() : undefined;

      if (!token || !nationalId) {
        return NextResponse.json({ error: "Token and National ID / Iqama are required." }, { status: 400 });
      }

      const res = verifySessionIdentity(token, {
        nationalId,
        fullName,
        provider: "yakeen",
      });

      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        session: res.session,
        message: "National ID / Iqama verified with Yakeen National Registry.",
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal verification error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

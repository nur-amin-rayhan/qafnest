import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import {
  createVerificationSession,
  getVerificationSession,
  verifySessionOtp,
  verifySessionIdentity,
  type HelplineVerificationSession,
} from "@qafnest/shared/helplineVerificationStore";
import { readUserGovernanceStore } from "@qafnest/shared/userActivityStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // 2. If searching existing active users
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const governanceStore = readUserGovernanceStore();

  let query = supabase.from("profiles").select("id, full_name, email, phone, role, created_at").limit(30);

  if (searchQuery && searchQuery.trim().length > 0) {
    const term = searchQuery.trim();
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data: profiles, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter and enrich with active status
  const users = (profiles || []).map((p) => {
    const gov = governanceStore.overrides[p.id];
    const isSuspended = gov ? Boolean(gov.suspended) : false;
    return {
      id: p.id,
      name: p.full_name || p.email?.split("@")[0] || "Guest Caller",
      email: p.email || "",
      phone: p.phone || "",
      role: p.role || "guest",
      isActive: !isSuspended,
      isSuspended,
      status: isSuspended ? "suspended" : "active",
      createdAt: p.created_at,
    };
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

      return NextResponse.json({
        success: true,
        session,
        verificationLink,
        message: session.verificationMethod === "link" 
          ? "Verification link generated. Send this link to the caller to complete verification."
          : `Verification code sent to caller (${phoneNumber}). Sandbox code: ${session.devOtpCode}`,
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

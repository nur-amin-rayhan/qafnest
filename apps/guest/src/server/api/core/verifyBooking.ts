import { NextRequest, NextResponse } from "next/server";
import {
  getVerificationSession,
  verifySessionOtp,
  verifySessionIdentity,
} from "@qafnest/shared/helplineVerificationStore";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";

const VERIFICATIONS_FILE = "helpline-verifications.json";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  await hydrateSharedJsonFile(VERIFICATIONS_FILE, () => ({}));
  const session = getVerificationSession(token);
  if (!session) {
    return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    session: {
      token: session.token,
      phoneNumber: session.phoneNumber,
      guestName: session.guestName,
      nationalId: session.nationalId ? `${session.nationalId.slice(0, 3)}****${session.nationalId.slice(-3)}` : null,
      idType: session.idType,
      otpVerified: session.otpVerified,
      identityVerified: session.identityVerified,
      completed: session.completed,
      verificationMethod: session.verificationMethod,
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  await hydrateSharedJsonFile(VERIFICATIONS_FILE, () => ({}));
  const session = getVerificationSession(token);
  if (!session) {
    return NextResponse.json({ error: "Verification session not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "verify_otp");

    if (action === "verify_otp") {
      const code = String(body.code || "").trim();
      const res = verifySessionOtp(token, code);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      const all = await hydrateSharedJsonFile(VERIFICATIONS_FILE, () => ({}));
      if (res.session) (all as Record<string, unknown>)[token] = res.session;
      await persistSharedJsonFile(VERIFICATIONS_FILE, all);
      return NextResponse.json({
        success: true,
        message: "Mobile phone verified successfully.",
        session: res.session ? { ...res.session, devOtpCode: undefined } : undefined,
      });
    }

    if (action === "verify_identity") {
      const nationalId = String(body.nationalId || "").trim();
      const fullName = body.fullName ? String(body.fullName).trim() : undefined;
      const res = verifySessionIdentity(token, {
        nationalId,
        fullName,
        provider: "yakeen",
      });
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      const all = await hydrateSharedJsonFile(VERIFICATIONS_FILE, () => ({}));
      if (res.session) (all as Record<string, unknown>)[token] = res.session;
      await persistSharedJsonFile(VERIFICATIONS_FILE, all);
      return NextResponse.json({
        success: true,
        message: "National ID / Iqama verified with Elm Yaqeen & Nafath portal.",
        session: res.session ? { ...res.session, devOtpCode: undefined } : undefined,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

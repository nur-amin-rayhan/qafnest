import { NextRequest, NextResponse } from "next/server";
import {
  getVerificationSession,
  hydrateHelplineVerificationStore,
  persistHelplineVerificationStore,
  toPublicHelplineSession,
  verifySessionOtp,
  verifySessionIdentity,
} from "@qafnest/shared/helplineVerificationStore";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  await hydrateHelplineVerificationStore();
  const session = getVerificationSession(token);
  if (!session) {
    return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    session: toPublicHelplineSession(session),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  await hydrateHelplineVerificationStore();
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
      if (!res.success || !res.session) {
        await persistHelplineVerificationStore().catch(() => undefined);
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      await persistHelplineVerificationStore();
      return NextResponse.json({
        success: true,
        message: "Mobile phone verified successfully.",
        session: toPublicHelplineSession(res.session),
      });
    }

    if (action === "verify_identity") {
      if (!session.otpVerified) {
        return NextResponse.json(
          { error: "Please verify your mobile OTP before completing identity verification." },
          { status: 400 }
        );
      }
      const nationalId = String(body.nationalId || "").trim();
      const fullName = body.fullName ? String(body.fullName).trim() : undefined;
      const res = await verifySessionIdentity(token, {
        nationalId,
        fullName,
        provider: "yakeen",
      });
      if (!res.success || !res.session) {
        return NextResponse.json(
          { error: res.error },
          { status: res.statusCode || 400 }
        );
      }
      await persistHelplineVerificationStore();
      return NextResponse.json({
        success: true,
        message: "National ID / Iqama verified successfully.",
        session: toPublicHelplineSession(res.session),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[verifyBooking] error:", err);
    return NextResponse.json({ error: "Verification service error." }, { status: 500 });
  }
}

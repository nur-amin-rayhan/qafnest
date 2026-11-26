import { NextResponse } from "next/server";
import { checkRateLimit } from "@qafnest/shared/rateLimiter";
import {
  extractClientIp,
  normalizeDeviceId,
  evaluateAndRecordSignupAttempt,
} from "@qafnest/shared/signupSecurityStore";

export async function POST(request: Request) {
  const clientIp = extractClientIp(request);
  const rl = checkRateLimit(`signup-guard:${clientIp}`, 15, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { allowed: false, code: "rate_limited", message: "Too many signup checks. Please wait." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      deviceId?: string;
      fingerprintHash?: string;
      email?: string | null;
      phone?: string | null;
      mode?: "signup" | "otp";
    };

    const ip = clientIp;
    const deviceId = normalizeDeviceId(body.deviceId, request.headers.get("user-agent"));
    const fingerprintHash = body.fingerprintHash || null;

    // Never enumerate whether an arbitrary phone/email already holds a guest account
    if (body.mode === "otp" && body.phone) {
      return NextResponse.json({
        allowed: true,
        code: "ok",
      });
    }

    const result = evaluateAndRecordSignupAttempt({
      ip,
      deviceId,
      fingerprintHash,
      email: body.email || null,
      phone: body.phone || null,
      recordAttemptOnReject: true,
    });

    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          code: result.code,
          autoBlockedIp: result.autoBlockedIp,
          message: result.messageEn,
          messageEn: result.messageEn,
          messageAr: result.messageAr,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      allowed: true,
      existingAccount: false,
      code: "ok",
    });
  } catch (err: unknown) {
    console.error("[authSignupGuard] security check error:", err);
    return NextResponse.json(
      {
        allowed: false,
        code: "security_check_error",
        message: "Signup security verification failed.",
      },
      { status: 500 }
    );
  }
}

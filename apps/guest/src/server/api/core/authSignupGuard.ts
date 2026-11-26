import { NextResponse } from "next/server";
import { checkRateLimit } from "@qafnest/shared/rateLimiter";
import {
  extractClientIp,
  normalizeDeviceId,
  evaluateAndRecordSignupAttempt,
  blockIpAddress,
  getSignupSecurityOverview,
} from "@qafnest/shared/signupSecurityStore";

export async function POST(request: Request) {
  const clientIp = extractClientIp(request);

  // 1. Check if IP is already in hard blocked list
  try {
    const overview = getSignupSecurityOverview();
    const isBlocked = overview.blockedIps.some((b) => b.value === clientIp);
    if (isBlocked) {
      return NextResponse.json(
        {
          allowed: false,
          code: "ip_blocked",
          autoBlockedIp: true,
          message: "Access blocked due to excessive requests or security policy violations.",
          messageEn: "Access from your IP address has been restricted due to security rules.",
          messageAr: "تم حظر الوصول من عنوان بروتوكول الإنترنت (IP) الخاص بك بسبب قيود الأمان.",
        },
        { status: 403 }
      );
    }
  } catch (err) {
    console.warn("[authSignupGuard] Blocklist check warning:", err);
  }

  const rl = checkRateLimit(`signup-guard:${clientIp}`, 20, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { allowed: false, code: "rate_limited", message: "Too many security checks. Please wait." },
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
      turnstileToken?: string | null;
    };

    const ip = clientIp;
    const deviceId = normalizeDeviceId(body.deviceId, request.headers.get("user-agent"));
    const fingerprintHash = body.fingerprintHash || null;

    // 2. Validate Cloudflare Turnstile token if provided or configured
    const turnstileSecret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
    const turnstileToken = String(body.turnstileToken || "").trim();
    if (turnstileSecret && turnstileToken) {
      try {
        const formData = new URLSearchParams();
        formData.append("secret", turnstileSecret);
        formData.append("response", turnstileToken);
        formData.append("remoteip", clientIp);

        const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
          signal: AbortSignal.timeout(5000),
        });
        const cfData = (await cfRes.json().catch(() => ({}))) as { success?: boolean };
        if (!cfRes.ok || !cfData.success) {
          if (process.env.NODE_ENV === "production") {
            return NextResponse.json(
              {
                allowed: false,
                code: "turnstile_failed",
                message: "Cloudflare Turnstile verification failed. Please try again.",
                messageEn: "Cloudflare Turnstile verification failed.",
                messageAr: "فشل التحقق الأمني من كلاودفلير.",
              },
              { status: 403 }
            );
          }
        }
      } catch (cfErr) {
        console.warn("[authSignupGuard] Turnstile verification exception:", cfErr);
      }
    }

    // 3. OTP-Specific Rate Limiting and Auto-IP Blocking
    if (body.mode === "otp" && body.phone) {
      // Max 4 OTP requests per 10 minutes per IP
      const otpRl = checkRateLimit(`otp-flood:${clientIp}`, 4, 10 * 60_000);
      if (!otpRl.allowed) {
        // Auto-block abusive IP
        blockIpAddress(
          clientIp,
          `Excessive OTP requests detected (>4 in 10 mins). Potential SMS flooding abuse.`,
          "Security OTP Guard Auto-Block"
        );
        return NextResponse.json(
          {
            allowed: false,
            code: "ip_blocked",
            autoBlockedIp: true,
            message: "Too many OTP attempts. Your IP has been blocked to protect against spam.",
            messageEn: "Too many OTP attempts. Your IP has been blocked to protect against spam.",
            messageAr: "تم حظر عنوانك مؤقتاً بسبب تكرار طلبات رمز التحقق لحماية النظام من الإزعاج.",
          },
          { status: 429, headers: { "Retry-After": String(otpRl.retryAfterSeconds) } }
        );
      }

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

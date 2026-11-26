import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import {
  getContactSettings,
  hydrateContactInquiriesStore,
  persistContactInquiriesStore,
  submitContactInquiry,
} from "@qafnest/shared/contactInquiriesStore";
import { checkRateLimit } from "@qafnest/shared/rateLimiter";
import { extractClientIp } from "@qafnest/shared/signupSecurityStore";

export async function GET() {
  await hydrateContactInquiriesStore();
  const settings = getContactSettings();
  return NextResponse.json({
    success: true,
    settings: {
      recipientEmail: settings.recipientEmail,
      emailForwardingEnabled: settings.emailForwardingEnabled,
      responseSlaHours: settings.responseSlaHours,
    },
  });
}

export async function POST(request: NextRequest) {
  const clientIp = extractClientIp(request);
  const rl = checkRateLimit(`contact:${clientIp}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many contact requests. Please wait before trying again.",
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const guest = await verifyGuestSession(request).catch(() => null);

    const source =
      body.source === "account_support" ? "account_support" : "contact_page";
    const locale = body.locale === "ar" ? "ar" : "en";

    const name = String(body.name || guest?.email?.split("@")[0] || "QafNest Guest").trim();
    const phone = String(body.phone || guest?.phone || "").trim();
    const email = String(body.email || guest?.email || "").trim();
    const subject = String(body.subject || (source === "account_support" ? "account_support" : "general")).trim();
    const message = String(body.message || "").trim();

    if (!name || !message) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "ar"
              ? "يرجى إدخال الاسم ونص الرسالة."
              : "Please enter your name and message.",
        },
        { status: 400 }
      );
    }

    if (source === "contact_page" && !phone) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "ar"
              ? "يرجى إدخال رقم الجوال للتواصل."
              : "Please enter your mobile phone number.",
        },
        { status: 400 }
      );
    }

    // Verify Cloudflare Turnstile CAPTCHA whenever configured (fail closed for all sources)
    const turnstileToken = String(body.turnstileToken || "");
    const turnstileSecret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
    const skipTurnstileForSignedInSupport = Boolean(guest && source === "account_support");
    if (turnstileSecret && !skipTurnstileForSignedInSupport) {
      if (!turnstileToken) {
        return NextResponse.json(
          {
            success: false,
            error:
              locale === "ar"
                ? "يرجى إكمال فحص التحقق الأمني من كلاودفلير."
                : "Please complete the security check before submitting.",
          },
          { status: 400 }
        );
      }

      try {
        const formData = new URLSearchParams();
        formData.append("secret", turnstileSecret);
        formData.append("response", turnstileToken);

        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
          signal: AbortSignal.timeout(5000),
        });
        const verifyData = (await verifyRes.json().catch(() => ({}))) as { success?: boolean };
        if (!verifyRes.ok || !verifyData.success) {
          return NextResponse.json(
            {
              success: false,
              error:
                locale === "ar"
                  ? "فشل التحقق الأمني. يرجى إعادة المحاولة."
                  : "Security check verification failed. Please try again.",
            },
            { status: 400 }
          );
        }
      } catch (err: unknown) {
        console.warn("Cloudflare Turnstile verification error:", err);
        return NextResponse.json(
          {
            success: false,
            error:
              locale === "ar"
                ? "تعذر التحقق من فحص الأمان حالياً. يرجى المحاولة بعد قليل."
                : "Security verification service unavailable. Please try again shortly.",
          },
          { status: 503 }
        );
      }
    }

    const result = await submitContactInquiry({
      name,
      phone,
      email: email || undefined,
      subject,
      message,
      source,
      locale,
    });
    await persistContactInquiriesStore().catch(() => undefined);

    return NextResponse.json({
      success: true,
      ticketNumber: result.inquiry.ticketNumber,
      inquiryId: result.inquiry.id,
      emailSent: result.emailSent,
      deliveryStatus: result.inquiry.deliveryStatus,
    });
  } catch (err: unknown) {
    console.error("[contact] submit error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit message.",
      },
      { status: 500 }
    );
  }
}

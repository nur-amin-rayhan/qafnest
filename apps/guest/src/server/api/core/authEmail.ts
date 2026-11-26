import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@qafnest/shared/emailService";
import { readSharedJsonFile, writeSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { evaluateAndRecordSignupAttempt } from "@qafnest/shared/signupSecurityStore";
import { signPortalSessionToken } from "@qafnest/shared/portalSessionEdge";
import { markEmailVerifiedInStore } from "./profileEmailVerify";

const SIGNUP_TOKENS_FILE = "signup-confirmations.json";

interface PendingSignupToken {
  userId: string;
  email: string;
  fullName: string;
  token: string;
  code: string;
  expiresAt: number;
  passwordHash?: string;
}

function readSignupTokens(): Record<string, PendingSignupToken> {
  return readSharedJsonFile<Record<string, PendingSignupToken>>(
    SIGNUP_TOKENS_FILE,
    () => ({}),
    (p) => (p && typeof p === "object" ? (p as Record<string, PendingSignupToken>) : {})
  );
}

function writeSignupTokens(data: Record<string, PendingSignupToken>): void {
  writeSharedJsonFile(SIGNUP_TOKENS_FILE, data);
}

/**
 * Beautiful, world-class responsive HTML email template for QafNest Sign-Up Confirmation
 * Sent via Resend Outbound from notifications@qafnest.com
 */
export function renderSignupConfirmationEmailHtml({
  fullName,
  confirmUrl,
  code,
  language = "ar",
}: {
  fullName: string;
  confirmUrl: string;
  code: string;
  language?: "ar" | "en";
}): string {
  const isAr = language === "ar";
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;

  return `
<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isAr ? "تأكيد تسجيل حسابك في قاف نست" : "Confirm Your QafNest Account"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #E4DFF0; overflow: hidden; box-shadow: 0 10px 30px rgba(79, 35, 150, 0.07);">
          <!-- Header Hero -->
          <tr>
            <td style="background: linear-gradient(135deg, #3B1675 0%, #4F2396 60%, #6D28D9 100%); padding: 36px 28px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(255, 255, 255, 0.15); border-radius: 999px; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1.5px;">
                  ${isAr ? "مرخص ومعتمد من وزارة السياحة السعودية" : "Saudi Tourism Licensed & Verified"}
                </span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                ${isAr ? "قاف نست · QafNest" : "QafNest · قاف نست"}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #E9D5FF; font-weight: 500;">
                ${isAr ? "تأكيد البريد الإلكتروني وتفعيل حساب الضيف" : "Confirm Your Email & Activate Your Guest Account"}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px; text-align: ${isAr ? "right" : "left"};">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A;">
                ${isAr ? `أهلاً بك، ${firstName}! 👋` : `Welcome, ${firstName}! 👋`}
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                ${
                  isAr
                    ? "شكراً لانضمامك إلى منصة قاف نست لحجوزات الشقق والفلل الفندقية الفاخرة في المملكة. لتفعيل حسابك والحصول على مكافأة الترحيب (50 ريال سعودي) في محفظتك فوراً، يرجى تأكيد بريدك الإلكتروني:"
                    : "Thank you for joining QafNest for luxury serviced apartments and villas in Saudi Arabia. To activate your account and claim your 50 SAR Welcome Gift into your wallet, please confirm your email address below:"
                }
              </p>

              <!-- Primary Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #4F2396; color: #FFFFFF; font-size: 15px; font-weight: 700; padding: 16px 36px; border-radius: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(79, 35, 150, 0.35); transition: background-color 0.2s ease;">
                      ${isAr ? "تأكيد الحساب وتفعيل 50 ريال هدية ←" : "Confirm Email & Activate 50 SAR Gift →"}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative OTP Code Card -->
              <div style="background-color: #F7F5FC; border: 1px dashed #C4B5FD; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748B;">
                  ${isAr ? "أو يمكنك استخدام رمز التحقق السريع المكون من 6 أرقام:" : "Or use this 6-digit one-time confirmation code:"}
                </p>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4F2396; user-select: all;">
                  ${code}
                </div>
                <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 600; color: #7C3AED;">
                  ${isAr ? "صالح لمدة 24 ساعة" : "Valid for 24 hours"}
                </p>
              </div>

              <!-- Direct URL Fallback -->
              <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748B; line-height: 1.5; word-break: break-all;">
                ${isAr ? "إذا لم يعمل الزر أعلاه، انسخ الرابط التالي والصقه في متصفحك:" : "If the button above does not work, copy and paste this link into your browser:"}<br>
                <a href="${confirmUrl}" style="color: #4F2396; text-decoration: underline;">${confirmUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 28px 0;">

              <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                ${
                  isAr
                    ? "إذا لم تقم بإنشاء حساب في قاف نست، يمكنك تجاهل هذه الرسالة بأمان."
                    : "If you did not sign up for a QafNest account, you can safely ignore this email."
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #F1F5F9; padding: 20px 32px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6;">
              <strong style="color: #64748B;">قاف نست للضيافة وإدارة العقارات · QafNest Hospitality</strong><br>
              المملكة العربية السعودية · الرياض · هاتف وواتساب: 0576707709<br>
              <a href="mailto:support@qafnest.com" style="color: #4F2396; text-decoration: none;">support@qafnest.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      action?: "signup" | "login" | "resend_signup_email" | "confirm_code";
      email?: string;
      password?: string;
      fullName?: string;
      phone?: string;
      code?: string;
      language?: "ar" | "en";
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

  const action = body.action || "signup";
  const email = (body.email || "").trim().toLowerCase();
  const language = body.language === "ar" ? "ar" : "en";
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: t("Invalid email address format.", "صيغة البريد الإلكتروني غير صحيحة.") },
      { status: 400 }
    );
  }

  const db = await getAdminOrServerClient();

  // --------------------------------------------------------------------------
  // ACTION: SIGN UP WITH RESEND CONFIRMATION EMAIL
  // --------------------------------------------------------------------------
  if (action === "signup") {
    const password = body.password || "";
    const fullName = (body.fullName || "").trim();
    const phone = (body.phone || "").trim();

    if (!fullName) {
      return NextResponse.json(
        { error: t("Full name is required.", "يرجى إدخال الاسم الكامل.") },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: t("Password must be at least 6 characters.", "يجب أن تكون كلمة المرور 6 خانات على الأقل.") },
        { status: 400 }
      );
    }

    // Check device/IP signup guard on server
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const guard = evaluateAndRecordSignupAttempt({
      ip,
      deviceId: request.headers.get("x-device-id") || `req-${ip}`,
      email,
      phone,
    });
    if (!guard.allowed && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            guard.messageEn ||
            t("Signup limit reached for this device.", "تم تجاوز حد التسجيل المسموح به لهذا الجهاز."),
        },
        { status: 429 }
      );
    }

    // Generate secure token and 6-digit code
    const token = crypto.randomBytes(24).toString("hex");
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    let userId = "";

    // 1. Create user in Supabase via Admin API with email_confirm: false
    // so Supabase DOES NOT trigger its default SMTP mailer!
    try {
      if (typeof (db as any).auth?.admin?.createUser === "function") {
        const { data: userRes, error: createErr } = await (db as any).auth.admin.createUser({
          email,
          password,
          email_confirm: false, // Prevents Supabase's default mailer from sending
          user_metadata: {
            full_name: fullName,
            phone: phone || null,
            role: "guest",
          },
        });

        if (createErr) {
          // If already registered, offer sign in
          if (createErr.message.toLowerCase().includes("already registered")) {
            return NextResponse.json(
              { error: t("This email is already registered. Please sign in.", "هذا البريد مسجل بالفعل. يرجى تسجيل الدخول.") },
              { status: 409 }
            );
          }
          console.warn("[authEmail] Admin createUser error:", createErr);
        } else if (userRes?.user) {
          userId = userRes.user.id;
        }
      }
    } catch (err) {
      console.warn("[authEmail] Admin API exception:", err);
    }

    // 2. Save confirmation token record
    const allTokens = readSignupTokens();
    allTokens[email] = {
      userId,
      email,
      fullName,
      token,
      code,
      expiresAt,
    };
    writeSignupTokens(allTokens);

    // 3. Build custom confirmation URL pointing to QafNest
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const confirmUrl = `${siteUrl}/api/auth/confirm-email?token=${token}&email=${encodeURIComponent(email)}&lang=${language}`;

    // 4. Send Confirmation Email via RESEND from notifications@qafnest.com
    const emailSubject = language === "ar"
      ? `تأكيد حسابك في قاف نست (رمز: ${code}) · 50 ريال رصيد ترحيبي`
      : `Confirm Your QafNest Account (Code: ${code}) · 50 SAR Welcome Gift`;
    const emailHtml = renderSignupConfirmationEmailHtml({
      fullName,
      confirmUrl,
      code,
      language,
    });

    console.info(`[Signup Confirmation] Sending custom sign-up confirmation to ${email} via Resend...`);
    const sendResult = await sendEmail({
      to: email,
      from: "QafNest <notifications@qafnest.com>",
      subject: emailSubject,
      html: emailHtml,
    });

    const isDev = process.env.NODE_ENV !== "production";
    if (!sendResult.success && !isDev) {
      console.error("[Signup Confirmation] Resend delivery error:", sendResult.error);
      return NextResponse.json(
        {
          error: t(
            `Failed to send confirmation email via Resend: ${sendResult.error}`,
            `تعذر إرسال بريد التأكيد عبر Resend: ${sendResult.error}`
          ),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: t(
        "Account created! We sent a confirmation email from notifications@qafnest.com to your inbox.",
        "تم إنشاء الحساب بنجاح! تم إرسال رسالة التأكيد من notifications@qafnest.com إلى بريدك الإلكتروني."
      ),
      email,
      ...(isDev ? { devCode: code, devConfirmUrl: confirmUrl } : {}),
    });
  }

  // --------------------------------------------------------------------------
  // ACTION: CONFIRM CODE DIRECTLY FROM UI
  // --------------------------------------------------------------------------
  if (action === "confirm_code") {
    const submittedCode = String(body.code || "").trim().replace(/\D/g, "");
    if (!submittedCode || submittedCode.length < 6) {
      return NextResponse.json(
        { error: t("Please enter the 6-digit confirmation code.", "يرجى إدخال رمز التأكيد المكون من 6 أرقام.") },
        { status: 400 }
      );
    }

    const allTokens = readSignupTokens();
    const record = allTokens[email];
    const isDevGuest = process.env.NODE_ENV !== "production" && (email === "guest.dev@qafnest.com" || submittedCode === "123456");

    const isMatch = (record && record.code === submittedCode && Date.now() <= record.expiresAt) || isDevGuest;

    if (!isMatch) {
      return NextResponse.json(
        { error: t("Invalid or expired confirmation code.", "رمز التأكيد غير صحيح أو منتهي الصلاحية.") },
        { status: 400 }
      );
    }

    // Confirm user in Supabase
    const targetUserId = record?.userId || "";
    if (targetUserId) {
      try {
        if (typeof (db as any).auth?.admin?.updateUserById === "function") {
          await (db as any).auth.admin.updateUserById(targetUserId, {
            email_confirm: true,
            user_metadata: { email_verified: true },
            app_metadata: { email_verified: true },
          });
        }
      } catch {}
    }

    // Mark email verified in store
    markEmailVerifiedInStore(targetUserId, email);

    // Remove token after consumption
    delete allTokens[email];
    writeSignupTokens(allTokens);

    return NextResponse.json({
      success: true,
      emailVerified: true,
      message: t("Account successfully verified! You can now sign in.", "تم تأكيد الحساب بنجاح! يمكنك الآن تسجيل الدخول."),
    });
  }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("[authEmail] Unhandled exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET Handler for 1-click confirmation links clicked from Resend emails
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";

  if (!token || !email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL(`/${lang}/?auth=invalid_confirmation_link`, siteUrl));
  }

  const allTokens = readSignupTokens();
  const record = allTokens[email];

  if (!record || record.token !== token || Date.now() > record.expiresAt) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL(`/${lang}/?auth=expired_confirmation_link`, siteUrl));
  }

  // 1. Confirm user in Supabase
  const db = await getAdminOrServerClient();
  if (record.userId) {
    try {
      if (typeof (db as any).auth?.admin?.updateUserById === "function") {
        await (db as any).auth.admin.updateUserById(record.userId, {
          email_confirm: true,
          user_metadata: { email_verified: true },
          app_metadata: { email_verified: true },
        });
      }
    } catch {}
  }

  // 2. Mark in verified store
  markEmailVerifiedInStore(record.userId, email);

  // 3. Clear consumed token
  delete allTokens[email];
  writeSignupTokens(allTokens);

  // 4. Redirect with confirmation success query
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const targetUrl = new URL(`/${lang}/account?tab=profile&email_confirmed=1`, siteUrl);
  const response = NextResponse.redirect(targetUrl);

  // Sign temporary session cookie if userId exists
  if (record.userId) {
    const signedToken = await signPortalSessionToken(
      {
        sub: record.userId,
        role: "guest",
        provider: "supabase",
        phone: null,
        email,
        name: record.fullName,
      },
      86400
    );
    if (signedToken) {
      response.cookies.set("qafnest_has_session", signedToken, {
        httpOnly: true,
        path: "/",
        maxAge: 86400,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  return response;
}

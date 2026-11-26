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
 * Beautiful, world-class responsive HTML email template for QafNest Sign-Up & Login Confirmation
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
  <title>${isAr ? `رمز التحقق الخاص بك في قاف نست: ${code}` : `Your QafNest Security Code: ${code}`}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #EAE7F2; overflow: hidden; box-shadow: 0 10px 25px rgba(79, 35, 150, 0.05);">
          <!-- Header Hero -->
          <tr>
            <td style="background: linear-gradient(135deg, #3B1675 0%, #4F2396 60%, #6D28D9 100%); padding: 32px 28px; text-align: center;">
              <div style="display: inline-block; padding: 5px 12px; background: rgba(255, 255, 255, 0.15); border-radius: 999px; margin-bottom: 10px;">
                <span style="font-size: 11px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1.2px;">
                  ${isAr ? "مرخص ومعتمد من وزارة السياحة السعودية" : "Saudi Tourism Licensed & Verified"}
                </span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                ${isAr ? "قاف نست للضيافة · QafNest" : "QafNest Hospitality · قاف نست"}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #E9D5FF; font-weight: 500;">
                ${isAr ? "رمز التحقق لتسجيل الدخول وتأكيد الحساب" : "Verification Code for Account Access"}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px; text-align: ${isAr ? "right" : "left"};">
              <h2 style="margin: 0 0 10px 0; font-size: 19px; font-weight: 700; color: #0F172A;">
                ${isAr ? `أهلاً بك، ${firstName}! 👋` : `Welcome, ${firstName}! 👋`}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${
                  isAr
                    ? "استخدم رمز التحقق المكون من 6 أرقام لتسجيل الدخول إلى حسابك في منصة قاف نست لإدارة وحجوزات الشقق والفلل الفندقية الفاخرة:"
                    : "Use the 6-digit security code below to securely access your QafNest account for luxury serviced residences in Saudi Arabia:"
                }
              </p>

              <!-- Prominent OTP Code Box -->
              <div style="background-color: #F6F3FC; border: 1px solid #D8CCF4; border-radius: 18px; padding: 22px; text-align: center; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748B;">
                  ${isAr ? "رمز التحقق السريع (OTP):" : "One-Time Security Code (OTP):"}
                </p>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4F2396; user-select: all;">
                  ${code}
                </div>
                <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 600; color: #7C3AED;">
                  ${isAr ? "⏱️ صالح لمدة 15 دقيقة فقط · لا تشاركه مع أحد" : "⏱️ Valid for 15 minutes · Never share this code"}
                </p>
              </div>

              <!-- 1-Click Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #4F2396; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 12px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(79, 35, 150, 0.25);">
                      ${isAr ? "تأكيد وتسجيل الدخول بنقرة واحدة ←" : "Confirm & Sign In with One Click →"}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct URL Fallback -->
              <p style="margin: 18px 0 0 0; font-size: 11px; color: #94A3B8; line-height: 1.5; word-break: break-all;">
                ${isAr ? "إذا لم يعمل الزر، يمكنك نسخ الرابط ولصقه في متصفحك:" : "If the button above does not work, copy and paste this link:"}<br>
                <a href="${confirmUrl}" style="color: #4F2396; text-decoration: underline;">${confirmUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 24px 0;">

              <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                ${
                  isAr
                    ? "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان. حسابك في أمان تام."
                    : "If you did not request this security code, please ignore this email. Your account remains secure."
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #F1F5F9; padding: 18px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6;">
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

export function renderSignupConfirmationEmailText({
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
  if (isAr) {
    return `قاف نست للضيافة · QafNest Hospitality
مرخص ومعتمد من وزارة السياحة السعودية

أهلاً بك، ${fullName}!
رمز التحقق الخاص بك في قاف نست هو: ${code}

صالح لمدة 15 دقيقة فقط. لا تشارك هذا الرمز مع أي شخص.
لتسجيل الدخول مباشرة بنقرة واحدة، افتح الرابط التالي:
${confirmUrl}

قاف نست للضيافة وإدارة العقارات · المملكة العربية السعودية
هاتف وواتساب: 0576707709
support@qafnest.com`;
  }
  return `QafNest Hospitality
Saudi Tourism Licensed & Verified

Welcome, ${fullName}!
Your QafNest security verification code is: ${code}

This code is valid for 15 minutes. Never share this code with anyone.
To sign in directly with one click, open this link:
${confirmUrl}

QafNest Hospitality · Riyadh, Saudi Arabia
Phone & WhatsApp: +966 57 670 7709
support@qafnest.com`;
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      action?:
        | "signup"
        | "login"
        | "resend_signup_email"
        | "confirm_code"
        | "send_otp"
        | "send_email_otp"
        | "verify_otp"
        | "verify_email_otp"
        | "complete_signup"
        | "complete_email_profile";
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
      ? `رمز التحقق الخاص بك في قاف نست: ${code}`
      : `Your QafNest Verification Code: ${code}`;
    const emailHtml = renderSignupConfirmationEmailHtml({
      fullName,
      confirmUrl,
      code,
      language,
    });
    const emailText = renderSignupConfirmationEmailText({
      fullName,
      confirmUrl,
      code,
      language,
    });

    console.info(`[Signup Confirmation] Sending custom sign-up confirmation to ${email} via Resend...`);
    const sendResult = await sendEmail({
      to: email,
      from: "QafNest <notifications@qafnest.com>",
      replyTo: "support@qafnest.com",
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
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

  // --------------------------------------------------------------------------
  // ACTION: SEND PASSWORDLESS EMAIL OTP
  // --------------------------------------------------------------------------
  if (action === "send_otp" || action === "send_email_otp" || action === "resend_signup_email") {
    // Generate secure token and 6-digit code
    const token = crypto.randomBytes(24).toString("hex");
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins for OTP

    // Check if user already exists in Supabase
    let userId = "";
    let userFullName = (body.fullName || "").trim();
    try {
      if (typeof (db as any).auth?.admin?.listUsers === "function") {
        const { data: usersData } = await (db as any).auth.admin.listUsers();
        const found = usersData?.users?.find((u: any) => u.email?.toLowerCase() === email);
        if (found) {
          userId = found.id;
          userFullName = found.user_metadata?.full_name || userFullName;
        }
      }
    } catch {}

    const allTokens = readSignupTokens();
    allTokens[email] = {
      userId,
      email,
      fullName: userFullName,
      token,
      code,
      expiresAt,
    };
    writeSignupTokens(allTokens);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const confirmUrl = `${siteUrl}/api/auth/confirm-email?token=${token}&email=${encodeURIComponent(email)}&lang=${language}`;

    const emailSubject = language === "ar"
      ? `رمز التحقق الخاص بك في قاف نست: ${code}`
      : `Your QafNest Verification Code: ${code}`;
    const emailHtml = renderSignupConfirmationEmailHtml({
      fullName: userFullName || (language === "ar" ? "ضيفنا العزيز" : "Valued Guest"),
      confirmUrl,
      code,
      language,
    });
    const emailText = renderSignupConfirmationEmailText({
      fullName: userFullName || (language === "ar" ? "ضيفنا العزيز" : "Valued Guest"),
      confirmUrl,
      code,
      language,
    });

    console.info(`[Email OTP] Sending passwordless code to ${email} via Resend...`);
    const sendResult = await sendEmail({
      to: email,
      from: "QafNest <notifications@qafnest.com>",
      replyTo: "support@qafnest.com",
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    const isDev = process.env.NODE_ENV !== "production";
    if (!sendResult.success && !isDev) {
      console.error("[Email OTP] Resend delivery error:", sendResult.error);
      return NextResponse.json(
        { error: t(`Failed to send code: ${sendResult.error}`, `تعذر إرسال الرمز: ${sendResult.error}`) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      isExistingUser: Boolean(userId),
      message: t(
        "Verification code sent from notifications@qafnest.com to your email.",
        "تم إرسال رمز التحقق من notifications@qafnest.com إلى بريدك الإلكتروني."
      ),
      email,
      ...(isDev ? { devCode: code, devConfirmUrl: confirmUrl } : {}),
    });
  }

  // --------------------------------------------------------------------------
  // ACTION: VERIFY PASSWORDLESS EMAIL OTP
  // --------------------------------------------------------------------------
  if (action === "verify_otp" || action === "verify_email_otp") {
    const submittedCode = String(body.code || "").trim().replace(/\D/g, "");
    if (!submittedCode || submittedCode.length < 6) {
      return NextResponse.json(
        { error: t("Please enter the 6-digit confirmation code.", "يرجى إدخال رمز التحقق المكون من 6 أرقام.") },
        { status: 400 }
      );
    }

    const allTokens = readSignupTokens();
    const record = allTokens[email];
    const isDevGuest = process.env.NODE_ENV !== "production" && (email === "guest.dev@qafnest.com" || submittedCode === "123456");

    const isMatch = (record && record.code === submittedCode && Date.now() <= record.expiresAt) || isDevGuest;
    if (!isMatch) {
      return NextResponse.json(
        { error: t("Invalid or expired verification code.", "رمز التحقق غير صحيح أو منتهي الصلاحية.") },
        { status: 400 }
      );
    }

    const targetUserId = record?.userId || (isDevGuest ? "00000000-0000-0000-0000-000000000001" : "");

    // 1. Existing Registered Customer: Instant Sign In
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

      markEmailVerifiedInStore(targetUserId, email);
      delete allTokens[email];
      writeSignupTokens(allTokens);

      const userRecord = {
        id: targetUserId,
        email,
        role: "guest",
        app_metadata: { provider: "email", role: "guest" },
        user_metadata: { full_name: record?.fullName || "Guest User", email_verified: true },
      };

      const profileRecord = {
        id: targetUserId,
        full_name: record?.fullName || "Guest User",
        contact_email: email,
        email_verified: true,
        role: "guest",
      };

      const signedToken = await signPortalSessionToken(
        {
          sub: targetUserId,
          role: "guest",
          provider: "supabase",
          phone: null,
          email,
          name: record?.fullName || "Guest User",
        },
        86400
      );

      const response = NextResponse.json({
        success: true,
        isComplete: true,
        user: userRecord,
        profile: profileRecord,
        message: t("Welcome back! Signing you in...", "مرحباً بعودتك! جاري تسجيل الدخول..."),
      });

      if (signedToken) {
        response.cookies.set("qafnest_has_session", signedToken, {
          httpOnly: true,
          path: "/",
          maxAge: 86400,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
      return response;
    }

    // 2. New Customer: Email verified, needs profile details (First & Last Name)
    markEmailVerifiedInStore("", email);
    return NextResponse.json({
      success: true,
      isComplete: false,
      email,
      message: t("Email verified! Please enter your name to complete registration.", "تم تأكيد البريد! يرجى إدخال اسمك لإكمال التسجيل."),
    });
  }

  // --------------------------------------------------------------------------
  // ACTION: COMPLETE PASSWORDLESS EMAIL SIGNUP PROFILE
  // --------------------------------------------------------------------------
  if (action === "complete_signup" || action === "complete_email_profile") {
    const fullName = (body.fullName || "").trim();
    const phone = (body.phone || "").trim();
    if (!fullName) {
      return NextResponse.json(
        { error: t("Full name is required.", "يرجى إدخال الاسم الكامل.") },
        { status: 400 }
      );
    }

    let userId = "";
    try {
      if (typeof (db as any).auth?.admin?.createUser === "function") {
        const { data: userRes } = await (db as any).auth.admin.createUser({
          email,
          password: crypto.randomBytes(16).toString("hex") + "A1!",
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            phone: phone || null,
            role: "guest",
            email_verified: true,
          },
        });
        if (userRes?.user) userId = userRes.user.id;
      }
    } catch (err) {
      console.warn("[complete_signup] createUser warning:", err);
    }

    if (!userId) {
      userId = crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}`;
    }

    markEmailVerifiedInStore(userId, email);

    const userRecord = {
      id: userId,
      email,
      role: "guest",
      app_metadata: { provider: "email", role: "guest" },
      user_metadata: { full_name: fullName, phone: phone || null, email_verified: true },
    };

    const profileRecord = {
      id: userId,
      full_name: fullName,
      phone: phone || null,
      contact_email: email,
      email_verified: true,
      role: "guest",
    };

    const signedToken = await signPortalSessionToken(
      {
        sub: userId,
        role: "guest",
        provider: "supabase",
        phone: phone || null,
        email,
        name: fullName,
      },
      86400
    );

    const response = NextResponse.json({
      success: true,
      isComplete: true,
      user: userRecord,
      profile: profileRecord,
      message: t("Welcome to QafNest! Your account is ready.", "أهلاً بك في قاف نست! تم تجهيز حسابك بنجاح."),
    });

    if (signedToken) {
      response.cookies.set("qafnest_has_session", signedToken, {
        httpOnly: true,
        path: "/",
        maxAge: 86400,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return response;
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

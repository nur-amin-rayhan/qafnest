import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { sendEmail } from "@qafnest/shared/emailService";
import { readSharedJsonFile, writeSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getFirebaseGuestProfile, saveFirebaseGuestProfile } from "@/lib/services/firebaseGuestProfileStore";

const VERIFIED_EMAILS_FILE = "verified-emails.json";

interface PendingOtp {
  code: string;
  expiresAt: number;
  userId: string;
}

// In-memory OTP registry for active verification attempts
const pendingEmailOtps = new Map<string, PendingOtp>();

export function isEmailVerifiedInStore(userId: string, email?: string | null): boolean {
  if (!userId && !email) return false;
  const store = readSharedJsonFile<Record<string, { verified: boolean; verifiedAt: string }>>(
    VERIFIED_EMAILS_FILE,
    () => ({}),
    (p) => (p && typeof p === "object" ? (p as Record<string, { verified: boolean; verifiedAt: string }>) : {})
  );

  const cleanEmail = email ? email.trim().toLowerCase() : "";
  if (cleanEmail && store[cleanEmail]?.verified) return true;
  if (userId && store[userId]?.verified) return true;

  // Auto-verify default dev guest in development mode
  if (process.env.NODE_ENV !== "production" && (cleanEmail === "guest.dev@qafnest.com" || userId === "00000000-0000-0000-0000-000000000001")) {
    return true;
  }
  return false;
}

export function markEmailVerifiedInStore(userId: string, email: string): void {
  const cleanEmail = email.trim().toLowerCase();
  const store = readSharedJsonFile<Record<string, { verified: boolean; verifiedAt: string }>>(
    VERIFIED_EMAILS_FILE,
    () => ({}),
    (p) => (p && typeof p === "object" ? (p as Record<string, { verified: boolean; verifiedAt: string }>) : {})
  );

  const now = new Date().toISOString();
  if (cleanEmail) {
    store[cleanEmail] = { verified: true, verifiedAt: now };
  }
  if (userId) {
    store[userId] = { verified: true, verifiedAt: now };
  }
  writeSharedJsonFile(VERIFIED_EMAILS_FILE, store);
}

function renderVerificationEmailHtml(code: string, language: "ar" | "en"): string {
  const isAr = language === "ar";
  return `
<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
<head>
  <meta charset="utf-8">
  <title>${isAr ? "رمز توثيق البريد الإلكتروني" : "Email Verification Code"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E4DFF0; overflow: hidden; box-shadow: 0 4px 16px rgba(79, 35, 150, 0.06);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4F2396 0%, #6D28D9 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                ${isAr ? "قاف نست · QafNest" : "QafNest · قاف نست"}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #E9D5FF; font-weight: 500;">
                ${isAr ? "توثيق البريد الإلكتروني لحسابك" : "Verify Your Account Email"}
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px; text-align: ${isAr ? "right" : "left"};">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                ${
                  isAr
                    ? "مرحباً بك! لتأكيد عنوان بريدك الإلكتروني في منصة قاف نست، يرجى استخدام رمز التحقق التالي:"
                    : "Welcome! To verify your email address on the QafNest platform, please use the following one-time verification code:"
                }
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #F7F5FC; border: 1px dashed #C4B5FD; border-radius: 14px; padding: 20px 16px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4F2396; user-select: all;">
                      ${code}
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: #7C3AED;">
                      ${isAr ? "صالح لمدة 15 دقيقة فقط" : "Valid for 15 minutes only"}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                ${
                  isAr
                    ? "إذا لم تقم بطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان."
                    : "If you did not request this verification code, you can safely ignore this email."
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #F1F5F9; padding: 18px 24px; text-align: center; font-size: 11px; color: #94A3B8;">
              ${isAr ? "منصة قاف نست لإدارة وتأجير العقارات والضيافة · المملكة العربية السعودية" : "QafNest Real Estate & Vacation Rental Platform · Saudi Arabia"}
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
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; email?: string; code?: string; language?: "ar" | "en" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const action = body.action || "send";
  const email = (body.email || authUser.email || "").trim().toLowerCase();
  const language = body.language === "ar" ? "ar" : "en";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: language === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email address format." },
      { status: 400 }
    );
  }

  // ACTION 1: SEND OTP CODE VIA RESEND
  if (action === "send") {
    // Generate secure 6-digit numeric OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    pendingEmailOtps.set(email, { code, expiresAt, userId: authUser.id });

    const emailSubject = language === "ar"
      ? `رمز التحقق من البريد الإلكتروني (${code}) - قاف نست`
      : `Your QafNest Email Verification Code: ${code}`;
    const emailHtml = renderVerificationEmailHtml(code, language);

    console.info(`[Email Verification] Dispatching OTP to ${email} via Resend Outbound API...`);
    const sendResult = await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });

    const isDev = process.env.NODE_ENV !== "production";
    if (!sendResult.success && !isDev) {
      console.error("[Email Verification] Resend delivery error:", sendResult.error);
      return NextResponse.json(
        {
          error: language === "ar"
            ? `تعذر إرسال البريد عبر Resend: ${sendResult.error || "خطأ غير متوقع"}`
            : `Failed to deliver verification email via Resend: ${sendResult.error || "Unexpected error"}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: language === "ar"
        ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح."
        : "Verification code sent to your email successfully via Resend.",
      // Provide dev code for seamless local DX
      ...(isDev ? { devCode: code } : {}),
    });
  }

  // ACTION 2: CONFIRM OTP CODE
  if (action === "confirm") {
    const submittedCode = String(body.code || "").trim().replace(/\D/g, "");
    if (!submittedCode || submittedCode.length < 6) {
      return NextResponse.json(
        { error: language === "ar" ? "يرجى إدخال رمز التحقق المكون من 6 أرقام" : "Please enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    const pending = pendingEmailOtps.get(email);
    const isDevGuest =
      process.env.NODE_ENV !== "production" &&
      (email === "guest.dev@qafnest.com" || authUser.id === "00000000-0000-0000-0000-000000000001");

    const isCodeValid =
      (pending && pending.code === submittedCode && Date.now() <= pending.expiresAt) ||
      (isDevGuest && (submittedCode === "123456" || (pending && pending.code === submittedCode)));

    if (!isCodeValid) {
      return NextResponse.json(
        {
          error: language === "ar"
            ? "رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى طلب رمز جديد."
            : "Invalid or expired verification code. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Clear pending OTP upon success
    pendingEmailOtps.delete(email);

    // 1. Mark verified in shared persistent store
    markEmailVerifiedInStore(authUser.id, email);

    // 2. Persist to Supabase if UUID user
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);
    if (isUuid) {
      try {
        const db = await getAdminOrServerClient();
        if (typeof (db as any).auth?.admin?.updateUserById === "function") {
          await (db as any).auth.admin.updateUserById(authUser.id, {
            email_confirm: true,
            user_metadata: {
              email_verified: true,
              contact_email: email,
            },
            app_metadata: {
              email_verified: true,
            },
          });
        }
      } catch (err) {
        console.warn("[Email Verification] Supabase admin metadata update notice:", err);
      }
    } else {
      // 3. Persist to Firebase profile store if non-UUID phone user
      const existingFb = await getFirebaseGuestProfile(authUser.id);
      await saveFirebaseGuestProfile(authUser.id, {
        ...(existingFb || {}),
        contact_email: email,
        is_email_verified: true,
      });
    }

    return NextResponse.json({
      success: true,
      emailVerified: true,
      email,
      message: language === "ar"
        ? "تم توثيق بريدك الإلكتروني بنجاح!"
        : "Email address verified successfully!",
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

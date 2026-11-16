import { NextResponse } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { normalizePhoneInput, normalizeSaudiPhone } from "@qafnest/shared/phone";
import {
  extractClientIp,
  normalizeDeviceId,
  evaluateAndRecordSignupAttempt,
} from "@qafnest/shared/signupSecurityStore";


async function checkExistingGuestAccount(params: {
  email?: string | null;
  phone?: string | null;
}): Promise<boolean> {
  try {
    const supabase = await getAdminOrServerClient();
    const email = params.email?.trim().toLowerCase();
    const phoneNormalized = params.phone
      ? normalizeSaudiPhone(params.phone) || normalizePhoneInput(params.phone)
      : null;

    if (phoneNormalized) {
      const { data: phoneRows } = await supabase
        .from("profiles")
        .select("id, phone")
        .eq("phone", phoneNormalized)
        .limit(1);
      if (phoneRows && phoneRows.length > 0) {
        return true;
      }
    }
  } catch {
    // Fail open only for existence probe; device/IP guard still runs for unverified signups
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      deviceId?: string;
      fingerprintHash?: string;
      email?: string | null;
      phone?: string | null;
      mode?: "signup" | "otp";
    };

    const ip = extractClientIp(request);
    const deviceId = normalizeDeviceId(body.deviceId, request.headers.get("user-agent"));
    const fingerprintHash = body.fingerprintHash || null;

    // For OTP login flow, allow returning verified users who already own an account to receive login OTP
    if (body.mode === "otp" && body.phone) {
      const exists = await checkExistingGuestAccount({ phone: body.phone });
      if (exists) {
        return NextResponse.json({
          allowed: true,
          existingAccount: true,
          code: "ok",
        });
      }
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
    return NextResponse.json(
      {
        allowed: false,
        code: "security_check_error",
        message: err instanceof Error ? err.message : "Signup security verification failed.",
      },
      { status: 500 }
    );
  }
}

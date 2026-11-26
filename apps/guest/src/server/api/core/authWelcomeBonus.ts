import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { awardWelcomeBonus, getUserWallet } from "@/lib/services/walletService";
import {
  getServerPlatformFeeConfig,
  hydratePlatformFeeConfig,
} from "@qafnest/shared/platformFeeStore";
import { checkRateLimit } from "@qafnest/shared/rateLimiter";
import {
  extractClientIp,
  normalizeDeviceId,
  evaluateAndRecordSignupAttempt,
  recordApprovedSignupDevice,
  getSignupSecurityOverview,
  hydrateSignupSecurityStore,
} from "@qafnest/shared/signupSecurityStore";


export async function POST(request: Request) {
  const ip = extractClientIp(request);
  const rl = checkRateLimit(`welcome:${ip}`, 10, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { code: "rate_limited", message: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      deviceId?: string;
      fingerprintHash?: string;
      isNewSignup?: boolean;
    };

    const wallet = await getUserWallet(authUser.id);
    if (wallet.welcomeBonusCredited) {
      return NextResponse.json({
        success: true,
        awarded: false,
        alreadyCredited: true,
        amountCredited: 0,
        balance: wallet.balance,
      });
    }

    await Promise.all([hydratePlatformFeeConfig(), hydrateSignupSecurityStore()]);
    const feeCfg = getServerPlatformFeeConfig();
    const secOverview = getSignupSecurityOverview();
    const welcomeEnabled =
      feeCfg.welcomeBonusEnabled !== false && secOverview.policy.welcomeBonusEnabled !== false;
    const bonusAmount = welcomeEnabled
      ? Math.max(0, feeCfg.welcomeBonusAmountSar ?? secOverview.policy.welcomeBonusAmountSar ?? 50)
      : 0;

    if (!welcomeEnabled || bonusAmount <= 0) {
      return NextResponse.json({
        success: true,
        awarded: false,
        amountCredited: 0,
        balance: wallet.balance,
      });
    }

    // Verify account age strictly from server records (never let body.isNewSignup mark accounts new)
    let isRecentSignup = false;
    try {
      const admin = await getAdminOrServerClient();
      if ("auth" in admin && admin.auth?.admin?.getUserById && /^[0-9a-f-]{36}$/i.test(authUser.id)) {
        const { data: userRes } = await admin.auth.admin.getUserById(authUser.id);
        const createdAt = userRes?.user?.created_at;
        if (createdAt) {
          const ageMs = Date.now() - Date.parse(createdAt);
          if (ageMs >= 0 && ageMs <= 48 * 3600_000) {
            isRecentSignup = true;
          }
        }
      } else if (authUser.provider === "firebase" && wallet.transactions.length === 0) {
        const { count } = await admin
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .or(`guest_id.eq.${authUser.id},auth_subject.eq.${authUser.id}`);
        if ((count ?? 0) === 0) {
          isRecentSignup = true;
        }
      }
    } catch {
      // Fail closed on verification error rather than trusting client body.isNewSignup
      isRecentSignup = false;
    }

    if (!isRecentSignup) {
      return NextResponse.json({
        success: true,
        awarded: false,
        alreadyCredited: true,
        amountCredited: 0,
        balance: wallet.balance,
      });
    }

    const ip = extractClientIp(request);
    const deviceId = normalizeDeviceId(body.deviceId, request.headers.get("user-agent"));
    const fingerprintHash = body.fingerprintHash || null;

    const guard = evaluateAndRecordSignupAttempt({
      ip,
      deviceId,
      fingerprintHash,
      email: authUser.email,
      phone: authUser.phone,
      existingUserId: authUser.id,
      recordAttemptOnReject: true,
    });

    if (!guard.allowed) {
      return NextResponse.json(
        {
          success: false,
          awarded: false,
          blocked: true,
          code: guard.code,
          messageEn: guard.messageEn,
          messageAr: guard.messageAr,
          balance: wallet.balance,
        },
        { status: 403 }
      );
    }

    const creditRes = await awardWelcomeBonus({
      userId: authUser.id,
      amount: bonusAmount,
      deviceId,
      ip,
    });

    recordApprovedSignupDevice({
      userId: authUser.id,
      email: authUser.email,
      phone: authUser.phone,
      ip,
      deviceId,
      fingerprintHash,
      userAgent: request.headers.get("user-agent"),
      welcomeBonusAwarded: creditRes.awarded,
      welcomeBonusAmount: creditRes.amountCredited,
    });

    return NextResponse.json({
      success: true,
      awarded: creditRes.awarded,
      alreadyCredited: creditRes.alreadyCredited,
      amountCredited: creditRes.amountCredited,
      balance: creditRes.wallet.balance,
      messageEn: creditRes.awarded
        ? `Welcome to QafNest! ${creditRes.amountCredited} SAR Welcome Bonus has been added to your wallet.`
        : "Welcome bonus status verified.",
      messageAr: creditRes.awarded
        ? `أهلاً بك في قاف نست! تم إضافة مكافأة ترحيبية بقيمة ${creditRes.amountCredited} ر.س إلى محفظتك.`
        : "تم التحقق من حالة المكافأة الترحيبية.",
    });
  } catch (err: unknown) {
    console.error("[authWelcomeBonus] failed:", err);
    return NextResponse.json(
      {
        success: false,
        awarded: false,
        amountCredited: 0,
        message: "Failed to process welcome bonus.",
      },
      { status: 500 }
    );
  }
}

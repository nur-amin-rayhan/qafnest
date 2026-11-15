import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculatePricingBreakdown } from "@/lib/services/pricing";
import { validateAuthoritativeCoupon } from "@/lib/services/couponService";
import { getServerEffectiveGuestFeeConfig } from "@qafnest/shared/platformFeeStore";


export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { code, nights, category } = payload || {};
    const baseRate =
      typeof payload?.baseRate === "number"
        ? payload.baseRate
        : typeof payload?.basePrice === "number"
        ? payload.basePrice
        : 0;

    if (baseRate <= 0) {
      return NextResponse.json(
        {
          valid: false,
          error: "invalid_base_rate",
          messageEn: "Valid booking base rate is required.",
          messageAr: "قيمة الحجز الأساسية مطلوبة للتحقق من الكود.",
        },
        { status: 400 }
      );
    }

    const nightCount = typeof nights === "number" && nights > 0 ? nights : 1;
    const cleanCode = (code || "").trim();

    if (!cleanCode) {
      return NextResponse.json(
        {
          valid: false,
          error: "empty_code",
          messageEn: "Please enter a valid coupon code.",
          messageAr: "يرجى إدخال كود خصم صحيح.",
        },
        { status: 422 }
      );
    }

    const supabase = await createClient();
    const result = await validateAuthoritativeCoupon({
      code: cleanCode,
      baseRate,
      nights: nightCount,
      dbClient: supabase,
    });

    if (!result.valid) {
      return NextResponse.json(result, { status: 422 });
    }

    const guestFee = getServerEffectiveGuestFeeConfig(
      typeof category === "string" ? category : undefined
    );

    const pricing = calculatePricingBreakdown({
      baseRate,
      nights: nightCount,
      couponCode: result.coupon?.code,
      validatedCoupon: result.coupon,
      customDiscount: result.discountAmount,
      serviceFeeRate: guestFee.serviceFeeRate,
      feeMode: guestFee.feeMode,
      fixedFeeAmountSar: guestFee.fixedFeeAmountSar,
      vatRate: guestFee.vatRatePercent / 100,
      category: typeof category === "string" ? category : undefined,
    });

    return NextResponse.json({
      valid: true,
      coupon: result.coupon,
      discountAmount: result.discountAmount,
      pricing,
      messageEn: result.messageEn,
      messageAr: result.messageAr,
    });
  } catch (err) {
    console.error("Coupon validation error:", err);
    return NextResponse.json(
      {
        valid: false,
        error: "server_error",
        messageEn: "Failed to validate coupon code.",
        messageAr: "تعذر التحقق من كود الخصم حالياً.",
      },
      { status: 500 }
    );
  }
}

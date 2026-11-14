import { getAdminOrServerClient } from "@/lib/supabase/service";
import {
  CouponDefinition,
  CouponValidationResult,
} from "@/lib/services/pricing";
import { getPromotionState, savePromotionState } from "@/lib/services/promotionStore";

export interface AuthoritativeCouponParams {
  code: string;
  baseRate: number;
  nights?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbClient?: any;
}

/**
 * Validates a coupon code across all authoritative sources:
 * 1. Global platform settings (promotions_enabled)
 * 2. Supabase database `coupons` table (active, expiration, starts_at, usage_limit, min_spend, min_nights)
 * 3. Shared local file-based promotion store fallback
 * 4. In-memory static catalog (`ACTIVE_COUPONS`) fallback
 */
export async function validateAuthoritativeCoupon(
  params: AuthoritativeCouponParams
): Promise<CouponValidationResult> {
  const { code, baseRate, nights = 1, dbClient } = params;
  const cleanCode = (code || "").trim().toUpperCase();

  if (!cleanCode) {
    return {
      valid: false,
      discountAmount: 0,
      error: "empty_code",
      messageEn: "Please enter a valid coupon code.",
      messageAr: "يرجى إدخال كود خصم صحيح.",
    };
  }

  if (baseRate <= 0) {
    return {
      valid: false,
      discountAmount: 0,
      error: "invalid_base_rate",
      messageEn: "Valid booking base rate is required.",
      messageAr: "قيمة الحجز الأساسية مطلوبة للتحقق من الكود.",
    };
  }

  const nightCount = typeof nights === "number" && nights > 0 ? nights : 1;

  // 1. Quick check against shared local store for emergency admin pause
  const localState = getPromotionState();
  if (localState.promotionsEnabled === false) {
    return {
      valid: false,
      discountAmount: 0,
      error: "promotions_disabled",
      messageEn: "Promotions and discount codes are currently paused by the platform administrator.",
      messageAr: "نظام الخصومات والعروض متوقف مؤقتاً من قِبل إدارة المنصة.",
    };
  }

  // 2. Authoritative check in Supabase database
  try {
    const supabase = dbClient || (await getAdminOrServerClient());

    // Check platform settings
    const { data: settingData } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "promotions_enabled")
      .maybeSingle();

    if (settingData && settingData.value === false) {
      return {
        valid: false,
        discountAmount: 0,
        error: "promotions_disabled",
        messageEn: "Promotions and discount codes are currently paused by the platform administrator.",
        messageAr: "نظام الخصومات والعروض متوقف مؤقتاً من قِبل إدارة المنصة.",
      };
    }

    // Query live coupon record in Supabase
    const { data: dbCoupon } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", cleanCode)
      .maybeSingle();

    if (dbCoupon) {
      if (!dbCoupon.is_active) {
        return {
          valid: false,
          discountAmount: 0,
          error: "coupon_paused",
          messageEn: `Coupon ${cleanCode} is currently paused by admin.`,
          messageAr: `كود الخصم ${cleanCode} موقوف حالياً من الإدارة.`,
        };
      }

      if (dbCoupon.starts_at && new Date(dbCoupon.starts_at).getTime() > Date.now()) {
        return {
          valid: false,
          discountAmount: 0,
          error: "coupon_not_started",
          messageEn: `Coupon ${cleanCode} is not active yet.`,
          messageAr: `كود الخصم ${cleanCode} لم يبدأ بعد.`,
        };
      }

      if (dbCoupon.expires_at && new Date(dbCoupon.expires_at).getTime() < Date.now()) {
        return {
          valid: false,
          discountAmount: 0,
          error: "coupon_expired",
          messageEn: `Coupon ${cleanCode} has expired.`,
          messageAr: `انتهت صلاحية كود الخصم ${cleanCode}.`,
        };
      }

      if (
        typeof dbCoupon.usage_limit === "number" &&
        typeof dbCoupon.used_count === "number" &&
        dbCoupon.used_count >= dbCoupon.usage_limit
      ) {
        return {
          valid: false,
          discountAmount: 0,
          error: "coupon_limit_reached",
          messageEn: `Coupon ${cleanCode} has reached its maximum usage limit.`,
          messageAr: `وصل كود الخصم ${cleanCode} إلى الحد الأقصى للاستخدام.`,
        };
      }

      if (dbCoupon.min_spend && baseRate < Number(dbCoupon.min_spend)) {
        return {
          valid: false,
          discountAmount: 0,
          error: "min_spend_not_met",
          messageEn: `Coupon requires a minimum booking rate of SAR ${dbCoupon.min_spend}.`,
          messageAr: `يتطلب كود الخصم حجزاً بقيمة ${dbCoupon.min_spend} ر.س كحد أدنى.`,
        };
      }

      if (dbCoupon.min_nights && nightCount < Number(dbCoupon.min_nights)) {
        return {
          valid: false,
          discountAmount: 0,
          error: "min_nights_not_met",
          messageEn: `Coupon requires an accommodation stay of ${dbCoupon.min_nights}+ nights.`,
          messageAr: `يتطلب كود الخصم إقامة لمدة ${dbCoupon.min_nights} ليالٍ أو أكثر.`,
        };
      }

      let discount = 0;
      const val = Number(dbCoupon.value);
      if (dbCoupon.type === "percentage") {
        discount = Math.round(baseRate * (val / 100) * 100) / 100;
        if (dbCoupon.max_discount && discount > Number(dbCoupon.max_discount)) {
          discount = Number(dbCoupon.max_discount);
        }
      } else {
        discount = Math.min(baseRate, val);
      }
      discount = Math.round(discount * 100) / 100;

      const couponDef: CouponDefinition = {
        code: dbCoupon.code,
        type: dbCoupon.type,
        value: val,
        minSpend: dbCoupon.min_spend ? Number(dbCoupon.min_spend) : undefined,
        maxDiscount: dbCoupon.max_discount ? Number(dbCoupon.max_discount) : undefined,
        minNights: dbCoupon.min_nights ? Number(dbCoupon.min_nights) : undefined,
        descriptionEn:
          dbCoupon.description_en || `${val}${dbCoupon.type === "percentage" ? "%" : " SAR"} discount`,
        descriptionAr:
          dbCoupon.description_ar || `خصم ${val}${dbCoupon.type === "percentage" ? "%" : " ر.س"}`,
      };

      return {
        valid: true,
        coupon: couponDef,
        discountAmount: discount,
        messageEn: `Coupon ${cleanCode} applied: -SAR ${discount.toFixed(2)}`,
        messageAr: `تم تطبيق كود ${cleanCode}: -${discount.toFixed(2)} ر.س`,
      };
    }
  } catch (dbErr) {
    console.warn("Notice: Database lookup error during coupon validation:", dbErr);
  }

  // 3. Fallback to shared local store
  const storeCoupon = (localState.coupons || []).find((c) => c.code.toUpperCase() === cleanCode);
  if (storeCoupon) {
    if (!storeCoupon.is_active) {
      return {
        valid: false,
        discountAmount: 0,
        error: "coupon_paused",
        messageEn: `Coupon ${cleanCode} is currently paused by admin.`,
        messageAr: `كود الخصم ${cleanCode} موقوف حالياً من الإدارة.`,
      };
    }

    if (storeCoupon.expires_at && new Date(storeCoupon.expires_at).getTime() < Date.now()) {
      return {
        valid: false,
        discountAmount: 0,
        error: "coupon_expired",
        messageEn: `Coupon ${cleanCode} has expired.`,
        messageAr: `انتهت صلاحية كود الخصم ${cleanCode}.`,
      };
    }

    if (
      typeof storeCoupon.usage_limit === "number" &&
      typeof storeCoupon.used_count === "number" &&
      storeCoupon.used_count >= storeCoupon.usage_limit
    ) {
      return {
        valid: false,
        discountAmount: 0,
        error: "coupon_limit_reached",
        messageEn: `Coupon ${cleanCode} has reached its maximum usage limit.`,
        messageAr: `وصل كود الخصم ${cleanCode} إلى الحد الأقصى للاستخدام.`,
      };
    }

    if (storeCoupon.min_spend && baseRate < Number(storeCoupon.min_spend)) {
      return {
        valid: false,
        discountAmount: 0,
        error: "min_spend_not_met",
        messageEn: `Coupon requires a minimum booking rate of SAR ${storeCoupon.min_spend}.`,
        messageAr: `يتطلب كود الخصم حجزاً بقيمة ${storeCoupon.min_spend} ر.س كحد أدنى.`,
      };
    }

    if (storeCoupon.min_nights && nightCount < Number(storeCoupon.min_nights)) {
      return {
        valid: false,
        discountAmount: 0,
        error: "min_nights_not_met",
        messageEn: `Coupon requires an accommodation stay of ${storeCoupon.min_nights}+ nights.`,
        messageAr: `يتطلب كود الخصم إقامة لمدة ${storeCoupon.min_nights} ليالٍ أو أكثر.`,
      };
    }

    let discount = 0;
    const val = Number(storeCoupon.value);
    if (storeCoupon.type === "percentage") {
      discount = Math.round(baseRate * (val / 100) * 100) / 100;
      if (storeCoupon.max_discount && discount > Number(storeCoupon.max_discount)) {
        discount = Number(storeCoupon.max_discount);
      }
    } else {
      discount = Math.min(baseRate, val);
    }
    discount = Math.round(discount * 100) / 100;

    const couponDef: CouponDefinition = {
      code: storeCoupon.code,
      type: storeCoupon.type,
      value: val,
      minSpend: storeCoupon.min_spend ? Number(storeCoupon.min_spend) : undefined,
      maxDiscount: storeCoupon.max_discount ? Number(storeCoupon.max_discount) : undefined,
      minNights: storeCoupon.min_nights ? Number(storeCoupon.min_nights) : undefined,
      descriptionEn:
        storeCoupon.description_en || `${val}${storeCoupon.type === "percentage" ? "%" : " SAR"} discount`,
      descriptionAr:
        storeCoupon.description_ar || `خصم ${val}${storeCoupon.type === "percentage" ? "%" : " ر.س"}`,
    };

    return {
      valid: true,
      coupon: couponDef,
      discountAmount: discount,
      messageEn: `Coupon ${cleanCode} applied: -SAR ${discount.toFixed(2)}`,
      messageAr: `تم تطبيق كود ${cleanCode}: -${discount.toFixed(2)} ر.س`,
    };
  }

  return {
    valid: false,
    discountAmount: 0,
    error: "invalid_code",
    messageEn: "Coupon code is invalid or has expired.",
    messageAr: "كود الخصم غير صالح أو منتهي الصلاحية.",
  };
}

/**
 * Increments the used_count for a successfully redeemed coupon in both Supabase and local store.
 * Uses atomic Compare-And-Swap (CAS) optimistic concurrency control to prevent race conditions (SEC-07).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordCouponUsage(code: string, dbClient?: any): Promise<void> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) return;

  try {
    const supabase = dbClient || (await getAdminOrServerClient());

    // 1. First attempt: Atomic stored procedure increment if present in database
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("increment_coupon_usage", {
        p_code: cleanCode,
      });
      if (!rpcError && rpcData?.success) {
        return;
      }
    } catch {}

    // 2. CAS Optimistic Locking Retry Loop (up to 3 attempts under high concurrency)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: dbCoupon } = await supabase
        .from("coupons")
        .select("id, used_count, usage_limit")
        .ilike("code", cleanCode)
        .maybeSingle();

      if (!dbCoupon) break;

      const currentCount = Number(dbCoupon.used_count) || 0;
      const limit = typeof dbCoupon.usage_limit === "number" ? dbCoupon.usage_limit : null;

      // Quota limit enforcement: never exceed defined usage limit
      if (limit !== null && currentCount >= limit) {
        console.warn(`[COUPON NOTICE] Usage limit reached for coupon: ${cleanCode}`);
        break;
      }

      const { data: updatedRows, error: updateErr } = await supabase
        .from("coupons")
        .update({
          used_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbCoupon.id)
        .eq("used_count", currentCount) // CAS predicate: guarantees atomic compare-and-swap
        .select("id");

      if (!updateErr && updatedRows && updatedRows.length > 0) {
        break; // Successfully incremented atomically
      }
      // If another transaction raced and incremented, the loop retries with fresh used_count
    }
  } catch (err) {
    console.warn("Could not update coupon used_count in Supabase:", err);
  }

  try {
    const localState = getPromotionState();
    const existing = (localState.coupons || []).find((c) => c.code.toUpperCase() === cleanCode);
    if (existing) {
      existing.used_count = (existing.used_count || 0) + 1;
      existing.updated_at = new Date().toISOString();
      savePromotionState(localState);
    }
  } catch (err) {
    console.warn("Could not update coupon used_count in local store:", err);
  }
}


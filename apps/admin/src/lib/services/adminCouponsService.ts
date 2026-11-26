import crypto from "node:crypto";
import { createAdminDataClient } from "@/lib/adminApi";
import {
  getPromotionState,
  hydratePromotionState,
  persistPromotionState,
} from "@qafnest/shared/promotionStore";
import { AdminCouponRecord } from "./defaultCoupons";

export type { AdminCouponRecord };
export let memoryCoupons: AdminCouponRecord[] = [];

let globalPromotionsEnabled = true;

export async function getAdminCoupons() {
  await hydratePromotionState().catch(() => undefined);
  const supabase = createAdminDataClient();
  if (supabase) {
    const [{ data, error }, { data: settingData }] = await Promise.all([
      supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "promotions_enabled")
        .maybeSingle(),
    ]);

    if (settingData && typeof settingData.value === "boolean") {
      globalPromotionsEnabled = settingData.value;
    }

    if (error) {
      throw new Error(`Failed to fetch coupons: ${error.message}`);
    }

    return { coupons: data || [], promotionsEnabled: globalPromotionsEnabled };
  }

  const localState = getPromotionState();
  return {
    coupons: localState.coupons,
    promotionsEnabled: localState.promotionsEnabled,
  };
}

export async function createAdminCouponRecord(body: Record<string, unknown>) {
  const rawCode = (typeof body.code === "string" ? body.code : "").trim().toUpperCase();
  if (!rawCode || rawCode.length < 3 || !/^[A-Z0-9_-]{3,32}$/.test(rawCode)) {
    throw new Error("Promo code must be 3-32 alphanumeric characters.");
  }

  const type = body.type === "percentage" ? "percentage" : "fixed";
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Discount value must be greater than zero.");
  }
  if (type === "percentage" && value > 90) {
    throw new Error("Percentage discount cannot exceed 90%.");
  }

  const minSpend = body.minSpend !== undefined && body.minSpend !== "" ? Number(body.minSpend) : 0;
  if (!Number.isFinite(minSpend) || minSpend < 0) {
    throw new Error("Minimum spend must be zero or positive.");
  }
  const maxDiscount =
    body.maxDiscount !== undefined && body.maxDiscount !== null && body.maxDiscount !== ""
      ? Number(body.maxDiscount)
      : undefined;
  if (maxDiscount !== undefined && (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) {
    throw new Error("Maximum discount must be greater than zero.");
  }
  const minNights = body.minNights !== undefined && body.minNights !== "" ? Number(body.minNights) : 1;
  if (!Number.isInteger(minNights) || minNights < 1) {
    throw new Error("Minimum nights must be an integer >= 1.");
  }
  const usageLimit =
    body.usageLimit !== undefined && body.usageLimit !== null && body.usageLimit !== ""
      ? Number(body.usageLimit)
      : undefined;
  if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    throw new Error("Usage limit must be an integer >= 1.");
  }

  const isActive = body.isActive !== false;
  const descriptionEn =
    (typeof body.descriptionEn === "string" ? body.descriptionEn : "").trim() ||
    `${value}${type === "percentage" ? "%" : " SAR"} promo discount`;
  const descriptionAr =
    (typeof body.descriptionAr === "string" ? body.descriptionAr : "").trim() ||
    `خصم ترويجي بقيمة ${value} ${type === "percentage" ? "%" : "ر.س"}`;
  let expiresAt = "2026-12-31T20:59:59Z";
  if (body.expiresAt) {
    const parsed = Date.parse(String(body.expiresAt));
    if (Number.isNaN(parsed)) {
      throw new Error("Invalid coupon expiry date.");
    }
    expiresAt = new Date(parsed).toISOString();
  }

  const newCoupon: AdminCouponRecord = {
    id: `coup-${crypto.randomUUID().slice(0, 12)}`,
    code: rawCode,
    type,
    value,
    min_spend: minSpend,
    max_discount: maxDiscount,
    min_nights: minNights,
    usage_limit: usageLimit,
    used_count: 0,
    is_active: isActive,
    description_en: descriptionEn,
    description_ar: descriptionAr,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminDataClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: newCoupon.code,
        type: newCoupon.type,
        value: newCoupon.value,
        min_spend: newCoupon.min_spend,
        max_discount: newCoupon.max_discount,
        min_nights: newCoupon.min_nights,
        usage_limit: newCoupon.usage_limit,
        used_count: 0,
        is_active: newCoupon.is_active,
        description_en: newCoupon.description_en,
        description_ar: newCoupon.description_ar,
        expires_at: newCoupon.expires_at,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to create coupon in database.");
    }

    if (data) {
      const localState = getPromotionState();
      localState.coupons.unshift(data);
      await persistPromotionState(localState);
      return data;
    }
  }

  const localState = getPromotionState();
  localState.coupons.unshift(newCoupon);
  await persistPromotionState(localState);
  memoryCoupons.unshift(newCoupon);
  return newCoupon;
}

export async function updateAdminCouponRecord(id: string, body: Record<string, unknown>) {
  const cleanCode =
    typeof body.code === "string" && body.code.trim() ? body.code.trim().toUpperCase() : undefined;
  if (cleanCode !== undefined && !/^[A-Z0-9_-]{3,32}$/.test(cleanCode)) {
    throw new Error("Promo code must be 3-32 alphanumeric characters.");
  }

  const rawType = body.type ?? body.discount_type ?? body.discountType;
  let validatedType: "percentage" | "fixed" | undefined;
  if (rawType !== undefined) {
    const t = String(rawType).toLowerCase();
    if (t !== "percentage" && t !== "fixed") {
      throw new Error("Coupon type must be 'percentage' or 'fixed'.");
    }
    validatedType = t;
  }

  const rawVal = body.value ?? body.discount_value ?? body.discountValue;
  let validatedValue: number | undefined;
  if (rawVal !== undefined) {
    const num = Number(rawVal);
    if (!Number.isFinite(num) || num <= 0) {
      throw new Error("Discount value must be greater than zero.");
    }
    if (validatedType === "percentage" && num > 90) {
      throw new Error("Percentage discount cannot exceed 90%.");
    }
    validatedValue = num;
  }

  const supabase = createAdminDataClient();
  if (supabase) {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (cleanCode) updatePayload.code = cleanCode;
    const isActive =
      typeof body.is_active === "boolean"
        ? body.is_active
        : typeof body.isActive === "boolean"
        ? body.isActive
        : undefined;
    if (typeof isActive === "boolean") updatePayload.is_active = isActive;
    if (validatedValue !== undefined) updatePayload.value = validatedValue;
    if (validatedType !== undefined) updatePayload.type = validatedType;

    const minSpendRaw = body.min_spend ?? body.minSpend;
    if (minSpendRaw !== undefined) {
      const ms = Number(minSpendRaw);
      if (!Number.isFinite(ms) || ms < 0) throw new Error("Minimum spend must be >= 0.");
      updatePayload.min_spend = ms;
    }
    const maxDiscountRaw = body.max_discount !== undefined ? body.max_discount : body.maxDiscount;
    if (maxDiscountRaw !== undefined) {
      const md = maxDiscountRaw ? Number(maxDiscountRaw) : null;
      if (md !== null && (!Number.isFinite(md) || md <= 0)) {
        throw new Error("Maximum discount must be greater than zero.");
      }
      updatePayload.max_discount = md;
    }
    const minNightsRaw = body.min_nights ?? body.minNights;
    if (minNightsRaw !== undefined) {
      const mn = Number(minNightsRaw);
      if (!Number.isInteger(mn) || mn < 1) throw new Error("Minimum nights must be an integer >= 1.");
      updatePayload.min_nights = mn;
    }
    const usageLimitRaw = body.usage_limit !== undefined ? body.usage_limit : body.usageLimit;
    if (usageLimitRaw !== undefined) {
      const ul = usageLimitRaw ? Number(usageLimitRaw) : null;
      if (ul !== null && (!Number.isInteger(ul) || ul < 1)) {
        throw new Error("Usage limit must be an integer >= 1.");
      }
      updatePayload.usage_limit = ul;
    }
    const descEn = body.description_en || body.descriptionEn;
    if (typeof descEn === "string") updatePayload.description_en = descEn;
    const descAr = body.description_ar || body.descriptionAr;
    if (typeof descAr === "string") updatePayload.description_ar = descAr;
    const expiresAt = body.expires_at || body.expiresAt;
    if (expiresAt) {
      const parsed = Date.parse(String(expiresAt));
      if (Number.isNaN(parsed)) throw new Error("Invalid expiry date.");
      updatePayload.expires_at = new Date(parsed).toISOString();
    }

    const { data, error } = await supabase
      .from("coupons")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to update coupon in database.");
    }
    if (!data) {
      return null;
    }

    const localState = getPromotionState();
    const sIdx = localState.coupons.findIndex((c) => c.id === id);
    if (sIdx !== -1) {
      localState.coupons[sIdx] = data;
    } else {
      localState.coupons.unshift(data);
    }
    await persistPromotionState(localState);
    return data;
  }

  const localState = getPromotionState();
  let index = localState.coupons.findIndex((c) => c.id === id);
  if (index === -1 && cleanCode) {
    index = localState.coupons.findIndex((c) => c.code.toUpperCase() === cleanCode);
  }
  if (index !== -1) {
    const prevC = localState.coupons[index];
    const updated: AdminCouponRecord = {
      ...prevC,
      code: cleanCode || prevC.code,
      type: validatedType || prevC.type,
      value: validatedValue !== undefined ? validatedValue : prevC.value,
      min_spend:
        typeof body.min_spend === "number"
          ? body.min_spend
          : typeof body.minSpend === "number"
          ? body.minSpend
          : prevC.min_spend,
      max_discount:
        typeof body.max_discount !== "undefined"
          ? (body.max_discount ? Number(body.max_discount) : undefined)
          : typeof body.maxDiscount !== "undefined"
          ? (body.maxDiscount ? Number(body.maxDiscount) : undefined)
          : prevC.max_discount,
      min_nights:
        typeof body.min_nights === "number"
          ? body.min_nights
          : typeof body.minNights === "number"
          ? body.minNights
          : prevC.min_nights,
      usage_limit:
        typeof body.usage_limit !== "undefined"
          ? (body.usage_limit ? Number(body.usage_limit) : undefined)
          : typeof body.usageLimit !== "undefined"
          ? (body.usageLimit ? Number(body.usageLimit) : undefined)
          : prevC.usage_limit,
      is_active:
        typeof body.is_active === "boolean"
          ? body.is_active
          : typeof body.isActive === "boolean"
          ? body.isActive
          : prevC.is_active,
      description_en: String(body.description_en || body.descriptionEn || prevC.description_en),
      description_ar: String(body.description_ar || body.descriptionAr || prevC.description_ar),
      expires_at: String(body.expires_at || body.expiresAt || prevC.expires_at),
      updated_at: new Date().toISOString(),
    };
    localState.coupons[index] = updated;
    await persistPromotionState(localState);

    const memIdx = memoryCoupons.findIndex((c) => c.id === id);
    if (memIdx !== -1) {
      memoryCoupons[memIdx] = updated;
    } else {
      memoryCoupons.unshift(updated);
    }
    return updated;
  }

  return null;
}

export async function deleteAdminCouponRecord(id: string) {
  const supabase = createAdminDataClient();
  if (supabase) {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      throw new Error(error.message || "Failed to delete coupon.");
    }
  }

  const localState = getPromotionState();
  localState.coupons = localState.coupons.filter((c) => c.id !== id && c.code !== id);
  await persistPromotionState(localState);

  memoryCoupons = memoryCoupons.filter((c) => c.id !== id);
}


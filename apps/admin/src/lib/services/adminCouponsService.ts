import { createAdminDataClient } from "@/lib/adminApi";
import { getPromotionState, savePromotionState } from "@qafnest/shared/promotionStore";
import { INITIAL_DEFAULT_COUPONS, AdminCouponRecord } from "./defaultCoupons";

export type { AdminCouponRecord };
export let memoryCoupons: AdminCouponRecord[] = [];

let globalPromotionsEnabled = true;

export async function getAdminCoupons() {
  const supabase = createAdminDataClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: settingData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "promotions_enabled")
        .maybeSingle();

      if (settingData && typeof settingData.value === "boolean") {
        globalPromotionsEnabled = settingData.value;
      }

      if (!error && data && data.length > 0) {
        return { coupons: data, promotionsEnabled: globalPromotionsEnabled };
      }
    } catch {}
  }

  const localState = getPromotionState();
  return {
    coupons: localState.coupons,
    promotionsEnabled: localState.promotionsEnabled,
  };
}

export async function createAdminCouponRecord(body: Record<string, unknown>) {
  const rawCode = (typeof body.code === "string" ? body.code : "").trim().toUpperCase();
  if (!rawCode || rawCode.length < 3) {
    throw new Error("Promo code must be at least 3 characters.");
  }

  const type = body.type === "percentage" ? "percentage" : "fixed";
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Discount value must be greater than zero.");
  }
  if (type === "percentage" && value > 90) {
    throw new Error("Percentage discount cannot exceed 90%.");
  }

  const minSpend = Number(body.minSpend) || 0;
  const maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : undefined;
  const minNights = Number(body.minNights) || 1;
  const usageLimit = body.usageLimit ? Number(body.usageLimit) : undefined;
  const isActive = body.isActive !== false;
  const descriptionEn =
    (typeof body.descriptionEn === "string" ? body.descriptionEn : "").trim() ||
    `${value}${type === "percentage" ? "%" : " SAR"} promo discount`;
  const descriptionAr =
    (typeof body.descriptionAr === "string" ? body.descriptionAr : "").trim() ||
    `خصم ترويجي بقيمة ${value} ${type === "percentage" ? "%" : "ر.س"}`;
  const expiresAt = body.expiresAt
    ? new Date(String(body.expiresAt)).toISOString()
    : "2026-12-31T20:59:59Z";

  const newCoupon: AdminCouponRecord = {
    id: `coup-${Math.random().toString(36).slice(2, 10)}`,
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
    try {
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

      if (!error && data) {
        const localState = getPromotionState();
        localState.coupons.unshift(data);
        savePromotionState(localState);
        return data;
      }
    } catch {}
  }

  const localState = getPromotionState();
  localState.coupons.unshift(newCoupon);
  savePromotionState(localState);
  memoryCoupons.unshift(newCoupon);
  return newCoupon;
}

export async function updateAdminCouponRecord(id: string, body: Record<string, unknown>) {
  const supabase = createAdminDataClient();
  if (supabase) {
    try {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      const isActive =
        typeof body.is_active === "boolean"
          ? body.is_active
          : typeof body.isActive === "boolean"
          ? body.isActive
          : undefined;
      if (typeof isActive === "boolean") updatePayload.is_active = isActive;
      if (typeof body.value === "number") updatePayload.value = body.value;
      if (typeof body.type === "string") updatePayload.type = body.type;
      const minSpend =
        typeof body.min_spend === "number"
          ? body.min_spend
          : typeof body.minSpend === "number"
          ? body.minSpend
          : undefined;
      if (typeof minSpend === "number") updatePayload.min_spend = minSpend;
      const maxDiscount =
        typeof body.max_discount !== "undefined" ? body.max_discount : body.maxDiscount;
      if (typeof maxDiscount !== "undefined") updatePayload.max_discount = maxDiscount;
      const minNights =
        typeof body.min_nights === "number"
          ? body.min_nights
          : typeof body.minNights === "number"
          ? body.minNights
          : undefined;
      if (typeof minNights === "number") updatePayload.min_nights = minNights;
      const usageLimit =
        typeof body.usage_limit !== "undefined" ? body.usage_limit : body.usageLimit;
      if (typeof usageLimit !== "undefined") updatePayload.usage_limit = usageLimit;
      const descEn = body.description_en || body.descriptionEn;
      if (typeof descEn === "string") updatePayload.description_en = descEn;
      const descAr = body.description_ar || body.descriptionAr;
      if (typeof descAr === "string") updatePayload.description_ar = descAr;

      const { data, error } = await supabase
        .from("coupons")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        const localState = getPromotionState();
        const sIdx = localState.coupons.findIndex((c) => c.id === id);
        if (sIdx !== -1) {
          localState.coupons[sIdx] = data;
          savePromotionState(localState);
        }
        return data;
      }
    } catch {}
  }

  const localState = getPromotionState();
  const index = localState.coupons.findIndex((c) => c.id === id || c.code === body.code);
  if (index !== -1) {
    const prevC = localState.coupons[index];
    const updated: AdminCouponRecord = {
      ...prevC,
      code: body.code ? String(body.code).toUpperCase() : prevC.code,
      type: body.type === "percentage" || body.type === "fixed" ? body.type : prevC.type,
      value: typeof body.value === "number" ? body.value : prevC.value,
      min_spend:
        typeof body.min_spend === "number"
          ? body.min_spend
          : typeof body.minSpend === "number"
          ? body.minSpend
          : prevC.min_spend,
      max_discount:
        typeof body.max_discount !== "undefined"
          ? (body.max_discount as number)
          : typeof body.maxDiscount !== "undefined"
          ? (body.maxDiscount as number)
          : prevC.max_discount,
      min_nights:
        typeof body.min_nights === "number"
          ? body.min_nights
          : typeof body.minNights === "number"
          ? body.minNights
          : prevC.min_nights,
      usage_limit:
        typeof body.usage_limit !== "undefined"
          ? (body.usage_limit as number)
          : typeof body.usageLimit !== "undefined"
          ? (body.usageLimit as number)
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
    savePromotionState(localState);

    const memIdx = memoryCoupons.findIndex((c) => c.id === id || c.code === body.code);
    if (memIdx !== -1) memoryCoupons[memIdx] = updated;

    return updated;
  }

  return null;
}

export async function deleteAdminCouponRecord(id: string) {
  const supabase = createAdminDataClient();
  if (supabase) {
    try {
      await supabase.from("coupons").delete().eq("id", id);
    } catch {}
  }

  const localState = getPromotionState();
  localState.coupons = localState.coupons.filter((c) => c.id !== id && c.code !== id);
  savePromotionState(localState);

  memoryCoupons = memoryCoupons.filter((c) => c.id !== id);
}


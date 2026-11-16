import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPromotionState } from "@qafnest/shared/promotionStore";
import { hydrateRootJsonFile } from "@qafnest/shared/serverJsonStore";

export async function GET() {
  await hydrateRootJsonFile(".qafnest-promotions.json", () => ({ coupons: [], promotionsEnabled: true })).catch(() => undefined);
  try {
    const supabase = await createClient();

    // Check if promo system is enabled
    const { data: settingData } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "promotions_enabled")
      .maybeSingle();

    if (settingData && settingData.value === false) {
      return NextResponse.json({
        enabled: false,
        coupons: [],
      });
    }

    const { data: dbCoupons, error } = await supabase
      .from("coupons")
      .select("code, type, value, min_spend, max_discount, min_nights, description_en, description_ar")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && dbCoupons && dbCoupons.length > 0) {
      return NextResponse.json({
        enabled: true,
        coupons: dbCoupons,
      });
    }
  } catch {}

  // Check shared promotion store
  const localState = getPromotionState();
  if (localState.promotionsEnabled === false) {
    return NextResponse.json({
      enabled: false,
      coupons: [],
    });
  }

  const activeCoupons = (localState.coupons || []).filter((c) => {
    if (!c.is_active) return false;
    if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return false;
    return true;
  });

  return NextResponse.json({
    enabled: true,
    coupons: activeCoupons,
  });
}

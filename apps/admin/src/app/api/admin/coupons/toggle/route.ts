import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import {
  getPromotionState,
  hydratePromotionState,
  persistPromotionState,
} from "@qafnest/shared/promotionStore";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    await hydratePromotionState().catch(() => undefined);
    const body = await request.json();
    const action = body.action;
    const target = body.target || (action === "toggle_promotions" ? "global" : action === "toggle_coupon" ? "coupon" : undefined);
    const enabled = typeof body.enabled === "boolean" ? body.enabled : (typeof body.isActive === "boolean" ? body.isActive : undefined);
    const couponId = body.couponId || body.id;

    const supabase = createAdminDataClient();
    const localState = getPromotionState();

    // 1. Global toggle for promotions platform-wide
    if (target === "global" && typeof enabled === "boolean") {
      const isEnabled = enabled;
      if (supabase) {
        const { error: upsertErr } = await supabase
          .from("platform_settings")
          .upsert({
            key: "promotions_enabled",
            value: isEnabled,
            updated_at: new Date().toISOString(),
          });
        if (upsertErr) {
          console.error("[admin coupons toggle] platform_settings upsert failed:", upsertErr);
          return NextResponse.json({ code: "db_update_failed" }, { status: 500 });
        }
      }

      localState.promotionsEnabled = isEnabled;
      await persistPromotionState(localState);

      return NextResponse.json({
        success: true,
        target: "global",
        promotionsEnabled: isEnabled,
      });
    }

    // 2. Individual coupon toggle
    if (target === "coupon" && couponId && typeof enabled === "boolean") {
      const isEnabled = enabled;
      if (supabase) {
        const { data: updatedCoupon, error: couponErr } = await supabase
          .from("coupons")
          .update({
            is_active: isEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq("id", couponId)
          .select("id")
          .maybeSingle();
        if (couponErr) {
          console.error("[admin coupons toggle] coupon update failed:", couponErr);
          return NextResponse.json({ code: "db_update_failed" }, { status: 500 });
        }
        if (!updatedCoupon) {
          return NextResponse.json({ code: "coupon_not_found" }, { status: 404 });
        }
      }

      const matchIdx = localState.coupons.findIndex((c) => c.id === couponId || c.code === couponId);
      if (matchIdx !== -1) {
        localState.coupons[matchIdx].is_active = isEnabled;
        localState.coupons[matchIdx].updated_at = new Date().toISOString();
        await persistPromotionState(localState);
      } else if (!supabase) {
        return NextResponse.json({ code: "coupon_not_found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        target: "coupon",
        couponId,
        isActive: isEnabled,
      });
    }

    return NextResponse.json({ code: "invalid_payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ code: "server_error" }, { status: 500 });
  }
}

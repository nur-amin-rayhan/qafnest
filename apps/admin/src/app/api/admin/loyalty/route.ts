import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminApi";
import {
  getAdminLoyaltyConfig,
  updateAdminLoyaltySettings,
  toggleAdminLoyaltyOffer,
  saveAdminLoyaltyOffer,
  deleteAdminLoyaltyOffer,
} from "@/lib/services/adminLoyaltyService";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const config = getAdminLoyaltyConfig();
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action;

    if (action === "update_settings") {
      const updated = updateAdminLoyaltySettings(body.settings || {});
      return NextResponse.json({ success: true, settings: updated });
    }

    if (action === "toggle_offer") {
      const { offerId, isActive } = body;
      if (!offerId) {
        return NextResponse.json({ code: "missing_offer_id" }, { status: 400 });
      }
      const updatedOffers = toggleAdminLoyaltyOffer(offerId, Boolean(isActive));
      return NextResponse.json({ success: true, offers: updatedOffers });
    }

    if (action === "save_offer") {
      const { offer } = body;
      if (!offer) {
        return NextResponse.json({ code: "missing_offer_payload" }, { status: 400 });
      }
      const updatedOffers = saveAdminLoyaltyOffer(offer);
      return NextResponse.json({ success: true, offers: updatedOffers });
    }

    if (action === "delete_offer") {
      const { offerId } = body;
      if (!offerId) {
        return NextResponse.json({ code: "missing_offer_id" }, { status: 400 });
      }
      const updatedOffers = deleteAdminLoyaltyOffer(offerId);
      return NextResponse.json({ success: true, offers: updatedOffers });
    }

    return NextResponse.json({ code: "unknown_action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "internal_error", message: err instanceof Error ? err.message : "Error processing request" },
      { status: 500 }
    );
  }
}

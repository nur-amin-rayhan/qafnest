import { NextResponse } from "next/server";
import {
  getServerPlatformFeeConfig,
  getServerEffectiveGuestFeeConfig,
} from "@qafnest/shared/platformFeeStore";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const config = getServerPlatformFeeConfig();
    const guestFee = getServerEffectiveGuestFeeConfig(category);

    return NextResponse.json(
      {
        success: true,
        feeMode: guestFee.feeMode,
        fixedFeeAmountSar: guestFee.fixedFeeAmountSar,
        serviceFeeRate: guestFee.serviceFeeRate,
        serviceFeePercent: guestFee.serviceFeePercent,
        vatRatePercent: guestFee.vatRatePercent,
        baseCommissionPercent: config.baseCommissionPercent,
        hostCommissionPercent: guestFee.hostCommissionPercent,
        welcomeBonusAmountSar: guestFee.welcomeBonusAmountSar,
        welcomeBonusEnabled: guestFee.welcomeBonusEnabled,
        syncGuestServiceFee: config.syncGuestServiceFee,
        lastUpdatedAt: config.lastUpdatedAt,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load platform fee",
        feeMode: "percentage",
        fixedFeeAmountSar: 0,
        serviceFeeRate: 0.13,
        serviceFeePercent: 13,
        vatRatePercent: 15,
        welcomeBonusAmountSar: 50,
        welcomeBonusEnabled: true,
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminRequest } from "@/lib/adminApi";
import {
  getServerPlatformFeeConfig,
  updateServerPlatformFeeConfig,
  calculateServerPlatformFee,
} from "@qafnest/shared/platformFeeStore";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { code: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { searchParams } = request.nextUrl;
  const simulateAmount = searchParams.get("simulate_amount");

  if (simulateAmount) {
    const amount = Number(simulateAmount) || 1000;
    const category = searchParams.get("category") || undefined;
    const isNew = searchParams.get("is_new_host") === "true";
    const calculation = calculateServerPlatformFee(amount, category, isNew);
    return NextResponse.json(
      { success: true, calculation },
      { headers: NO_STORE_HEADERS }
    );
  }

  const config = getServerPlatformFeeConfig();
  return NextResponse.json(
    { success: true, config },
    { headers: NO_STORE_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { code: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const body = await request.json();
    const guestFeeMode =
      body?.guestFeeMode === "fixed_amount" || body?.guestFeeMode === "percentage"
        ? body.guestFeeMode
        : undefined;

    const feeUpdates: Record<string, unknown> = {
      ...(body || {}),
      syncGuestServiceFee: body?.syncGuestServiceFee !== undefined ? Boolean(body.syncGuestServiceFee) : true,
      lastUpdatedBy: body?.lastUpdatedBy || session.email || "Super Admin (Finance Officer)",
    };

    if (guestFeeMode !== undefined) feeUpdates.guestFeeMode = guestFeeMode;
    else delete feeUpdates.guestFeeMode;

    if (body?.guestServiceFeePercent !== undefined) {
      feeUpdates.guestServiceFeePercent = Math.max(0, Number(body.guestServiceFeePercent) || 0);
    } else {
      delete feeUpdates.guestServiceFeePercent;
    }

    if (body?.guestFixedFeeAmountSar !== undefined) {
      feeUpdates.guestFixedFeeAmountSar = Math.max(0, Number(body.guestFixedFeeAmountSar) || 0);
    } else {
      delete feeUpdates.guestFixedFeeAmountSar;
    }

    if (body?.baseCommissionPercent !== undefined) {
      feeUpdates.baseCommissionPercent = Math.max(0, Math.min(80, Number(body.baseCommissionPercent) || 0));
    } else {
      delete feeUpdates.baseCommissionPercent;
    }

    if (body?.welcomeBonusAmountSar !== undefined) {
      feeUpdates.welcomeBonusAmountSar = Math.max(0, Number(body.welcomeBonusAmountSar) || 0);
    } else {
      delete feeUpdates.welcomeBonusAmountSar;
    }

    if (typeof body?.welcomeBonusEnabled === "boolean") {
      feeUpdates.welcomeBonusEnabled = body.welcomeBonusEnabled;
    } else {
      delete feeUpdates.welcomeBonusEnabled;
    }

    const updated = updateServerPlatformFeeConfig(feeUpdates);

    const guestSummary =
      updated.guestFeeMode === "fixed_amount"
        ? `${updated.guestFixedFeeAmountSar} SAR fixed`
        : `${updated.guestServiceFeePercent}%`;

    return NextResponse.json(
      {
        success: true,
        message: `Guest service fee (${guestSummary}) and Host commission (${updated.baseCommissionPercent}%) saved successfully.`,
        config: updated,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        code: "invalid_request",
        message: err instanceof Error ? err.message : "Error updating platform fee config",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminRequest } from "@/lib/adminApi";
import {
  getServerPlatformFeeConfig,
  hydratePlatformFeeConfig,
  persistPlatformFeeConfig,
  updateServerPlatformFeeConfig,
  calculateServerPlatformFee,
} from "@qafnest/shared/platformFeeStore";
import {
  hydrateSignupSecurityStore,
  persistSignupSecurityStore,
  updateSignupSecurityPolicy,
} from "@qafnest/shared/signupSecurityStore";

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

  await hydratePlatformFeeConfig().catch(() => undefined);
  const { searchParams } = request.nextUrl;
  const simulateAmount = searchParams.get("simulate_amount");

  if (simulateAmount) {
    const amount = Number(simulateAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { code: "invalid_amount", message: "Simulation amount must be a positive number." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
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
    await hydratePlatformFeeConfig().catch(() => undefined);
    const body = await request.json();
    const parseFinite = (val: unknown, label: string, min: number, max?: number): number => {
      const n = Number(val);
      if (!Number.isFinite(n) || n < min || (max !== undefined && n > max)) {
        throw new Error(`Invalid numeric value for ${label}`);
      }
      return n;
    };

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
      feeUpdates.guestServiceFeePercent = parseFinite(body.guestServiceFeePercent, "guestServiceFeePercent", 0, 100);
    } else {
      delete feeUpdates.guestServiceFeePercent;
    }

    if (body?.guestFixedFeeAmountSar !== undefined) {
      feeUpdates.guestFixedFeeAmountSar = parseFinite(body.guestFixedFeeAmountSar, "guestFixedFeeAmountSar", 0);
    } else {
      delete feeUpdates.guestFixedFeeAmountSar;
    }

    if (body?.baseCommissionPercent !== undefined) {
      feeUpdates.baseCommissionPercent = parseFinite(body.baseCommissionPercent, "baseCommissionPercent", 0, 80);
    } else {
      delete feeUpdates.baseCommissionPercent;
    }

    if (body?.vatRatePercent !== undefined) {
      feeUpdates.vatRatePercent = parseFinite(body.vatRatePercent, "vatRatePercent", 0, 100);
    } else {
      delete feeUpdates.vatRatePercent;
    }

    if (body?.welcomeBonusAmountSar !== undefined) {
      feeUpdates.welcomeBonusAmountSar = parseFinite(body.welcomeBonusAmountSar, "welcomeBonusAmountSar", 0);
    } else {
      delete feeUpdates.welcomeBonusAmountSar;
    }

    if (typeof body?.welcomeBonusEnabled === "boolean") {
      feeUpdates.welcomeBonusEnabled = body.welcomeBonusEnabled;
    } else {
      delete feeUpdates.welcomeBonusEnabled;
    }

    const updated = updateServerPlatformFeeConfig(feeUpdates);
    await persistPlatformFeeConfig(updated).catch(() => undefined);

    if (
      typeof feeUpdates.welcomeBonusAmountSar === "number" ||
      typeof feeUpdates.welcomeBonusEnabled === "boolean"
    ) {
      await hydrateSignupSecurityStore().catch(() => undefined);
      updateSignupSecurityPolicy({
        ...(typeof feeUpdates.welcomeBonusAmountSar === "number"
          ? { welcomeBonusAmountSar: feeUpdates.welcomeBonusAmountSar }
          : {}),
        ...(typeof feeUpdates.welcomeBonusEnabled === "boolean"
          ? { welcomeBonusEnabled: feeUpdates.welcomeBonusEnabled }
          : {}),
      });
      await persistSignupSecurityStore().catch(() => undefined);
    }

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

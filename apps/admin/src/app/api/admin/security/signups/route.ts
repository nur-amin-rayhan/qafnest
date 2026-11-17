import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminRequest } from "@/lib/adminApi";
import {
  getSignupSecurityOverview,
  hydrateSignupSecurityStore,
  persistSignupSecurityStore,
  blockIpAddress,
  unblockIpAddress,
  clearIpRegistrationLock,
  clearDeviceRegistrationLock,
  updateSignupSecurityPolicy,
} from "@qafnest/shared/signupSecurityStore";
import {
  hydratePlatformFeeConfig,
  persistPlatformFeeConfig,
  updateServerPlatformFeeConfig,
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

  await Promise.all([hydrateSignupSecurityStore(), hydratePlatformFeeConfig()]);
  const overview = getSignupSecurityOverview();
  return NextResponse.json(
    { success: true, ...overview },
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
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      ip?: string;
      deviceId?: string;
      reason?: string;
      policy?: {
        enforceSingleAccountPerIp?: boolean;
        enforceSingleAccountPerDevice?: boolean;
        autoBlockRepeatIps?: boolean;
        welcomeBonusAmountSar?: number;
        welcomeBonusEnabled?: boolean;
      };
    };

    switch (body.action) {
      case "block_ip": {
        if (!body.ip?.trim()) {
          return NextResponse.json(
            { code: "invalid_ip", message: "IP address is required." },
            { status: 400, headers: NO_STORE_HEADERS }
          );
        }
        const doc = blockIpAddress(
          body.ip,
          body.reason || "Blocked manually by Admin",
          session.email || "Super Admin"
        );
        return NextResponse.json(
          { success: true, message: `IP ${body.ip} blocked.`, ...doc },
          { headers: NO_STORE_HEADERS }
        );
      }

      case "unblock_ip": {
        if (!body.ip?.trim()) {
          return NextResponse.json(
            { code: "invalid_ip", message: "IP address is required." },
            { status: 400, headers: NO_STORE_HEADERS }
          );
        }
        const doc = unblockIpAddress(body.ip);
        return NextResponse.json(
          { success: true, message: `IP ${body.ip} unblocked.`, ...doc },
          { headers: NO_STORE_HEADERS }
        );
      }

      case "clear_ip_lock": {
        if (!body.ip?.trim()) {
          return NextResponse.json(
            { code: "invalid_ip", message: "IP address is required." },
            { status: 400, headers: NO_STORE_HEADERS }
          );
        }
        const doc = clearIpRegistrationLock(body.ip);
        return NextResponse.json(
          { success: true, message: `IP registration lock reset for ${body.ip}.`, ...doc },
          { headers: NO_STORE_HEADERS }
        );
      }

      case "clear_device_lock": {
        if (!body.deviceId?.trim()) {
          return NextResponse.json(
            { code: "invalid_device", message: "Device ID is required." },
            { status: 400, headers: NO_STORE_HEADERS }
          );
        }
        const doc = clearDeviceRegistrationLock(body.deviceId);
        return NextResponse.json(
          { success: true, message: `Device lock cleared.`, ...doc },
          { headers: NO_STORE_HEADERS }
        );
      }

      case "update_policy": {
        await Promise.all([hydrateSignupSecurityStore(), hydratePlatformFeeConfig()]);
        const policyUpdates = body.policy || {};
        if (policyUpdates.welcomeBonusAmountSar !== undefined) {
          policyUpdates.welcomeBonusAmountSar = Math.max(
            0,
            Math.round(Number(policyUpdates.welcomeBonusAmountSar) * 100) / 100
          );
        }
        const doc = updateSignupSecurityPolicy(policyUpdates);
        await persistSignupSecurityStore();
        if (
          policyUpdates.welcomeBonusAmountSar !== undefined ||
          policyUpdates.welcomeBonusEnabled !== undefined
        ) {
          const updatedFee = updateServerPlatformFeeConfig({
            welcomeBonusAmountSar: policyUpdates.welcomeBonusAmountSar,
            welcomeBonusEnabled: policyUpdates.welcomeBonusEnabled,
          });
          await persistPlatformFeeConfig(updatedFee);
        }
        return NextResponse.json(
          { success: true, message: "Signup security & welcome bonus policy updated.", ...doc },
          { headers: NO_STORE_HEADERS }
        );
      }

      default:
        return NextResponse.json(
          { code: "unknown_action", message: "Unsupported security action." },
          { status: 400, headers: NO_STORE_HEADERS }
        );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      {
        code: "error",
        message: err instanceof Error ? err.message : "Failed to update security controls.",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

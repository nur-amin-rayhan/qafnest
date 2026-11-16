import { NextRequest, NextResponse } from "next/server";
import {
  getServerSaudiIdentityConfig,
  updateServerSaudiIdentityConfig,
} from "@qafnest/shared/saudiIdentityStore";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { DEFAULT_IDENTITY_CONFIG, type SaudiIdentityConfig } from "@qafnest/shared/saudiIdentityConfig";
import { isAdminRequest } from "@/lib/adminApi";

const SAUDI_IDENTITY_FILE = "saudi-identity-config.json";
const CONFIGURED_SENTINEL = "__CONFIGURED__";

function redactIdentityConfig(cfg: SaudiIdentityConfig) {
  return {
    ...cfg,
    yakeen: {
      ...cfg.yakeen,
      appKey: cfg.yakeen.appKey ? CONFIGURED_SENTINEL : "",
      hasAppKey: Boolean(cfg.yakeen.appKey),
    },
    nafath: {
      ...cfg.nafath,
      appKey: cfg.nafath.appKey ? CONFIGURED_SENTINEL : "",
      hasAppKey: Boolean(cfg.nafath.appKey),
    },
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await hydrateSharedJsonFile<SaudiIdentityConfig>(SAUDI_IDENTITY_FILE, () => DEFAULT_IDENTITY_CONFIG);
  const config = getServerSaudiIdentityConfig();
  return NextResponse.json({ success: true, config: redactIdentityConfig(config) });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<SaudiIdentityConfig>(SAUDI_IDENTITY_FILE, () => DEFAULT_IDENTITY_CONFIG);
    const existing = getServerSaudiIdentityConfig();
    const body = (await request.json()) as Partial<SaudiIdentityConfig>;
    const normalizedBody: Partial<SaudiIdentityConfig> = {
      ...body,
      ...(body.yakeen
        ? {
            yakeen: {
              ...body.yakeen,
              appKey:
                body.yakeen.appKey === CONFIGURED_SENTINEL
                  ? existing.yakeen.appKey
                  : body.yakeen.appKey,
            },
          }
        : {}),
      ...(body.nafath
        ? {
            nafath: {
              ...body.nafath,
              appKey:
                body.nafath.appKey === CONFIGURED_SENTINEL
                  ? existing.nafath.appKey
                  : body.nafath.appKey,
            },
          }
        : {}),
    };
    const updated = updateServerSaudiIdentityConfig(normalizedBody);
    await persistSharedJsonFile(SAUDI_IDENTITY_FILE, updated);
    return NextResponse.json({ success: true, config: redactIdentityConfig(updated) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update identity configuration";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

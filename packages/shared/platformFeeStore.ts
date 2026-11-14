import fs from "fs";
import path from "path";
import {
  PlatformFeeConfig,
  DEFAULT_FEE_CONFIG,
  EffectiveGuestFeeConfig,
  calculatePlatformFee as calcFeePure,
  getEffectiveGuestFeeConfig,
  normalizeFeeConfigUpdates,
} from "./platformFee";

function findMonorepoRoot(): string {
  let curr = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(curr, "packages", "shared"))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return process.cwd();
}

function getStoreFilePath(): string {
  const root = findMonorepoRoot();
  return path.join(root, "packages", "shared", "data", "platform-fee-config.json");
}

export function getServerPlatformFeeConfig(): PlatformFeeConfig {
  try {
    const filePath = getStoreFilePath();
    if (!fs.existsSync(filePath)) {
      writeServerPlatformFeeConfig(DEFAULT_FEE_CONFIG);
      return DEFAULT_FEE_CONFIG;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.baseCommissionPercent === "number") {
      return {
        ...DEFAULT_FEE_CONFIG,
        ...parsed,
        syncGuestServiceFee: parsed.syncGuestServiceFee === true,
        guestFeeMode: parsed.guestFeeMode === "fixed_amount" ? "fixed_amount" : "percentage",
        guestFixedFeeAmountSar:
          typeof parsed.guestFixedFeeAmountSar === "number" ? parsed.guestFixedFeeAmountSar : 0,
        guestServiceFeePercent:
          typeof parsed.guestServiceFeePercent === "number" ? parsed.guestServiceFeePercent : 13.0,
        welcomeBonusAmountSar:
          typeof parsed.welcomeBonusAmountSar === "number" ? parsed.welcomeBonusAmountSar : 50.0,
        welcomeBonusEnabled: parsed.welcomeBonusEnabled !== false,
      };
    }
    return DEFAULT_FEE_CONFIG;
  } catch (err) {
    console.error("[platformFeeStore] read error:", err);
    return DEFAULT_FEE_CONFIG;
  }
}

export function writeServerPlatformFeeConfig(config: PlatformFeeConfig): void {
  try {
    const filePath = getStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error("[platformFeeStore] write error:", err);
  }
}

export function updateServerPlatformFeeConfig(updates: Partial<PlatformFeeConfig>): PlatformFeeConfig {
  const current = getServerPlatformFeeConfig();
  const nextConfig = normalizeFeeConfigUpdates(current, updates);
  writeServerPlatformFeeConfig(nextConfig);
  return nextConfig;
}

export function getServerEffectiveGuestFeeConfig(category?: string): EffectiveGuestFeeConfig {
  const config = getServerPlatformFeeConfig();
  return getEffectiveGuestFeeConfig(category, config);
}

export function getServerEffectiveGuestFeeRate(category?: string): number {
  return getServerEffectiveGuestFeeConfig(category).serviceFeeRate;
}

export function calculateServerPlatformFee(grossAmount: number, category?: string, isNewHost?: boolean) {
  const config = getServerPlatformFeeConfig();
  return calcFeePure(grossAmount, config, category, isNewHost);
}

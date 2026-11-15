import {
  PlatformFeeConfig,
  DEFAULT_FEE_CONFIG,
  EffectiveGuestFeeConfig,
  calculatePlatformFee as calcFeePure,
  getEffectiveGuestFeeConfig,
  normalizeFeeConfigUpdates,
} from "./platformFee";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

const PLATFORM_FEE_FILE = "platform-fee-config.json";

export function getServerPlatformFeeConfig(): PlatformFeeConfig {
  return readSharedJsonFile<PlatformFeeConfig>(
    PLATFORM_FEE_FILE,
    () => DEFAULT_FEE_CONFIG,
    (parsed) => {
      const candidate = parsed as Partial<PlatformFeeConfig> | null;
      if (candidate && typeof candidate.baseCommissionPercent === "number") {
        return {
          ...DEFAULT_FEE_CONFIG,
          ...candidate,
          syncGuestServiceFee: candidate.syncGuestServiceFee === true,
          guestFeeMode: candidate.guestFeeMode === "fixed_amount" ? "fixed_amount" : "percentage",
          guestFixedFeeAmountSar:
            typeof candidate.guestFixedFeeAmountSar === "number" ? candidate.guestFixedFeeAmountSar : 0,
          guestServiceFeePercent:
            typeof candidate.guestServiceFeePercent === "number" ? candidate.guestServiceFeePercent : 13.0,
          welcomeBonusAmountSar:
            typeof candidate.welcomeBonusAmountSar === "number" ? candidate.welcomeBonusAmountSar : 50.0,
          welcomeBonusEnabled: candidate.welcomeBonusEnabled !== false,
        };
      }
      return DEFAULT_FEE_CONFIG;
    }
  );
}

export function writeServerPlatformFeeConfig(config: PlatformFeeConfig): void {
  writeSharedJsonFile(PLATFORM_FEE_FILE, config);
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

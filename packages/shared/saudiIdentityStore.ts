import {
  SaudiIdentityConfig,
  DEFAULT_IDENTITY_CONFIG,
} from "./saudiIdentity";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

export * from "./saudiIdentity";
export const DEFAULT_SAUDI_IDENTITY_CONFIG = DEFAULT_IDENTITY_CONFIG;

const SAUDI_IDENTITY_FILE = "saudi-identity-config.json";

export function getServerSaudiIdentityConfig(): SaudiIdentityConfig {
  return readSharedJsonFile<SaudiIdentityConfig>(
    SAUDI_IDENTITY_FILE,
    () => DEFAULT_IDENTITY_CONFIG,
    (parsed) => {
      const candidate = parsed as Partial<SaudiIdentityConfig> | null;
      if (candidate && typeof candidate.isMandatoryForGuests === "boolean") {
        return { ...DEFAULT_IDENTITY_CONFIG, ...candidate };
      }
      return DEFAULT_IDENTITY_CONFIG;
    }
  );
}

export function writeServerSaudiIdentityConfig(config: SaudiIdentityConfig): void {
  writeSharedJsonFile(SAUDI_IDENTITY_FILE, config);
}

export function updateServerSaudiIdentityConfig(
  updates: Partial<SaudiIdentityConfig>
): SaudiIdentityConfig {
  const current = getServerSaudiIdentityConfig();
  const nextConfig: SaudiIdentityConfig = {
    ...current,
    ...updates,
    yakeen: {
      ...current.yakeen,
      ...(updates.yakeen || {}),
    },
    nafath: {
      ...current.nafath,
      ...(updates.nafath || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  writeServerSaudiIdentityConfig(nextConfig);
  return nextConfig;
}

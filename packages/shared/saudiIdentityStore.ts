import fs from "fs";
import path from "path";
import {
  SaudiIdentityConfig,
  DEFAULT_IDENTITY_CONFIG,
} from "./saudiIdentity";

export * from "./saudiIdentity";

function findMonorepoRoot(): string {
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
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
  return path.join(root, "packages", "shared", "data", "saudi-identity-config.json");
}

export function getServerSaudiIdentityConfig(): SaudiIdentityConfig {
  try {
    const filePath = getStoreFilePath();
    if (!fs.existsSync(filePath)) {
      writeServerSaudiIdentityConfig(DEFAULT_IDENTITY_CONFIG);
      return DEFAULT_IDENTITY_CONFIG;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.isMandatoryForGuests === "boolean") {
      return { ...DEFAULT_IDENTITY_CONFIG, ...parsed };
    }
    return DEFAULT_IDENTITY_CONFIG;
  } catch (err) {
    console.error("[saudiIdentityConfig] read error:", err);
    return DEFAULT_IDENTITY_CONFIG;
  }
}

export function writeServerSaudiIdentityConfig(config: SaudiIdentityConfig): void {
  try {
    const filePath = getStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("[saudiIdentityConfig] write error:", err);
  }
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

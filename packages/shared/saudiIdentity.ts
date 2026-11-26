/**
 * Saudi Identity Verification configuration types and defaults
 * Pure model - safe for browser and server bundles.
 */

export interface SaudiIdentityConfig {
  enabled: boolean;
  isMandatoryForGuests: boolean;
  isMandatoryForHosts: boolean;
  activeProvider: "yakeen" | "nafath" | "sandbox";
  yakeen: {
    appId: string;
    appKey: string;
    organizationNumber: string;
    baseUrl?: string;
  };
  nafath: {
    appId: string;
    appKey: string;
    baseUrl?: string;
  };
  updatedAt: string;
}

export function isValidSaudiIdDigits(raw: string, expectedPrefix?: "1" | "2"): boolean {
  const cleaned = raw.trim().replace(/\D/g, "");
  if (expectedPrefix === "1" && !/^1\d{9}$/.test(cleaned)) return false;
  if (expectedPrefix === "2" && !/^2\d{9}$/.test(cleaned)) return false;
  if (!expectedPrefix && !/^(1|2)\d{9}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = parseInt(cleaned[i], 10);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }
  return sum % 10 === 0;
}

export const DEFAULT_IDENTITY_CONFIG: SaudiIdentityConfig = {
  enabled: true,
  isMandatoryForGuests: true,
  isMandatoryForHosts: true,
  activeProvider: "sandbox",
  yakeen: {
    appId: "",
    appKey: "",
    organizationNumber: "0000000000",
    baseUrl: "https://yakeen.elm.sa/api",
  },
  nafath: {
    appId: "",
    appKey: "",
    baseUrl: "https://nafath.api.elm.sa",
  },
  updatedAt: new Date().toISOString(),
};

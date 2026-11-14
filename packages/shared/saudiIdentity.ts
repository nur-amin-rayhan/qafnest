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

export const DEFAULT_IDENTITY_CONFIG: SaudiIdentityConfig = {
  enabled: true,
  isMandatoryForGuests: false, // Optional for testing as requested
  isMandatoryForHosts: true,   // Mandatory for real hosts
  activeProvider: "sandbox",
  yakeen: {
    appId: "",
    appKey: "",
    organizationNumber: "7007384501",
    baseUrl: "https://yakeen.elm.sa/api",
  },
  nafath: {
    appId: "",
    appKey: "",
    baseUrl: "https://nafath.api.elm.sa",
  },
  updatedAt: new Date().toISOString(),
};

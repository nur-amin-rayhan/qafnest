import { getServiceRoleClient } from "@/lib/supabase/service";
import { readRootJsonFile, writeRootJsonFile } from "@qafnest/shared/serverJsonStore";
import { DEFAULT_LOYALTY_SETTINGS, type WalletStoreState } from "./walletTypes";

const WALLET_STORE_FILE = ".qafnest-wallets.json";

export function defaultWalletStoreState(): WalletStoreState {
  return {
    wallets: {},
    activeOffers: [],
    loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
    pendingSplits: {},
  };
}

export function loadWalletStore(): WalletStoreState {
  return readRootJsonFile<WalletStoreState>(
    WALLET_STORE_FILE,
    defaultWalletStoreState,
    (parsed) => {
      const candidate = parsed as Partial<WalletStoreState> | null;
      if (candidate && typeof candidate.wallets === "object" && candidate.wallets !== null) {
        return {
          wallets: candidate.wallets || {},
          activeOffers: Array.isArray(candidate.activeOffers) ? candidate.activeOffers : [],
          loyaltySettings: candidate.loyaltySettings || DEFAULT_LOYALTY_SETTINGS,
          pendingSplits:
            candidate.pendingSplits && typeof candidate.pendingSplits === "object"
              ? candidate.pendingSplits
              : {},
        };
      }
      return defaultWalletStoreState();
    }
  );
}

export function saveWalletStore(state: WalletStoreState): void {
  writeRootJsonFile(WALLET_STORE_FILE, state);
}

export function determineTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" {
  if (points >= 5000) return "Platinum";
  if (points >= 2000) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

/** Sync wallet balance / loyalty metadata changes to Supabase Auth without aborting local flow. */
export async function syncWalletUserMetadata(
  userId: string,
  userMetadata: Record<string, unknown>
): Promise<void> {
  try {
    const admin = getServiceRoleClient();
    await admin.auth.admin.updateUserById(userId, { user_metadata: userMetadata });
  } catch (err) {
    console.warn("Notice: Could not sync user metadata in Supabase:", err);
  }
}

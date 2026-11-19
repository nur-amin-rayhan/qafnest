import crypto from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/service";
import { hydrateRootJsonFile, readRootJsonFile, writeRootJsonFile } from "@qafnest/shared/serverJsonStore";
import {
  DEFAULT_LOYALTY_SETTINGS,
  type PendingWalletSplit,
  type PendingWalletTopUp,
  type UserWalletData,
  type WalletStoreState,
} from "./walletTypes";

const WALLET_STORE_FILE = ".qafnest-wallets.json";
const PRIVATE_STATE_BUCKET = "qafnest-private-state";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let bucketEnsured = false;

async function ensurePrivateStateBucket(): Promise<void> {
  if (bucketEnsured) return;
  try {
    const admin = getServiceRoleClient();
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === PRIVATE_STATE_BUCKET)) {
      await admin.storage.createBucket(PRIVATE_STATE_BUCKET, { public: false });
    }
    bucketEnsured = true;
  } catch (err) {
    console.warn("Notice: Could not verify private state bucket:", err);
  }
}

function safeStorageKey(rawKey: string): string {
  const cleanPrefix = rawKey.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "key";
  const digest = crypto.createHash("sha256").update(rawKey).digest("hex").slice(0, 16);
  return `${cleanPrefix}_${digest}`;
}

async function readCloudJson<T>(objectPath: string): Promise<T | null> {
  try {
    const admin = getServiceRoleClient();
    const { data, error } = await admin.storage.from(PRIVATE_STATE_BUCKET).download(objectPath);
    if (error || !data) return null;
    const raw = await data.text();
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeCloudJson(objectPath: string, payload: unknown): Promise<void> {
  try {
    await ensurePrivateStateBucket();
    const admin = getServiceRoleClient();
    await admin.storage.from(PRIVATE_STATE_BUCKET).upload(objectPath, JSON.stringify(payload), {
      contentType: "application/json",
      upsert: true,
    });
  } catch (err) {
    console.warn(`Notice: Could not persist ${objectPath} to cloud state:`, err);
  }
}

export function defaultWalletStoreState(): WalletStoreState {
  return {
    wallets: {},
    activeOffers: [],
    loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
    pendingSplits: {},
    pendingTopUps: {},
    processedTopUpPaymentIds: [],
  };
}

function normalizeWalletStoreState(parsed: unknown): WalletStoreState {
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
      pendingTopUps:
        candidate.pendingTopUps && typeof candidate.pendingTopUps === "object"
          ? candidate.pendingTopUps
          : {},
      processedTopUpPaymentIds: Array.isArray(candidate.processedTopUpPaymentIds)
        ? candidate.processedTopUpPaymentIds
        : [],
    };
  }
  return defaultWalletStoreState();
}

export function loadWalletStore(): WalletStoreState {
  return readRootJsonFile<WalletStoreState>(
    WALLET_STORE_FILE,
    defaultWalletStoreState,
    normalizeWalletStoreState
  );
}

export async function hydrateWalletStore(): Promise<WalletStoreState> {
  return hydrateRootJsonFile<WalletStoreState>(
    WALLET_STORE_FILE,
    defaultWalletStoreState,
    normalizeWalletStoreState
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

export function isSupabaseUuid(userId: string): boolean {
  return UUID_RE.test(userId);
}

export async function loadCloudUserWallet(userId: string): Promise<UserWalletData | null> {
  if (!userId) return null;
  return readCloudJson<UserWalletData>(`wallets/${safeStorageKey(userId)}.json`);
}

export async function saveCloudUserWallet(wallet: UserWalletData): Promise<void> {
  if (!wallet?.userId) return;
  await writeCloudJson(`wallets/${safeStorageKey(wallet.userId)}.json`, wallet);
}

export async function loadCloudPendingSplit(bookingRef: string): Promise<PendingWalletSplit | null> {
  if (!bookingRef) return null;
  return readCloudJson<PendingWalletSplit>(`splits/${safeStorageKey(bookingRef)}.json`);
}

export async function saveCloudPendingSplit(split: PendingWalletSplit): Promise<void> {
  if (!split?.bookingRef) return;
  await writeCloudJson(`splits/${safeStorageKey(split.bookingRef)}.json`, split);
}

export async function deleteCloudPendingSplit(bookingRef: string): Promise<void> {
  if (!bookingRef) return;
  try {
    const admin = getServiceRoleClient();
    await admin.storage.from(PRIVATE_STATE_BUCKET).remove([`splits/${safeStorageKey(bookingRef)}.json`]);
  } catch {}
}

export async function loadCloudPendingTopUp(reference: string): Promise<PendingWalletTopUp | null> {
  if (!reference) return null;
  return readCloudJson<PendingWalletTopUp>(`topups/${safeStorageKey(reference)}.json`);
}

export async function saveCloudPendingTopUp(topup: PendingWalletTopUp): Promise<void> {
  if (!topup?.reference) return;
  await writeCloudJson(`topups/${safeStorageKey(topup.reference)}.json`, topup);
}

export async function isCloudTopUpPaymentProcessed(paymentId: string): Promise<boolean> {
  if (!paymentId) return false;
  const marker = await readCloudJson<{ processed?: boolean }>(`topup-payments/${safeStorageKey(paymentId)}.json`);
  return Boolean(marker?.processed);
}

export async function markCloudTopUpPaymentProcessed(paymentId: string, reference: string): Promise<void> {
  if (!paymentId) return;
  await writeCloudJson(`topup-payments/${safeStorageKey(paymentId)}.json`, {
    processed: true,
    reference,
    processedAt: new Date().toISOString(),
  });
}

/** Sync wallet balance / loyalty metadata changes to Supabase Auth for UUID users. */
export async function syncWalletUserMetadata(
  userId: string,
  userMetadata: Record<string, unknown>
): Promise<void> {
  if (!isSupabaseUuid(userId)) return;
  try {
    const admin = getServiceRoleClient();
    await admin.auth.admin.updateUserById(userId, { user_metadata: userMetadata });
  } catch (err) {
    console.warn("Notice: Could not sync user metadata in Supabase:", err);
  }
}

/** Writes wallet state to L1 store, durable Supabase Private Storage, and optional Supabase user_metadata. */
export async function commitUserWallet(
  wallet: UserWalletData,
  metadataPatch?: Record<string, unknown>
): Promise<void> {
  wallet.updatedAt = new Date().toISOString();
  const store = loadWalletStore();
  store.wallets[wallet.userId] = wallet;
  saveWalletStore(store);
  await saveCloudUserWallet(wallet);
  if (metadataPatch) {
    await syncWalletUserMetadata(wallet.userId, metadataPatch);
  }
}

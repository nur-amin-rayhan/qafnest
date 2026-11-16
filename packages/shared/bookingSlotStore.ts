import fs from "fs";
import path from "path";
import {
  createDefaultPropertySlotConfig,
  sanitizePropertySlotConfig,
  type DateSlotOverride,
  type PropertyBookingSlotConfig,
} from "./bookingSlotConfig";
import {
  getTmpDataDir,
  getWritableLockDir,
  hydrateSharedJsonFile,
  isUnwritableFsError,
  markReadOnlyFsFallback,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";

interface StoredSlotConfigDocument {
  configs: Record<string, PropertyBookingSlotConfig>;
  slugToPropertyId: Record<string, string>;
}

const CUSTOM_DAY_SLOT_CONFIG_KEY = "__slotConfig";
const SLOT_CONFIGS_FILE = "booking-slot-configs.json";
const inMemoryQueues = new Map<string, Promise<unknown>>();
let warnedLockFallback = false;

const normalizeSlotConfigDoc = (parsed: unknown): StoredSlotConfigDocument => {
  const candidate = parsed as Partial<StoredSlotConfigDocument>;
  return {
    configs: candidate?.configs && typeof candidate.configs === "object" ? candidate.configs : {},
    slugToPropertyId:
      candidate?.slugToPropertyId && typeof candidate.slugToPropertyId === "object"
        ? candidate.slugToPropertyId
        : {},
  };
};

export async function hydrateBookingSlotStore(): Promise<StoredSlotConfigDocument> {
  return hydrateSharedJsonFile<StoredSlotConfigDocument>(
    SLOT_CONFIGS_FILE,
    () => ({ configs: {}, slugToPropertyId: {} }),
    normalizeSlotConfigDoc
  );
}

export async function persistBookingSlotStore(): Promise<boolean> {
  return persistSharedJsonFile(SLOT_CONFIGS_FILE, readStoreDocument());
}

function readStoreDocument(): StoredSlotConfigDocument {
  return readSharedJsonFile<StoredSlotConfigDocument>(
    SLOT_CONFIGS_FILE,
    () => ({ configs: {}, slugToPropertyId: {} }),
    normalizeSlotConfigDoc
  );
}

function writeStoreDocument(doc: StoredSlotConfigDocument): void {
  writeSharedJsonFile(SLOT_CONFIGS_FILE, doc);
}

export function extractSlotConfigFromCustomDayPricing(
  customDayPricing: unknown,
  propertyId: string,
  slug?: string
): PropertyBookingSlotConfig | null {
  if (!customDayPricing || typeof customDayPricing !== "object") return null;
  const embedded = (customDayPricing as Record<string, unknown>)[CUSTOM_DAY_SLOT_CONFIG_KEY];
  if (!embedded || typeof embedded !== "object") return null;
  return sanitizePropertySlotConfig(embedded, propertyId, slug);
}

export function mergeSlotConfigIntoCustomDayPricing(
  customDayPricing: unknown,
  config: PropertyBookingSlotConfig
): Record<string, unknown> {
  const baseObj: Record<string, unknown> =
    customDayPricing && typeof customDayPricing === "object"
      ? { ...(customDayPricing as Record<string, unknown>) }
      : {};
  baseObj[CUSTOM_DAY_SLOT_CONFIG_KEY] = {
    enableStandard4pmTo12pm: config.enableStandard4pmTo12pm,
    enableTwelveHour12amTo12pm: config.enableTwelveHour12amTo12pm,
    twelveHourPrice: config.twelveHourPrice,
    hostBlockedDates: config.hostBlockedDates || [],
    dateSlotOverrides: config.dateSlotOverrides || {},
    updatedBy: config.updatedBy,
    updatedAt: config.updatedAt,
  };
  return baseObj;
}

export function getServerPropertySlotConfig(params: {
  propertyId: string;
  slug?: string | null;
  dbCustomDayPricing?: unknown;
}): PropertyBookingSlotConfig {
  const { propertyId, slug, dbCustomDayPricing } = params;
  const doc = readStoreDocument();

  const fileConfig =
    doc.configs[propertyId] ||
    (slug ? doc.configs[slug] : undefined) ||
    (doc.slugToPropertyId[propertyId] ? doc.configs[doc.slugToPropertyId[propertyId]] : undefined) ||
    (slug && doc.slugToPropertyId[slug] ? doc.configs[doc.slugToPropertyId[slug]] : undefined);
  const dbConfig = extractSlotConfigFromCustomDayPricing(dbCustomDayPricing, propertyId, slug || undefined);

  if (fileConfig && dbConfig) {
    const fileTs = Date.parse(fileConfig.updatedAt || "0") || 0;
    const dbTs = Date.parse(dbConfig.updatedAt || "0") || 0;
    return sanitizePropertySlotConfig(fileTs >= dbTs ? fileConfig : dbConfig, propertyId, slug || undefined);
  }
  if (fileConfig) {
    return sanitizePropertySlotConfig(fileConfig, propertyId, slug || undefined);
  }
  if (dbConfig) {
    return sanitizePropertySlotConfig(dbConfig, propertyId, slug || undefined);
  }
  return createDefaultPropertySlotConfig(propertyId, slug || undefined);
}

export function updateServerPropertySlotConfig(params: {
  propertyId: string;
  slug?: string | null;
  dbCustomDayPricing?: unknown;
  updates: {
    enableStandard4pmTo12pm?: boolean;
    enableTwelveHour12amTo12pm?: boolean;
    twelveHourPrice?: number | null;
    hostBlockedDates?: string[];
    dateSlotOverrides?: Record<string, DateSlotOverride | null>;
    updatedBy?: "host" | "admin";
  };
}): PropertyBookingSlotConfig {
  const { propertyId, slug, dbCustomDayPricing, updates } = params;
  const doc = readStoreDocument();
  const current = getServerPropertySlotConfig({ propertyId, slug, dbCustomDayPricing });

  const nextOverrides: Record<string, DateSlotOverride> = { ...current.dateSlotOverrides };
  if (updates.dateSlotOverrides && typeof updates.dateSlotOverrides === "object") {
    for (const [dateKey, ov] of Object.entries(updates.dateSlotOverrides)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
      if (ov === null) {
        delete nextOverrides[dateKey];
      } else {
        const merged = { ...(nextOverrides[dateKey] || {}), ...ov };
        const clean: DateSlotOverride = {};
        if (typeof merged.standardEnabled === "boolean") clean.standardEnabled = merged.standardEnabled;
        if (typeof merged.twelveHourEnabled === "boolean") clean.twelveHourEnabled = merged.twelveHourEnabled;
        if (typeof merged.fullDayClosed === "boolean") clean.fullDayClosed = merged.fullDayClosed;
        if (merged.twelveHourPrice !== undefined) {
          clean.twelveHourPrice =
            merged.twelveHourPrice !== null && Number(merged.twelveHourPrice) > 0
              ? Math.round(Number(merged.twelveHourPrice) * 100) / 100
              : null;
        }
        if (merged.standardPrice !== undefined) {
          clean.standardPrice =
            merged.standardPrice !== null && Number(merged.standardPrice) > 0
              ? Math.round(Number(merged.standardPrice) * 100) / 100
              : null;
        }
        nextOverrides[dateKey] = clean;
      }
    }
  }

  const nextConfig = sanitizePropertySlotConfig(
    {
      ...current,
      propertyId,
      slug: slug || current.slug,
      enableStandard4pmTo12pm:
        typeof updates.enableStandard4pmTo12pm === "boolean"
          ? updates.enableStandard4pmTo12pm
          : current.enableStandard4pmTo12pm,
      enableTwelveHour12amTo12pm:
        typeof updates.enableTwelveHour12amTo12pm === "boolean"
          ? updates.enableTwelveHour12amTo12pm
          : current.enableTwelveHour12amTo12pm,
      twelveHourPrice:
        updates.twelveHourPrice !== undefined
          ? updates.twelveHourPrice !== null && Number(updates.twelveHourPrice) > 0
            ? Math.round(Number(updates.twelveHourPrice) * 100) / 100
            : null
          : current.twelveHourPrice,
      hostBlockedDates: Array.isArray(updates.hostBlockedDates)
        ? updates.hostBlockedDates
        : current.hostBlockedDates,
      dateSlotOverrides: nextOverrides,
      updatedBy: updates.updatedBy || "host",
      updatedAt: new Date().toISOString(),
    },
    propertyId,
    slug || current.slug
  );

  doc.configs[propertyId] = nextConfig;
  if (slug) {
    doc.configs[slug] = nextConfig;
    doc.slugToPropertyId[slug] = propertyId;
  }
  if (current.slug && current.slug !== slug) {
    doc.configs[current.slug] = nextConfig;
    doc.slugToPropertyId[current.slug] = propertyId;
  }
  writeStoreDocument(doc);
  return nextConfig;
}

export function listAllServerPropertySlotConfigs(): Record<string, PropertyBookingSlotConfig> {
  return readStoreDocument().configs;
}

async function runWithInProcessMutex<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = inMemoryQueues.get(key) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => next, () => next);
  inMemoryQueues.set(key, chained);

  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
    if (inMemoryQueues.get(key) === chained) {
      inMemoryQueues.delete(key);
    }
  }
}

function getLockFilePath(key: string, dirOverride?: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 96);
  return path.join(dirOverride || getWritableLockDir(), `${safeKey}.lock`);
}

type FileLockAttempt =
  | { status: "acquired"; fd: number; lockPath: string }
  | { status: "busy" }
  | { status: "unavailable" };

function openExclusiveLockFile(lockPath: string): FileLockAttempt {
  try {
    const dir = path.dirname(lockPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const fd = fs.openSync(lockPath, "wx");
    return { status: "acquired", fd, lockPath };
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "EEXIST") {
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > 15_000) {
          fs.unlinkSync(lockPath);
          const fd = fs.openSync(lockPath, "wx");
          return { status: "acquired", fd, lockPath };
        }
      } catch {
        // Retry on next backoff tick
      }
      return { status: "busy" };
    }
    if (isUnwritableFsError(err)) {
      markReadOnlyFsFallback();
      const tmpLockPath = getLockFilePath(path.basename(lockPath, ".lock"), path.join(getTmpDataDir(), ".locks"));
      if (tmpLockPath !== lockPath) {
        return openExclusiveLockFile(tmpLockPath);
      }
    }
    if (!warnedLockFallback) {
      warnedLockFallback = true;
      console.warn("[bookingSlotStore] Lockfile unavailable, falling back to in-process mutex:", code || err);
    }
    return { status: "unavailable" };
  }
}

/**
 * Prevents simultaneous checkout or admin/host mutations on the same property from creating
 * overlapping bookings or overwriting active slots. Serializes via in-process mutex + atomic lockfile
 * (falling back cleanly to in-process mutex when running on a read-only filesystem).
 */
export async function acquirePropertyBookingLock<T>(
  propertyKeys: string | Array<string | null | undefined>,
  fn: () => Promise<T>,
  timeoutMs = 8_000
): Promise<T> {
  const rawList = (Array.isArray(propertyKeys) ? propertyKeys : [propertyKeys])
    .filter((k): k is string => Boolean(k && k.trim()))
    .map((k) => k.trim());
  const uuidKey = rawList.find((k) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k));
  const primaryKey = uuidKey || rawList[0] || "global";

  return runWithInProcessMutex(primaryKey, async () => {
    const lockPath = getLockFilePath(primaryKey);
    const deadline = Date.now() + timeoutMs;
    let attempt: FileLockAttempt = { status: "busy" };

    while (Date.now() < deadline) {
      attempt = openExclusiveLockFile(lockPath);
      if (attempt.status === "acquired" || attempt.status === "unavailable") break;
      await new Promise((r) => setTimeout(r, 25 + Math.floor(Math.random() * 25)));
    }

    if (attempt.status === "unavailable") {
      return await fn();
    }

    if (attempt.status !== "acquired") {
      throw new Error("Property reservation lock timeout — concurrent booking in progress.");
    }

    try {
      fs.writeSync(attempt.fd, `${process.pid}:${Date.now()}`);
      return await fn();
    } finally {
      try {
        fs.closeSync(attempt.fd);
      } catch {
        // ignore close errors
      }
      try {
        fs.unlinkSync(attempt.lockPath);
      } catch {
        // ignore unlink errors
      }
    }
  });
}

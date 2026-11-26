import {
  hydrateSharedJsonFile,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";
import type { PortalRole } from "./portalSessionEdge";

export interface PortalAccountRecord {
  uid: string;
  role: PortalRole;
  provider: string;
  updatedAt: string;
}

const FILE_NAME = "portal-accounts.json";

let registryQueue: Promise<void> = Promise.resolve();

function withRegistryLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = registryQueue;
  let release!: () => void;
  registryQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  return prev.then(fn).finally(release);
}

function parseRegistry(parsed: unknown): Record<string, PortalAccountRecord> {
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, PortalAccountRecord>)
    : {};
}

export async function hydratePortalRegistry(): Promise<Record<string, PortalAccountRecord>> {
  return hydrateSharedJsonFile<Record<string, PortalAccountRecord>>(FILE_NAME, () => ({}), parseRegistry);
}

export async function getRegisteredPortalRole(uid: string): Promise<PortalRole | null> {
  if (!uid) return null;
  const map = await hydratePortalRegistry();
  const entry =
    map[uid] ||
    readSharedJsonFile<Record<string, PortalAccountRecord>>(FILE_NAME, () => ({}), parseRegistry)[uid];
  return entry?.role === "host" || entry?.role === "guest" ? entry.role : null;
}

export async function registerPortalAccount(
  uid: string,
  role: PortalRole,
  provider: string
): Promise<{ ok: boolean; role: PortalRole }> {
  if (!uid) return { ok: false, role };

  return withRegistryLock(async () => {
    const existingMap = await hydratePortalRegistry();
    const current = existingMap[uid];

    if (current && current.role !== role) {
      return { ok: false, role: current.role };
    }

    if (current && current.role === role && current.provider === provider) {
      return { ok: true, role };
    }

    const updated: Record<string, PortalAccountRecord> = {
      ...existingMap,
      [uid]: {
        uid,
        role,
        provider,
        updatedAt: new Date().toISOString(),
      },
    };
    writeSharedJsonFile(FILE_NAME, updated);
    await persistSharedJsonFile(FILE_NAME, updated);
    return { ok: true, role };
  });
}

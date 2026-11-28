import fs from "fs";
import os from "os";
import path from "path";
import { fetchRemoteSharedState, pushRemoteSharedState } from "./supabaseKvStore";

const TMP_DATA_DIR_NAME = "qafnest-data";
const READ_ONLY_FS_CODES = new Set(["EROFS", "EACCES", "EPERM", "ENOENT", "ENOTDIR"]);
const inFlightSyncPromises = new Map<string, Promise<boolean>>();

let forceTmpStorage = false;

/** Returns true when running in a read-only serverless environment such as Vercel or AWS Lambda. */
export function isReadOnlyServerlessEnv(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NOW_REGION ||
      forceTmpStorage
  );
}

/** Switches subsequent file writes to the OS temp directory after a read-only filesystem error. */
export function markReadOnlyFsFallback(): void {
  forceTmpStorage = true;
}

/** Checks whether an error code indicates an unwritable or missing bundled filesystem path. */
export function isUnwritableFsError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  return Boolean(code && READ_ONLY_FS_CODES.has(code));
}

/** Reads cwd dynamically so @vercel/nft does not expand process.cwd() across the entire monorepo. */
function getRuntimeCwd(): string {
  const proc = (globalThis as { process?: { cwd?: () => string } }).process;
  return typeof proc?.cwd === "function" ? proc.cwd() : "";
}

/** Resolves the monorepo root containing packages/shared, falling back to current working directory. */
export function findMonorepoRoot(): string {
  const cwd = getRuntimeCwd();
  let curr = cwd;
  for (let i = 0; i < 6; i++) {
    if (curr && fs.existsSync(path.join(curr, "packages", "shared"))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return cwd;
}

export function getTmpDataDir(): string {
  return path.join(os.tmpdir(), TMP_DATA_DIR_NAME);
}

export function getBundledSharedDataDir(): string {
  try {
    if (typeof __dirname !== "undefined") {
      const localDataDir = path.resolve(__dirname, "data");
      if (fs.existsSync(path.join(localDataDir, "platform-fee-config.json"))) {
        return localDataDir;
      }
    }
  } catch {}
  return path.join(findMonorepoRoot(), "packages", "shared", "data");
}

export function getWritableSharedDataDir(): string {
  return isReadOnlyServerlessEnv() ? getTmpDataDir() : getBundledSharedDataDir();
}

export function getWritableLockDir(): string {
  return path.join(getWritableSharedDataDir(), ".locks");
}

/** Avoids static path.join(root, fileName) wildcards that make @vercel/nft trace the entire monorepo. */
function joinRuntimeFile(dir: string, fileName: string): string {
  const cleanDir = dir.endsWith(path.sep) ? dir.slice(0, -1) : dir;
  return [cleanDir, path.basename(fileName)].join(path.sep);
}

function getRepoRootCandidates(fileName: string): string[] {
  const cwd = getRuntimeCwd();
  const root = findMonorepoRoot();
  const grandparent = path.dirname(path.dirname(cwd));
  const candidates = [
    joinRuntimeFile(root, fileName),
    joinRuntimeFile(cwd, fileName),
    joinRuntimeFile(grandparent, fileName),
  ];
  return Array.from(new Set(candidates));
}

function writeAtomicJsonSync(filePath: string, data: unknown): void {
  const serialized = JSON.stringify(data, null, 2);
  try {
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf-8") === serialized) {
      return;
    }
  } catch {
    // Proceed with atomic write if pre-check read fails
  }
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
  try {
    fs.writeFileSync(tmpPath, serialized, "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // ignore temp cleanup failure
    }
    throw err;
  }
}

function readJsonFromCandidates<T>(
  candidates: string[],
  fallback: () => T,
  normalize?: (parsed: unknown) => T
): T {
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, "utf-8");
      const parsed = JSON.parse(raw);
      return normalize ? normalize(parsed) : (parsed as T);
    } catch (err) {
      console.warn(`[serverJsonStore] Failed reading ${candidate}:`, err);
    }
  }
  return fallback();
}

function writeJsonWithTmpFallback(primaryPath: string, tmpFallbackPath: string, data: unknown): boolean {
  const target = isReadOnlyServerlessEnv() ? tmpFallbackPath : primaryPath;
  try {
    writeAtomicJsonSync(target, data);
    return true;
  } catch (err) {
    if (target !== tmpFallbackPath && isUnwritableFsError(err)) {
      forceTmpStorage = true;
      try {
        writeAtomicJsonSync(tmpFallbackPath, data);
        return true;
      } catch (tmpErr) {
        console.warn(`[serverJsonStore] Fallback write failed for ${tmpFallbackPath}:`, tmpErr);
        return false;
      }
    }
    console.warn(`[serverJsonStore] Write failed for ${target}:`, err);
    return false;
  }
}

/**
 * Reads a JSON file from packages/shared/data (preferring any warm /tmp override when present).
 * Never creates directories or throws on missing/unreadable files.
 */
export function readSharedJsonFile<T>(
  fileName: string,
  fallback: () => T,
  normalize?: (parsed: unknown) => T,
  extraFallbackDirs: string[] = []
): T {
  const tmpFile = path.join(getTmpDataDir(), fileName);
  const bundledFile = path.join(getBundledSharedDataDir(), fileName);
  const extraFiles = extraFallbackDirs.map((dir) => path.join(dir, fileName));
  const candidates = isReadOnlyServerlessEnv()
    ? Array.from(new Set([tmpFile, bundledFile, ...extraFiles]))
    : Array.from(new Set([bundledFile, tmpFile, ...extraFiles]));
  return readJsonFromCandidates(candidates, fallback, normalize);
}

function scheduleRemoteSync(key: string, data: unknown): void {
  const promise = pushRemoteSharedState(key, data).catch(() => false);
  inFlightSyncPromises.set(key, promise);
  void promise.finally(() => {
    if (inFlightSyncPromises.get(key) === promise) {
      inFlightSyncPromises.delete(key);
    }
  });
}

/** Waits for any background remote sync on a shared/root key or flushes explicitly. */
export async function flushSharedStateSync(fileName?: string): Promise<void> {
  if (fileName) {
    const p = inFlightSyncPromises.get(path.basename(fileName));
    if (p) await p;
    return;
  }
  await Promise.all(Array.from(inFlightSyncPromises.values()));
}

/**
 * Hydrates a shared JSON store from Supabase (`platform_shared_state` / `qafnest-private-state`)
 * into local/tmp cache so subsequent synchronous store reads reflect cross-app updates.
 */
export async function hydrateSharedJsonFile<T>(
  fileName: string,
  fallback: () => T,
  normalize?: (parsed: unknown) => T,
  extraFallbackDirs: string[] = []
): Promise<T> {
  const key = path.basename(fileName);
  await flushSharedStateSync(key);
  const remote = await fetchRemoteSharedState<unknown>(key);
  if (remote !== null) {
    const value = normalize ? normalize(remote) : (remote as T);
    const primaryPath = path.join(getBundledSharedDataDir(), key);
    const tmpFallbackPath = path.join(getTmpDataDir(), key);
    writeJsonWithTmpFallback(primaryPath, tmpFallbackPath, value);
    return value;
  }
  return readSharedJsonFile(key, fallback, normalize, extraFallbackDirs);
}

/**
 * Atomically writes a shared JSON file locally/tmp AND mirrors it asynchronously to Supabase.
 */
export function writeSharedJsonFile(fileName: string, data: unknown): boolean {
  const key = path.basename(fileName);
  const primaryPath = path.join(getBundledSharedDataDir(), key);
  const tmpFallbackPath = path.join(getTmpDataDir(), key);
  const ok = writeJsonWithTmpFallback(primaryPath, tmpFallbackPath, data);
  try {
    writeAtomicJsonSync(tmpFallbackPath, data);
  } catch {}
  scheduleRemoteSync(key, data);
  return ok;
}

/** Writes locally/tmp and awaits remote Supabase persistence. */
export async function persistSharedJsonFile(fileName: string, data: unknown): Promise<boolean> {
  const key = path.basename(fileName);
  const primaryPath = path.join(getBundledSharedDataDir(), key);
  const tmpFallbackPath = path.join(getTmpDataDir(), key);
  const localOk = writeJsonWithTmpFallback(primaryPath, tmpFallbackPath, data);
  try {
    writeAtomicJsonSync(tmpFallbackPath, data);
  } catch {}
  const remoteOk = await pushRemoteSharedState(key, data);
  return localOk || remoteOk;
}

/**
 * Hydrates a root-level JSON store from Supabase into local/tmp cache.
 */
export async function hydrateRootJsonFile<T>(
  fileName: string,
  fallback: () => T,
  normalize?: (parsed: unknown) => T
): Promise<T> {
  const key = path.basename(fileName);
  await flushSharedStateSync(key);
  const remote = await fetchRemoteSharedState<unknown>(key);
  if (remote !== null) {
    const value = normalize ? normalize(remote) : (remote as T);
    const tmpFallbackPath = path.join(getTmpDataDir(), key);
    if (isReadOnlyServerlessEnv()) {
      writeJsonWithTmpFallback(tmpFallbackPath, tmpFallbackPath, value);
    } else {
      const primaryPath = joinRuntimeFile(findMonorepoRoot(), key);
      writeJsonWithTmpFallback(primaryPath, tmpFallbackPath, value);
    }
    return value;
  }
  return readRootJsonFile(key, fallback, normalize);
}

/**
 * Reads a root-level JSON file (e.g., .qafnest-wallets.json) with /tmp override support.
 */
export function readRootJsonFile<T>(
  fileName: string,
  fallback: () => T,
  normalize?: (parsed: unknown) => T
): T {
  const tmpFile = path.join(getTmpDataDir(), fileName);
  if (isReadOnlyServerlessEnv()) {
    return readJsonFromCandidates([tmpFile], fallback, normalize);
  }
  const candidates = Array.from(new Set([tmpFile, ...getRepoRootCandidates(fileName)]));
  return readJsonFromCandidates(candidates, fallback, normalize);
}

/**
 * Atomically writes a root-level JSON file locally/tmp and mirrors to Supabase.
 */
export function writeRootJsonFile(fileName: string, data: unknown): boolean {
  const key = path.basename(fileName);
  const tmpFallbackPath = path.join(getTmpDataDir(), key);
  const ok = isReadOnlyServerlessEnv()
    ? writeJsonWithTmpFallback(tmpFallbackPath, tmpFallbackPath, data)
    : writeJsonWithTmpFallback(joinRuntimeFile(findMonorepoRoot(), key), tmpFallbackPath, data);
  scheduleRemoteSync(key, data);
  return ok;
}

/** Writes a root-level JSON file locally/tmp and awaits remote Supabase persistence. */
export async function persistRootJsonFile(fileName: string, data: unknown): Promise<boolean> {
  const key = path.basename(fileName);
  const tmpFallbackPath = path.join(getTmpDataDir(), key);
  const localOk = isReadOnlyServerlessEnv()
    ? writeJsonWithTmpFallback(tmpFallbackPath, tmpFallbackPath, data)
    : writeJsonWithTmpFallback(joinRuntimeFile(findMonorepoRoot(), key), tmpFallbackPath, data);
  const remoteOk = await pushRemoteSharedState(key, data);
  return localOk || remoteOk;
}

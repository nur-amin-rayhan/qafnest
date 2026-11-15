import fs from "fs";
import os from "os";
import path from "path";

const TMP_DATA_DIR_NAME = "qafnest-data";
const READ_ONLY_FS_CODES = new Set(["EROFS", "EACCES", "EPERM", "ENOENT", "ENOTDIR"]);

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

/** Resolves the monorepo root containing packages/shared, falling back to process.cwd(). */
export function findMonorepoRoot(): string {
  let curr = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(curr, "packages", "shared"))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return process.cwd();
}

export function getTmpDataDir(): string {
  return path.join(os.tmpdir(), TMP_DATA_DIR_NAME);
}

export function getBundledSharedDataDir(): string {
  return path.join(findMonorepoRoot(), "packages", "shared", "data");
}

export function getWritableSharedDataDir(): string {
  return isReadOnlyServerlessEnv() ? getTmpDataDir() : getBundledSharedDataDir();
}

export function getWritableLockDir(): string {
  return path.join(getWritableSharedDataDir(), ".locks");
}

function getRepoRootCandidates(fileName: string): string[] {
  const root = findMonorepoRoot();
  const candidates = [
    path.join(root, fileName),
    path.resolve(process.cwd(), fileName),
    path.resolve(process.cwd(), "..", "..", fileName),
  ];
  return Array.from(new Set(candidates));
}

function writeAtomicJsonSync(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
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
  const candidates = Array.from(new Set([tmpFile, bundledFile, ...extraFiles]));
  return readJsonFromCandidates(candidates, fallback, normalize);
}

/**
 * Atomically writes a JSON file to packages/shared/data, automatically falling back to /tmp/qafnest-data
 * on read-only filesystems (e.g., Vercel serverless functions) without throwing.
 */
export function writeSharedJsonFile(fileName: string, data: unknown): boolean {
  const primaryPath = path.join(getBundledSharedDataDir(), fileName);
  const tmpFallbackPath = path.join(getTmpDataDir(), fileName);
  return writeJsonWithTmpFallback(primaryPath, tmpFallbackPath, data);
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
  const candidates = Array.from(new Set([tmpFile, ...getRepoRootCandidates(fileName)]));
  return readJsonFromCandidates(candidates, fallback, normalize);
}

/**
 * Atomically writes a root-level JSON file, falling back to /tmp/qafnest-data on read-only deployments.
 */
export function writeRootJsonFile(fileName: string, data: unknown): boolean {
  const primaryPath = path.join(findMonorepoRoot(), fileName);
  const tmpFallbackPath = path.join(getTmpDataDir(), fileName);
  return writeJsonWithTmpFallback(primaryPath, tmpFallbackPath, data);
}

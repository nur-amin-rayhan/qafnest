import fs from "fs";
import path from "path";

export type UserActivityRole = "guest" | "host" | "admin" | "system";

export type UserActivityCategory =
  | "booking"
  | "payment"
  | "property"
  | "review"
  | "favorite"
  | "auth"
  | "security"
  | "governance";

export interface StoredUserActivityEvent {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  role: UserActivityRole;
  category: UserActivityCategory;
  action: string;
  title: string;
  details: string;
  targetId?: string;
  targetLabel?: string;
  actor?: string;
  timestamp: string;
}

export interface UserGovernanceOverride {
  userId: string;
  role: "guest" | "host";
  suspended?: boolean;
  suspendedReason?: string;
  verifiedOverride?: boolean;
  adminNote?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UserGovernanceStoreDoc {
  overrides: Record<string, UserGovernanceOverride>;
  events: StoredUserActivityEvent[];
}

function findMonorepoRoot(): string {
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

function getStorePath(): string {
  return path.join(findMonorepoRoot(), "packages", "shared", "data", "user-governance-activity.json");
}

export function readUserGovernanceStore(): UserGovernanceStoreDoc {
  try {
    const filePath = getStorePath();
    if (!fs.existsSync(filePath)) {
      return { overrides: {}, events: [] };
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Partial<UserGovernanceStoreDoc>;
    return {
      overrides: parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch (err) {
    console.warn("[userActivityStore] read warning:", err);
    return { overrides: {}, events: [] };
  }
}

function writeUserGovernanceStore(doc: UserGovernanceStoreDoc): void {
  const filePath = getStorePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(doc, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export function recordUserActivity(
  event: Omit<StoredUserActivityEvent, "id" | "timestamp"> & { timestamp?: string }
): StoredUserActivityEvent {
  const doc = readUserGovernanceStore();
  const entry: StoredUserActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: event.timestamp || new Date().toISOString(),
    ...event,
  };
  doc.events = [entry, ...doc.events].slice(0, 500);
  writeUserGovernanceStore(doc);
  return entry;
}

export function updateUserGovernanceOverride(
  userId: string,
  role: "guest" | "host",
  updates: Partial<Omit<UserGovernanceOverride, "userId" | "role" | "updatedAt">>,
  actorEmail: string
): UserGovernanceOverride {
  const doc = readUserGovernanceStore();
  const existing = doc.overrides[userId];
  const next: UserGovernanceOverride = {
    ...(existing || { userId, role }),
    ...updates,
    userId,
    role: existing?.role || role,
    updatedAt: new Date().toISOString(),
    updatedBy: actorEmail,
  };
  doc.overrides[userId] = next;
  writeUserGovernanceStore(doc);
  return next;
}

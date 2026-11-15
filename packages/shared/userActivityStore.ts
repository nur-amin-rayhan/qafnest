import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

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

const USER_GOVERNANCE_FILE = "user-governance-activity.json";

export function readUserGovernanceStore(): UserGovernanceStoreDoc {
  return readSharedJsonFile<UserGovernanceStoreDoc>(
    USER_GOVERNANCE_FILE,
    () => ({ overrides: {}, events: [] }),
    (parsed) => {
      const candidate = (parsed || {}) as Partial<UserGovernanceStoreDoc>;
      return {
        overrides:
          candidate.overrides && typeof candidate.overrides === "object" ? candidate.overrides : {},
        events: Array.isArray(candidate.events) ? candidate.events : [],
      };
    }
  );
}

function writeUserGovernanceStore(doc: UserGovernanceStoreDoc): void {
  writeSharedJsonFile(USER_GOVERNANCE_FILE, doc);
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

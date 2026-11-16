import { hydrateSharedJsonFile, persistSharedJsonFile, readSharedJsonFile, writeSharedJsonFile } from "@qafnest/shared/serverJsonStore";

export interface FirebaseGuestProfileRecord {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  iqama?: string | null;
  id_type?: string | null;
  city?: string | null;
  contact_email?: string | null;
  is_verified?: boolean;
  avatar_url?: string | null;
  updated_at?: string;
}

const FILE_NAME = "firebase-guest-profiles.json";

function readAll(): Record<string, FirebaseGuestProfileRecord> {
  return readSharedJsonFile<Record<string, FirebaseGuestProfileRecord>>(
    FILE_NAME,
    () => ({}),
    (parsed) => (parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, FirebaseGuestProfileRecord>) : {})
  );
}

export async function getFirebaseGuestProfile(uid: string): Promise<FirebaseGuestProfileRecord | null> {
  if (!uid) return null;
  const map = await hydrateSharedJsonFile<Record<string, FirebaseGuestProfileRecord>>(FILE_NAME, () => ({}));
  return map[uid] || readAll()[uid] || null;
}

export async function saveFirebaseGuestProfile(
  uid: string,
  patch: Partial<FirebaseGuestProfileRecord>
): Promise<FirebaseGuestProfileRecord> {
  const existingMap = await hydrateSharedJsonFile<Record<string, FirebaseGuestProfileRecord>>(FILE_NAME, () => ({}));
  const current = existingMap[uid] || readAll()[uid] || { id: uid };
  const next: FirebaseGuestProfileRecord = {
    ...current,
    ...patch,
    id: uid,
    updated_at: new Date().toISOString(),
  };
  const merged = { ...existingMap, [uid]: next };
  writeSharedJsonFile(FILE_NAME, merged);
  await persistSharedJsonFile(FILE_NAME, merged);
  return next;
}

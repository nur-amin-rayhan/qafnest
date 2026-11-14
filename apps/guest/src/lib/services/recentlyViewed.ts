/**
 * Recently Viewed Properties Service
 * Handles persistence and retrieval of viewed property IDs in Local Storage.
 */

export const RECENTLY_VIEWED_STORAGE_KEY = "qafnest_recently_viewed_ids";
export const RECENTLY_VIEWED_EVENT = "qafnest_recently_viewed_changed";
const MAX_RECENTLY_VIEWED = 12;

/**
 * Safely retrieve recently viewed property IDs from local storage.
 */
export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    }
  } catch {
    // Graceful fallback for corrupted storage or disabled storage
  }
  return [];
}

/**
 * Add a property ID to recently viewed list.
 * Deduplicates, brings the ID to the front, and trims to MAX_RECENTLY_VIEWED.
 */
export function addRecentlyViewed(propertyId: string): void {
  if (typeof window === "undefined" || !propertyId || typeof propertyId !== "string") return;

  const cleanId = propertyId.trim();
  if (!cleanId) return;

  try {
    const existing = getRecentlyViewedIds();
    // Move to front if already exists, else insert at front
    const updated = [cleanId, ...existing.filter((id) => id !== cleanId)].slice(0, MAX_RECENTLY_VIEWED);
    window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(updated));

    // Notify other components on the page
    window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_EVENT, { detail: updated }));
  } catch (err) {
    console.warn("Could not save to recently viewed properties:", err);
  }
}

/**
 * Clears the recently viewed list.
 */
export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_EVENT, { detail: [] }));
  } catch (err) {
    console.warn("Could not clear recently viewed properties:", err);
  }
}


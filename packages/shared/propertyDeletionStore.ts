/**
 * Server-Only Shared Store for Property Deletion Review Requests.
 * Synchronized across Host Portal (:3001) and Admin Portal (:3003).
 */

import {
  hydrateSharedJsonFile,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";
import {
  getDeletionReasonOption,
  type PropertyDeletionReasonCode,
  type PropertyDeletionRequest,
  type PropertyDeletionRequestSummary,
} from "./propertyDeletionConfig";

export * from "./propertyDeletionConfig";

interface PropertyDeletionStoreData {
  requests: PropertyDeletionRequest[];
}

const DELETION_STORE_FILE = "property-deletion-requests.json";

const normalizeDeletionStore = (parsed: unknown): PropertyDeletionStoreData => {
  const candidate = (parsed || {}) as Partial<PropertyDeletionStoreData>;
  return {
    requests: Array.isArray(candidate.requests) ? candidate.requests : [],
  };
};

export async function hydratePropertyDeletionStore(): Promise<PropertyDeletionStoreData> {
  return hydrateSharedJsonFile<PropertyDeletionStoreData>(
    DELETION_STORE_FILE,
    () => ({ requests: [] }),
    normalizeDeletionStore
  );
}

export async function persistPropertyDeletionStore(): Promise<boolean> {
  return persistSharedJsonFile(DELETION_STORE_FILE, readStore());
}

function readStore(): PropertyDeletionStoreData {
  return readSharedJsonFile<PropertyDeletionStoreData>(
    DELETION_STORE_FILE,
    () => ({ requests: [] }),
    normalizeDeletionStore
  );
}

function writeStore(data: PropertyDeletionStoreData): void {
  writeSharedJsonFile(DELETION_STORE_FILE, data);
}

export function readPropertyDeletionRequests(): PropertyDeletionRequest[] {
  return [...readStore().requests].sort((a, b) =>
    String(b.requestedAt || "").localeCompare(String(a.requestedAt || ""))
  );
}

export function getPropertyDeletionRequestById(
  id: string
): PropertyDeletionRequest | null {
  return readStore().requests.find((r) => r.id === id) || null;
}

export function getPendingDeletionRequestForProperty(
  propertyId: string
): PropertyDeletionRequest | null {
  return (
    readStore().requests.find(
      (r) => r.propertyId === propertyId && r.status === "pending"
    ) || null
  );
}

export function getLatestDeletionRequestForProperty(
  propertyId: string
): PropertyDeletionRequest | null {
  const sorted = readPropertyDeletionRequests().filter(
    (r) => r.propertyId === propertyId
  );
  return sorted[0] || null;
}

export function toDeletionRequestSummary(
  req: PropertyDeletionRequest | null | undefined
): PropertyDeletionRequestSummary | null {
  if (!req) return null;
  return {
    id: req.id,
    status: req.status,
    reasonCode: req.reasonCode,
    reasonLabelEn: req.reasonLabelEn,
    reasonLabelAr: req.reasonLabelAr,
    reasonDetails: req.reasonDetails,
    requestedAt: req.requestedAt,
    reviewedAt: req.reviewedAt,
    reviewedBy: req.reviewedBy,
    adminNotes: req.adminNotes,
  };
}

export function createOrUpdatePendingDeletionRequest(input: {
  propertyId: string;
  unitCode?: string;
  propertyTitle: string;
  propertyTitleAr?: string;
  propertyCity?: string;
  hostId: string;
  hostName?: string;
  hostPhone?: string;
  hostEmail?: string;
  reasonCode: PropertyDeletionReasonCode;
  reasonDetails: string;
}): PropertyDeletionRequest {
  const store = readStore();
  const reasonOpt = getDeletionReasonOption(input.reasonCode) || {
    code: "other" as const,
    labelEn: "Other Specific Reason",
    labelAr: "سبب آخر محدد",
  };
  const nowIso = new Date().toISOString();

  const existingPendingIdx = store.requests.findIndex(
    (r) => r.propertyId === input.propertyId && r.status === "pending"
  );

  if (existingPendingIdx >= 0) {
    const updated: PropertyDeletionRequest = {
      ...store.requests[existingPendingIdx],
      unitCode: input.unitCode || store.requests[existingPendingIdx].unitCode,
      propertyTitle: input.propertyTitle || store.requests[existingPendingIdx].propertyTitle,
      propertyTitleAr: input.propertyTitleAr || store.requests[existingPendingIdx].propertyTitleAr,
      propertyCity: input.propertyCity || store.requests[existingPendingIdx].propertyCity,
      hostName: input.hostName || store.requests[existingPendingIdx].hostName,
      hostPhone: input.hostPhone || store.requests[existingPendingIdx].hostPhone,
      hostEmail: input.hostEmail || store.requests[existingPendingIdx].hostEmail,
      reasonCode: reasonOpt.code,
      reasonLabelEn: reasonOpt.labelEn,
      reasonLabelAr: reasonOpt.labelAr,
      reasonDetails: input.reasonDetails.trim(),
      requestedAt: nowIso,
    };
    store.requests[existingPendingIdx] = updated;
    writeStore(store);
    return updated;
  }

  const created: PropertyDeletionRequest = {
    id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    propertyId: input.propertyId,
    unitCode: input.unitCode,
    propertyTitle: input.propertyTitle,
    propertyTitleAr: input.propertyTitleAr,
    propertyCity: input.propertyCity,
    hostId: input.hostId,
    hostName: input.hostName,
    hostPhone: input.hostPhone,
    hostEmail: input.hostEmail,
    reasonCode: reasonOpt.code,
    reasonLabelEn: reasonOpt.labelEn,
    reasonLabelAr: reasonOpt.labelAr,
    reasonDetails: input.reasonDetails.trim(),
    status: "pending",
    requestedAt: nowIso,
  };

  store.requests.unshift(created);
  writeStore(store);
  return created;
}

export function cancelPendingDeletionRequest(
  propertyId: string,
  hostId?: string
): PropertyDeletionRequest | null {
  const store = readStore();
  const idx = store.requests.findIndex(
    (r) =>
      r.propertyId === propertyId &&
      r.status === "pending" &&
      (!hostId || !r.hostId || r.hostId === hostId)
  );
  if (idx < 0) return null;

  const updated: PropertyDeletionRequest = {
    ...store.requests[idx],
    status: "cancelled",
    reviewedAt: new Date().toISOString(),
  };
  store.requests[idx] = updated;
  writeStore(store);
  return updated;
}

export function finalizePropertyDeletionReview(params: {
  requestId?: string;
  propertyId?: string;
  decision: "approve" | "reject";
  reviewedBy: string;
  adminNotes?: string;
  autoDeletedAt?: string;
}): PropertyDeletionRequest | null {
  const store = readStore();
  const idx = store.requests.findIndex(
    (r) =>
      r.status === "pending" &&
      ((params.requestId && r.id === params.requestId) ||
        (params.propertyId && r.propertyId === params.propertyId))
  );
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();
  const updated: PropertyDeletionRequest = {
    ...store.requests[idx],
    status: params.decision === "approve" ? "approved" : "rejected",
    reviewedAt: nowIso,
    reviewedBy: params.reviewedBy,
    ...(params.adminNotes?.trim() ? { adminNotes: params.adminNotes.trim() } : {}),
    ...(params.decision === "approve"
      ? { autoDeletedAt: params.autoDeletedAt || nowIso }
      : {}),
  };
  store.requests[idx] = updated;
  writeStore(store);
  return updated;
}

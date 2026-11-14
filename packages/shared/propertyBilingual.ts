export const BILINGUAL_PROPERTY_DB_COLUMNS = [
  "title_ar",
  "description_ar",
  "district_ar",
  "address",
  "address_ar",
  "street",
  "street_ar",
  "postal_code",
] as const;

export const EXTENDED_PROPERTY_META_COLUMNS = [
  "state",
  "state_ar",
  "google_maps_url",
] as const;

export const ALL_PROPERTY_META_COLUMNS = [
  ...BILINGUAL_PROPERTY_DB_COLUMNS,
  ...EXTENDED_PROPERTY_META_COLUMNS,
] as const;

const ALL_META_COLUMN_SET = new Set<string>(ALL_PROPERTY_META_COLUMNS);
const EXTENDED_META_COLUMN_SET = new Set<string>(EXTENDED_PROPERTY_META_COLUMNS);

/**
 * Checks whether a Supabase/PostgREST error was caused by the bilingual columns
 * migration not yet having been applied to the connected database.
 */
export function isMissingBilingualColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; details?: string; hint?: string };
  const code = String(err.code || "").toUpperCase();
  const text = `${err.message || ""} ${err.details || ""} ${err.hint || ""}`.toLowerCase();

  if (code === "42703" || code === "PGRST204") {
    return ALL_PROPERTY_META_COLUMNS.some((col) => text.includes(col)) || text.includes("column");
  }

  return (
    (text.includes("does not exist") || text.includes("could not find")) &&
    ALL_PROPERTY_META_COLUMNS.some((col) => text.includes(col))
  );
}

/**
 * Removes bilingual/extended address columns from an insert/update payload so a legacy
 * unmigrated Postgres schema can still save core property fields without failing.
 */
export function stripBilingualColumns<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!ALL_META_COLUMN_SET.has(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Removes bilingual column names from a comma-separated Supabase `.select(...)` string.
 */
export function stripBilingualFromSelect(selectClause: string): string {
  return selectClause
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !ALL_META_COLUMN_SET.has(part))
    .join(",");
}

/**
 * Picks the localized value given explicit English and Arabic fields, falling back
 * to whichever non-empty language value exists.
 */
export function pickBilingualText(
  locale: "en" | "ar",
  englishValue?: string | null,
  arabicValue?: string | null,
  fallback = ""
): string {
  const en = typeof englishValue === "string" ? englishValue.trim() : "";
  const ar = typeof arabicValue === "string" ? arabicValue.trim() : "";
  if (locale === "ar") {
    return ar || en || fallback;
  }
  return en || ar || fallback;
}

export type BilingualPropertyColumn = (typeof ALL_PROPERTY_META_COLUMNS)[number];
export type BilingualPropertyMeta = Partial<Record<BilingualPropertyColumn, string>>;

export interface ExternalHostReviewMeta {
  admin_feedback?: string;
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface ExternalHostMeta {
  admin_feedback: string;
  rejection_reason: string;
  reviewed_at: string;
  reviewed_by: string;
  bilingual?: BilingualPropertyMeta;
}

function normalizeBilingualMeta(input: unknown): BilingualPropertyMeta | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const src = input as Record<string, unknown>;
  const normalized: BilingualPropertyMeta = {};
  let hasAny = false;
  for (const key of ALL_PROPERTY_META_COLUMNS) {
    const raw = src[key];
    if (typeof raw === "string" && raw.trim().length > 0) {
      normalized[key] = raw.trim();
      hasAny = true;
    }
  }
  return hasAny ? normalized : undefined;
}

function normalizeExtendedMetaOnly(input: unknown): BilingualPropertyMeta | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const src = input as Record<string, unknown>;
  const normalized: BilingualPropertyMeta = {};
  let hasAny = false;
  for (const key of EXTENDED_PROPERTY_META_COLUMNS) {
    const raw = src[key];
    if (typeof raw === "string" && raw.trim().length > 0) {
      normalized[key] = raw.trim();
      hasAny = true;
    }
  }
  return hasAny ? normalized : undefined;
}

/**
 * Safely parses `external_host_id`, supporting both structured JSON
 * (`{ admin_feedback, rejection_reason, reviewed_at, reviewed_by, bilingual }`)
 * and legacy plain-text admin feedback strings.
 */
export function parseExternalHostMeta(externalHostId: unknown): ExternalHostMeta {
  const result: ExternalHostMeta = {
    admin_feedback: "",
    rejection_reason: "",
    reviewed_at: "",
    reviewed_by: "QafNest Operations",
  };

  if (typeof externalHostId !== "string" || !externalHostId.trim()) {
    return result;
  }

  const trimmed = externalHostId.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      result.admin_feedback =
        typeof parsed.admin_feedback === "string"
          ? parsed.admin_feedback
          : typeof parsed.rejection_reason === "string"
            ? parsed.rejection_reason
            : "";
      result.rejection_reason =
        typeof parsed.rejection_reason === "string"
          ? parsed.rejection_reason
          : typeof parsed.admin_feedback === "string"
            ? parsed.admin_feedback
            : "";
      result.reviewed_at = typeof parsed.reviewed_at === "string" ? parsed.reviewed_at : "";
      if (typeof parsed.reviewed_by === "string" && parsed.reviewed_by.trim()) {
        result.reviewed_by = parsed.reviewed_by.trim();
      }
      result.bilingual = normalizeBilingualMeta(parsed.bilingual);
      return result;
    } catch {
      // Fallback to legacy plain text string
    }
  }

  result.admin_feedback = trimmed;
  result.rejection_reason = trimmed;
  return result;
}

/**
 * Serializes moderation feedback and/or unmigrated bilingual fallback metadata into
 * `external_host_id` JSON, returning `null` when both are empty.
 */
export function serializeExternalHostMeta(options: {
  baseRaw?: unknown;
  review?: ExternalHostReviewMeta | null;
  bilingual?: BilingualPropertyMeta | null;
}): string | null {
  const base = parseExternalHostMeta(options.baseRaw);
  const nextObj: Record<string, unknown> = {};

  if (options.review !== null) {
    const adminFeedback = options.review
      ? (options.review.admin_feedback || options.review.rejection_reason || "").trim()
      : base.admin_feedback.trim();
    const rejectionReason = options.review
      ? (options.review.rejection_reason || options.review.admin_feedback || "").trim()
      : base.rejection_reason.trim();
    const reviewedAt = options.review
      ? (options.review.reviewed_at || "").trim()
      : base.reviewed_at.trim();
    const reviewedBy = options.review
      ? (options.review.reviewed_by || "QafNest Operations").trim()
      : base.reviewed_by.trim();

    if (adminFeedback) nextObj.admin_feedback = adminFeedback;
    if (rejectionReason) nextObj.rejection_reason = rejectionReason;
    if (reviewedAt) nextObj.reviewed_at = reviewedAt;
    if (adminFeedback || rejectionReason) {
      nextObj.reviewed_by = reviewedBy || "QafNest Operations";
    }
  }

  const nextBilingual =
    options.bilingual === null
      ? undefined
      : options.bilingual !== undefined
        ? normalizeBilingualMeta(options.bilingual)
        : base.bilingual;

  if (nextBilingual) {
    nextObj.bilingual = nextBilingual;
  }

  return Object.keys(nextObj).length > 0 ? JSON.stringify(nextObj) : null;
}

/**
 * Strips ONLY non-migrated extended location metadata (`state`, `state_ar`, `google_maps_url`)
 * from SQL payloads while storing them safely inside `external_host_id` JSON, keeping native
 * bilingual DB columns untouched when the database supports them.
 */
export function extractExtendedLocationToExternalMeta<T extends Record<string, unknown>>(
  payload: T,
  options?: { existingExternalHostId?: unknown; clearReview?: boolean }
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!EXTENDED_META_COLUMN_SET.has(key)) {
      cleaned[key] = value;
    }
  }
  const extendedMeta = normalizeExtendedMetaOnly(payload);
  const serializedMeta = serializeExternalHostMeta({
    baseRaw: options?.existingExternalHostId ?? payload.external_host_id,
    review: options?.clearReview ? null : undefined,
    bilingual: extendedMeta ?? undefined,
  });
  if (serializedMeta !== null || options?.clearReview) {
    cleaned.external_host_id = serializedMeta;
  }
  return cleaned;
}

/**
 * Strips unmigrated bilingual/address columns for a legacy Postgres schema while
 * preserving their values (plus extended location metadata) inside `external_host_id`
 * so bilingual and Google Maps location fields always survive submit/edit.
 */
export function stripBilingualColumnsWithFallback<T extends Record<string, unknown>>(
  payload: T,
  options?: { existingExternalHostId?: unknown; clearReview?: boolean }
): Record<string, unknown> {
  const cleaned = stripBilingualColumns(payload);
  const baseExtended = parseExternalHostMeta(
    options?.existingExternalHostId ?? payload.external_host_id
  ).bilingual;
  const bilingualMeta = normalizeBilingualMeta({
    ...(baseExtended || {}),
    ...payload,
  });
  const serializedMeta = serializeExternalHostMeta({
    baseRaw: options?.existingExternalHostId ?? payload.external_host_id,
    review: options?.clearReview ? null : undefined,
    bilingual: bilingualMeta ?? null,
  });
  cleaned.external_host_id = serializedMeta;
  return cleaned;
}

/**
 * Merges native bilingual DB columns with any JSON fallback stored inside `external_host_id`,
 * preferring explicit Postgres column values whenever present.
 */
export function extractBilingualPropertyFields<T extends Record<string, unknown>>(
  row: T
): T & Partial<Record<BilingualPropertyColumn, string | null>> {
  const meta = parseExternalHostMeta(row.external_host_id);
  const enriched: Record<string, unknown> = { ...row };
  for (const col of ALL_PROPERTY_META_COLUMNS) {
    const nativeVal = typeof row[col] === "string" ? (row[col] as string).trim() : "";
    const metaVal = meta.bilingual?.[col] || "";
    const resolved = nativeVal || metaVal;
    if (resolved) {
      enriched[col] = resolved;
    } else if (row[col] === undefined) {
      enriched[col] = null;
    }
  }
  return enriched as T & Partial<Record<BilingualPropertyColumn, string | null>>;
}

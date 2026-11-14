import crypto from "crypto";

/**
 * Deterministically maps a property slug to a valid UUID v4 format.
 * Ensures consistent UUIDs across client, server, and database migrations.
 */
export function slugToUuid(slug: string): string {
  const hash = crypto.createHash("sha256").update("qafnest:property:" + slug).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16),
    "8" + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join("-");
}

export function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function resolvePropertyIdentifier(identifier: string): { uuid: string; slug: string } {
  if (isUuid(identifier)) {
    return {
      uuid: identifier,
      slug: identifier,
    };
  }

  return {
    uuid: slugToUuid(identifier),
    slug: identifier,
  };
}


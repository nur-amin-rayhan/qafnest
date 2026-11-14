/**
 * PII Sanitizer & Masking Utility (SEC-08)
 * Ensures compliance with Saudi Personal Data Protection Law (PDPL) and PCI-DSS
 * by preventing raw customer PII, phone numbers, emails, and credentials from
 * appearing in application server logs.
 */

export function maskPii(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // If it looks like an email: test@example.com -> t***@example.com
    if (obj.includes("@") && obj.includes(".")) {
      return obj.replace(/^(.{1,2})(.*)(@.*)$/, "$1***$3");
    }
    // If it looks like a phone: +966552538488 -> +9665****488
    if (/^\+?\d{9,15}$/.test(obj)) {
      return obj.length > 6 ? obj.slice(0, 5) + "****" + obj.slice(-3) : "***";
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(maskPii);
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();

      if (typeof val === "string") {
        if (lowerKey.includes("phone") || lowerKey.includes("mobile")) {
          sanitized[key] = val.length > 5 ? val.slice(0, 4) + "****" + val.slice(-2) : "***";
        } else if (lowerKey.includes("email")) {
          sanitized[key] = val.replace(/^(.{1,2})(.*)(@.*)$/, "$1***$3");
        } else if (lowerKey.includes("customername") || (lowerKey === "name" && val.length > 2)) {
          const parts = val.trim().split(" ");
          sanitized[key] = parts.map((p) => (p.length > 2 ? p[0] + "***" + p.slice(-1) : "***")).join(" ");
        } else if (lowerKey.includes("pin") || lowerKey.includes("passcode") || lowerKey.includes("secret")) {
          sanitized[key] = "****";
        } else if (lowerKey.includes("cardnumber") || lowerKey.includes("token")) {
          sanitized[key] = val.length > 4 ? "****" + val.slice(-4) : "****";
        } else {
          sanitized[key] = maskPii(val);
        }
      } else if (val && typeof val === "object") {
        sanitized[key] = maskPii(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  return obj;
}

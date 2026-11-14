/**
 * QafNest Unified Saudi Phone (+966) Validation & Normalization Module
 * Converts Arabic-Indic numerals, strips prefixes (00966, 966, 05, 5),
 * and enforces canonical E.164 format (+9665XXXXXXXX).
 */

/** Converts Arabic-Indic and Eastern-Indic numerals to standard ASCII digits */
export function convertArabicIndicDigits(str: string): string {
  if (!str) return "";
  const arabicIndic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const easternIndic = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.split(arabicIndic[i]).join(String(i)).split(easternIndic[i]).join(String(i));
  }
  return res;
}

/**
 * Normalizes any Saudi mobile number representation into canonical E.164 (+9665XXXXXXXX).
 * Accepts:
 *  - "+966 50 123 4567"
 *  - "00966501234567"
 *  - "966501234567"
 *  - "0501234567"
 *  - "501234567"
 *  - "٠٥٠١٢٣٤٥٦٧" (Arabic-Indic numerals)
 * Returns canonical "+9665XXXXXXXX" or null if invalid.
 */
export function normalizeSaudiPhone(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const ascii = convertArabicIndicDigits(String(value).trim());
  let digits = ascii.replace(/\D/g, "");

  if (digits.startsWith("00966")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("966")) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Saudi mobile numbers are strictly 9 digits starting with '5' (e.g. 50, 53, 54, 55, 56, 57, 58, 59)
  if (/^5\d{8}$/.test(digits)) {
    return `+966${digits}`;
  }

  return null;
}

/**
 * Normalizes any international or Saudi phone input.
 * If Saudi mobile, formats to +9665XXXXXXXX.
 * If international, preserves valid E.164.
 */
export function normalizePhoneInput(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = convertArabicIndicDigits(String(value).trim());

  // Check Saudi mobile first
  const saudi = normalizeSaudiPhone(raw);
  if (saudi) return saudi;

  // General international format check
  if (raw.startsWith("+")) {
    const cleaned = `+${raw.slice(1).replace(/\D/g, "")}`;
    return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null;
  }

  const digits = raw.replace(/\D/g, "");
  if (/^[1-9]\d{9,14}$/.test(digits)) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Validates whether the given value is a genuine Saudi mobile number.
 */
export function isValidSaudiMobile(value: unknown): boolean {
  return normalizeSaudiPhone(value) !== null;
}

/**
 * Formats a phone number for user-friendly display in UI.
 * e.g., "+966501234567" -> "+966 50 123 4567" or local "050 123 4567"
 */
export function formatSaudiPhoneDisplay(
  phone: string,
  mode: "international" | "local" = "international"
): string {
  const normalized = normalizeSaudiPhone(phone);
  if (!normalized) return String(phone || "");

  const digits = normalized.slice(4); // 9 digits: "501234567"
  const prefix = digits.slice(0, 2); // "50"
  const mid = digits.slice(2, 5); // "123"
  const rest = digits.slice(5); // "4567"

  if (mode === "local") {
    return `0${prefix} ${mid} ${rest}`;
  }
  return `+966 ${prefix} ${mid} ${rest}`;
}


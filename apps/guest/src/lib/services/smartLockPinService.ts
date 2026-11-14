/**
 * QafNest Smart Lock Manual PIN Validation Engine
 * Validates user-provided manual passcodes.
 */

const WEAK_PINS_SET = new Set([
  "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
  "1234", "2345", "3456", "4567", "5678", "6789", "7890",
  "4321", "5432", "6543", "7654", "8765", "9876", "0987",
  "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999",
  "123456", "234567", "345678", "456789", "567890",
  "654321", "765432", "876543", "987654", "098765",
  "121212", "131313", "696969", "123123",
]);

/**
 * Checks if a PIN consists of all identical digits (e.g. "5555")
 */
function isRepeatedDigits(pin: string): boolean {
  return pin.split("").every((char) => char === pin[0]);
}

/**
 * Checks if a PIN is sequentially increasing or decreasing (e.g. "1234" or "9876")
 */
function isSequential(pin: string): boolean {
  let isAscending = true;
  let isDescending = true;

  for (let i = 1; i < pin.length; i++) {
    const prev = Number(pin[i - 1]);
    const curr = Number(pin[i]);
    if (curr !== prev + 1) isAscending = false;
    if (curr !== prev - 1) isDescending = false;
  }

  return isAscending || isDescending;
}

/**
 * Validates a manual custom PIN.
 */
export function validateCustomPin(
  pin: string,
  lang: "en" | "ar" = "en"
): { valid: boolean; error?: string } {
  const cleanPin = (pin || "").trim();

  if (!cleanPin) {
    return {
      valid: false,
      error: lang === "ar" ? "يرجى إدخال رمز الدخول" : "Please enter a PIN code.",
    };
  }

  if (!/^\d+$/.test(cleanPin)) {
    return {
      valid: false,
      error: lang === "ar" ? "يجب أن يتكون الرمز من أرقام فقط" : "PIN must only contain digits.",
    };
  }

  if (cleanPin.length < 4 || cleanPin.length > 12) {
    return {
      valid: false,
      error:
        lang === "ar"
          ? "يجب أن يتكون الرمز من 4 أرقام على الأقل"
          : "PIN length must be at least 4 digits (up to 12).",
    };
  }

  if (WEAK_PINS_SET.has(cleanPin) || isRepeatedDigits(cleanPin)) {
    return {
      valid: false,
      error:
        lang === "ar"
          ? "رمز سهل التخمين! يرجى اختيار رمز أكثر أماناً"
          : "This PIN is too easy to guess. Please choose a more secure code.",
    };
  }

  if (isSequential(cleanPin)) {
    return {
      valid: false,
      error:
        lang === "ar"
          ? "الرموز المتسلسلة غير مسموح بها لأسباب أمنية"
          : "Sequential numbers are not permitted for security reasons.",
    };
  }

  return { valid: true };
}

/**
 * Formats a PIN for clean visual display (e.g. "8 4 9 2 0 1").
 */
export function formatPinDisplay(pin: string | null | undefined): string {
  if (!pin) return "— — — — — —";
  return pin.split("").join(" ");
}


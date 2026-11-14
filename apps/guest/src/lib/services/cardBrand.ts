export type CardBrand = "mada" | "visa" | "mastercard" | "amex";

/**
 * Known Saudi Payments (mada) 6-digit BIN prefixes, including official MyFatoorah sandbox mada BINs.
 */
export const MADA_BIN_PREFIXES = [
  "400861", "401757", "406136", "407197", "409201", "410685", "412565",
  "417633", "419593", "420132", "422817", "422818", "422819", "428331",
  "428671", "428672", "428673", "431361", "432328", "434107", "439954",
  "440533", "440647", "440795", "445564", "446393", "446404", "446672",
  "455036", "455708", "457865", "457997", "458456", "462220", "468540",
  "468541", "468542", "468543", "483010", "483011", "483012", "484783",
  "486094", "486095", "486096", "489317", "489318", "489319", "493428",
  "504300", "506968", "508160", "513213", "520058", "521076", "524130",
  "524514", "529415", "529741", "530060", "530906", "531095", "531196",
  "532013", "535825", "536023", "537767", "539931", "540975", "543085",
  "543357", "549760", "554180", "557606", "558563", "558848", "585265",
  "588845", "588846", "588847", "588848", "588849", "588850", "588851",
  "588982", "588983", "589005", "589206", "604906", "605141", "636120",
  "968201", "968202", "968203", "968204", "968205", "968206", "968207",
  "968208", "968209", "968211",
] as const;

/**
 * Detects card brand as the user types a card number; returns null until a valid prefix is present.
 */
export function detectCardBrandOrNull(cardNumber: string): CardBrand | null {
  const clean = cardNumber.replace(/\D/g, "");
  if (!clean) return null;

  if (clean.length >= 6) {
    const bin6 = clean.slice(0, 6);
    if (MADA_BIN_PREFIXES.includes(bin6 as (typeof MADA_BIN_PREFIXES)[number])) {
      return "mada";
    }
  }

  if (/^3[47]/.test(clean)) return "amex";
  if (clean.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(clean) || /^(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/.test(clean)) {
    return "mastercard";
  }
  return null;
}

/**
 * Detects card brand with "mada" fallback for persistence.
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  return detectCardBrandOrNull(cardNumber) || "mada";
}

export function getCardBrandMeta(brand: CardBrand): {
  labelEn: string;
  labelAr: string;
  iconPath: string;
  maxLength: number;
} {
  switch (brand) {
    case "visa":
      return {
        labelEn: "Visa",
        labelAr: "فيزا",
        iconPath: "/payment-icons/v.png",
        maxLength: 16,
      };
    case "mastercard":
      return {
        labelEn: "Mastercard",
        labelAr: "ماستركارد",
        iconPath: "/payment-icons/m.png",
        maxLength: 16,
      };
    case "amex":
      return {
        labelEn: "American Express",
        labelAr: "أمريكان إكسبريس",
        iconPath: "/payment-icons/ae.png",
        maxLength: 15,
      };
    case "mada":
    default:
      return {
        labelEn: "mada",
        labelAr: "مدى",
        iconPath: "/payment-icons/md.png",
        maxLength: 16,
      };
  }
}

/**
 * Formats card number for display while typing (4-6-5 for Amex, 4-4-4-4 for others).
 */
export function formatCardNumberInput(value: string): string {
  const brand = detectCardBrandOrNull(value);
  const maxLen = brand === "amex" ? 15 : 16;
  const raw = value.replace(/\D/g, "").slice(0, maxLen);

  if (brand === "amex") {
    const p1 = raw.slice(0, 4);
    const p2 = raw.slice(4, 10);
    const p3 = raw.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }

  return (raw.match(/[\s\S]{1,4}/g) || []).join(" ");
}

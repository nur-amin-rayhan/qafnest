import { SAUDI_ALL_CITIES } from "@qafnest/shared";
import type { NominatimAddress } from "./serverGeocoderTypes";

export const DIRECTION_EN_MAP: Record<"شمال" | "جنوب" | "شرق" | "غرب" | "وسط", string> = {
  شمال: "North",
  جنوب: "South",
  شرق: "East",
  غرب: "West",
  وسط: "Central",
};

const HAS_ARABIC_RE = /[\u0600-\u06FF]/;
const HAS_LATIN_RE = /[A-Za-z]/;

export function stripBidiChars(value: string): string {
  return value.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
}

export function normalizeArabicDigits(value: string): string {
  return value.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function hasArabic(value?: string | null): boolean {
  return Boolean(value && HAS_ARABIC_RE.test(value));
}

export function hasLatin(value?: string | null): boolean {
  return Boolean(value && HAS_LATIN_RE.test(value));
}

export function isSaudiShortCode(value: string): boolean {
  return /^[A-Z]{4}\d{4}(?:[،,\s]+\d{4,5})?$/i.test(value.trim());
}

export function isPlusCode(value: string): boolean {
  return /^[2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,4}/i.test(value.trim());
}

export function isNoiseHint(value?: string | null): boolean {
  if (!value) return true;
  const trimmed = stripBidiChars(value).trim();
  if (!trimmed || trimmed.length < 3) return true;
  if (/^\d{1,3}°/.test(trimmed) || /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(trimmed)) return true;
  if (isSaudiShortCode(trimmed) || isPlusCode(trimmed)) return true;
  return /^(?:google maps|خرائط\s*google|saudi arabia|المملكة العربية السعودية|السعودية|unnamed road)$/i.test(trimmed);
}

export function normalizeHints(hint?: string | null): string {
  if (!hint) return "";
  const cleaned = stripBidiChars(hint).replace(/\s+/g, " ").trim();
  return isNoiseHint(cleaned) ? "" : cleaned;
}

export function extractBuildingNumberPrefix(value?: string | null): string {
  if (!value) return "";
  const clean = normalizeArabicDigits(stripBidiChars(value)).trim();
  return clean.match(/^(\d{3,5})\s+(?:[\u0600-\u06FFA-Za-z])/)?.[1] || "";
}

export function stripLeadingBuildingNumber(street: string, addNum?: string): string {
  const clean = stripBidiChars(street).trim();
  if (!clean) return "";
  if (addNum) {
    const escaped = addNum.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stripped = clean.replace(new RegExp(`^${escaped}\\s+`), "").trim();
    if (stripped) return stripped;
  }
  return clean.replace(/^\d{3,5}\s+/, "").trim();
}

export function approxDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLatMeters = (lat2 - lat1) * 111320;
  const dLngMeters = (lng2 - lng1) * 111320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLatMeters, dLngMeters);
}

export function normalizeComparableName(val?: string | null): string {
  return (val || "").toLowerCase().replace(/^(?:al|el)[-\s]+/i, "").replace(/[-\s_]+/g, " ").trim();
}

export function dedupeJoin(parts: Array<string | undefined | null>, separator: string): string {
  const result: string[] = [];
  for (const raw of parts) {
    const clean = (raw || "").trim();
    if (!clean) continue;
    const norm = clean.toLowerCase().replace(/[-\s]+/g, " ");
    if (!result.some((existing) => existing.toLowerCase().replace(/[-\s]+/g, " ") === norm)) {
      result.push(clean);
    }
  }
  return result.join(separator);
}

const ARABIC_SAUDI_TERMS: Record<string, string> = {
  الملك: "King", الأمير: "Prince", الامير: "Prince", عبدالعزيز: "Abdulaziz", "عبد العزيز": "Abdulaziz",
  فهد: "Fahd", سلمان: "Salman", عبدالله: "Abdullah", "عبد الله": "Abdullah", فيصل: "Faisal",
  خالد: "Khalid", سلطان: "Sultan", سعود: "Saud", تركي: "Turki", محمد: "Mohammed", بندر: "Bandar",
  أنس: "Anas", مالك: "Malik", عثمان: "Othman", عفان: "Affan", أبو: "Abu", بكر: "Bakr", بدر: "Badr",
  مسعود: "Mas'ud", البدري: "Al Badri", القباني: "Al Qabbani", عمر: "Omar", علي: "Ali", الأول: "Al Awwal",
  الثاني: "Al Thani", بن: "Bin", رقم: "No.", العام: "Main", الرئيسي: "Main", الدائري: "Ring",
  الشمالي: "North", الجنوبي: "South", الشرقي: "East", الغربي: "West", العليا: "Al Olaya", الملقا: "Al Malqa",
  النرجس: "Al Narjis", الياسمين: "Al Yasmin", العمارية: "Al Ammariyah", الدرعية: "Diriyah", حطين: "Hittin",
  أبحر: "Abhur", الشمالية: "Al Shamaliyah", الكورنيش: "Corniche", المطار: "Airport", المدينة: "Al Madinah",
  الرياض: "Riyadh", جدة: "Jeddah", طيبة: "Taibah", الشاطئ: "Al Shati", التخصصي: "Takhassusi",
  العروبة: "Al Urubah", التحلية: "Tahlia",
};

const ARABIC_CHAR_MAP: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "aa", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh",
  ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q",
  ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "ah", و: "w", ي: "y", ى: "a", ئ: "i", ؤ: "o", ء: "",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

function romanizeArabicWord(word: string): string {
  if (ARABIC_SAUDI_TERMS[word]) return ARABIC_SAUDI_TERMS[word];
  if (word.startsWith("ال") && word.length > 2) {
    const rest = word.slice(2);
    const restMapped = ARABIC_SAUDI_TERMS[rest];
    if (restMapped) return restMapped.startsWith("Al ") ? restMapped : `Al ${restMapped}`;
    return `Al ${romanizeArabicWord(rest)}`;
  }
  let out = "";
  for (const ch of word) out += ARABIC_CHAR_MAP[ch] ?? ch;
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : "";
}

export function arabicRoadToEnglishFallback(input: string): string {
  const clean = normalizeArabicDigits(stripBidiChars(input))
    .replace(/[^\u0600-\u06FFA-Za-z0-9.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean || !hasArabic(clean)) return clean;

  const numPrefix = clean.match(/^(\d{3,5})\s+(.*)$/);
  const leadingNum = numPrefix?.[1] || "";
  const restClean = numPrefix?.[2]?.trim() || clean;

  const prefixSuffixPairs: Array<[string, string]> = [
    ["طريق ", "Rd"], ["شارع ", "St"], ["ممر ", "Ln"], ["جادة ", "Ave"],
  ];
  let suffix = "";
  let body = restClean;
  for (const [arPrefix, enSuffix] of prefixSuffixPairs) {
    if (restClean.startsWith(arPrefix)) {
      suffix = enSuffix;
      body = restClean.slice(arPrefix.length).trim();
      break;
    }
  }

  const tokens = body.split(" ").filter(Boolean).map((w) => (hasArabic(w) ? romanizeArabicWord(w) : w));
  return [leadingNum, ...tokens, suffix].filter(Boolean).join(" ").trim() || clean;
}

export function englishRoadToArabicFallback(input: string): string {
  const clean = stripBidiChars(input).trim();
  if (!clean || hasArabic(clean)) return clean;
  return clean
    .replace(/\bStreet\s+No\.?\s*/i, "شارع رقم ")
    .replace(/\bRoad\b|\bRd\b/gi, "طريق")
    .replace(/\bStreet\b|\bSt\b/gi, "شارع")
    .trim();
}

export function isStreetOrBuildingSegment(seg: string): boolean {
  const clean = normalizeArabicDigits(seg).trim();
  if (/^\d{3,5}\s+[\u0600-\u06FFA-Za-z]/.test(clean) && !isSaudiShortCode(clean)) return true;
  return (
    /\b(street|st|road|rd|avenue|ave|highway|blvd|boulevard|way|drive|dr)\b/i.test(clean) ||
    /(شارع|طريق|جادة|ممر|ميدان)/.test(clean)
  );
}

function isCityDistrictOrPostcodeSegment(
  seg: string,
  cityEn: string,
  cityAr: string,
  districtEn: string,
  districtAr: string
): boolean {
  const clean = normalizeArabicDigits(seg).trim();
  const norm = normalizeComparableName(clean);
  if (!norm || /^\d{4,6}$/.test(clean) || isSaudiShortCode(clean) || isPlusCode(clean) || isNoiseHint(clean)) return true;

  const withoutPostal = normalizeComparableName(clean.replace(/\b\d{5}\b/g, "").trim());
  const cityDistSet = [cityEn, cityAr, districtEn, districtAr].map(normalizeComparableName).filter(Boolean);
  if (cityDistSet.includes(norm) || (withoutPostal && cityDistSet.includes(withoutPostal))) return true;

  if (/^(?:حي|منطقة|محافظة)\s+/i.test(clean)) {
    const withoutPrefix = normalizeComparableName(clean.replace(/^(?:حي|منطقة|محافظة)\s+/i, ""));
    if (withoutPrefix && cityDistSet.includes(withoutPrefix)) return true;
  }
  return false;
}

export function extractStreetFromPlaceHint(
  hint: string,
  cityEn: string,
  cityAr: string,
  districtEn: string,
  districtAr: string
): string {
  const clean = normalizeHints(hint);
  if (!clean) return "";
  const segments = clean.split(/[،,·|]/).map((s) => stripBidiChars(s).trim()).filter(Boolean);
  const explicitStreetSeg = segments.find((seg) => isStreetOrBuildingSegment(seg));
  if (explicitStreetSeg && !isNoiseHint(explicitStreetSeg)) return explicitStreetSeg;
  return segments.find((seg) => !isCityDistrictOrPostcodeSegment(seg, cityEn, cityAr, districtEn, districtAr)) || "";
}

export function computeDirectionFromCenter(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
): "شمال" | "جنوب" | "شرق" | "غرب" | "وسط" {
  const dLat = lat - centerLat;
  const dLng = lng - centerLng;
  if (Math.abs(dLat) < 0.02 && Math.abs(dLng) < 0.02) return "وسط";
  if (Math.abs(dLat) >= Math.abs(dLng)) return dLat >= 0 ? "شمال" : "جنوب";
  return dLng >= 0 ? "شرق" : "غرب";
}

export function findNearestSaudiCity(lat: number, lng: number) {
  let best = SAUDI_ALL_CITIES[0];
  let bestDist = Infinity;
  for (const city of SAUDI_ALL_CITIES) {
    const d = Math.hypot(city.lat - lat, city.lng - lng);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return { city: best, distanceDeg: bestDist };
}

export function pickNominatimField(addr: NominatimAddress | undefined, keys: Array<keyof NominatimAddress>): string {
  if (!addr) return "";
  for (const k of keys) {
    const val = addr[k];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

function roadTokensLatin(raw: string): string[] {
  const english = hasArabic(raw) ? arabicRoadToEnglishFallback(raw) : raw;
  return normalizeArabicDigits(stripBidiChars(english))
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\b\d{3,5}\b/g, " ")
    .replace(/\b(?:al|el|shari|street|st|road|rd|avenue|ave|way|drive|dr)\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) => w.replace(/abi/g, "abu").replace(/oo|ou/g, "u").replace(/ee/g, "i"));
}

export function areSimilarRoadNames(a: string, b: string): boolean {
  const ta = roadTokensLatin(a);
  const tb = roadTokensLatin(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const matches = ta.filter((w) => tb.some((u) => u === w || u.startsWith(w) || w.startsWith(u)));
  return matches.length >= Math.min(2, ta.length, tb.length);
}

export function combineBuildingWithRoad(buildingNum: string, roadWithPossibleNum: string, addNum?: string): string {
  const cleanRoad = stripLeadingBuildingNumber(roadWithPossibleNum, addNum);
  return cleanRoad ? `${buildingNum} ${cleanRoad}`.trim() : buildingNum;
}

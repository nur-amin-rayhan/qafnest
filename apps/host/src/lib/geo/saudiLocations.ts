import { SAUDI_ALL_CITIES, resolveSaudiCity } from "@qafnest/shared";

export interface DistrictInfo {
  id: string; // Arabic name, e.g. "حي الملقا"
  en: string; // English name, e.g. "Al-Malqa"
  x: number; // Map X coordinate percentage (0 - 100)
  y: number; // Map Y coordinate percentage (0 - 100)
  lat: number; // GPS Latitude
  lng: number; // GPS Longitude
  direction: "شمال" | "جنوب" | "شرق" | "غرب" | "وسط";
  directionEn: "North" | "South" | "East" | "West" | "Central";
  postalCode: string;
  streetSample: string;
  streetSampleEn: string;
  keywords: string[];
}

export interface CityInfo {
  id: string; // Arabic name, e.g. "الرياض"
  en: string; // English name, e.g. "Riyadh"
  lat: number;
  lng: number;
  defaultPin: { x: number; y: number };
  districts: DistrictInfo[];
}

export const DIRECTION_OPTIONS = [
  { id: "شمال", en: "North", ar: "شمال" },
  { id: "جنوب", en: "South", ar: "جنوب" },
  { id: "شرق", en: "East", ar: "شرق" },
  { id: "غرب", en: "West", ar: "غرب" },
  { id: "وسط", en: "Central", ar: "وسط" },
] as const;

const FEATURED_SAUDI_CITIES: CityInfo[] = [
  {
    id: "الرياض",
    en: "Riyadh",
    lat: 24.7136,
    lng: 46.6753,
    defaultPin: { x: 50, y: 50 },
    districts: [
      {
        id: "حي الملقا",
        en: "Al-Malqa",
        x: 36,
        y: 20,
        lat: 24.8105,
        lng: 46.612,
        direction: "شمال",
        directionEn: "North",
        postalCode: "13524",
        streetSample: "طريق الأمير تركي بن عبدالعزيز الأول",
        streetSampleEn: "Prince Turki Ibn Abdulaziz Al Awwal Rd",
        keywords: ["الملقا", "ملقا", "malqa", "al-malqa", "al malqa", "turki"],
      },
      {
        id: "حي النرجس",
        en: "Al-Narjis",
        x: 64,
        y: 18,
        lat: 24.842,
        lng: 46.685,
        direction: "شمال",
        directionEn: "North",
        postalCode: "13324",
        streetSample: "شارع عثمان بن عفان",
        streetSampleEn: "Othman Ibn Affan St",
        keywords: ["النرجس", "نرجس", "narjis", "al-narjis", "al narjis"],
      },
      {
        id: "حي الياسمين",
        en: "Al-Yasmin",
        x: 52,
        y: 24,
        lat: 24.809,
        lng: 46.65,
        direction: "شمال",
        directionEn: "North",
        postalCode: "13322",
        streetSample: "طريق أنس بن مالك",
        streetSampleEn: "Anas Ibn Malik Rd",
        keywords: ["الياسمين", "ياسمين", "yasmin", "al-yasmin", "al yasmin"],
      },
      {
        id: "حي حطين",
        en: "Hittin",
        x: 30,
        y: 30,
        lat: 24.768,
        lng: 46.598,
        direction: "شمال",
        directionEn: "North",
        postalCode: "13512",
        streetSample: "طريق الأمير محمد بن سلمان",
        streetSampleEn: "Prince Mohammed Bin Salman Rd",
        keywords: ["حطين", "hittin", "httin", "boulevard", "بوليفارد"],
      },
      {
        id: "حي العمارية",
        en: "Al-Ammariyah",
        x: 16,
        y: 22,
        lat: 24.821,
        lng: 46.425,
        direction: "غرب",
        directionEn: "West",
        postalCode: "13725",
        streetSample: "طريق العمارية العام",
        streetSampleEn: "Al-Ammariyah Main Rd",
        keywords: ["العمارية", "عمارية", "ammariyah", "amariya", "شاليهات العمارية"],
      },
      {
        id: "حي الرفيعة",
        en: "Al-Rafiah",
        x: 44,
        y: 56,
        lat: 24.6333,
        lng: 46.6853,
        direction: "غرب",
        directionEn: "West",
        postalCode: "12752",
        streetSample: "طريق مكة المكرمة",
        streetSampleEn: "Makkah Al Mukarramah Rd",
        keywords: ["الرفيعة", "رفيعة", "rafiah", "al-rafiah", "al rafiah"],
      },
      {
        id: "حي الدرعية",
        en: "Diriyah",
        x: 22,
        y: 38,
        lat: 24.7333,
        lng: 46.575,
        direction: "غرب",
        directionEn: "West",
        postalCode: "13711",
        streetSample: "شارع الطريف التاريخي",
        streetSampleEn: "At-Turaif Historical St",
        keywords: ["الدرعية", "درعية", "diriyah", "turaif", "طريف", "بجيري"],
      },
      {
        id: "حي العليا",
        en: "Al-Olaya",
        x: 48,
        y: 46,
        lat: 24.711,
        lng: 46.674,
        direction: "وسط",
        directionEn: "Central",
        postalCode: "12211",
        streetSample: "طريق الملك فهد، برج المملكة",
        streetSampleEn: "King Fahd Rd, Kingdom Centre",
        keywords: ["العليا", "عليا", "olaya", "olayah", "برج المملكة"],
      },
      {
        id: "حي السليمانية",
        en: "Al-Sulaimaniyah",
        x: 54,
        y: 48,
        lat: 24.7,
        lng: 46.7,
        direction: "وسط",
        directionEn: "Central",
        postalCode: "12243",
        streetSample: "شارع الأمير محمد بن عبدالعزيز (التحلية)",
        streetSampleEn: "Tahlia St",
        keywords: ["السليمانية", "سليمانية", "sulaimaniyah", "tahlia", "التحلية"],
      },
      {
        id: "حي الرمال",
        en: "Al-Rimal",
        x: 84,
        y: 38,
        lat: 24.795,
        lng: 46.852,
        direction: "شرق",
        directionEn: "East",
        postalCode: "13264",
        streetSample: "طريق الجنادرية",
        streetSampleEn: "Janadriyah Rd",
        keywords: ["الرمال", "رمال", "rimal", "al-rimal", "الجنادرية"],
      },
      {
        id: "حي الصحافة",
        en: "Al-Sahafa",
        x: 48,
        y: 16,
        lat: 24.815,
        lng: 46.64,
        direction: "شمال",
        directionEn: "North",
        postalCode: "13321",
        streetSample: "طريق الملك عبدالعزيز",
        streetSampleEn: "King Abdulaziz Rd",
        keywords: ["الصحافة", "صحافة", "sahafa", "al-sahafa"],
      },
      {
        id: "حي العقيق",
        en: "Al-Aqeeq",
        x: 40,
        y: 28,
        lat: 24.775,
        lng: 46.63,
        direction: "شمال",
        directionEn: "North",
        postalCode: "13511",
        streetSample: "طريق الإمام سعود بن فيصل",
        streetSampleEn: "Imam Saud Bin Faisal Rd",
        keywords: ["العقيق", "عقيق", "aqeeq", "al-aqeeq", "kfd", "المالي"],
      },
      {
        id: "حي الشفا",
        en: "Al-Shifa",
        x: 46,
        y: 78,
        lat: 24.542,
        lng: 46.711,
        direction: "جنوب",
        directionEn: "South",
        postalCode: "14713",
        streetSample: "طريق ديراب الفرعي",
        streetSampleEn: "Deyrab Branch Rd",
        keywords: ["الشفا", "شفا", "shifa", "al-shifa"],
      },
    ],
  },
  {
    id: "جدة",
    en: "Jeddah",
    lat: 21.5433,
    lng: 39.1728,
    defaultPin: { x: 42, y: 46 },
    districts: [
      {
        id: "حي الشاطئ",
        en: "Al-Shati",
        x: 28,
        y: 34,
        lat: 21.602,
        lng: 39.112,
        direction: "غرب",
        directionEn: "West",
        postalCode: "23414",
        streetSample: "طريق الكورنيش الشمالي",
        streetSampleEn: "North Corniche Rd",
        keywords: ["الشاطئ", "شاطئ", "shati", "al-shati", "الكورنيش"],
      },
      {
        id: "حي أبحر الشمالية",
        en: "North Obhur",
        x: 34,
        y: 16,
        lat: 21.745,
        lng: 39.124,
        direction: "شمال",
        directionEn: "North",
        postalCode: "23815",
        streetSample: "شارع الأمير نايف",
        streetSampleEn: "Prince Naif St",
        keywords: ["أبحر", "ابحر", "obhur", "abhor", "شاليهات ابحر"],
      },
      {
        id: "حي الروضة",
        en: "Al-Rawdah",
        x: 52,
        y: 44,
        lat: 21.565,
        lng: 39.158,
        direction: "وسط",
        directionEn: "Central",
        postalCode: "23432",
        streetSample: "شارع الأمير محمد بن عبدالعزيز (التحلية)",
        streetSampleEn: "Prince Mohammed Bin Abdulaziz St",
        keywords: ["الروضة", "روضة", "rawdah", "al-rawdah"],
      },
      {
        id: "حي الحمراء",
        en: "Al-Hamra",
        x: 36,
        y: 60,
        lat: 21.518,
        lng: 39.162,
        direction: "غرب",
        directionEn: "West",
        postalCode: "23212",
        streetSample: "طريق الأندلس، نافورة الملك فهد",
        streetSampleEn: "Al Andalus Rd, King Fahd Fountain",
        keywords: ["الحمراء", "حمراء", "hamra", "al-hamra", "نافورة"],
      },
    ],
  },
  {
    id: "الدمام",
    en: "Dammam",
    lat: 26.4207,
    lng: 50.0888,
    defaultPin: { x: 50, y: 45 },
    districts: [
      {
        id: "حي الشاطئ الشرقي",
        en: "Al-Shati Al-Sharqi",
        x: 58,
        y: 30,
        lat: 26.452,
        lng: 50.125,
        direction: "شرق",
        directionEn: "East",
        postalCode: "32414",
        streetSample: "طريق الخليج العربي",
        streetSampleEn: "Arabian Gulf Rd",
        keywords: ["الشاطئ", "شاطئ", "shati", "كورنيش الدمام"],
      },
      {
        id: "حي المزروعية",
        en: "Al-Mazrouiyah",
        x: 48,
        y: 46,
        lat: 26.438,
        lng: 50.105,
        direction: "وسط",
        directionEn: "Central",
        postalCode: "32412",
        streetSample: "شارع الأشرعة",
        streetSampleEn: "Al Ashriah St",
        keywords: ["المزروعية", "مزروعية", "mazrouiyah"],
      },
      {
        id: "حي الفاخرية",
        en: "Al-Fakhiriyah",
        x: 36,
        y: 68,
        lat: 26.375,
        lng: 50.052,
        direction: "غرب",
        directionEn: "West",
        postalCode: "32262",
        streetSample: "طريق الملك فهد بن عبدالعزيز",
        streetSampleEn: "King Fahd Bin Abdulaziz Rd",
        keywords: ["الفاخرية", "فاخرية", "fakhiriyah"],
      },
    ],
  },
  {
    id: "الخبر",
    en: "Khobar",
    lat: 26.2172,
    lng: 50.1971,
    defaultPin: { x: 50, y: 45 },
    districts: [
      {
        id: "حي الكورنيش",
        en: "Al-Corniche",
        x: 56,
        y: 32,
        lat: 26.285,
        lng: 50.215,
        direction: "شرق",
        directionEn: "East",
        postalCode: "34412",
        streetSample: "طريق الكورنيش الجنوبي",
        streetSampleEn: "South Corniche Rd",
        keywords: ["الكورنيش", "كورنيش", "corniche", "khobar corniche"],
      },
      {
        id: "حي العزيزية",
        en: "Al-Aziziyah",
        x: 44,
        y: 72,
        lat: 26.155,
        lng: 50.175,
        direction: "جنوب",
        directionEn: "South",
        postalCode: "34712",
        streetSample: "طريق الملك خالد، شاليهات العزيزية",
        streetSampleEn: "King Khalid Rd, Aziziyah Chalets",
        keywords: ["العزيزية", "عزيزية", "aziziyah", "شاليهات العزيزية"],
      },
    ],
  },
  {
    id: "العلا",
    en: "AlUla",
    lat: 26.6083,
    lng: 37.9222,
    defaultPin: { x: 50, y: 48 },
    districts: [
      {
        id: "حي الديرة (البلدة القديمة)",
        en: "Old Town (Al-Deerah)",
        x: 48,
        y: 52,
        lat: 26.612,
        lng: 37.918,
        direction: "وسط",
        directionEn: "Central",
        postalCode: "43511",
        streetSample: "طريق البلدة القديمة التاريخي",
        streetSampleEn: "Old Town Historical Rd",
        keywords: ["الديرة", "ديرة", "البلدة القديمة", "old town", "alula old town"],
      },
      {
        id: "واحة العلا",
        en: "AlUla Oasis",
        x: 42,
        y: 40,
        lat: 26.635,
        lng: 37.912,
        direction: "شمال",
        directionEn: "North",
        postalCode: "43515",
        streetSample: "ممشى الواحة الخضراء",
        streetSampleEn: "Green Oasis Trail",
        keywords: ["الواحة", "واحة", "oasis", "مزارع العلا"],
      },
      {
        id: "حي الصخيرات",
        en: "Al-Sukhayrat",
        x: 58,
        y: 62,
        lat: 26.582,
        lng: 37.935,
        direction: "جنوب",
        directionEn: "South",
        postalCode: "43521",
        streetSample: "طريق الملك عبدالعزيز",
        streetSampleEn: "King Abdulaziz Rd",
        keywords: ["الصخيرات", "صخيرات", "sukhayrat"],
      },
    ],
  },
  {
    id: "مكة المكرمة",
    en: "Makkah",
    lat: 21.3891,
    lng: 39.8579,
    defaultPin: { x: 50, y: 50 },
    districts: [
      {
        id: "حي العزيزية",
        en: "Al-Aziziyah",
        x: 62,
        y: 45,
        lat: 21.412,
        lng: 39.878,
        direction: "شرق",
        directionEn: "East",
        postalCode: "24243",
        streetSample: "طريق المسجد الحرام",
        streetSampleEn: "Masjid Al Haram Rd",
        keywords: ["العزيزية", "عزيزية", "aziziyah"],
      },
      {
        id: "حي العوالي",
        en: "Al-Awali",
        x: 72,
        y: 65,
        lat: 21.365,
        lng: 39.912,
        direction: "جنوب",
        directionEn: "South",
        postalCode: "24372",
        streetSample: "طريق الطائف السريع",
        streetSampleEn: "Taif Expressway",
        keywords: ["العوالي", "عوالي", "awali"],
      },
      {
        id: "حي الشوقية",
        en: "Al-Shawqiyyah",
        x: 32,
        y: 68,
        lat: 21.372,
        lng: 39.815,
        direction: "غرب",
        directionEn: "West",
        postalCode: "24351",
        streetSample: "شارع عبدالله بن العباس",
        streetSampleEn: "Abdullah Bin Abbas St",
        keywords: ["الشوقية", "شوقية", "shawqiyyah"],
      },
    ],
  },
  {
    id: "المدينة المنورة",
    en: "Madinah",
    lat: 24.5247,
    lng: 39.5692,
    defaultPin: { x: 50, y: 50 },
    districts: [
      {
        id: "حي قباء",
        en: "Quba",
        x: 48,
        y: 68,
        lat: 24.438,
        lng: 39.615,
        direction: "جنوب",
        directionEn: "South",
        postalCode: "42315",
        streetSample: "طريق الهجرة، بالقرب من مسجد قباء",
        streetSampleEn: "Al Hijrah Rd, near Quba Mosque",
        keywords: ["قباء", "quba", "مسجد قباء"],
      },
      {
        id: "حي سلطانة",
        en: "Sultana",
        x: 42,
        y: 35,
        lat: 24.492,
        lng: 39.585,
        direction: "شمال",
        directionEn: "North",
        postalCode: "42331",
        streetSample: "شارع أبي بكر الصديق (سلطانة)",
        streetSampleEn: "Abu Bakr As-Siddiq St (Sultana)",
        keywords: ["سلطانة", "sultana", "شارع سلطانة"],
      },
    ],
  },
  {
    id: "أبها",
    en: "Abha",
    lat: 18.2164,
    lng: 42.5053,
    defaultPin: { x: 50, y: 50 },
    districts: [
      {
        id: "حي السودة",
        en: "Al-Soudah",
        x: 24,
        y: 28,
        lat: 18.275,
        lng: 42.365,
        direction: "شمال",
        directionEn: "North",
        postalCode: "62562",
        streetSample: "طريق السودة السياحي",
        streetSampleEn: "Al Soudah Scenic Rd",
        keywords: ["السودة", "سودة", "soudah", "al-soudah", "شاليهات السودة"],
      },
      {
        id: "حي الضباب",
        en: "Al-Dhabab",
        x: 45,
        y: 55,
        lat: 18.205,
        lng: 42.495,
        direction: "جنوب",
        directionEn: "South",
        postalCode: "62521",
        streetSample: "ممشى الضباب السحابي",
        streetSampleEn: "Fog Walkway",
        keywords: ["الضباب", "ضباب", "dhabab", "fog walk"],
      },
    ],
  },
  {
    id: "الطائف",
    en: "Taif",
    lat: 21.2854,
    lng: 40.4222,
    defaultPin: { x: 50, y: 50 },
    districts: [
      {
        id: "حي الهدا",
        en: "Al-Hada",
        x: 22,
        y: 32,
        lat: 21.365,
        lng: 40.285,
        direction: "غرب",
        directionEn: "West",
        postalCode: "26792",
        streetSample: "طريق الهدا الدائري، تلفريك الهدا",
        streetSampleEn: "Al-Hada Ring Rd",
        keywords: ["الهدا", "هدا", "hada", "al-hada", "منتجعات الهدا"],
      },
      {
        id: "حي الشفا",
        en: "Al-Shafa",
        x: 35,
        y: 72,
        lat: 21.085,
        lng: 40.325,
        direction: "جنوب",
        directionEn: "South",
        postalCode: "26765",
        streetSample: "طريق عقبة الشفا السياحي",
        streetSampleEn: "Al-Shafa Mountain Pass",
        keywords: ["الشفا", "شفا", "shafa", "al-shafa", "جبل الشفا"],
      },
    ],
  },
];

const FEATURED_CITY_EN_SET = new Set(FEATURED_SAUDI_CITIES.map((c) => c.en.toLowerCase()));

export const SAUDI_CITIES: CityInfo[] = [
  ...FEATURED_SAUDI_CITIES,
  ...SAUDI_ALL_CITIES.filter((c) => !FEATURED_CITY_EN_SET.has(c.en.toLowerCase())).map((c) => ({
    id: c.ar,
    en: c.en,
    lat: c.lat,
    lng: c.lng,
    defaultPin: { x: 50, y: 50 },
    districts: [],
  })),
];

/**
 * Normalizes text by trimming and stripping Arabic diacritics / tatweel
 */
export function normalizeSearchText(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0640]/g, "") // remove harakat and tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

/**
 * Returns city info or defaults to Riyadh
 */
export function getCityInfo(cityName?: string): CityInfo {
  if (!cityName) return SAUDI_CITIES[0];

  // Check shared Saudi cities catalog first so all regions & aliases map accurately
  const sharedMatch = resolveSaudiCity(cityName);
  if (sharedMatch) {
    const byShared = SAUDI_CITIES.find(
      (c) =>
        c.en.toLowerCase() === sharedMatch.en.toLowerCase() ||
        normalizeSearchText(c.id) === normalizeSearchText(sharedMatch.ar)
    );
    if (byShared) return byShared;
  }

  const norm = normalizeSearchText(cityName);
  const exact = SAUDI_CITIES.find(
    (c) => normalizeSearchText(c.id) === norm || c.en.toLowerCase() === norm
  );
  if (exact) return exact;

  const fuzzy = SAUDI_CITIES.find(
    (c) =>
      normalizeSearchText(c.id).includes(norm) ||
      norm.includes(normalizeSearchText(c.id)) ||
      c.en.toLowerCase().includes(norm)
  );
  return fuzzy || SAUDI_CITIES[0];
}

/**
 * Localized direction display helper
 */
export function getDirectionDisplay(
  dir: string | undefined,
  lang: "ar" | "en"
): string {
  if (!dir) return lang === "ar" ? "وسط" : "Central";
  const norm = dir.trim();
  if (norm === "شمال" || norm.toLowerCase() === "north") {
    return lang === "ar" ? "شمال" : "North";
  }
  if (norm === "جنوب" || norm.toLowerCase() === "south") {
    return lang === "ar" ? "جنوب" : "South";
  }
  if (norm === "شرق" || norm.toLowerCase() === "east") {
    return lang === "ar" ? "شرق" : "East";
  }
  if (norm === "غرب" || norm.toLowerCase() === "west") {
    return lang === "ar" ? "غرب" : "West";
  }
  return lang === "ar" ? "وسط" : "Central";
}

/**
 * Normalizes direction to canonical Arabic id ("شمال" | "جنوب" | "شرق" | "غرب" | "وسط")
 */
export function toDirectionId(
  dir: string | undefined
): "شمال" | "جنوب" | "شرق" | "غرب" | "وسط" | "" {
  if (!dir?.trim()) return "";
  const norm = dir.trim().toLowerCase();
  if (dir === "شمال" || norm === "north") return "شمال";
  if (dir === "جنوب" || norm === "south") return "جنوب";
  if (dir === "شرق" || norm === "east") return "شرق";
  if (dir === "غرب" || norm === "west") return "غرب";
  if (dir === "وسط" || norm === "central" || norm === "center") return "وسط";
  return "";
}

/**
 * Localized city display helper
 */
export function getCityDisplay(cityName: string | undefined, lang: "ar" | "en"): string {
  if (!cityName?.trim()) return "";
  const c = getCityInfo(cityName);
  return lang === "ar" ? c.id : c.en;
}

/**
 * Normalizes city to canonical Arabic id
 */
export function toCityId(cityName: string | undefined): string {
  if (!cityName?.trim()) return "";
  const c = getCityInfo(cityName);
  return c.id;
}

/**
 * Localized district display helper
 */
export function getDistrictDisplay(
  districtName: string | undefined,
  lang: "ar" | "en",
  cityName?: string
): string {
  if (!districtName?.trim()) return lang === "ar" ? "حي مختار" : "Selected District";
  const city = getCityInfo(cityName);
  const norm = normalizeSearchText(districtName);

  // Look in given city first
  const foundInCity = city.districts.find(
    (d) =>
      normalizeSearchText(d.id) === norm ||
      d.en.toLowerCase() === districtName.toLowerCase().trim() ||
      normalizeSearchText(d.id).includes(norm)
  );
  if (foundInCity) return lang === "ar" ? foundInCity.id : foundInCity.en;

  // Search across all cities
  for (const c of SAUDI_CITIES) {
    const f = c.districts.find(
      (d) =>
        normalizeSearchText(d.id) === norm ||
        d.en.toLowerCase() === districtName.toLowerCase().trim()
    );
    if (f) return lang === "ar" ? f.id : f.en;
  }

  return districtName;
}

/**
 * Normalizes district to canonical Arabic id
 */
export function toDistrictId(districtName: string | undefined, cityName?: string): string {
  if (!districtName?.trim()) return "";
  const city = getCityInfo(cityName);
  const norm = normalizeSearchText(districtName);

  const foundInCity = city.districts.find(
    (d) =>
      normalizeSearchText(d.id) === norm ||
      d.en.toLowerCase() === districtName.toLowerCase().trim() ||
      normalizeSearchText(d.id).includes(norm)
  );
  if (foundInCity) return foundInCity.id;

  for (const c of SAUDI_CITIES) {
    const f = c.districts.find(
      (d) =>
        normalizeSearchText(d.id) === norm ||
        d.en.toLowerCase() === districtName.toLowerCase().trim()
    );
    if (f) return f.id;
  }

  return districtName;
}

/**
 * Determines compass direction relative to city center based on pin (x, y)
 */
export function determineDirection(x: number, y: number): "شمال" | "جنوب" | "شرق" | "غرب" | "وسط" {
  const dx = x - 50;
  const dy = y - 50;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 12) return "وسط";
  if (Math.abs(dy) > Math.abs(dx)) {
    return dy < 0 ? "شمال" : "جنوب";
  } else {
    return dx < 0 ? "غرب" : "شرق";
  }
}

/**
 * Reverse-geocodes pin coordinates (x, y) on the city map
 * into a realistic Saudi address, district, direction, and GPS coordinates.
 */
export function reverseGeocodePin(
  cityName: string,
  pin: { x: number; y: number }
): {
  city: string;
  cityEn: string;
  district: string;
  districtEn: string;
  direction: "شمال" | "جنوب" | "شرق" | "غرب" | "وسط";
  directionEn: "North" | "South" | "East" | "West" | "Central";
  street: string;
  streetEn: string;
  addressAr: string;
  addressEn: string;
  lat: number;
  lng: number;
  postalCode: string;
} {
  const city = getCityInfo(cityName);
  const direction = determineDirection(pin.x, pin.y);
  const directionEnMap = {
    "شمال": "North",
    "جنوب": "South",
    "شرق": "East",
    "غرب": "West",
    "وسط": "Central",
  } as const;
  const directionEn = directionEnMap[direction];

  // Find nearest known district by Euclidean distance on map
  let nearestDistrict = city.districts[0];
  let minDistance = Number.MAX_VALUE;

  for (const dist of city.districts) {
    const d = Math.hypot(dist.x - pin.x, dist.y - pin.y);
    if (d < minDistance) {
      minDistance = d;
      nearestDistrict = dist;
    }
  }

  // Calculate fine GPS coordinates relative to nearest district or city center
  const fineLat = Number((city.lat + (50 - pin.y) * 0.0035).toFixed(5));
  const fineLng = Number((city.lng + (pin.x - 50) * 0.004).toFixed(5));

  const street = nearestDistrict?.streetSample || "الطريق العام";
  const streetEn = nearestDistrict?.streetSampleEn || "Main Road";
  const districtName = nearestDistrict?.id || `${direction} ${city.id}`;
  const districtNameEn = nearestDistrict?.en || `${directionEn} ${city.en}`;
  const postal = nearestDistrict?.postalCode || "";

  // Build Saudi National Address style format
  const postalPartAr = postal ? ` ${postal}` : "";
  const postalPartEn = postal ? ` ${postal}` : "";
  const addressAr = `${street}، ${districtName}، ${city.id}${postalPartAr}، المملكة العربية السعودية`;
  const addressEn = `${streetEn}, ${districtNameEn}, ${city.en}${postalPartEn}, Saudi Arabia`;

  return {
    city: city.id,
    cityEn: city.en,
    district: districtName,
    districtEn: districtNameEn,
    direction,
    directionEn,
    street,
    streetEn,
    addressAr,
    addressEn,
    lat: fineLat,
    lng: fineLng,
    postalCode: postal,
  };
}

/**
 * Forward-geocodes an address or district query string to find matching location & pin
 */
export function geocodeAddress(
  query: string,
  currentCityName?: string
): {
  found: boolean;
  city: string;
  cityEn: string;
  district: string;
  districtEn: string;
  direction: "شمال" | "جنوب" | "شرق" | "غرب" | "وسط";
  directionEn: "North" | "South" | "East" | "West" | "Central";
  pin: { x: number; y: number };
  addressAr: string;
  addressEn: string;
  lat: number;
  lng: number;
} {
  const normQuery = normalizeSearchText(query);
  const currentCity = getCityInfo(currentCityName);
  const directionEnMap = {
    "شمال": "North",
    "جنوب": "South",
    "شرق": "East",
    "غرب": "West",
    "وسط": "Central",
  } as const;

  if (!normQuery) {
    const def = currentCity.districts[0] || {
      id: "حي الملقا",
      en: "Al-Malqa",
      x: 50,
      y: 50,
      direction: "وسط",
      directionEn: "Central",
      postalCode: "12341",
      streetSample: "طريق الملك فهد",
      streetSampleEn: "King Fahd Rd",
    };
    return {
      found: false,
      city: currentCity.id,
      cityEn: currentCity.en,
      district: def.id,
      districtEn: def.en,
      direction: def.direction as any,
      directionEn: (def.directionEn || "Central") as any,
      pin: { x: def.x, y: def.y },
      addressAr: `${def.streetSample}، ${def.id}، ${currentCity.id}، المملكة العربية السعودية`,
      addressEn: `${def.streetSampleEn}, ${def.en}, ${currentCity.en}, Saudi Arabia`,
      lat: currentCity.lat,
      lng: currentCity.lng,
    };
  }

  // 1. Search in current city first
  for (const dist of currentCity.districts) {
    const distNorm = normalizeSearchText(dist.id);
    const distEnNorm = dist.en.toLowerCase();
    const hasMatch =
      normQuery.includes(distNorm) ||
      distNorm.includes(normQuery) ||
      normQuery.includes(distEnNorm) ||
      dist.keywords.some((k) => normQuery.includes(normalizeSearchText(k)));

    if (hasMatch) {
      return {
        found: true,
        city: currentCity.id,
        cityEn: currentCity.en,
        district: dist.id,
        districtEn: dist.en,
        direction: dist.direction,
        directionEn: dist.directionEn,
        pin: { x: dist.x, y: dist.y },
        addressAr: `${dist.streetSample}، ${dist.id}، ${currentCity.id} ${dist.postalCode}، المملكة العربية السعودية`,
        addressEn: `${dist.streetSampleEn}, ${dist.en}, ${currentCity.en} ${dist.postalCode}, Saudi Arabia`,
        lat: dist.lat,
        lng: dist.lng,
      };
    }
  }

  // 2. Search across all other cities and districts
  for (const city of SAUDI_CITIES) {
    const cityNorm = normalizeSearchText(city.id);
    const cityEnNorm = city.en.toLowerCase();
    if (normQuery.includes(cityNorm) || normQuery.includes(cityEnNorm)) {
      for (const dist of city.districts) {
        const distNorm = normalizeSearchText(dist.id);
        if (normQuery.includes(distNorm) || dist.keywords.some((k) => normQuery.includes(normalizeSearchText(k)))) {
          return {
            found: true,
            city: city.id,
            cityEn: city.en,
            district: dist.id,
            districtEn: dist.en,
            direction: dist.direction,
            directionEn: dist.directionEn,
            pin: { x: dist.x, y: dist.y },
            addressAr: `${dist.streetSample}، ${dist.id}، ${city.id} ${dist.postalCode}، المملكة العربية السعودية`,
            addressEn: `${dist.streetSampleEn}, ${dist.en}, ${city.en} ${dist.postalCode}, Saudi Arabia`,
            lat: dist.lat,
            lng: dist.lng,
          };
        }
      }

      const firstDist = city.districts[0];
      const dir = (firstDist?.direction || "وسط") as any;
      return {
        found: true,
        city: city.id,
        cityEn: city.en,
        district: firstDist?.id || "وسط المدينة",
        districtEn: firstDist?.en || "Downtown",
        direction: dir,
        directionEn: directionEnMap[dir as keyof typeof directionEnMap] || "Central",
        pin: city.defaultPin,
        addressAr: `${firstDist?.streetSample || "شارع الملك فهد"}، ${firstDist?.id || "الوسط"}، ${city.id}، المملكة العربية السعودية`,
        addressEn: `${firstDist?.streetSampleEn || "King Fahd St"}, ${firstDist?.en || "Downtown"}, ${city.en}, Saudi Arabia`,
        lat: city.lat,
        lng: city.lng,
      };
    }

    for (const dist of city.districts) {
      const distNorm = normalizeSearchText(dist.id);
      const distEnNorm = dist.en.toLowerCase();
      if (
        normQuery.includes(distNorm) ||
        distNorm.includes(normQuery) ||
        normQuery.includes(distEnNorm) ||
        dist.keywords.some((k) => normQuery.includes(normalizeSearchText(k)))
      ) {
        return {
          found: true,
          city: city.id,
          cityEn: city.en,
          district: dist.id,
          districtEn: dist.en,
          direction: dist.direction,
          directionEn: dist.directionEn,
          pin: { x: dist.x, y: dist.y },
          addressAr: `${dist.streetSample}، ${dist.id}، ${city.id} ${dist.postalCode}، المملكة العربية السعودية`,
          addressEn: `${dist.streetSampleEn}, ${dist.en}, ${city.en} ${dist.postalCode}, Saudi Arabia`,
          lat: dist.lat,
          lng: dist.lng,
        };
      }
    }
  }

  // 3. Fallback: custom address query preserved, pin placed at sensible position
  return {
    found: false,
    city: currentCity.id,
    cityEn: currentCity.en,
    district: currentCity.districts[0]?.id || "حي الرفيعة",
    districtEn: currentCity.districts[0]?.en || "Al-Rafiah",
    direction: "وسط",
    directionEn: "Central",
    pin: { x: 50, y: 50 },
    addressAr: `${query.trim()}، ${currentCity.id}، المملكة العربية السعودية`,
    addressEn: `${query.trim()}, ${currentCity.en}, Saudi Arabia`,
    lat: currentCity.lat,
    lng: currentCity.lng,
  };
}

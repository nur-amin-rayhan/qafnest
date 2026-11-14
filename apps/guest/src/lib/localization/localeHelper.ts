import { resolveSaudiCity } from "@qafnest/shared";
import { CITIES } from "@/components/search/searchConstants";
import { CITY_NAMES_AR } from "@/data/translations";

export type Locale = "ar" | "en";
export const SUPPORTED_LOCALES: readonly Locale[] = ["ar", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ar";

const BASE_URL =
  process.env.NEXT_PUBLIC_GUEST_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://qafnest.com"
    : "http://localhost:3000");

export function isValidLocale(val: unknown): val is Locale {
  return val === "ar" || val === "en";
}

export function getLocaleFromPathname(pathname?: string | null): Locale | null {
  if (!pathname) return null;
  const clean = pathname.split("?")[0].split("#")[0];
  const segments = clean.split("/").filter(Boolean);
  if (segments[0] === "ar") return "ar";
  if (segments[0] === "en") return "en";
  return null;
}

export function stripLocaleFromPathname(pathname: string): string {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0].split("#")[0];
  const queryIndex = pathname.indexOf("?");
  const hashIndex = pathname.indexOf("#");
  const suffix = queryIndex !== -1 ? pathname.slice(queryIndex) : hashIndex !== -1 ? pathname.slice(hashIndex) : "";

  const segments = clean.split("/").filter(Boolean);
  if (segments[0] === "ar" || segments[0] === "en") {
    const stripped = "/" + segments.slice(1).join("/");
    return (stripped === "/" ? "/" : stripped) + suffix;
  }
  return pathname;
}

export function localizePath(path: string, locale: Locale): string {
  if (!path || path === "/") return `/${locale}`;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("mailto:") || path.startsWith("tel:") || path.startsWith("#")) {
    return path;
  }

  const clean = stripLocaleFromPathname(path);
  if (clean === "/" || clean === "") {
    return `/${locale}`;
  }
  return `/${locale}${clean.startsWith("/") ? clean : "/" + clean}`;
}

const CITY_LOOKUP_MAP: Record<string, { en: string; ar: string }> = {
  all: { en: "All Destinations", ar: "جميع الوجهات" },
  riyadh: { en: "Riyadh", ar: "الرياض" },
  jeddah: { en: "Jeddah", ar: "جدة" },
  mecca: { en: "Makkah", ar: "مكة المكرمة" },
  makkah: { en: "Makkah", ar: "مكة المكرمة" },
  madinah: { en: "Madinah", ar: "المدينة المنورة" },
  medina: { en: "Madinah", ar: "المدينة المنورة" },
  alula: { en: "AlUla", ar: "العلا" },
  khobar: { en: "Al Khobar", ar: "الخبر" },
  dammam: { en: "Dammam", ar: "الدمام" },
  alhafuf: { en: "Al-Ahsa & Hofuf", ar: "الأحساء والهفوف" },
  abha: { en: "Abha", ar: "أبها" },
  taif: { en: "Taif", ar: "الطائف" },
  khamis: { en: "Khamis Mushait", ar: "خميس مشيط" },
  "khamis-mushait": { en: "Khamis Mushait", ar: "خميس مشيط" },
  tabuk: { en: "Tabuk", ar: "تبوك" },
  yanbu: { en: "Yanbu", ar: "ينبع" },
  jubail: { en: "Jubail", ar: "الجبيل" },
  hail: { en: "Hail", ar: "حائل" },
  jazan: { en: "Jazan", ar: "جازان" },
  najran: { en: "Najran", ar: "نجران" },
  buraidah: { en: "Buraidah", ar: "بريدة" },
  unaizah: { en: "Unaizah", ar: "عنيزة" },
  "al-bahah": { en: "Al Bahah", ar: "الباحة" },
  bahah: { en: "Al Bahah", ar: "الباحة" },
  sakaka: { en: "Sakaka", ar: "سكاكا" },
  arar: { en: "Arar", ar: "عرعر" },
  qatif: { en: "Qatif", ar: "القطيف" },
  diriyah: { en: "Diriyah", ar: "الدرعية" },
  "al-ammariyah": { en: "Al-Ammariyah", ar: "العمارية" },
  ammariyah: { en: "Al-Ammariyah", ar: "العمارية" },
  umluj: { en: "Umluj", ar: "أملج" },
  "al-wajh": { en: "Al Wajh", ar: "الوجه" },
  "hafar-al-batin": { en: "Hafar Al-Batin", ar: "حفر الباطن" },
  bisha: { en: "Bisha", ar: "بيشة" },
  "al-majmaah": { en: "Al Majma'ah", ar: "المجمعة" },
  sharurah: { en: "Sharurah", ar: "شرورة" },
  dhurma: { en: "Dhurma", ar: "ضرما" },
};

export function getLocalizedCityName(
  cityIdOrName: string | null | undefined,
  locale: Locale
): string {
  if (!cityIdOrName) {
    return locale === "ar" ? "جميع الوجهات" : "All Destinations";
  }

  const raw = cityIdOrName.trim();
  const lower = raw.toLowerCase().replace(/['’]/g, "");

  if (CITY_LOOKUP_MAP[lower]) {
    return locale === "ar" ? CITY_LOOKUP_MAP[lower].ar : CITY_LOOKUP_MAP[lower].en;
  }

  const cityEntry = CITIES.find(
    (c) =>
      c.id.toLowerCase() === lower ||
      c.name.toLowerCase() === lower ||
      c.nameAr === raw ||
      c.nameAr.replace(/[\u064B-\u065F]/g, "") === raw
  );

  if (cityEntry) {
    return locale === "ar" ? cityEntry.nameAr : cityEntry.name;
  }

  for (const [, val] of Object.entries(CITY_LOOKUP_MAP)) {
    if (val.ar === raw || val.en.toLowerCase() === lower) {
      return locale === "ar" ? val.ar : val.en;
    }
  }

  const sharedCity = resolveSaudiCity(raw);
  if (sharedCity) {
    return locale === "ar" ? sharedCity.ar : sharedCity.en;
  }

  if (locale === "ar") {
    return CITY_NAMES_AR[lower] || raw;
  }
  return raw;
}

const DISTRICT_LOOKUP: Record<string, { en: string; ar: string }> = {
  ammariyah: { en: "Al-Ammariyah", ar: "العمارية" },
  "al-ammariyah": { en: "Al-Ammariyah", ar: "العمارية" },
  diriyah: { en: "Diriyah", ar: "الدرعية" },
  malqa: { en: "Al Malqa", ar: "الملقا" },
  olaya: { en: "Al Olaya", ar: "العليا" },
  obhur: { en: "Obhur", ar: "أبحر" },
  corniche: { en: "Corniche", ar: "الكورنيش" },
  soudah: { en: "Al Soudah", ar: "السودة" },
  "half moon": { en: "Half Moon Bay", ar: "خليج نصف القمر" },
  hada: { en: "Al Hada", ar: "الهدا" },
  shafa: { en: "Al Shafa", ar: "الشفا" },
  kafd: { en: "KAFD", ar: "كافد" },
  tuwaiq: { en: "Tuwaiq", ar: "طويق" },
  qiddiya: { en: "Qiddiya", ar: "القدية" },
  hanifa: { en: "Wadi Hanifa", ar: "وادي حنيفة" },
  hazm: { en: "Al Hazm", ar: "الحزم" },
  hamra: { en: "Al Hamra", ar: "الحمراء" },
  nuzhah: { en: "An Nuzhah", ar: "النزهة" },
  bawadi: { en: "Al Bawadi", ar: "البوادي" },
  muhammadiyah: { en: "Al Muhammadiyah", ar: "المحمدية" },
  marwah: { en: "Al Marwah", ar: "المروة" },
  ghlydh: { en: "Qra al Ghlydh", ar: "قرى الغليظ" },
  mahala: { en: "Al Mahalah", ar: "المحالة" },
  mahalah: { en: "Al Mahalah", ar: "المحالة" },
  wasaif: { en: "Al Wasaif", ar: "الوصائف" },
  arin: { en: "Al Arin", ar: "العرين" },
  muathafin: { en: "Al Muathafin", ar: "الموظفين" },
  sadad: { en: "As Sadad", ar: "السداد" },
  sarur: { en: "As Sarur", ar: "السرور" },
  jal: { en: "Al Jal", ar: "الجال" },
  wesam: { en: "Al Wesam", ar: "الوسام" },
  narjis: { en: "Al Narjis", ar: "النرجس" },
  hitteen: { en: "Hitteen", ar: "حطين" },
  suwaidi: { en: "West Suwaidi", ar: "السويدي الغربي" },
  sharaan: { en: "Sharaan Valley", ar: "وادي شرعان" },
  central: { en: "Central District", ar: "المنطقة المركزية" },
  yasmeen: { en: "Al Yasmeen", ar: "الياسمين" },
  sahafah: { en: "Al Sahafah", ar: "الصحافة" },
  aqeeq: { en: "Al Aqeeq", ar: "العقيق" },
  qurtubah: { en: "Qurtubah", ar: "قرطبة" },
  rawdah: { en: "Al Rawdah", ar: "حي الروضة" },
  "al-rawdah": { en: "Al Rawdah", ar: "حي الروضة" },
  "الروضة": { en: "Al Rawdah", ar: "حي الروضة" },
  rafiah: { en: "Al Rafiah", ar: "حي الرفيعة" },
  "al-rafiah": { en: "Al Rafiah", ar: "حي الرفيعة" },
  "الرفيعة": { en: "Al Rafiah", ar: "حي الرفيعة" },
  "north obhur": { en: "North Obhur", ar: "أبحر الشمالية" },
  "north-obhur": { en: "North Obhur", ar: "أبحر الشمالية" },
  "أبحر الشمالية": { en: "North Obhur", ar: "أبحر الشمالية" },
  "south obhur": { en: "South Obhur", ar: "أبحر الجنوبية" },
  "south-obhur": { en: "South Obhur", ar: "أبحر الجنوبية" },
  "أبحر الجنوبية": { en: "South Obhur", ar: "أبحر الجنوبية" },
  turki: { en: "Prince Turki Coast", ar: "ساحل الأمير تركي" },
  "prince turki": { en: "Prince Turki Coast", ar: "ساحل الأمير تركي" },
  "الأمير تركي": { en: "Prince Turki Coast", ar: "ساحل الأمير تركي" },
  najd: { en: "West Tuwaiq (Najd)", ar: "غرب طويق (نجد)" },
  "dune": { en: "Al-Ammariyah Dunes", ar: "كثبان العمارية" },
  // Riyadh districts
  rimal: { en: "Al-Rimal", ar: "حي الرمال" },
  "al-rimal": { en: "Al-Rimal", ar: "حي الرمال" },
  "الرمال": { en: "Al-Rimal", ar: "حي الرمال" },
  yasmin: { en: "Al-Yasmin", ar: "حي الياسمين" },
  "al-yasmin": { en: "Al-Yasmin", ar: "حي الياسمين" },
  sahafa: { en: "Al-Sahafa", ar: "حي الصحافة" },
  "al-sahafa": { en: "Al-Sahafa", ar: "حي الصحافة" },
  hittin: { en: "Hittin", ar: "حي حطين" },
  sulaimaniyah: { en: "Al-Sulaimaniyah", ar: "حي السليمانية" },
  "al-sulaimaniyah": { en: "Al-Sulaimaniyah", ar: "حي السليمانية" },
  "السليمانية": { en: "Al-Sulaimaniyah", ar: "حي السليمانية" },
  shifa: { en: "Al-Shifa", ar: "حي الشفا" },
  "al-shifa": { en: "Al-Shifa", ar: "حي الشفا" },
  // Eastern & Coastal districts (specific phrases first)
  "al-shati al-sharqi": { en: "Al-Shati Al-Sharqi", ar: "حي الشاطئ الشرقي" },
  "الشاطئ الشرقي": { en: "Al-Shati Al-Sharqi", ar: "حي الشاطئ الشرقي" },
  "al-shati": { en: "Al-Shati", ar: "حي الشاطئ" },
  shati: { en: "Al-Shati", ar: "حي الشاطئ" },
  "الشاطئ": { en: "Al-Shati", ar: "حي الشاطئ" },
  mazrouiyah: { en: "Al-Mazrouiyah", ar: "حي المزروعية" },
  "al-mazrouiyah": { en: "Al-Mazrouiyah", ar: "حي المزروعية" },
  "المزروعية": { en: "Al-Mazrouiyah", ar: "حي المزروعية" },
  fakhiriyah: { en: "Al-Fakhiriyah", ar: "حي الفاخرية" },
  "al-fakhiriyah": { en: "Al-Fakhiriyah", ar: "حي الفاخرية" },
  "الفاخرية": { en: "Al-Fakhiriyah", ar: "حي الفاخرية" },
  aziziyah: { en: "Al-Aziziyah", ar: "حي العزيزية" },
  "al-aziziyah": { en: "Al-Aziziyah", ar: "حي العزيزية" },
  "العزيزية": { en: "Al-Aziziyah", ar: "حي العزيزية" },
  // AlUla, Makkah, Madinah, Abha districts
  "old town (al-deerah)": { en: "Old Town (Al-Deerah)", ar: "حي الديرة (البلدة القديمة)" },
  deerah: { en: "Al-Deerah", ar: "حي الديرة" },
  "الديرة": { en: "Al-Deerah", ar: "حي الديرة" },
  "alula oasis": { en: "AlUla Oasis", ar: "واحة العلا" },
  "واحة العلا": { en: "AlUla Oasis", ar: "واحة العلا" },
  sukhayrat: { en: "Al-Sukhayrat", ar: "حي الصخيرات" },
  "al-sukhayrat": { en: "Al-Sukhayrat", ar: "حي الصخيرات" },
  "الصخيرات": { en: "Al-Sukhayrat", ar: "حي الصخيرات" },
  awali: { en: "Al-Awali", ar: "حي العوالي" },
  "al-awali": { en: "Al-Awali", ar: "حي العوالي" },
  "العوالي": { en: "Al-Awali", ar: "حي العوالي" },
  shawqiyyah: { en: "Al-Shawqiyyah", ar: "حي الشوقية" },
  "al-shawqiyyah": { en: "Al-Shawqiyyah", ar: "حي الشوقية" },
  "الشوقية": { en: "Al-Shawqiyyah", ar: "حي الشوقية" },
  quba: { en: "Quba", ar: "حي قباء" },
  "قباء": { en: "Quba", ar: "حي قباء" },
  sultana: { en: "Sultana", ar: "حي سلطانة" },
  "سلطانة": { en: "Sultana", ar: "حي سلطانة" },
  dhabab: { en: "Al-Dhabab", ar: "حي الضباب" },
  "al-dhabab": { en: "Al-Dhabab", ar: "حي الضباب" },
  "الضباب": { en: "Al-Dhabab", ar: "حي الضباب" },
  "العمارية": { en: "Al-Ammariyah", ar: "العمارية" },
  "الدرعية": { en: "Diriyah", ar: "الدرعية" },
};

export const KNOWN_TITLE_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  "al-narjis premium chalet & pool": {
    en: "Al-Narjis Premium Chalet & Pool",
    ar: "شاليه النرجس الفاخر بمسبح خاص",
  },
  "obhur bay beachfront haven": {
    en: "Obhur Bay Beachfront Haven",
    ar: "ملاذ خليج أبحر الشاطئي الفاخر",
  },
  "desert dune luxury villa": {
    en: "Desert Dune Luxury Villa",
    ar: "فيلا واحة الكثبان الصحراوية الملكية",
  },
  "al-ammariyah royal chalet": {
    en: "Al-Ammariyah Royal Chalet",
    ar: "شاليه العمارية الملكي بمسبح خاص",
  },
  "najd sovereign private estate": {
    en: "Najd Sovereign Private Estate",
    ar: "قصر نجد السيادي بمسبح خاص",
  },
  "diriyah oasis heritage farm": {
    en: "Diriyah Oasis Heritage Farm",
    ar: "مزرعة واحة الدرعية التراثية",
  },
  "tuwaiq panorama luxury villa": {
    en: "Tuwaiq Panorama Luxury Villa",
    ar: "فيلا بانوراما طويق الفاخرة",
  },
  "studio with unique vibe": {
    en: "Studio with Unique Vibe",
    ar: "استوديو بتصميم وأجواء فريدة",
  },
  "apartment with two-bedroom": {
    en: "Apartment with Two-Bedroom",
    ar: "شقة أنيقة بغرفتي نوم",
  },
  "apartment with living room": {
    en: "Apartment with Living Room",
    ar: "شقة واسعة بصالة جلوس",
  },
  "apartment with self-check in": {
    en: "Apartment with Self-Check in",
    ar: "شقة مجهزة بدخول ذاتي ذكي",
  },
  "chalet with outdoor seating": {
    en: "Chalet with Outdoor Seating",
    ar: "شاليه بجلسة خارجية وإطلالة",
  },
  "studio with elegant design": {
    en: "Studio with Elegant Design",
    ar: "استوديو بتصميم عصري أنيق",
  },
  "abraj panoramic holy haram suite": {
    en: "Abraj Panoramic Holy Haram Suite",
    ar: "جناح أبراج مكة البانورامي المطل على الحرم",
  },
  "apartment with view of riyadh": {
    en: "Apartment with view of Riyadh",
    ar: "شقة مميزة بإطلالة على مدينة الرياض",
  },
  "apartment with 1 bedroom": {
    en: "Apartment with 1 Bedroom",
    ar: "شقة راقية بغرفة نوم واحدة",
  },
  "apartment with 3 bedroom": {
    en: "Apartment with 3 Bedroom",
    ar: "شقة عائلية فاخرة بـ ٣ غرف نوم",
  },
  "studio with master bed": {
    en: "Studio with Master Bed",
    ar: "استوديو أنيق بسرير ماستر",
  },
  "apartment with backyard": {
    en: "Apartment with backyard",
    ar: "شقة هادئة بحديقة وفناء خاص",
  },
  "tuwaiq falcon ridge chalet (near qiddiya)": {
    en: "Tuwaiq Falcon Ridge Chalet (Near Qiddiya)",
    ar: "شاليه صقر طويق الفاخر (قرب القدية)",
  },
  "wadi hanifa sunset chalet": {
    en: "Wadi Hanifa Sunset Chalet",
    ar: "شاليه غروب وادي حنيفة",
  },
  "alula sky-dome desert sanctuary": {
    en: "AlUla Sky-Dome Desert Sanctuary",
    ar: "قبة سماء العلا الفلكية وسط الصحراء",
  },
  "kafd executive high-rise penthouse": {
    en: "KAFD Executive High-Rise Penthouse",
    ar: "بنتهاوس كافد التنفيذي الفاخر بإطلالة بانورامية",
  },
  "palm view apartment": {
    en: "Palm View Apartment",
    ar: "شقة إطلالة النخيل",
  },
  "nur villa": {
    en: "Nur Villa",
    ar: "فيلا النور الفاخرة",
  },
  "rayhan villa": {
    en: "Rayhan Villa",
    ar: "فيلا الريحان الخاصة",
  },
  "rr property": {
    en: "RR Luxury Residence",
    ar: "إقامة آر آر الفاخرة",
  },
  "al-ammariyah sunset oasis chalet (updated)": {
    en: "Al-Ammariyah Sunset Oasis Chalet",
    ar: "شاليه واحة غروب العمارية",
  },
  "al-diriyah royal palm chalet & heated pool": {
    en: "Al-Diriyah Royal Palm Chalet & Heated Pool",
    ar: "شاليه نخيل الدرعية الملكي بمسبح مدفأ",
  },
};

export function getLocalizedDistrictName(
  district: string | null | undefined,
  locale: Locale
): string {
  if (!district) return "";
  const raw = district.trim();
  const lower = raw.toLowerCase();
  const withoutHayAr = raw.replace(/^حي\s+/, "").trim();
  const withoutHayEn = lower.replace(/^al-/, "").trim();

  for (const [key, val] of Object.entries(DISTRICT_LOOKUP)) {
    if (
      lower === key ||
      raw === val.ar ||
      withoutHayAr === val.ar.replace(/^حي\s+/, "").trim() ||
      withoutHayEn === key.replace(/^al-/, "")
    ) {
      return locale === "ar" ? val.ar : val.en;
    }
  }

  for (const [key, val] of Object.entries(DISTRICT_LOOKUP)) {
    if (lower.includes(key) || raw.includes(key) || raw.includes(val.ar)) {
      return locale === "ar" ? val.ar : val.en;
    }
  }

  // Prevent Arabic text from leaking into English displays
  if (locale === "en" && /[\u0600-\u06FF]/.test(raw) && !/[a-zA-Z]/.test(raw)) {
    return "";
  }

  return raw;
}

export function formatLocalizedPropertySpecs(
  property: {
    specs?: string | null;
    areaSqm?: number | null;
    bedroomsCount?: number | null;
    livingRoomsCount?: number | null;
  },
  locale: Locale
): string {
  const parts: string[] = [];
  const area = property.areaSqm;
  const beds = property.bedroomsCount;
  const livings = property.livingRoomsCount;

  if (typeof area === "number" && area > 0) {
    parts.push(locale === "ar" ? `${area} م²` : `${area} m²`);
  }
  if (typeof beds === "number") {
    parts.push(
      locale === "ar"
        ? beds === 0
          ? "0 غرف نوم"
          : beds === 1
            ? "غرفة نوم واحدة"
            : `${beds} غرف نوم`
        : beds === 1
          ? "1 bedroom"
          : `${beds} bedrooms`
    );
  }
  if (typeof livings === "number") {
    parts.push(
      locale === "ar"
        ? livings === 0
          ? "0 مجالس"
          : livings === 1
            ? "مجلس واحد"
            : `${livings} مجالس`
        : livings === 1
          ? "1 living room"
          : `${livings} living rooms`
    );
  }

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  return property.specs || "";
}

export function getLocalizedPropertyLocation(
  property: {
    city?: string | null;
    cityName?: string | null;
    city_name?: string | null;
    district?: string | null;
    districtAr?: string | null;
  },
  locale: Locale
): { district: string; city: string; location: string } {
  const city = getLocalizedCityName(property.city || property.cityName || property.city_name, locale);

  const rawDistrict =
    locale === "ar"
      ? property.districtAr || property.district
      : property.district || property.districtAr;

  let district =
    locale === "en" && property.district?.trim() && !/[\u0600-\u06FF]/.test(property.district)
      ? property.district.trim()
      : locale === "ar" && property.districtAr?.trim()
        ? property.districtAr.trim()
        : getLocalizedDistrictName(rawDistrict, locale);

  // If district couldn't be resolved or is empty, use city
  if (!district || district.trim().length === 0) {
    district = city;
  }

  // Build clean non-redundant location string
  let location = "";
  if (locale === "ar") {
    if (district === city) {
      location = city;
    } else {
      location = `${district}، ${city}`;
    }
  } else {
    if (district.toLowerCase() === city.toLowerCase()) {
      location = city;
    } else {
      location = `${district}, ${city}`;
    }
  }

  return { district, city, location };
}

export function getLocalizedPropertyTitle(
  property: { id?: string; title?: string | null; titleAr?: string | null; title_ar?: string | null },
  locale: Locale
): string {
  const explicitAr = (property.titleAr || property.title_ar || "").trim();
  const explicitEn = (property.title || "").trim();

  if (locale === "ar") {
    if (explicitAr) {
      return explicitAr;
    }
    const cleanTitle = explicitEn.toLowerCase();
    if (KNOWN_TITLE_TRANSLATIONS[cleanTitle]) {
      return KNOWN_TITLE_TRANSLATIONS[cleanTitle].ar;
    }
    // If property.title is already in Arabic
    if (explicitEn && /[\u0600-\u06FF]/.test(explicitEn)) {
      return explicitEn;
    }
    return explicitEn || "إقامة فاخرة";
  }

  // English mode
  const cleanTitle = explicitEn.toLowerCase();
  if (KNOWN_TITLE_TRANSLATIONS[cleanTitle]) {
    return KNOWN_TITLE_TRANSLATIONS[cleanTitle].en;
  }
  if (explicitEn && !/[\u0600-\u06FF]/.test(explicitEn)) {
    return explicitEn;
  }
  if (explicitAr && !/[\u0600-\u06FF]/.test(explicitAr)) {
    return explicitAr;
  }
  // Reverse check if Arabic matches
  for (const item of Object.values(KNOWN_TITLE_TRANSLATIONS)) {
    if (item.ar === explicitEn || item.ar === explicitAr) {
      return item.en;
    }
  }
  return explicitEn || explicitAr || "Luxury Stay";
}

export function getLocalizedCategoryName(
  category: string | null | undefined,
  locale: Locale
): string {
  const cat = (category || "").toLowerCase();
  if (locale === "ar") {
    if (cat.includes("chalet")) return "شاليه ومنتجع";
    if (cat.includes("villa")) return "فيلا فاخرة";
    if (cat.includes("farm")) return "مزرعة ريفية";
    if (cat.includes("camp")) return "مخيم صحراوي";
    if (cat.includes("penthouse") || cat.includes("apartment") || cat.includes("studio")) return "شقة مخدومة";
    if (cat.includes("cabin")) return "كوخ جبلي";
    if (cat.includes("dome")) return "قبة زجاجية";
    return "إقامة مميزة";
  }
  if (cat.includes("chalet")) return "Chalet & Resort";
  if (cat.includes("villa")) return "Luxury Villa";
  if (cat.includes("farm")) return "Farm & Country Estate";
  if (cat.includes("camp")) return "Desert Camp";
  if (cat.includes("penthouse") || cat.includes("apartment") || cat.includes("studio")) return "Serviced Penthouse";
  if (cat.includes("cabin")) return "Mountain Cabin";
  if (cat.includes("dome")) return "Glass Dome";
  return "Special Stay";
}

export function getSeoAlternates(pathname: string, locale: Locale, customBaseUrl?: string) {
  const base = (customBaseUrl || BASE_URL).replace(/\/$/, "");
  const stripped = stripLocaleFromPathname(pathname);
  const pathWithoutSlash = stripped === "/" ? "" : stripped;

  const arUrl = `${base}/ar${pathWithoutSlash}`;
  const enUrl = `${base}/en${pathWithoutSlash}`;
  const canonical = locale === "ar" ? arUrl : enUrl;

  return {
    canonical,
    alternates: {
      canonical,
      languages: {
        ar: arUrl,
        en: enUrl,
        "x-default": arUrl,
      },
    },
  };
}


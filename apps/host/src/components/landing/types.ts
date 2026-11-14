export type PropertyCalcType = "apartment" | "chalet" | "istraha" | "resort" | "villa" | "camp";

export type CityCalcKey =
  | "riyadh"
  | "jeddah"
  | "alshargia"
  | "abha"
  | "altaif"
  | "alula"
  | "almadina"
  | "buraydah"
  | "albaha";

// Exact monthly SAR earnings matrix modeled after Gathern's calculator
export const EARNINGS_MATRIX: Record<CityCalcKey, Record<PropertyCalcType, number>> = {
  riyadh: { apartment: 8800, chalet: 12600, istraha: 12600, resort: 14200, villa: 15400, camp: 9800 },
  jeddah: { apartment: 7500, chalet: 9100, istraha: 9100, resort: 11500, villa: 12800, camp: 7400 },
  alshargia: { apartment: 5700, chalet: 10800, istraha: 10800, resort: 11900, villa: 12200, camp: 7900 },
  abha: { apartment: 4800, chalet: 10100, istraha: 10100, resort: 11200, villa: 11600, camp: 8200 },
  altaif: { apartment: 4700, chalet: 7400, istraha: 7400, resort: 8900, villa: 9500, camp: 6800 },
  alula: { apartment: 5100, chalet: 9200, istraha: 9200, resort: 13500, villa: 12400, camp: 11200 },
  almadina: { apartment: 4100, chalet: 4500, istraha: 4500, resort: 6800, villa: 7900, camp: 5200 },
  buraydah: { apartment: 4100, chalet: 4500, istraha: 4500, resort: 5900, villa: 6800, camp: 5100 },
  albaha: { apartment: 4300, chalet: 4900, istraha: 4900, resort: 6400, villa: 7200, camp: 5400 },
};

export const PROPERTY_TYPE_LABELS: { id: PropertyCalcType; ar: string; en: string }[] = [
  { id: "chalet", ar: "شاليه", en: "Chalet" },
  { id: "apartment", ar: "شقة", en: "Apartment" },
  { id: "istraha", ar: "استراحة", en: "Rest House (Istraha)" },
  { id: "resort", ar: "منتجع", en: "Resort" },
  { id: "villa", ar: "فيلا", en: "Villa" },
  { id: "camp", ar: "مخيم", en: "Desert Camp" },
];

export const CITY_LABELS: { id: CityCalcKey; ar: string; en: string }[] = [
  { id: "riyadh", ar: "الرياض", en: "Riyadh" },
  { id: "jeddah", ar: "جدة", en: "Jeddah" },
  { id: "alshargia", ar: "المنطقة الشرقية", en: "Eastern Province" },
  { id: "abha", ar: "أبها", en: "Abha" },
  { id: "altaif", ar: "الطائف", en: "Taif" },
  { id: "alula", ar: "العلا", en: "AlUla" },
  { id: "almadina", ar: "المدينة المنورة", en: "Madinah" },
  { id: "buraydah", ar: "بريدة", en: "Buraydah" },
  { id: "albaha", ar: "الباحة", en: "Al Baha" },
];

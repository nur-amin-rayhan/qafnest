export type PropertyCategory = "chalet" | "villa" | "farm" | "camp" | "penthouse";

export type PropertyModerationStatus = "approved" | "pending" | "rejected" | "suspended";

export interface SharedCity {
  id: string;
  nameEn: string;
  nameAr: string;
}

export const SAUDI_CITIES: SharedCity[] = [
  { id: "riyadh", nameEn: "Riyadh", nameAr: "الرياض" },
  { id: "jeddah", nameEn: "Jeddah", nameAr: "جدة" },
  { id: "alula", nameEn: "AlUla", nameAr: "العلا" },
  { id: "khobar", nameEn: "Al Khobar", nameAr: "الخبر" },
  { id: "dammam", nameEn: "Dammam", nameAr: "الدمام" },
  { id: "abha", nameEn: "Abha", nameAr: "أبها" },
  { id: "taif", nameEn: "Taif", nameAr: "الطائف" },
  { id: "mecca", nameEn: "Makkah", nameAr: "مكة المكرمة" },
  { id: "madinah", nameEn: "Madinah", nameAr: "المدينة المنورة" },
  { id: "alhafuf", nameEn: "Al Ahsa & Hofuf", nameAr: "الأحساء والهفوف" },
];

export const PROPERTY_CATEGORIES: Array<{
  id: PropertyCategory;
  nameEn: string;
  nameAr: string;
}> = [
  { id: "chalet", nameEn: "Chalets & Resorts", nameAr: "شاليهات ومنتجعات" },
  { id: "villa", nameEn: "Private Villas", nameAr: "فلل خاصة" },
  { id: "penthouse", nameEn: "Serviced Apartments", nameAr: "شقق مخدومة" },
  { id: "farm", nameEn: "Country Farms", nameAr: "مزارع ريفية" },
  { id: "camp", nameEn: "Desert Camps", nameAr: "مخيمات صحراوية" },
];

export const ECOSYSTEM_URLS = {
  guest: process.env.NEXT_PUBLIC_GUEST_URL || "http://localhost:3000",
  host: process.env.NEXT_PUBLIC_HOST_PORTAL_URL || "http://localhost:3001",
  cms: process.env.NEXT_PUBLIC_CMS_PORTAL_URL || "http://localhost:3002",
};

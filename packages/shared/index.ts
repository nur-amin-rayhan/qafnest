import { SAUDI_ALL_CITIES } from "./saudiCities";

export type PropertyCategory = "chalet" | "villa" | "farm" | "camp" | "penthouse";

export type PropertyModerationStatus = "approved" | "pending" | "rejected" | "suspended";

export interface SharedCity {
  id: string;
  nameEn: string;
  nameAr: string;
}

export const SAUDI_CITIES: SharedCity[] = SAUDI_ALL_CITIES.map((c) => ({
  id: c.id,
  nameEn: c.en,
  nameAr: c.ar,
}));

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

const IS_PROD = process.env.NODE_ENV === "production";

export const ECOSYSTEM_URLS = {
  guest:
    process.env.NEXT_PUBLIC_GUEST_URL ||
    (IS_PROD ? "https://qafnest.com" : "http://localhost:3000"),
  host:
    process.env.NEXT_PUBLIC_HOST_PORTAL_URL ||
    process.env.NEXT_PUBLIC_HOST_URL ||
    (IS_PROD ? "https://business.qafnest.com" : "http://localhost:3001"),
  cms:
    process.env.NEXT_PUBLIC_CMS_PORTAL_URL ||
    (IS_PROD ? "https://qafnest.com/cms" : "http://localhost:3002/cms"),
  admin:
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ||
    (IS_PROD ? "https://qafnest.com/admin" : "http://localhost:3003/admin"),
};

export const QAFNEST_SUPPORT_CONTACT = {
  localPhone: "0576707709",
  displayPhone: "0576707709",
  e164Phone: "+966576707709",
  internationalDisplay: "+966 57 670 7709",
  whatsappDigits: "966576707709",
  telHref: "tel:+966576707709",
  whatsappHref: "https://wa.me/966576707709",
  supportEmail: "support@qafnest.com",
} as const;

// Re-export Design System & Taste Skill Specifications
export * from "./design-system";
export * from "./taste";
export * from "./phone";
export * from "./zatca";
export * from "./zatcaPhase2";
export * from "./zatcaConfig";
export * from "./cmsTypes";
export * from "./blogTypes";
export * from "./platformFee";
export * from "./hostPayoutConfig";
export * from "./timeSlots";
export * from "./locationShare";
export * from "./bookingSlotConfig";
export * from "./pricingEngine";
export * from "./saudiIdentity";
export * from "./saudiCities";
export * from "./propertyBilingual";


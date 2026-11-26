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
    process.env.NEXT_PUBLIC_CMS_URL ||
    (IS_PROD ? "https://cms.qafnest.com" : "http://localhost:3002"),
  admin:
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    (IS_PROD ? "https://admin.qafnest.com" : "http://localhost:3003"),
};

export const QAFNEST_SUPPORT_CONTACT = {
  localPhone: "0576707709",
  displayPhone: "+966576707709",
  e164Phone: "+966576707709",
  internationalDisplay: "+966 57 670 7709",
  whatsappDigits: "966576707709",
  telHref: "tel:+966576707709",
  whatsappHref: "https://wa.me/966576707709",
  supportEmail: "support@qafnest.com",
  hqAddressEn: "5040 Abu Masaoud Al Badri, 8121، حي طيبة، Jeddah 23835, Saudi Arabia",
  hqAddressAr: "5040 أبو مسعود البدري، 8121، حي طيبة، جدة 23835، المملكة العربية السعودية",
} as const;

// NOTE: Keep server-only modules (such as ./emailService) out of the client barrel
// to prevent pulling Node built-ins like nodemailer into Next.js client bundles.

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
export * from "./propertyDeletionConfig";
export * from "./unitCode";
export * from "./propertyBilingual";
export * from "./escapeHtml";


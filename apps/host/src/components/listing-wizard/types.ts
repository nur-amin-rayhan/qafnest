import {
  Bath,
  BedDouble,
  Car,
  CookingPot,
  DoorOpen,
  KeyRound,
  Mountain,
  Palmtree,
  Shield,
  Sofa,
  Trees,
  Waves,
  Wifi,
} from "lucide-react";

import { normalizeSaudiCityId } from "@qafnest/shared";

export interface WizardDraft {
  title: string;
  titleAr: string;
  category: string;
  city: string;
  state?: string;
  stateAr?: string;
  district: string;
  districtAr: string;
  street: string;
  streetAr: string;
  postalCode: string;
  direction: string;
  address?: string;
  addressAr?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  area: string;
  guestCapacity: number;
  mainFacilities: string[];
  bedroomsCount: number;
  weekdayPrice: string;
  weekendPrice: string;
  tourismLicenseNumber: string;
  singleBedsCount: number;
  masterBedsCount: number;
  mainMajlisCount: number;
  extraMajlisCount: number;
  outdoorSeatingCount: number;
  externalAnnexCount: number;
  poolsCount: number;
  poolAmenities: string[];
  kitchensCount: number;
  kitchenAmenities: string[];
  bathroomsCount: number;
  bathroomAmenities: string[];
  propertyAmenities: string[];
  propertyFeatures: string[];
  description: string;
  descriptionAr: string;
  step: number;
}

export const INITIAL_DRAFT: WizardDraft = {
  title: "",
  titleAr: "",
  category: "",
  city: "",
  state: "",
  stateAr: "",
  district: "",
  districtAr: "",
  street: "",
  streetAr: "",
  postalCode: "",
  direction: "",
  address: "",
  addressAr: "",
  latitude: undefined,
  longitude: undefined,
  googleMapsUrl: "",
  area: "0",
  guestCapacity: 2,
  mainFacilities: [],
  bedroomsCount: 0,
  weekdayPrice: "",
  weekendPrice: "",
  tourismLicenseNumber: "",
  singleBedsCount: 0,
  masterBedsCount: 0,
  mainMajlisCount: 0,
  extraMajlisCount: 0,
  outdoorSeatingCount: 0,
  externalAnnexCount: 0,
  poolsCount: 0,
  poolAmenities: [],
  kitchensCount: 0,
  kitchenAmenities: [],
  bathroomsCount: 0,
  bathroomAmenities: [],
  propertyAmenities: [],
  propertyFeatures: [],
  description: "",
  descriptionAr: "",
  step: 0,
};

export const CATEGORIES = [
  {
    id: "شقة",
    en: "Apartment",
    image: "/images/categories/apartment.webp",
  },
  {
    id: "شاليه",
    en: "Chalet",
    image: "/images/categories/chalet.webp",
  },
  {
    id: "استراحة",
    en: "Rest House",
    image: "/images/categories/rest-house.webp",
  },
  {
    id: "استديو",
    en: "Studio",
    image: "/images/categories/studio.webp",
  },
  {
    id: "مخيم",
    en: "Camp",
    image: "/images/categories/camp.webp",
  },
  {
    id: "فيلا",
    en: "Villa",
    image: "/images/categories/villa.webp",
  },
  {
    id: "منتجع فندقي",
    en: "Hotel Resort",
    image: "/images/categories/hotel-resort.webp",
  },
  {
    id: "غرفة",
    en: "Room",
    image: "/images/categories/room.webp",
  },
  {
    id: "مزرعة",
    en: "Farm",
    image: "/images/categories/farm.webp",
  },
  {
    id: "شقق مخدومة",
    en: "Serviced Apt",
    image: "/images/categories/serviced-apt.webp",
  },
];

export const MAIN_FACILITIES = [
  { id: "غرفة نوم", en: "Bedroom", icon: BedDouble },
  { id: "مجلس", en: "Majlis", icon: Sofa },
  { id: "مسبح", en: "Pool", icon: Waves },
  { id: "مطبخ", en: "Kitchen", icon: CookingPot },
  { id: "دورة مياه", en: "Bathroom", icon: Bath },
];

export const POOL_AMENITIES = [
  { id: "outdoor_pool", en: "Outdoor Pool", ar: "مسبح خارجي خاص" },
  { id: "indoor_pool", en: "Indoor Pool", ar: "مسبح داخلي خاص" },
  { id: "heated_pool", en: "Heated Pool", ar: "مسبح مدفأ" },
  { id: "pool_barrier", en: "Child Safety Barrier", ar: "حاجز حماية للأطفال" },
  { id: "kids_pool", en: "Kids Pool / Water Games", ar: "مسبح أطفال وألعاب مائية" },
];

export const KITCHEN_AMENITIES = [
  { id: "equipped_kitchen", en: "Fully Equipped Kitchen", ar: "مطبخ مجهز بالكامل" },
  { id: "refrigerator", en: "Refrigerator & Freezer", ar: "ثلاجة وفريزر" },
  { id: "oven_stove", en: "Oven & Stove", ar: "فرن وموقد طهي" },
  { id: "microwave", en: "Microwave", ar: "مايكرويف" },
  { id: "electric_kettle", en: "Electric Kettle", ar: "غلاية ماء كهربائية" },
  { id: "coffee_machine", en: "Coffee Machine", ar: "آلة تحضير قهوة" },
  { id: "cookware_dishes", en: "Cookware & Tableware", ar: "أواني طبخ وصحون تقديم" },
];

export const BATHROOM_AMENITIES = [
  { id: "بانيو / حوض استحمام", en: "Bathtub", ar: "بانيو / حوض استحمام" },
  { id: "جاكوزي", en: "Jacuzzi", ar: "جاكوزي" },
  { id: "دش", en: "Shower", ar: "دش" },
  { id: "رداء حمام", en: "Bathrobe", ar: "رداء حمام" },
  { id: "ساونا", en: "Sauna", ar: "ساونا" },
  { id: "سليبر", en: "Slippers", ar: "سليبر" },
  { id: "شامبو", en: "Shampoo", ar: "شامبو" },
  { id: "صابون", en: "Soap", ar: "صابون" },
  { id: "مناديل", en: "Tissues", ar: "مناديل" },
];

export const PROPERTY_AMENITIES = [
  { id: "ألعاب أطفال", en: "Kids Playground", ar: "ألعاب أطفال" },
  { id: "إضاءة إضافية", en: "Extra Lighting", ar: "إضاءة إضافية" },
  { id: "بروجكتر", en: "Projector", ar: "بروجكتر" },
  { id: "بلايستيشن", en: "PlayStation", ar: "بلايستيشن" },
  { id: "بلكونة", en: "Balcony", ar: "بلكونة" },
  { id: "تلفزيون", en: "TV", ar: "تلفزيون" },
  { id: "ركن شواء", en: "BBQ Grill", ar: "ركن شواء" },
  { id: "سماعات", en: "Speakers", ar: "سماعات" },
  { id: "صالة طعام", en: "Dining Room", ar: "صالة طعام" },
  { id: "غرفة تجهيز عروس", en: "Bridal Prep Room", ar: "غرفة تجهيز عروس" },
  { id: "غرفة سائقين", en: "Driver Room", ar: "غرفة سائقين" },
  { id: "غرفة سينما", en: "Cinema Room", ar: "غرفة سينما" },
  { id: "قسمين", en: "Two Sections", ar: "قسمين" },
  { id: "قسمين متصلة بينهم باب", en: "Connected Sections", ar: "قسمين متصلة بينهم باب" },
  { id: "قسمين منفصلة", en: "Separate Sections", ar: "قسمين منفصلة" },
  { id: "كرسي مساج", en: "Massage Chair", ar: "كرسي مساج" },
  { id: "مسبح عام للنساء", en: "Women Public Pool", ar: "مسبح عام للنساء" },
  { id: "مسبح عام مشترك", en: "Shared Public Pool", ar: "مسبح عام مشترك" },
  { id: "ملحق خارجي", en: "External Annex", ar: "ملحق خارجي" },
  { id: "موقد حطب", en: "Fireplace", ar: "موقد حطب" },
];

export const PROPERTY_FEATURES = [
  { id: "اطلالة على الجبل", en: "Mountain View", icon: Mountain },
  { id: "اطلالة على الحديقة", en: "Garden View", icon: Trees },
  { id: "اطلالة على البحر", en: "Sea View", icon: Waves },
  { id: "انترنت", en: "Internet", icon: Wifi },
  { id: "دخول ذاتي", en: "Self Check-in", icon: KeyRound },
  { id: "شاطئ خاص", en: "Private Beach", icon: Palmtree },
  { id: "شلال على الجبل", en: "Waterfall View", icon: Waves },
  { id: "مصعد", en: "Elevator", icon: DoorOpen },
  { id: "مكتب امن", en: "Security Office", icon: Shield },
  { id: "موقف سيارة", en: "Car Parking", icon: Car },
];

export function normalizeCategory(category: string) {
  if (category === "فيلا") return "villa";
  if (category === "مزرعة") return "farm";
  if (category === "مخيم") return "camp";
  if (["شقة", "استديو", "غرفة", "شقق مخدومة"].includes(category)) return "penthouse";
  return "chalet";
}

export type WizardArrayField =
  | "mainFacilities"
  | "poolAmenities"
  | "kitchenAmenities"
  | "bathroomAmenities"
  | "propertyAmenities"
  | "propertyFeatures";

export function normalizeCity(city: string) {
  return normalizeSaudiCityId(city);
}

export const WIZARD_STEPS = {
  CATEGORY_TITLE: 0,
  MAP_PIN: 1,
  LOCATION: 2,
  DETAILS_PRICING: 3,
  BEDROOM_DETAILS: 4,
  MAJLIS_DETAILS: 5,
  POOL_DETAILS: 6,
  KITCHEN_DETAILS: 7,
  BATHROOM_DETAILS: 8,
  PROPERTY_AMENITIES: 9,
  PROPERTY_FEATURES: 10,
  DESCRIPTION: 11,
  PHOTOS: 12,
} as const;

export function getVisibleWizardSteps(mainFacilities: string[]): number[] {
  const steps: number[] = [
    WIZARD_STEPS.CATEGORY_TITLE,
    WIZARD_STEPS.MAP_PIN,
    WIZARD_STEPS.LOCATION,
    WIZARD_STEPS.DETAILS_PRICING,
  ];
  if (mainFacilities.includes("غرفة نوم")) steps.push(WIZARD_STEPS.BEDROOM_DETAILS);
  if (mainFacilities.includes("مجلس")) steps.push(WIZARD_STEPS.MAJLIS_DETAILS);
  if (mainFacilities.includes("مسبح")) steps.push(WIZARD_STEPS.POOL_DETAILS);
  if (mainFacilities.includes("مطبخ")) steps.push(WIZARD_STEPS.KITCHEN_DETAILS);
  if (mainFacilities.includes("دورة مياه")) steps.push(WIZARD_STEPS.BATHROOM_DETAILS);
  steps.push(
    WIZARD_STEPS.PROPERTY_AMENITIES,
    WIZARD_STEPS.PROPERTY_FEATURES,
    WIZARD_STEPS.DESCRIPTION,
    WIZARD_STEPS.PHOTOS
  );
  return steps;
}

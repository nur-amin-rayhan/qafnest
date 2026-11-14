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
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "شاليه",
    en: "Chalet",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "استراحة",
    en: "Rest House",
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "استديو",
    en: "Studio",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "مخيم",
    en: "Camp",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "فيلا",
    en: "Villa",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "منتجع فندقي",
    en: "Hotel Resort",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "غرفة",
    en: "Room",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "مزرعة",
    en: "Farm",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "شقق مخدومة",
    en: "Serviced Apt",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80",
  },
];

export const MAIN_FACILITIES = [
  { id: "غرفة نوم", en: "Bedroom", icon: BedDouble },
  { id: "مجلس", en: "Majlis", icon: Sofa },
  { id: "مسبح", en: "Pool", icon: Waves },
  { id: "مطبخ", en: "Kitchen", icon: CookingPot },
  { id: "دورة مياه", en: "Bathroom", icon: Bath },
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

export function normalizeCity(city: string) {
  return normalizeSaudiCityId(city);
}

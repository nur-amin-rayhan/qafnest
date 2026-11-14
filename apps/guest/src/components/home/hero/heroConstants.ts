import { SAUDI_ALL_CITIES } from "@qafnest/shared";

// All Saudi Arabian Cities & Destinations
export const CITIES = [
  { id: "all", name: "All Saudi Destinations", nameAr: "جميع الوجهات" },
  ...SAUDI_ALL_CITIES.map((city) => ({
    id: city.id,
    name: city.en,
    nameAr: city.ar,
  })),
];

// Property Types (exact names and icons)
export const PROPERTY_TYPES = [
  {
    id: "all",
    name: "Apartments, Studios, rooms, Villas",
    icon: "🏠",
  },
  {
    id: "chalet",
    name: "Chalets, Istrahas and Resorts",
    icon: "🏊",
  },
  {
    id: "farm",
    name: "Farms",
    icon: "🌾",
  },
  {
    id: "camp",
    name: "Camps",
    icon: "⛺",
  },
  {
    id: "penthouse",
    name: "Serviced Apartments",
    icon: "🏢",
  },
];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];
export const DAY_NAMES_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];


import { SAUDI_ALL_CITIES } from "@qafnest/shared";

export interface CityItem {
  id: string;
  name: string;
  nameAr: string;
}

export const CITIES: CityItem[] = [
  { id: "all", name: "All Saudi Destinations", nameAr: "جميع الوجهات" },
  ...SAUDI_ALL_CITIES.map((city) => ({
    id: city.id,
    name: city.en,
    nameAr: city.ar,
  })),
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const DAY_NAMES_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

export function getSaudiTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
}

export function addDaysISO(isoDate: string, days: number): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function formatReadableDate(isoString: string, lang: "en" | "ar"): string {
  if (!isoString) return "";
  const [y, m, d] = isoString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return isoString;
  const locale = lang === "ar" ? "ar-SA" : "en-US";
  const weekday = date.toLocaleDateString(locale, { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "long" });
  return `${weekday}, ${day} ${month}`;
}


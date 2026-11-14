export function getSaudiToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getDayAfter(isoDate: string) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function formatGathernDate(isoDate: string, language: string) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
  const month = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return language === "ar"
    ? `${weekday}، ${day} ${month}`
    : `${weekday}, ${day} ${month}`;
}

export function formatGathernTime(time24: string, language: string) {
  if (!time24) return language === "ar" ? "04:00 م" : "04:00 PM";
  const [hourStr, minuteStr = "00"] = time24.split(":");
  const hourNum = Number(hourStr);
  if (!Number.isFinite(hourNum)) return time24;
  const period =
    hourNum >= 12
      ? language === "ar"
        ? "م"
        : "PM"
      : language === "ar"
      ? "ص"
      : "AM";
  const hour12 = hourNum % 12 || 12;
  const paddedHour = String(hour12).padStart(2, "0");
  return `${paddedHour}:${minuteStr.slice(0, 2)} ${period}`;
}

export function addDaysIso(isoDate: string, days: number) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const TWELVE_HOUR_SLOTS = ["00:00"];

export const CHECKIN_TIME_SLOTS = [
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "20:00",
];

export const CHECKOUT_TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
];


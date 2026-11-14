export interface SaudiBank {
  code: string;
  nameEn: string;
  nameAr: string;
}

export const SAUDI_BANKS: Record<string, { nameEn: string; nameAr: string }> = {
  "55": { nameEn: "Al Rajhi Bank", nameAr: "مصرف الراجحي" },
  "80": { nameEn: "Al Rajhi Bank", nameAr: "مصرف الراجحي" },
  "10": { nameEn: "Saudi National Bank (SNB)", nameAr: "البنك الأهلي السعودي" },
  "20": { nameEn: "Riyad Bank", nameAr: "بنك الرياض" },
  "05": { nameEn: "Alinma Bank", nameAr: "مصرف الإنماء" },
  "50": { nameEn: "Banque Saudi Fransi", nameAr: "البنك السعودي الفرنسي" },
  "45": { nameEn: "Saudi Awwal Bank (SAB)", nameAr: "البنك السعودي الأول" },
  "15": { nameEn: "Bank AlJazira", nameAr: "بنك الجزيرة" },
  "30": { nameEn: "Arab National Bank (ANB)", nameAr: "البنك العربي الوطني" },
  "60": { nameEn: "Bank Albilad", nameAr: "بنك البلاد" },
  "65": { nameEn: "Saudi Investment Bank (SAIB)", nameAr: "البنك السعودي للاستثمار" },
  "40": { nameEn: "Gulf International Bank (GIB)", nameAr: "بنك الخليج الدولي" },
};

export function detectSaudiBank(iban: string): { nameEn: string; nameAr: string } {
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  if (!clean.startsWith("SA") || clean.length < 6) {
    return { nameEn: "Not Configured", nameAr: "غير مضاف" };
  }
  const bankCode = clean.slice(4, 6);
  return SAUDI_BANKS[bankCode] || { nameEn: "Saudi Commercial Bank", nameAr: "بنك سعودي تجاري" };
}

export function validateSaudiIban(iban: string): { valid: boolean; errorEn?: string; errorAr?: string } {
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  if (!clean.startsWith("SA")) {
    return {
      valid: false,
      errorEn: "Saudi IBAN must start with 'SA'",
      errorAr: "يجب أن يبدأ الآيبان السعودي بـ SA",
    };
  }
  if (clean.length !== 24) {
    return {
      valid: false,
      errorEn: `Saudi IBAN must be 24 characters (currently ${clean.length})`,
      errorAr: `يجب أن يتكون الآيبان من 24 خانة (الحالي ${clean.length})`,
    };
  }
  if (!/^SA\d{22}$/.test(clean)) {
    return {
      valid: false,
      errorEn: "IBAN after 'SA' must be 22 numeric digits",
      errorAr: "يجب أن تكون الخانات بعد SA عبارة عن 22 رقماً",
    };
  }
  return { valid: true };
}

export function formatSaudiIban(iban: string): string {
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
}


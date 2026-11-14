export interface CmsPageSection {
  id: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
}

export interface CmsFaqItem {
  id: string;
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  category: string;
}

export interface CmsContactInfo {
  phone: string;
  whatsapp: string;
  supportEmail: string;
  hostsEmail: string;
  financeEmail: string;
  addressEn: string;
  addressAr: string;
  licenseNumber: string;
}

export interface CmsPageRecord {
  id: "terms" | "privacy" | "cookies" | "faq" | "contact";
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  lastUpdated: string;
  sections?: CmsPageSection[];
  faqs?: CmsFaqItem[];
  contactInfo?: CmsContactInfo;
}

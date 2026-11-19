export type CmsTab =
  | "dashboard"
  | "users"
  | "media"
  | "categories"
  | "blogs"
  | "roles"
  | "faqs"
  | "home-popups"
  | "destinations"
  | "home-hero"
  | "features"
  | "fleet-capabilities"
  | "coverage-network"
  | "industries"
  | "business-pages"
  | "legal-pages"
  | "navigation-links"
  | "social-links"
  | "contact-us"
  | "site-seo"
  | "google-tag-manager"
  | "about-us"
  | "identity"
  | "zatca";

export type CmsLocale = "en" | "ar";

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface CmsUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  updatedAt: string;
}

export interface CmsMediaRecord {
  id: string;
  filename: string;
  alt: string;
  url: string;
  mimeType: string;
  sizeKb: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface CmsCategoryRecord {
  id: string;
  name: LocalizedText;
  slug: string;
  description: LocalizedText;
  updatedAt: string;
}

export interface RolePermissionGroup {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export type RolePermissionModuleKey =
  | "blogs"
  | "categories"
  | "users"
  | "media"
  | "roles"
  | "businessPages"
  | "legalPages";

export interface CmsRoleRecord {
  id: string;
  name: string;
  description: string;
  permissions: Record<RolePermissionModuleKey, RolePermissionGroup>;
  updatedAt: string;
}

export interface CmsFaqRecord {
  id: string;
  category?: string;
  question: LocalizedText;
  answer: LocalizedText;
  enabled: boolean;
  order: number;
  updatedAt: string;
}

export interface CmsHomePopupRecord {
  id: string;
  title: string;
  desktopImage: string;
  mobileImage: string;
  link: string;
  openInNewTab: boolean;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  updatedAt: string;
}

export interface CmsDestinationRecord {
  id: string;
  city: string;
  name: LocalizedText;
  subtitle: LocalizedText;
  image: string;
  isMonthly?: boolean;
  badgeText?: string;
  enabled: boolean;
  order: number;
  updatedAt: string;
}

export interface CmsBusinessPageRecord {
  id: string;
  title: LocalizedText;
  slug: string;
  content: LocalizedText;
  showSection: boolean;
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  canonicalUrl: string;
  updatedAt: string;
}

export interface CmsLegalPageRecord {
  id: string;
  title: LocalizedText;
  slug: string;
  content: LocalizedText;
  showSection: boolean;
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  canonicalUrl: string;
  updatedAt: string;
}

export interface CmsNavLinkRecord {
  id: string;
  title: LocalizedText;
  link: string;
  showInNavbar: boolean;
  showInFooter: boolean;
  openInNewTab: boolean;
  order: number;
}

export interface CmsSocialLinkRecord {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
  updatedAt: string;
}

export interface CmsHomeHeroGlobal {
  badge: LocalizedText;
  titleLine1: LocalizedText;
  titleLine2: LocalizedText;
  description: LocalizedText;
  heroImage: string;
  profileButton: {
    label: LocalizedText;
    url: string;
    openInNewTab: boolean;
  };
  contactButton: {
    label: LocalizedText;
    url: string;
    openInNewTab: boolean;
  };
}

export interface CmsFeatureCard {
  id: string;
  badge: LocalizedText;
  icon: string;
  title: LocalizedText;
  description: LocalizedText;
  metaText: LocalizedText;
  metaIcon: string;
}

export interface CmsFeaturesGlobal {
  showSection: boolean;
  title: LocalizedText;
  subtitle: LocalizedText;
  slaBadge: LocalizedText;
  cards: CmsFeatureCard[];
}

export interface CmsHighlightCard {
  id: string;
  value: string;
  label: LocalizedText;
  description: LocalizedText;
}

export interface CmsCoverageNetworkGlobal {
  showSection: boolean;
  title: LocalizedText;
  description: LocalizedText;
  badge: LocalizedText;
  highlightCards: CmsHighlightCard[];
  showSecondaryCards: boolean;
}

export interface CmsContactUsGlobal {
  phone: string;
  address: LocalizedText;
  supportEmail: string;
  generalEmail: string;
  businessEmail: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
}

export interface CmsSiteSeoGlobal {
  siteName: LocalizedText;
  defaultTitle: LocalizedText;
  defaultDescription: LocalizedText;
  keywords: LocalizedText;
  openGraph: {
    title: LocalizedText;
    description: LocalizedText;
    url: string;
    type: string;
    image: string;
  };
  twitter: {
    handle: string;
    card: string;
    title: LocalizedText;
    description: LocalizedText;
  };
  socialProfiles: {
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    pinterest: string;
  };
  robots: {
    noIndex: boolean;
    noFollow: boolean;
    customRules?: string;
    sitemapEnabled?: boolean;
  };
}

export interface CmsGtmGlobal {
  enabled: boolean;
  gtmId: string;
}

export interface CmsAboutUsGlobal {
  content: LocalizedText;
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  keywords: LocalizedText;
  ogImage: string;
  noIndex: boolean;
  canonicalUrl: string;
}

export interface CmsWorkspaceData {
  users: CmsUserRecord[];
  media: CmsMediaRecord[];
  categories: CmsCategoryRecord[];
  roles: CmsRoleRecord[];
  faqs: CmsFaqRecord[];
  homePopups: CmsHomePopupRecord[];
  destinations: CmsDestinationRecord[];
  businessPages: CmsBusinessPageRecord[];
  legalPages: CmsLegalPageRecord[];
  navigationLinks: CmsNavLinkRecord[];
  socialLinks: CmsSocialLinkRecord[];
  globals: {
    homeHero: CmsHomeHeroGlobal;
    features: CmsFeaturesGlobal;
    fleetCapabilities: CmsFeaturesGlobal;
    coverageNetwork: CmsCoverageNetworkGlobal;
    industries: CmsFeaturesGlobal;
    contactUs: CmsContactUsGlobal;
    siteSeo: CmsSiteSeoGlobal;
    gtm: CmsGtmGlobal;
    aboutUs: CmsAboutUsGlobal;
  };
}

// Legacy exports kept for backward compatibility
export interface BlogArticle {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  category: string;
  status: "published" | "draft";
  views: number;
  updatedAt: string;
}

export interface SeoRouteMeta {
  path: string;
  titleEn: string;
  titleAr: string;
  keywords: string;
  ogImage: string;
}

export interface FaqItem {
  id: string;
  qEn: string;
  qAr: string;
  aEn?: string;
  aAr?: string;
  category: string;
}

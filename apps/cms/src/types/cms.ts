export type CmsTab = "articles" | "pages" | "contact" | "seo" | "faqs" | "announcements" | "identity" | "zatca";

export interface BlogArticle {
  id: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  category: string;
  status: "published" | "draft";
  views: number;
  date: string;
  metaDesc: string;
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
  category: "booking" | "hosting" | "cancellation" | "payment";
}


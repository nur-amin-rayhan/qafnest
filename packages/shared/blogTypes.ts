export interface BlogKeyFeature {
  titleEn: string;
  titleAr: string;
  descEn?: string;
  descAr?: string;
}

export interface BlogSeoConfig {
  metaTitleEn: string;
  metaTitleAr: string;
  metaDescriptionEn: string;
  metaDescriptionAr: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface SharedBlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentHtmlEn: string;
  contentHtmlAr: string;
  category: "chalet" | "villa" | "guides" | "host-tips" | "farm" | "camp";
  categoryNameEn: string;
  categoryNameAr: string;
  tags: string[];
  coverImage: string;
  author: string;
  authorRoleEn: string;
  authorRoleAr: string;
  readTimeEn: string;
  readTimeAr: string;
  status: "published" | "draft";
  featured: boolean;
  date: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  seo: BlogSeoConfig;
  keyFeatures?: BlogKeyFeature[];
  linkedPropertyId?: string;
  linkedPropertyTitle?: string;
  linkedPropertySlug?: string;
}

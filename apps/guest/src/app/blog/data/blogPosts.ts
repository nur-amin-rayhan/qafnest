export interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  category: "chalets" | "farms" | "camps" | "villas" | "guides";
  categoryNameEn: string;
  categoryNameAr: string;
  image: string;
  author: string;
  authorRoleEn: string;
  authorRoleAr: string;
  date: string;
  readTimeEn: string;
  readTimeAr: string;
  featured?: boolean;
}

export interface BlogCategory {
  id: string;
  nameEn: string;
  nameAr: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  { id: "all", nameEn: "All Articles", nameAr: "جميع المقالات" },
  { id: "chalets", nameEn: "Chalets & Resorts", nameAr: "شاليهات ومنتجعات" },
  { id: "villas", nameEn: "Villas & Apartments", nameAr: "شقق وفلل" },
  { id: "farms", nameEn: "Farms", nameAr: "مزارع" },
  { id: "camps", nameEn: "Camps", nameAr: "مخيّمات" },
  { id: "guides", nameEn: "Travel Guides", nameAr: "أدلة سياحية" },
];

export const BLOG_POSTS: BlogPost[] = [];

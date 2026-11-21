export interface BlogPostDetail {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentEn: string[];
  contentAr: string[];
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
}

export const BLOG_POST_DETAILS: Record<string, BlogPostDetail> = {};

export function getDefaultBlogPost(slug: string): BlogPostDetail {
  return {
    id: slug,
    slug,
    titleEn: "Article Not Found",
    titleAr: "المقال غير متوفر",
    excerptEn: "This article is currently unavailable or has been removed.",
    excerptAr: "هذا المقال غير متاح حالياً أو تمت إزالته.",
    contentEn: [],
    contentAr: [],
    category: "chalets",
    categoryNameEn: "General",
    categoryNameAr: "عام",
    image: "",
    author: "QafNest",
    authorRoleEn: "Editorial",
    authorRoleAr: "فريق التحرير",
    date: new Date().toISOString().split("T")[0],
    readTimeEn: "1 min",
    readTimeAr: "دقيقة واحدة",
  };
}

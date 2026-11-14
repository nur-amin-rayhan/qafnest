import type { BlogArticle, SeoRouteMeta, FaqItem } from "../types/cms";

export const INITIAL_ARTICLES: BlogArticle[] = [];

export const INITIAL_SEO_ROUTES: SeoRouteMeta[] = [
  {
    path: "/",
    titleEn: "QafNest | Saudi Chalets, Resorts & Luxury Stays",
    titleAr: "قاف نست | شاليهات ومنتجعات واستراحات المملكة",
    keywords: "chalets riyadh, resorts jeddah, alula desert camps, qafnest booking",
    ogImage: "https://qafnest.com/og-home.jpg",
  },
  {
    path: "/chalets/riyadh",
    titleEn: "Luxury Chalets & Private Pools in Riyadh | QafNest",
    titleAr: "شاليهات فاخرة ومسابح خاصة في الرياض | قاف نست",
    keywords: "riyadh chalets, private pool riyadh, luxury stays riyadh",
    ogImage: "https://qafnest.com/og-riyadh.jpg",
  },
  {
    path: "/alula",
    titleEn: "Exclusive AlUla Desert Camps & Eco Lodges | QafNest",
    titleAr: "مخيمات ومنتجعات العلا الفاخرة | قاف نست",
    keywords: "alula desert resorts, luxury camping alula, hegra stays",
    ogImage: "https://qafnest.com/og-alula.jpg",
  },
];

export const INITIAL_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    qEn: "How do I confirm a booking, pay a security deposit, and check in?",
    qAr: "كيف يُؤكد الحجز وما آلية دفع مبلغ التأمين وتسجيل الدخول؟",
    category: "booking",
  },
  {
    id: "faq-2",
    qEn: "What are the Ministry of Tourism licensing, commission, and Host Protection rules?",
    qAr: "ما هي متطلبات ترخيص وزارة السياحة والعمولة وبرنامج حماية المضيف؟",
    category: "hosting",
  },
  {
    id: "faq-3",
    qEn: "Can a confirmed booking be cancelled, postponed, or refunded?",
    qAr: "هل يمكن إلغاء الحجز أو تأجيله أو استرداد المبلغ المدفوع؟",
    category: "cancellation",
  },
  {
    id: "faq-4",
    qEn: "How does Smart Lock PIN access and communication with the Host work?",
    qAr: "كيف يعمل رمز القفل الذكي للدخول والتواصل مع المضيف؟",
    category: "booking",
  },
];


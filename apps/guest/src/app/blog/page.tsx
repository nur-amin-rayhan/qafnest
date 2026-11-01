"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Compass,
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";

interface BlogPost {
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

const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "top-chalets-riyadh-private-pool",
    titleEn: "Top 10 Luxury Chalets in Riyadh with Heated Pools for Weekend Getaways",
    titleAr: "أفضل ١٠ شاليهات فاخرة في الرياض بمسبح مدفأ لعطلات نهاية الأسبوع",
    excerptEn:
      "Looking for a private oasis in Riyadh? Discover our curated selection of verified chalets in Al-Ammariyah, Diriyah, and Al-Rimal featuring Olympic-grade pools and smart lock entry.",
    excerptAr:
      "تبحث عن ملاذ خاص واستثنائي في الرياض؟ استكشف مجموعتنا المختارة من الشاليهات المرخصة في العمارية والدرعية والرمال مع مسابح خاصة ودخول ذكي بدون مفتاح.",
    category: "chalets",
    categoryNameEn: "Chalets & Resorts",
    categoryNameAr: "شاليهات ومنتجعات",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    author: "Nouf Al-Otaibi",
    authorRoleEn: "Travel & Hospitality Editor",
    authorRoleAr: "محررة السياحة والضيافة",
    date: "2026-10-24",
    readTimeEn: "5 min read",
    readTimeAr: "قراءة ٥ دقائق",
    featured: true,
  },
  {
    id: "2",
    slug: "alula-glamping-stargazing-guide",
    titleEn: "AlUla Stargazing & Desert Glamping: The Ultimate Stays Guide",
    titleAr: "دليل التخييم الفاخر ومراقبة النجوم في العلا: إقامة بين الصخور والتاريخ",
    excerptEn:
      "From transparent luxury geodesic domes facing Elephant Rock to secluded heritage Bedouin retreats in Harrat Uwayrid. Here is everything you need to know about booking camps in AlUla.",
    excerptAr:
      "من القباب الزجاجية الفاخرة المطلة على صخرة الفيل إلى المخيمات التراثية الهادئة في حرة عويرض. كل ما تحتاجه لتجربة تخييم خيالية بين معالم العلا الساحرة.",
    category: "camps",
    categoryNameEn: "Camps",
    categoryNameAr: "مخيّمات",
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    author: "Faisal Al-Shammari",
    authorRoleEn: "Adventure & Desert Specialist",
    authorRoleAr: "أخصائي سياحة المغامرات",
    date: "2026-10-18",
    readTimeEn: "6 min read",
    readTimeAr: "قراءة ٦ دقائق",
    featured: true,
  },
  {
    id: "3",
    slug: "diriyah-ammariyah-heritage-farms",
    titleEn: "Heritage Country Farms in Diriyah & Al-Ammariyah: Fresh Air & Najdi Charm",
    titleAr: "مزارع ريفية واستراحات في الدرعية والعمارية: سحر نجد والأجواء النقية",
    excerptEn:
      "Escape city noise with lush organic date palm groves, authentic mud-brick majlis salons, and barbecue yards tailored for multi-generational family gatherings.",
    excerptAr:
      "ابتعد عن صخب المدينة واستمتع بمزارع النخيل العضوية والمجالس النجدية التراثية ومساحات الشواء المصممة خصيصاً للاجتماعات العائلية الممتعة.",
    category: "farms",
    categoryNameEn: "Farms",
    categoryNameAr: "مزارع",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    author: "Sultan Al-Harbi",
    authorRoleEn: "Heritage Architecture Writer",
    authorRoleAr: "باحث في التراث المعماري",
    date: "2026-10-12",
    readTimeEn: "4 min read",
    readTimeAr: "قراءة ٤ دقائق",
  },
  {
    id: "4",
    slug: "jeddah-obhur-beachfront-villas",
    titleEn: "Jeddah Obhur Beachfront Villas: Private Lagoon Docks and Sunset Vistas",
    titleAr: "فلل أبحر وجدة البحرية: منصات يخوت خاصة وإطلالات غروب ساحرة",
    excerptEn:
      "Experience Red Sea luxury with direct boat access, panoramic glass facades, private pools, and spacious living spaces curated for friends and family.",
    excerptAr:
      "استمتع بفخامة البحر الأحمر مع مراسي قوارب خاصة، واجهات زجاجية بانورامية، ومسابح مطلة صممت لتمنحك عطلة ساحلية لا تُنسى.",
    category: "villas",
    categoryNameEn: "Villas & Apartments",
    categoryNameAr: "شقق وفلل",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    author: "Reem Al-Ghamdi",
    authorRoleEn: "Coastal Living Writer",
    authorRoleAr: "محررة السياحة البحرية",
    date: "2026-10-05",
    readTimeEn: "5 min read",
    readTimeAr: "قراءة ٥ دقائق",
  },
  {
    id: "5",
    slug: "smart-lock-checkin-vacation-rentals",
    titleEn: "Smart Lock Check-In: How QafNest Simplifies Vacation Rentals in Saudi Arabia",
    titleAr: "الدخول الذكي بدون مفتاح: كيف تجعل قاف نست إقامتك أسرع وأكثر أماناً",
    excerptEn:
      "No waiting for keys or coordinating handover times. Learn how instant encrypted keypad codes provide seamless 24/7 entry to your booked stay.",
    excerptAr:
      "وداعاً لانتظار تسليم المفاتيح أو تنسيق المواعيد. تعرف على كيفية وصول كود القفل الذكي المشفر فور تأكيد الحجز للدخول السلس على مدار الساعة.",
    category: "guides",
    categoryNameEn: "Travel Guides",
    categoryNameAr: "أدلة سياحية",
    image: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=1200&q=80",
    author: "Eng. Tariq Al-Zahrani",
    authorRoleEn: "Smart Hospitality Lead",
    authorRoleAr: "مسؤول التقنية الفندقية",
    date: "2026-09-29",
    readTimeEn: "4 min read",
    readTimeAr: "قراءة ٤ دقائق",
  },
  {
    id: "6",
    slug: "abha-soudah-fog-cabins-escapes",
    titleEn: "Abha & Al-Soudah Mountain Cabins: Chill Above the Clouds in Asir",
    titleAr: "أكواخ أبها والسودة الجبلية: برودة وإطلالات فوق السحاب في عسير",
    excerptEn:
      "Discover juniper-scented mountain chalets perched on dramatic cliffs with working fireplaces, misty valleys, and year-round cool temperatures.",
    excerptAr:
      "اكتشف شاليهات جبال عسير المحاطة بأشجار العرعر والضباب، مع مدافئ حطب وإطلالات ساحرة على المنحدرات السحابية طوال العام.",
    category: "chalets",
    categoryNameEn: "Chalets & Resorts",
    categoryNameAr: "شاليهات ومنتجعات",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    author: "Nasser Al-Asmari",
    authorRoleEn: "Mountain Tourism Columnist",
    authorRoleAr: "كاتب السياحة الجبلية",
    date: "2026-09-22",
    readTimeEn: "5 min read",
    readTimeAr: "قراءة ٥ دقائق",
  },
];

export default function BlogPage() {
  const { language, isDarkTheme } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", nameEn: "All Articles", nameAr: "جميع المقالات" },
    { id: "chalets", nameEn: "Chalets & Resorts", nameAr: "شاليهات ومنتجعات" },
    { id: "villas", nameEn: "Villas & Apartments", nameAr: "شقق وفلل" },
    { id: "farms", nameEn: "Farms", nameAr: "مزارع" },
    { id: "camps", nameEn: "Camps", nameAr: "مخيّمات" },
    { id: "guides", nameEn: "Travel Guides", nameAr: "أدلة سياحية" },
  ];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.titleEn.toLowerCase().includes(q) ||
      post.titleAr.includes(q) ||
      post.excerptEn.toLowerCase().includes(q) ||
      post.excerptAr.includes(q);
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = BLOG_POSTS.filter((p) => p.featured);
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div
      className={`min-h-screen ${
        isDarkTheme ? "bg-[#06060B] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20">
        {/* ================= HERO HEADER ================= */}
        <section className="relative overflow-hidden py-12 sm:py-16 border-b border-purple-500/10">
          <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-950/30 text-xs sm:text-sm font-semibold text-fuchsia-400 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Compass className="w-4 h-4 text-fuchsia-400" />
              <span>
                {language === "ar"
                  ? "دليل السفر والسياحة في المملكة العربية السعودية"
                  : "Saudi Travel & Vacation Rentals Guide"}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight max-w-4xl mx-auto leading-[1.15]">
              {language === "ar" ? (
                <>
                  مدونة <span className="text-gradient">قاف نست</span> للسياحة والإقامات
                </>
              ) : (
                <>
                  Discover Saudi Arabia with{" "}
                  <span className="text-gradient">QafNest</span>
                </>
              )}
            </h1>

            <p className="mt-4 text-sm sm:text-base lg:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
              {language === "ar"
                ? "أدلة شاملة، نصائح حجز، وأفضل الوجهات لقضاء أجمل الأوقات في الشاليهات، الفلل، المزارع الريفية، والمخيمات الصحراوية."
                : "Curated destination guides, local stay insights, and insider tips for luxury chalets, private villas, farms, and desert camps."}
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-xl mx-auto relative">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                  isDarkTheme
                    ? "bg-[#0E0E1A] border-white/10 focus-within:border-violet-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                    : "bg-white border-purple-200 focus-within:border-purple-500 shadow-[0_10px_30px_rgba(88,28,135,0.08)]"
                }`}
              >
                <Search className="w-5 h-5 text-violet-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === "ar"
                      ? "ابحث عن مقال، وجهة، أو نوع إقامة .."
                      : "Search articles, destinations, or stay guides .."
                  }
                  className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-muted hover:text-white px-2 py-1"
                  >
                    {language === "ar" ? "مسح" : "Clear"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= CATEGORY TABS ================= */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const label = language === "ar" ? cat.nameAr : cat.nameEn;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                      : isDarkTheme
                      ? "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/5"
                      : "bg-white text-gray-700 hover:text-purple-900 hover:bg-purple-50 border border-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= FEATURED POSTS CAROUSEL/GRID ================= */}
        {selectedCategory === "all" && !searchQuery && featuredPosts.length > 0 && (
          <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                {language === "ar" ? "مقالات مختارة" : "Featured Stories"}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredPosts.map((post) => {
                const title = language === "ar" ? post.titleAr : post.titleEn;
                const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
                const catName =
                  language === "ar" ? post.categoryNameAr : post.categoryNameEn;
                const readTime = language === "ar" ? post.readTimeAr : post.readTimeEn;

                return (
                  <article
                    key={post.id}
                    className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                      isDarkTheme
                        ? "bg-[#0E0E1A] border-white/10 hover:border-violet-500/40 shadow-xl"
                        : "bg-white border-purple-100 hover:border-purple-300 shadow-md"
                    }`}
                  >
                    <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                      <Image
                        src={post.image}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600/90 text-white backdrop-blur-md">
                          {catName}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 rtl:left-4 rtl:right-4 text-white">
                        <div className="flex items-center gap-3 text-xs text-white/80">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {post.date}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {readTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold font-display group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                          {title}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
                          {excerpt}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-purple-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-violet-600/30 text-violet-300 font-bold text-xs flex items-center justify-center">
                            {post.author.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold">{post.author}</span>
                        </div>

                        <Link
                          href={`/search?type=${post.category === "guides" ? "chalet" : post.category}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 group-hover:text-fuchsia-400 transition-colors"
                        >
                          <span>{language === "ar" ? "استكشف العقارات" : "Explore Stays"}</span>
                          <ArrowIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= ALL POSTS GRID ================= */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display">
              {language === "ar" ? "أحدث المقالات" : "Latest Articles"}
            </h2>
            <span className="text-xs text-muted">
              {filteredPosts.length}{" "}
              {language === "ar" ? "مقال متوفر" : "articles"}
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isDarkTheme ? "bg-[#0E0E1A] border-white/10" : "bg-white border-purple-100"
              }`}
            >
              <Compass className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-muted">
                {language === "ar"
                  ? "لم يتم العثور على مقالات مطابقة لبحثك."
                  : "No articles matched your search."}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white"
              >
                {language === "ar" ? "عرض جميع المقالات" : "View All Articles"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const title = language === "ar" ? post.titleAr : post.titleEn;
                const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
                const catName =
                  language === "ar" ? post.categoryNameAr : post.categoryNameEn;
                const readTime = language === "ar" ? post.readTimeAr : post.readTimeEn;

                return (
                  <article
                    key={post.id}
                    className={`group rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                      isDarkTheme
                        ? "bg-[#0E0E1A] border-white/10 hover:border-violet-500/40 shadow-lg"
                        : "bg-white border-purple-100 hover:border-purple-300 shadow-sm"
                    }`}
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={post.image}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md">
                          {catName}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
                          <Calendar className="w-3 h-3" />
                          <span>{post.date}</span>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          <span>{readTime}</span>
                        </div>

                        <h3 className="text-base font-bold font-display group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                          {title}
                        </h3>

                        <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
                          {excerpt}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-purple-500/10 flex items-center justify-between text-xs">
                        <span className="font-medium text-muted">{post.author}</span>
                        <Link
                          href={`/search?type=${post.category === "guides" ? "chalet" : post.category}`}
                          className="font-bold text-violet-400 group-hover:text-fuchsia-400 flex items-center gap-1 transition-colors"
                        >
                          <span>{language === "ar" ? "تصفح الوحدات" : "Explore Stays"}</span>
                          <ArrowIcon className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= HOST CTA BANNER ================= */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 mt-16">
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 border border-violet-500/20 bg-gradient-to-r from-violet-950/70 via-purple-950/50 to-[#0E0E1A] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left rtl:md:text-right">
              <span className="text-xs uppercase font-bold text-fuchsia-400 tracking-wider">
                {language === "ar" ? "انضم كمضيف في قاف نست" : "Host on QafNest"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
                {language === "ar"
                  ? "هل تمتلك شاليه، فيلا، مزرعة أو مخيم؟"
                  : "Own a Chalet, Villa, Country Farm or Camp?"}
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-2">
                {language === "ar"
                  ? "أعلن عن عقارك الآن واستقبل آلاف الضيوف مع تقويم موحد، تأمين على الأضرار، وعوائد مجزية."
                  : "List your property now to connect with verified guests across Saudi Arabia with damage protection and instant smart locks."}
              </p>
            </div>

            <a
              href="https://business.qafnest.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all shrink-0 cursor-pointer"
            >
              {language === "ar" ? "أعلن عن عقارك معنا" : "List Your Property"}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

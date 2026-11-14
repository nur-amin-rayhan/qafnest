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

export const BLOG_POSTS: BlogPost[] = [
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


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
    id: "blog-01-riyadh-chalets",
    slug: "top-luxury-chalets-riyadh-winter-retreats",
    titleEn: "Top Luxury Chalets in Riyadh: Complete Winter Retreat & Weekend Guide",
    titleAr: "أفضل الشاليهات الفاخرة في الرياض: دليل العطلات الشتوية وعطلة نهاية الأسبوع",
    excerptEn: "Discover Riyadh's most coveted private chalets in Al-Narjis and Al-Ammariyah featuring heated infinity pools, outdoor majlis, and seamless digital access.",
    excerptAr: "اكتشف أرقى الشاليهات الخاصة في الرياض بأحياء النرجس والعمارية، والتي تتميز بمسابح مدفأة، مجالس خارجية راقية، ودخول ذاتي ذكي.",
    category: "chalets",
    categoryNameEn: "Chalet Stays",
    categoryNameAr: "شاليهات واستراحات",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&fit=crop",
    author: "QafNest Editorial Team",
    authorRoleEn: "Senior Hospitality Editor",
    authorRoleAr: "محرر الضيافة والسياحة",
    date: "2026-11-20",
    readTimeEn: "5 min read",
    readTimeAr: "٥ دقائق قراءة",
    featured: true,
  },
  {
    id: "blog-02-host-compliance-guide",
    slug: "saudi-vacation-rental-licensing-guide-for-hosts",
    titleEn: "Host Compliance Guide: Ministry of Tourism Licensing & SAMA Fast Payouts in 2026",
    titleAr: "دليل المضيف الشامل: تراخيص وزارة السياحة وتسويات ساما السريعة لعام 2026",
    excerptEn: "Everything property owners need to know about registering short-term rentals, verifying national IDs with Nafath, and receiving 24-hour SARIE bank payouts.",
    excerptAr: "كل ما يحتاجه ملاك العقارات لمعرفة خطوات ترخيص بيوت العطلات، التحقق عبر نفاذ الوطني، واستلام المستحقات المالية خلال 24 ساعة عبر سريع.",
    category: "guides",
    categoryNameEn: "Host Insights",
    categoryNameAr: "إرشادات المضيفين",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&fit=crop",
    author: "Fahad Al-Harbi",
    authorRoleEn: "Head of Host Operations & Compliance",
    authorRoleAr: "رئيس الامتثال وشؤون المضيفين",
    date: "2026-11-18",
    readTimeEn: "6 min read",
    readTimeAr: "٦ دقائق قراءة",
    featured: true,
  },
  {
    id: "blog-03-jeddah-coastal-villas",
    slug: "obhur-private-beach-villas-jeddah-coastal-living",
    titleEn: "Coastal Escapes: Exploring Private Beach Villas in Obhur, Jeddah",
    titleAr: "ملاذات البحر الأحمر: استكشاف الفلل الشاطئية الخاصة في شرم أبحر بجدة",
    excerptEn: "Experience seaside luxury along the Red Sea with private boat docks, infinity edge pools, and unmatched sunset dining in North Obhur, Jeddah.",
    excerptAr: "عش تجربة الضيافة البحرية الفاخرة على ضفاف البحر الأحمر مع مراسي القوارب الخاصة والمسابح المطلة على شواطئ أبحر الشمالية في جدة.",
    category: "villas",
    categoryNameEn: "Private Villas",
    categoryNameAr: "فلل وقصور خاصة",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&fit=crop",
    author: "Layan Al-Ghamdi",
    authorRoleEn: "Coastal Lifestyle Specialist",
    authorRoleAr: "أخصائية الإقامات الشاطئية",
    date: "2026-11-15",
    readTimeEn: "4 min read",
    readTimeAr: "٤ دقائق قراءة",
    featured: false,
  },
  {
    id: "blog-04-agri-tourism-farms",
    slug: "agri-tourism-private-farms-weekend-escapes",
    titleEn: "Agri-Tourism in Saudi Arabia: Why Private Farm Retreats are the New Family Favorite",
    titleAr: "السياحة الريفية في السعودية: لماذا أصبحت المزارع الخاصة الوجهة المفضلة للعائلات؟",
    excerptEn: "From organic date orchards in Al-Qassim to heritage estates in Al-Kharj, private farm rentals offer authentic heritage, fresh air, and abundant space for gatherings.",
    excerptAr: "من بساتين النخيل العضوية في القصيم إلى المزارع التراثية في الخرج، تمنح المزارع الخاصة العائلات تجربة طبيعية أصيلة ومساحات واسعة للاجتماعات.",
    category: "farms",
    categoryNameEn: "Private Farms",
    categoryNameAr: "مزارع ريفية",
    image: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200&fit=crop",
    author: "Abdullah Al-Dosari",
    authorRoleEn: "Rural Tourism Curator",
    authorRoleAr: "مختص السياحة الريفية",
    date: "2026-11-12",
    readTimeEn: "4 min read",
    readTimeAr: "٤ دقائق قراءة",
    featured: false,
  },
  {
    id: "blog-05-alula-desert-glamping",
    slug: "alula-desert-glamping-luxury-camps-stargazing",
    titleEn: "Under the Desert Stars: The Ultimate Guide to Luxury Glamping Camps in AlUla",
    titleAr: "تحت سماء الصحراء: الدليل المتكامل للمخيمات الفاخرة وتأمل النجوم في العلا",
    excerptEn: "Immerse yourself in AlUla’s awe-inspiring sandstone canyons and stargazing landscapes with fully serviced luxury desert camps.",
    excerptAr: "انغمس في سحر جبال العلا الرملية وتأمل النجوم اللامعة مع أفضل المخيمات الصحراوية الفاخرة والمخدومة بالكامل.",
    category: "camps",
    categoryNameEn: "Desert Camps",
    categoryNameAr: "مخيمات وتخييم فاخر",
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1200&fit=crop",
    author: "Sara Al-Otaibi",
    authorRoleEn: "Heritage Tourism Specialist",
    authorRoleAr: "أخصائية السياحة التراثية",
    date: "2026-11-10",
    readTimeEn: "5 min read",
    readTimeAr: "٥ دقائق قراءة",
    featured: false,
  },
];

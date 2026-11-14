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

export const BLOG_POST_DETAILS: Record<string, BlogPostDetail> = {
  "top-chalets-riyadh-private-pool": {
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
    contentEn: [
      "Riyadh's weekend culture revolves around private family gatherings, peaceful poolside relaxation, and luxurious hospitality. As winter approaches and evening breezes cool the desert plains, heated pools become the ultimate luxury commodity.",
      "In our 2026 curated guide, we have inspected and certified the top ten private chalets across Al-Ammariyah, Diriyah, and Al-Rimal. Each stay features commercial-grade temperature-controlled pools, indoor majlis lounges, full outdoor barbecue kitchens, and smart lock keypads that grant instant contactless access upon verified booking confirmation.",
      "Whether you're planning a weekend birthday celebration or a quiet workation retreat, these properties deliver high privacy, pristine hygiene standards, and verified Ministry of Tourism licensing.",
    ],
    contentAr: [
      "تتميز ثقافة عطلات نهاية الأسبوع في الرياض بالاجتماعات العائلية الدافئة والاسترخاء بجانب المسابح الخاصة في أجواء من الخصوصية المطلقة. ومع حلول الأجواء الشتوية المعتدلة، تصبح المسابح المدفأة الخيار الأول للباحثين عن الراحة والرفاهية.",
      "في دليلنا الحصري لعام ٢٠٢٦، قمنا بزيارة واعتماد أفضل عشرة شاليهات في العمارية والدرعية والرمال. تضم هذه الوحدات مسابح مجهزة بأنظمة تدفئة ذكية، ومجالس نجدية واسعة، ومطابخ خارجية مجهزة لحفلات الشواء، بالإضافة إلى أقفال ذكية تمنحك كود الدخول المشفر فور تأكيد الحجز.",
      "سواء كنت تخطط لاجتماع عائلي أو عطلة استجمام هادئة، توفر هذه العقارات أعلى معايير النظافة والخصوصية والترخيص النظامي من وزارة السياحة.",
    ],
  },
  "alula-glamping-stargazing-guide": {
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
    contentEn: [
      "AlUla offers one of the world's most dramatic geological and historical landscapes. Ancient Nabataean tombs etched into sandstone towers contrast with modern architectural masterpieces.",
      "Glamping in AlUla has evolved from rugged safari setups into ultra-luxury eco-resorts. Guests can sleep inside climate-controlled geodesic transparent domes with telescope setups positioned directly towards the celestial Milky Way.",
      "Discover our recommended camps featuring private fire pits, open-air stargazing lounges, gourmet organic Saudi breakfast spreads, and pre-arranged safari transfers to Hegra and Dadan.",
    ],
    contentAr: [
      "تعتبر العلا واحدة من أكثر الوجهات الجيولوجية والتاريخية إلهاماً حول العالم. حيث تلتقي المقابر النبطية القديمة المنحوتة في الصخور الرملية مع روائع الهندسة المعمارية الحديثة.",
      "تطورت تجربة التخييم في العلا لتصبح مزيجاً استثنائياً من البساطة الصحراوية والفخامة الفندقية. حيث تتيح القباب الشفافة المكيفة للضيوف النوم تحت قبة السماء المرصعة بالنجوم مع مناظير فلكية متطورة.",
      "استكشف مخيماتنا المختارة التي تقدم جلسات نار خاصة، ووجبات إفطار سعودية عضوية طازجة، وخدمات تنقل ميسرة إلى مدائن صالح والمواقع الأثرية.",
    ],
  },
  "diriyah-ammariyah-heritage-farms": {
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
    contentEn: [
      "A short thirty-minute drive north-west of Riyadh transports you from towering steel skyscrapers to the fertile, quiet oasis of Wadi Hanifa and Al-Ammariyah valley.",
      "Heritage country farms listed on QafNest offer expansive palm tree groves, traditional clay majlis seating areas, outdoor fire pits, and spacious lawns perfect for large family reunions or private corporate offsites.",
      "Experience fresh organic dates, open countryside breezes, and traditional Arabic coffee roasted over natural firewood.",
    ],
    contentAr: [
      "على بعد ثلاثين دقيقة فقط بالسيارة شمال غرب الرياض، تنتقل من ناطحات السحاب الحديثة إلى واحات وادي حنيفة ومزارع العمارية الغناء بالهدوء والطبيعة.",
      "توفر المزارع والاستراحات الريفية المعتمدة في قاف نست مزارع نخيل ممتدة، مجالس طينية أصيلة، جلسات شواء مفتوحة، ومساحات خضراء مثالية للقاءات العائلية واحتفالات نهاية الأسبوع.",
      "استمتع بتذوق التمور الطازجة، ونسمات الهواء الريفي العليل، ورائحة القهوة السعودية المعدة على الحطب.",
    ],
  },
};

export function getDefaultBlogPost(slug: string): BlogPostDetail {
  return {
    id: "default",
    slug,
    titleEn: "Saudi Hospitality & Stays Guide",
    titleAr: "دليل الضيافة والإقامات في المملكة",
    excerptEn: "Discover curated chalets, villas, farms, and desert camps across Saudi Arabia on QafNest.",
    excerptAr: "استكشف أفضل الشاليهات والفلل والمزارع والمخيمات في مختلف مناطق المملكة عبر قاف نست.",
    category: "guides",
    categoryNameEn: "Travel Guide",
    categoryNameAr: "دليل سياحي",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&fit=crop",
    author: "QafNest Editorial Team",
    authorRoleEn: "Hospitality Insights",
    authorRoleAr: "فريق التحرير الفندقي",
    date: "2026-11-01",
    readTimeEn: "4 min read",
    readTimeAr: "قراءة ٤ دقائق",
    contentEn: [
      "Welcome to the QafNest Travel and Hospitality Guide. Our mission is to elevate local tourism by connecting discerning guests with verified, high-quality holiday homes and chalets throughout the Kingdom.",
      "From the historic alleys of Diriyah to the coastal horizons of Jeddah Obhur and the ancient cliffs of AlUla, each property undergoes strict verification for guest safety, licensing compliance, and smart lock accessibility.",
      "Browse our curated catalog to reserve your next stay with instant booking and local payment methods including Mada, Visa, Mastercard, and Tamara installment options.",
    ],
    contentAr: [
      "أهلاً بكم في دليل قاف نست للسياحة والضيافة. هدفنا هو الارتقاء بالسياحة المحلية من خلال ربط الضيوف بأرقى بيوت العطلات والشاليهات المرخصة في مختلف مناطق المملكة.",
      "من أحياء الدرعية التاريخية إلى شواطئ أبحر بجدة وجبال العلا الساحرة، تخضع كل وحدة لفحص دقيق لمعايير السلامة والتراخيص النظامية وتقنيات الدخول الذكي.",
      "تصفح وحداتنا المعتمدة واحجز إقامتك القادمة فورياً مع خيارات الدفع المحلية مثل مدى والبطاقات الائتمانية وتقسيط تمارا.",
    ],
  };
}


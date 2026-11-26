export interface BlogKeyFeature {
  titleEn: string;
  titleAr: string;
  descEn?: string;
  descAr?: string;
}

export interface BlogPostDetail {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentHtmlEn: string;
  contentHtmlAr: string;
  contentEn?: string[];
  contentAr?: string[];
  category: "chalets" | "farms" | "camps" | "villas" | "guides";
  categoryNameEn: string;
  categoryNameAr: string;
  coverImage?: string;
  image: string;
  author: string;
  authorRoleEn: string;
  authorRoleAr: string;
  date: string;
  readTimeEn: string;
  readTimeAr: string;
  tags?: string[];
  featured?: boolean;
  keyFeatures?: BlogKeyFeature[];
  linkedPropertyId?: string;
  linkedPropertyTitle?: string;
}

export const BLOG_POST_DETAILS: Record<string, BlogPostDetail> = {
  "top-luxury-chalets-riyadh-winter-retreats": {
    id: "blog-01-riyadh-chalets",
    slug: "top-luxury-chalets-riyadh-winter-retreats",
    titleEn: "Top Luxury Chalets in Riyadh: Complete Winter Retreat & Weekend Guide",
    titleAr: "أفضل الشاليهات الفاخرة في الرياض: دليل العطلات الشتوية وعطلة نهاية الأسبوع",
    excerptEn: "Discover Riyadh's most coveted private chalets in Al-Narjis and Al-Ammariyah featuring heated infinity pools, outdoor majlis, and seamless digital access.",
    excerptAr: "اكتشف أرقى الشاليهات الخاصة في الرياض بأحياء النرجس والعمارية، والتي تتميز بمسابح مدفأة، مجالس خارجية راقية، ودخول ذاتي ذكي.",
    contentHtmlEn: `<h2>The Rise of Private Chalet Retreats in Riyadh</h2>
<p>As winter temperatures cool the capital, Riyadh residents and visiting families look to the valleys of Al-Ammariyah and North Riyadh for weekend escapes that blend absolute privacy with five-star hospitality.</p>
<h3>Top Locations for Winter Stays</h3>
<p>Al-Ammariyah and Al-Narjis stand out as premier destinations offering natural elevation, unobstructed sunset vistas, and tranquil seclusion just 30 minutes from downtown Riyadh.</p>`,
    contentHtmlAr: `<h2>نهضة إقامات الشاليهات الخاصة في الرياض</h2>
<p>مع اعتدال الأجواء وانخفاض درجات الحرارة في العاصمة، تتجه العائلات والزوار نحو أودية العمارية وشمال الرياض لقضاء عطلات نهاية أسبوع تجمع بين الخصوصية المطلقة والضيافة الفندقية الفاخرة.</p>
<h3>أفضل المواقع لإقامات الشتاء</h3>
<p>تتميز مناطق العمارية والنرجس بإطلالاتها البانورامية على التلال وهدوئها الفريد، مما يجعلها الملاذ المثالي على بُعد 30 دقيقة فقط من وسط الرياض.</p>`,
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
    tags: ["Riyadh", "Chalets", "Winter Retreats", "Private Pool"],
    featured: true,
    keyFeatures: [
      {
        titleEn: "Heated Private Pools",
        titleAr: "مسابح خاصة مدفأة",
        descEn: "Temperature-controlled aquatic zones designed for privacy and winter comfort.",
        descAr: "مسابح معزولة تماماً بتحكم حراري يضمن الراحة في موسم الشتاء.",
      },
      {
        titleEn: "Keyless Self Check-In",
        titleAr: "دخول ذاتي بدون مفاتيح",
        descEn: "Verified guests receive encrypted pin codes directly upon booking confirmation.",
        descAr: "يستلم النزيل كود الدخول الرقمي المشفر فور تأكيد الحجز مباشرة عبر المنصة.",
      },
      {
        titleEn: "ZATCA Tax Compliance",
        titleAr: "فواتير زاتكا المعتمدة",
        descEn: "Automated electronic tax receipts generated instantly with cryptographic QR stamps.",
        descAr: "إصدار فوري للفواتير الضريبية المبسطة مع رمز الاستجابة السريعة المشفر.",
      },
    ],
  },
  "saudi-vacation-rental-licensing-guide-for-hosts": {
    id: "blog-02-host-compliance-guide",
    slug: "saudi-vacation-rental-licensing-guide-for-hosts",
    titleEn: "Host Compliance Guide: Ministry of Tourism Licensing & SAMA Fast Payouts in 2026",
    titleAr: "دليل المضيف الشامل: تراخيص وزارة السياحة وتسويات ساما السريعة لعام 2026",
    excerptEn: "Everything property owners need to know about registering short-term rentals, verifying national IDs with Nafath, and receiving 24-hour SARIE bank payouts.",
    excerptAr: "كل ما يحتاجه ملاك العقارات لمعرفة خطوات ترخيص بيوت العطلات، التحقق عبر نفاذ الوطني، واستلام المستحقات المالية خلال 24 ساعة عبر سريع.",
    contentHtmlEn: `<h2>Regulatory Standards for Private Vacation Stays in Saudi Arabia</h2>
<p>The Ministry of Tourism regulations establish clear consumer protections, quality guidelines, and digital safety standards across all short-term rental properties in the Kingdom.</p>
<h3>Host Advantages with QafNest</h3>
<p>QafNest simplifies compliance for hosts by automating guest identity verification via Nafath and Yaqeen, streamlining ZATCA e-invoicing, and executing verified host payouts within 24 hours of guest check-in via SAMA SARIE rail.</p>
<h3>Step-by-Step Licensing Checklist</h3>
<p>Register your national address, complete civil defense self-inspection, and submit your title deed or lease contract directly through the unified digital tourism platform.</p>`,
    contentHtmlAr: `<h2>معايير الامتثال التنظيمي لبيوت العطلات في المملكة</h2>
<p>وضعت اللوائح التنظيمية لوزارة السياحة إطاراً حازماً لحماية حقوق النزيل والمضيف، وضمان معايير السلامة والجودة والشفافية عبر كافة بيوت العطلات والشاليهات المرخصة في المملكة.</p>
<h3>مزايا المضيف مع قاف نست</h3>
<p>تتولى منصة قاف نست أتمتة عمليات التحقق الرقمي عبر الربط مع نفاذ ويقين، وإصدار فواتير زاتكا الإلكترونية المعتمدة، مع تنفيذ تسويات المضيفين البنكية خلال 24 ساعة من تسجيل دخول النزيل عبر نظام سريع البنكي التابع للبنك المركزي السعودي (ساما).</p>`,
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
    tags: ["Host Guide", "Licensing", "Tourism Ministry", "SAMA SARIE"],
    featured: true,
    keyFeatures: [
      {
        titleEn: "Tourism License Verification",
        titleAr: "توثيق رخصة وزارة السياحة",
        descEn: "Seamless verification under Ministry of Tourism license #73102999.",
        descAr: "توثيق آلي وفوري للرخص السياحية المعتمدة تحت إشراف الوزارة.",
      },
      {
        titleEn: "SAMA SARIE Fast Payouts",
        titleAr: "تسويات بنكية سريعة (ساما)",
        descEn: "Automated host payouts dispatched within 24 hours of guest check-in.",
        descAr: "تحويلات مصرفية فورية ومجدولة خلال 24 ساعة من وصول النزيل.",
      },
      {
        titleEn: "Nafath & Yaqeen ID Safety",
        titleAr: "تحقق أمني عبر نفاذ ויقين",
        descEn: "Encrypted biometric validation for hosts and guests.",
        descAr: "مطابقة آمنة ومشفرة لهويات الضيوف والمضيفين وفق الأنظمة الوطنية.",
      },
    ],
  },
  "obhur-private-beach-villas-jeddah-coastal-living": {
    id: "blog-03-jeddah-coastal-villas",
    slug: "obhur-private-beach-villas-jeddah-coastal-living",
    titleEn: "Coastal Escapes: Exploring Private Beach Villas in Obhur, Jeddah",
    titleAr: "ملاذات البحر الأحمر: استكشاف الفلل الشاطئية الخاصة في شرم أبحر بجدة",
    excerptEn: "Experience seaside luxury along the Red Sea with private boat docks, infinity edge pools, and unmatched sunset dining in North Obhur, Jeddah.",
    excerptAr: "عش تجربة الضيافة البحرية الفاخرة على ضفاف البحر الأحمر مع مراسي القوارب الخاصة والمسابح المطلة على شواطئ أبحر الشمالية في جدة.",
    contentHtmlEn: `<h2>Private Waterfront Stays in Obhur</h2>
<p>Obhur remains Jeddah's premier destination for marine lifestyle and coastal recreation. Discover top private villas with direct sea access, private boat slips, and bespoke family amenities.</p>
<h3>Why Choose an Obhur Waterfront Villa?</h3>
<p>From sunset boat charters to waterfront dining along Corniche Obhur, guests can enjoy a complete resort experience with absolute personal privacy.</p>`,
    contentHtmlAr: `<h2>الإقامات الشاطئية الخاصة في شرم أبحر</h2>
<p>يظل شرم أبحر الوجهة الساحلية الأكثر تميزاً في جدة لعشاق البحر والأنشطة البحرية. استكشف أرقى الفلل الشاطئية الخاصة التي توفر وصولاً مباشراً للبحر ومراسي خاصة لليخوت والقوارب.</p>
<h3>لماذا تختار فيلا شاطئية في أبحر؟</h3>
<p>استمتع برحلات القوارب البحرية عند الغروب وأشهى المأكولات البحرية على كورنيش أبحر، مع الجمع بين رفاهية المنتجعات وخصوصية البيت المستقل.</p>`,
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
    tags: ["Jeddah", "Obhur", "Beach Villas", "Red Sea"],
    featured: false,
    linkedPropertyId: "e3e3e3e3-3333-4333-8333-333333333333",
    linkedPropertyTitle: "Obhur Bay Beachfront Luxury Villa",
    keyFeatures: [
      {
        titleEn: "Direct Seafront Access",
        titleAr: "شاطئ رملي خاص",
        descEn: "Private beach frontage with private docks for boats and jet skis.",
        descAr: "وصول مباشر لشواطئ البحر الأحمر مع مرسى خاص لليخوت والقوارب.",
      },
      {
        titleEn: "Panoramic Red Sea Sunset",
        titleAr: "إطلالات غروب بانورامية",
        descEn: "Unobstructed sea vistas with private poolside relaxation decks.",
        descAr: "جلسات خارجية رحبة ومسابح لا متناهية على امتداد مياه البحر.",
      },
      {
        titleEn: "Absolute Family Privacy",
        titleAr: "خصوصية عائلية تامة",
        descEn: "Gated and secure compound with encrypted keyless smart access.",
        descAr: "مجمع خاص معزول بالكامل وبوابات دخول ذكية ومشفرة.",
      },
    ],
  },
  "agri-tourism-private-farms-weekend-escapes": {
    id: "blog-04-agri-tourism-farms",
    slug: "agri-tourism-private-farms-weekend-escapes",
    titleEn: "Agri-Tourism in Saudi Arabia: Why Private Farm Retreats are the New Family Favorite",
    titleAr: "السياحة الريفية في السعودية: لماذا أصبحت المزارع الخاصة الوجهة المفضلة للعائلات؟",
    excerptEn: "From organic date orchards in Al-Qassim to heritage estates in Al-Kharj, private farm rentals offer authentic heritage, fresh air, and abundant space for gatherings.",
    excerptAr: "من بساتين النخيل العضوية في القصيم إلى المزارع التراثية في الخرج، تمنح المزارع الخاصة العائلات تجربة طبيعية أصيلة ومساحات واسعة للاجتماعات.",
    contentHtmlEn: `<h2>Rediscovering Nature Through Private Farm Stays</h2>
<p>Agri-tourism is rapidly emerging as one of the fastest-growing vacation segments in Saudi Arabia. Families enjoy walking through palm groves, fresh organic produce, and open-air majlis setups.</p>`,
    contentHtmlAr: `<h2>إعادة الاتصال بالطبيعة عبر إقامات المزارع الخاصة</h2>
<p>تشهد السياحة الزراعية والريفية إقبالاً متزايداً في مختلف مناطق المملكة، حيث تبحث العائلات عن متنفس طبيعي وسط مزارع النخيل ومساحات الخضرة والهدوء بعيداً عن صخب المدن.</p>`,
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
    tags: ["Agri-Tourism", "Farms", "Family Gatherings", "Al-Kharj"],
    featured: false,
    keyFeatures: [
      {
        titleEn: "Expansive Green Lawns",
        titleAr: "مسطحات خضراء شاسعة",
        descEn: "Extensive palm estates and outdoor seating for large family gatherings.",
        descAr: "مزارع نخيل ممتدة ومجالس مفتوحة تناسب الاجتماعات العائلية الكبرى.",
      },
      {
        titleEn: "Authentic Saudi Heritage",
        titleAr: "طراز معماري تراثي",
        descEn: "Traditional architecture paired with modern air-conditioned amenities.",
        descAr: "تصاميم طينية تراثية أصيلة ومجهزة بأحدث وسائل التبريد والراحة.",
      },
    ],
  },
  "alula-desert-glamping-luxury-camps-stargazing": {
    id: "blog-05-alula-desert-glamping",
    slug: "alula-desert-glamping-luxury-camps-stargazing",
    titleEn: "Under the Desert Stars: The Ultimate Guide to Luxury Glamping Camps in AlUla",
    titleAr: "تحت سماء الصحراء: الدليل المتكامل للمخيمات الفاخرة وتأمل النجوم في العلا",
    excerptEn: "Immerse yourself in AlUla's awe-inspiring sandstone canyons and stargazing landscapes with fully serviced luxury desert camps.",
    excerptAr: "انغمس في سحر جبال العلا الرملية وتأمل النجوم اللامعة مع أفضل المخيمات الصحراوية الفاخرة والمخدومة بالكامل.",
    contentHtmlEn: `<h2>Experiencing AlUla in Ultimate Desert Comfort</h2>
<p>AlUla represents the pinnacle of Saudi Arabia's cultural tourism. Luxury glamping camps offer guests the romance of traditional desert camping coupled with premium bedding, private en-suite amenities, and bespoke campfire dining.</p>`,
    contentHtmlAr: `<h2>تجربة العلا بأقصى درجات الراحة الصحراوية</h2>
<p>تعتبر العلا جوهرة السياحة الثقافية والتراثية في المملكة. وتوفر المخيمات الفاخرة للزوار تجربة فريدة تجمع بين روح التخييم العربي الأصيل وأرقى الخدمات الفندقية الحديثة.</p>`,
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
    tags: ["AlUla", "Glamping", "Desert Camps", "Stargazing"],
    featured: false,
    keyFeatures: [
      {
        titleEn: "Dark-Sky Stargazing",
        titleAr: "تأمل النجوم في سماء صافية",
        descEn: "Zero light pollution for crystal-clear celestial nightscapes.",
        descAr: "رؤية ساحرة للنجوم ومجرة درب التبانة بعيداً عن أضواء المدن.",
      },
      {
        titleEn: "Geodesic Luxury Domes",
        titleAr: "قباب جيوديسية مكيّفة",
        descEn: "Climate-controlled dome suites with panoramic star views.",
        descAr: "أجنحة فندقية مكيفة ذات أسقف بانورامية لمشاهدة السماء من السرير.",
      },
    ],
  },
};

// Aliases for user-friendly or legacy slugs
BLOG_POST_DETAILS["jeddah-beachfront-villas-guide"] = BLOG_POST_DETAILS["obhur-private-beach-villas-jeddah-coastal-living"];

export function getDefaultBlogPost(slug: string): BlogPostDetail {
  if (BLOG_POST_DETAILS[slug]) {
    return BLOG_POST_DETAILS[slug];
  }
  return {
    id: slug,
    slug,
    titleEn: "Article Not Found",
    titleAr: "المقال غير متوفر",
    excerptEn: "This article is currently unavailable or has been removed.",
    excerptAr: "هذا المقال غير متاح حالياً أو تمت إزالته.",
    contentHtmlEn: `<p>The requested article could not be located. Explore our latest guides below.</p>`,
    contentHtmlAr: `<p>تعذر العثور على المقال المطلوب. تصفح أحدث أدلتنا السياحية أدناه.</p>`,
    contentEn: [],
    contentAr: [],
    category: "chalets",
    categoryNameEn: "General",
    categoryNameAr: "عام",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&fit=crop",
    author: "QafNest",
    authorRoleEn: "Editorial",
    authorRoleAr: "فريق التحرير",
    date: new Date().toISOString().split("T")[0],
    readTimeEn: "1 min",
    readTimeAr: "دقيقة واحدة",
  };
}

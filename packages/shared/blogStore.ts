import path from "path";
import { BlogSeoConfig, SharedBlogPost } from "./blogTypes";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

export type { BlogSeoConfig, SharedBlogPost };

const BLOGS_FILE_NAME = "cms-blogs.json";

export const INITIAL_SHARED_BLOGS: SharedBlogPost[] = [
  {
    id: "blog-1",
    slug: "smart-living-riyadh",
    titleEn: "The Rise of Smart Living: Why Keyless Chalets Are Redefining Saudi Getaways",
    titleAr: "عصر الإقامة الذكية: كيف تعيد الشاليهات ذات الدخول الذكي صياغة العطلات في السعودية",
    excerptEn: "Discover how automated PIN locks, instantaneous verification, and private pools in Riyadh's Al-Malqa and Al-Ammariyah are transforming weekend stays into seamless, keyless luxuries.",
    excerptAr: "اكتشف كيف تُحدث الأقفال الذكية المؤتمتة والتوثيق الفوري والمسابح الخاصة في حي الملقا والعمارية بالرياض ثورةً في عطلات نهاية الأسبوع بخصوصية فائقة.",
    contentHtmlEn: `
      <h2>The Shift Toward Contactless Hospitality</h2>
      <p>Gone are the days when guests had to wait at the gate for a property caretaker to deliver a physical brass key. In 2026, premium vacationers throughout the Kingdom expect friction-free, instantaneous access.</p>
      <p>With integrated smart door locks and real-time OTP validation, verified guests receive an encrypted PIN code 30 minutes before check-in. The door unlocks effortlessly, setting the stage for an extraordinary private getaway.</p>
      
      <h3>1. Supreme Privacy and Absolute Freedom</h3>
      <p>Saudi families deeply value serenity and seclusion. Automated keyless entry ensures total privacy without intrusive check-in handoffs. Your family walks straight into an air-conditioned, pre-cooled luxury chalet.</p>

      <h3>2. Bank-Grade Security & Instant Verification</h3>
      <p>Coupling smart door systems with official identity verification (Nafath and Yaqeen) creates trust. Hosts know authenticated guests are enjoying their property, while guests enjoy peace of mind with 24/7 digital support.</p>

      <h3>3. Perfect for Midweek Day-Use and Weekend Retreats</h3>
      <p>Whether booking a quick 12-hour daytime gathering or a full three-day family reunion, smart units accommodate flexible arrival hours without scheduling coordination headaches.</p>
    `,
    contentHtmlAr: `
      <h2>التحول نحو الضيافة الرقمية بدون تلامس</h2>
      <p>انتهت أيام الانتظار عند البوابة في انتظار الحارس لتسليم المفاتيح التقليدية. في عام 2026، يتطلع رواد الشاليهات والمصايف في المملكة إلى تجربة رقمية فورية خالية من أي تعقيد.</p>
      <p>مع الأقفال الذكية المتصلة والتحقق الفوري عبر رمز OTP، يستلم الضيف الموثق رمز دخول مشفر قبل 30 دقيقة من موعد تسجيل الدخول، ليفتح الباب بسلاسة وتبدأ إجازته الخاصة.</p>

      <h3>١. خصوصية مطلقة وراحة تامة للعائلات</h3>
      <p>تولي العائلات السعودية أهمية قصوى للخصوصية والهدوء. يضمن الدخول الذكي دخولاً مستقلاً تماماً دون الحاجة لمقابلة أي شخص، لتدخل عائلتك مباشرة إلى شاليه مجهز ومكيف بأعلى المعايير.</p>

      <h3>٢. أمان معتمد وتوثيق وطني موثوق</h3>
      <p>ربط أنظمة الدخول الإلكترونية بالتحقق الرسمي عبر نفاذ ويقين يعزز الثقة المتبادلة بين المضيف والضيف، مما يوفر بيئة آمنة مدعومة بخدمة عملاء هاتفية على مدار 24 ساعة.</p>

      <h3>٣. مثالي للاستخدام النهاري والعطلات الأسبوعية</h3>
      <p>سواء كنت تخطط لجمعة عائلية نهارية لمدة 12 ساعة أو إقامة نهاية أسبوع كاملة، تمنحك الأقفال الذكية مرونة الوصول في أي وقت دون عناء التنسيق الميداني.</p>
    `,
    category: "chalet",
    categoryNameEn: "Chalets & Smart Living",
    categoryNameAr: "شاليهات وإقامة ذكية",
    tags: ["Smart Lock", "Riyadh", "Chalets", "Saudi Vision 2030", "Private Pool"],
    coverImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    author: "Faisal Al-Otaibi",
    authorRoleEn: "Senior Travel & Hospitality Specialist",
    authorRoleAr: "خبير أول في قطاع الضيافة والسياحة",
    readTimeEn: "5 min read",
    readTimeAr: "٥ دقائق قراءة",
    status: "published",
    featured: true,
    date: "2026-11-10",
    views: 1420,
    createdAt: "2026-11-10T10:00:00Z",
    updatedAt: "2026-11-12T12:00:00Z",
    seo: {
      metaTitleEn: "Smart Living: Keyless Luxury Chalets in Riyadh | QafNest",
      metaTitleAr: "الإقامة الذكية: شاليهات فاخرة بدخول ذكي في الرياض | قاف نست",
      metaDescriptionEn: "Discover top keyless entry chalets with private pools in Riyadh. Learn how QafNest delivers instant PIN access and 100% verified security.",
      metaDescriptionAr: "استكشف أفضل شاليهات الرياض المزودة بأنظمة الدخول الذكي والمسبح الخاص. تعرف على تجربة قاف نست للوصول الفوري والخصوصية التامة.",
      keywords: ["Riyadh Chalet", "Smart Lock Stays", "شاليهات الرياض", "دخول ذكي", "شاليه مسبح خاص"],
      canonicalUrl: "https://qafnest.com/blog/smart-living-riyadh",
      ogImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    },
  },
  {
    id: "blog-2",
    slug: "weekend-escapes-diriyah-ammariyah",
    titleEn: "5 Elite Weekend Getaways in Diriyah and Al-Ammariyah",
    titleAr: "٥ ملاذات استثنائية لعطلة نهاية الأسبوع في الدرعية والعمارية",
    excerptEn: "Escape the city bustle and immerse yourself in the desert heritage of historic Diriyah and the serene valleys of Al-Ammariyah with private heated pools and stargazing cabanas.",
    excerptAr: "اهرب من صخب المدينة واستمتع بجمال التراث في الدرعية وهدوء أودية العمارية مع شاليهات مجهزة بمسابح دافئة وجلسات خارجية لمشاهدة النجوم.",
    contentHtmlEn: `
      <h2>The Charm of Historic Najdi Elegance</h2>
      <p>Just a short drive from central Riyadh, Diriyah and Al-Ammariyah combine ancestral Saudi mud-brick architectural grandeur with modern boutique resort luxuries.</p>
      <p>Whether looking for an infinity pool overlooking dramatic limestone cliffs or a private farmhouse surrounded by date palms, these weekend sanctuaries offer unmatched relaxation.</p>
    `,
    contentHtmlAr: `
      <h2>سحر العمارة النجدية ودفء الطبيعة</h2>
      <p>على بعد دقائق معدودة من قلب الرياض، تجمع الدرعية والعمارية بين أصالة التراث النجدي وفخامة المنتجعات الحديثة المتكاملة.</p>
      <p>سواء كنت تبحث عن مسبح مطل على الهضاب الطبيعية أو مزرعة ريفية تحيط بها أشجار النخيل، تقدم هذه الوجهات تجربة استرخاء لا تُضاهى.</p>
    `,
    category: "villa",
    categoryNameEn: "Luxury Escapes",
    categoryNameAr: "ملاذات فاخرة",
    tags: ["Diriyah", "Al-Ammariyah", "Heritage", "Private Villa"],
    coverImage: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    author: "Noura Al-Dosari",
    authorRoleEn: "Culture & Architecture Curator",
    authorRoleAr: "باحثة في العمارة والتراث السعودي",
    readTimeEn: "4 min read",
    readTimeAr: "٤ دقائق قراءة",
    status: "published",
    featured: true,
    date: "2026-11-08",
    views: 980,
    createdAt: "2026-11-08T09:00:00Z",
    updatedAt: "2026-11-12T12:00:00Z",
    seo: {
      metaTitleEn: "Top Weekend Stays in Diriyah & Al-Ammariyah | QafNest",
      metaTitleAr: "أفضل شاليهات وفلل الدرعية والعمارية | قاف نست",
      metaDescriptionEn: "Explore exclusive private villas and boutique heritage chalets in Diriyah and Al-Ammariyah on QafNest.",
      metaDescriptionAr: "احجز أفضل الفلل والشاليهات الخاصة في الدرعية والعمارية واستمتع بأجمل إطلالات وادي حنيفة ومسابح الاسترخاء.",
      keywords: ["Diriyah stays", "Al-Ammariyah chalets", "شاليهات العمارية", "شاليهات الدرعية", "فلل خاصة بالرياض"],
      canonicalUrl: "https://qafnest.com/blog/weekend-escapes-diriyah-ammariyah",
      ogImage: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    },
  },
  {
    id: "blog-3",
    slug: "host-guide-revenue-optimization",
    titleEn: "Host Playbook: How Day-Use Slots and ZATCA E-Invoicing Boost Revenue by 38%",
    titleAr: "دليل المضيف الذكي: كيف تحقق الفترات النهارية والفوترة الإلكترونية زيادة بنسبة ٣٨٪ في العوائد",
    excerptEn: "Maximize chalet occupancy by offering dual-slot booking (Daytime vs Overnight) and building high trust with automated ZATCA-compliant invoicing and next-day SARIE bank payouts.",
    excerptAr: "ضاعف إشغال شاليهك أو منتجعك من خلال تفعيل نظام الفترات المزدوجة (فترة نهارية وفترة مبيت) وبناء ثقة متينة عبر الفواتير الإلكترونية المعتمدة والتحويل البنكي السريع.",
    contentHtmlEn: `
      <h2>The Untapped Potential of 12-Hour Day-Use Bookings</h2>
      <p>Many traditional chalets sit vacant on weekdays and early hours. By enabling flexible 12-hour daytime slots for private family lunches, birthdays, and business retreats, top hosts increase overall property yield by up to 38%.</p>
      <h3>ZATCA Phase-2 Tax Automation</h3>
      <p>Operating transparently with cryptographic QR invoices builds guest confidence and protects hosts against manual tax accounting audits.</p>
    `,
    contentHtmlAr: `
      <h2>القوة الكامنة في حجوزات الفترات النهارية (١٢ ساعة)</h2>
      <p>تبقى الكثير من الشاليهات شاغرة خلال أيام الأسبوع وساعات الصباح. من خلال إتاحة فترات نهارية مرنة للمناسبات العائلية واجتماعات العمل الخاصة، يحقق المضيفون قفزة في الدخل تصل إلى 38%.</p>
      <h3>أتمتة الفواتير الضريبية المعتمدة من زاتكا</h3>
      <p>إصدار الفواتير الإلكترونية الفورية المشفرة برمز QR يمنح الضيوف الثقة الكاملة ويحمي المضيف من أي تعقيدات محاسبية.</p>
    `,
    category: "host-tips",
    categoryNameEn: "Host Insights",
    categoryNameAr: "إرشادات المضيفين",
    tags: ["Host Tips", "ZATCA", "Revenue Optimization", "SARIE Payouts"],
    coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    author: "Tariq Al-Mansoor",
    authorRoleEn: "Head of Host Partner Growth",
    authorRoleAr: "مدير نمو شركاء الضيافة والمضيفين",
    readTimeEn: "6 min read",
    readTimeAr: "٦ دقائق قراءة",
    status: "published",
    featured: false,
    date: "2026-11-05",
    views: 750,
    createdAt: "2026-11-05T08:00:00Z",
    updatedAt: "2026-11-12T12:00:00Z",
    seo: {
      metaTitleEn: "Host Guide: Boost Chalet Revenue with Day-Use & Smart Access | QafNest",
      metaTitleAr: "دليل المضيفين: مضاعفة دخل الشاليهات بالفترات النهارية والفوترة الآلية | قاف نست",
      metaDescriptionEn: "A complete blueprint for Saudi property hosts to maximize occupancy, streamline ZATCA VAT invoicing, and ensure 24-hour payouts.",
      metaDescriptionAr: "دليل متكامل لمضيفي الشاليهات في السعودية لرفع نسب الإشغال وأتمتة الفوترة الضريبية وضمان استلام الأرباح خلال 24 ساعة.",
      keywords: ["Chalet hosting tips", "Saudi vacation rental", "إدارة الشاليهات", "عوائد الشاليهات", "تحويلات سريعة للمضيف"],
      canonicalUrl: "https://qafnest.com/blog/host-guide-revenue-optimization",
      ogImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    },
  },
];

export function getAllBlogs(): SharedBlogPost[] {
  return readSharedJsonFile<SharedBlogPost[]>(
    BLOGS_FILE_NAME,
    () => INITIAL_SHARED_BLOGS,
    (parsed) => {
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as SharedBlogPost[];
      }
      return INITIAL_SHARED_BLOGS;
    },
    [path.resolve(__dirname, "./data")]
  );
}

export function getBlogBySlug(slug: string): SharedBlogPost | null {
  const blogs = getAllBlogs();
  return blogs.find((b) => b.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export function getBlogById(id: string): SharedBlogPost | null {
  const blogs = getAllBlogs();
  return blogs.find((b) => b.id === id) || null;
}

export function saveBlog(post: SharedBlogPost): boolean {
  const blogs = [...getAllBlogs()];
  const existingIndex = blogs.findIndex((b) => b.id === post.id);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    blogs[existingIndex] = {
      ...post,
      updatedAt: now,
    };
  } else {
    blogs.unshift({
      ...post,
      createdAt: post.createdAt || now,
      updatedAt: now,
    });
  }

  return writeSharedJsonFile(BLOGS_FILE_NAME, blogs);
}

export function deleteBlog(id: string): boolean {
  const filtered = getAllBlogs().filter((b) => b.id !== id);
  return writeSharedJsonFile(BLOGS_FILE_NAME, filtered);
}

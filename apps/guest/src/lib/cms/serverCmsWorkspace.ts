import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";

export interface PublicLocalizedText {
  en: string;
  ar: string;
}

export interface PublicCmsFaq {
  id: string;
  category?: string;
  question: PublicLocalizedText;
  answer: PublicLocalizedText;
  enabled: boolean;
  order: number;
  updatedAt?: string;
}

export interface PublicCmsLegalPage {
  id: string;
  title: PublicLocalizedText;
  slug: string;
  content: PublicLocalizedText;
  showSection: boolean;
  metaTitle?: PublicLocalizedText;
  metaDescription?: PublicLocalizedText;
  canonicalUrl?: string;
  updatedAt?: string;
}

export interface PublicCmsNavLink {
  id: string;
  title: PublicLocalizedText;
  link: string;
  showInNavbar: boolean;
  showInFooter: boolean;
  openInNewTab: boolean;
  order: number;
}

export interface PublicCmsSocialLink {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface PublicCmsContactUs {
  phone?: string;
  address?: PublicLocalizedText;
  supportEmail?: string;
  generalEmail?: string;
  businessEmail?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

export interface PublicCmsSiteSeo {
  siteName?: PublicLocalizedText;
  defaultTitle?: PublicLocalizedText;
  defaultDescription?: PublicLocalizedText;
  keywords?: PublicLocalizedText;
  openGraph?: {
    title?: PublicLocalizedText;
    description?: PublicLocalizedText;
    url?: string;
    type?: string;
    image?: string;
  };
  twitter?: {
    handle?: string;
    card?: string;
    title?: PublicLocalizedText;
    description?: PublicLocalizedText;
  };
  socialProfiles?: Record<string, string>;
  robots?: {
    noIndex?: boolean;
    noFollow?: boolean;
    customRules?: string;
    sitemapEnabled?: boolean;
  };
}

export interface PublicCmsGtm {
  enabled: boolean;
  gtmId: string;
}

export interface PublicCmsAboutUs {
  content?: PublicLocalizedText;
  metaTitle?: PublicLocalizedText;
  metaDescription?: PublicLocalizedText;
  keywords?: PublicLocalizedText;
  ogImage?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}

export interface PublicCmsDestination {
  id: string;
  city: string;
  name: PublicLocalizedText;
  subtitle?: PublicLocalizedText;
  image: string;
  isMonthly?: boolean;
  badgeText?: string;
  enabled: boolean;
  order: number;
  updatedAt?: string;
}

export interface PublicCmsWorkspace {
  faqs: PublicCmsFaq[];
  legalPages: PublicCmsLegalPage[];
  navigationLinks: PublicCmsNavLink[];
  socialLinks: PublicCmsSocialLink[];
  destinations: PublicCmsDestination[];
  categories: Array<{
    id: string;
    name: PublicLocalizedText;
    slug: string;
    description?: PublicLocalizedText;
  }>;
  globals: {
    contactUs?: PublicCmsContactUs;
    siteSeo?: PublicCmsSiteSeo;
    gtm?: PublicCmsGtm;
    aboutUs?: PublicCmsAboutUs;
  };
}

const LEGACY_STUBS = [
  "QafNest complies with Saudi Personal Data Protection Law (PDPL) to safeguard guest and host information.",
  "These terms govern bookings, host listings, payments, and dispute resolution on QafNest.",
];

export function isLegacyLegalStub(html?: string): boolean {
  const clean = String(html || "").trim();
  if (!clean) return true;
  return clean.length < 240 && LEGACY_STUBS.some((s) => clean.includes(s));
}


export const DEFAULT_PUBLIC_FAQS: PublicCmsFaq[] = [
      {
        id: "faq-1",
        category: "booking",
        question: {
          en: "How does QafNest work and is it licensed by the Ministry of Tourism?",
          ar: "ما هي منصة قاف نست وهل هي مرخصة رسمياً من وزارة السياحة؟",
        },
        answer: {
          en: "QafNest is an electronic vacation rental platform licensed by the Saudi Ministry of Tourism (License #73102999) connecting Guests with verified Hosts across chalets, villas, resorts (istirahat), apartments, farms, and desert camps. QafNest acts strictly as an authorized digital intermediary ensuring identity verification, secure payments, and compliant tax invoicing.",
          ar: "منصة قاف نست هي منصة إلكترونية سعودية مرخصة من وزارة السياحة (ترخيص رقم 73102999) تعمل كوسيط تقني يربط الضيوف بالمضيفين المعتمدين لحجز الشاليهات والفلل والاستراحات والشقق والمزارع والمخيمات، مع ضمان توثيق الهوية وأمان المدفوعات والفوترة الضريبية.",
        },
        enabled: true,
        order: 1,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-2",
        category: "booking",
        question: {
          en: "How do I confirm my reservation and verify its status?",
          ar: "كيف يُؤكد الحجز وكيف أتحقق من حالته؟",
        },
        answer: {
          en: "No booking is confirmed until the required payment or deposit is completed electronically through supported channels. Once paid, your booking is confirmed immediately—open 'My Bookings' anytime to inspect status, stay details, and your official receipt.",
          ar: "لا يُعد أي حجز مؤكداً نهائياً إلا بعد سداد قيمة الحجز إلكترونياً عبر وسائل الدفع المتاحة في المنصة. وبمجرد إتمام السداد يظهر الحجز فوراً في صفحة 'حجوزاتي' متضمناً التفاصيل والفاتورة الرسمية.",
        },
        enabled: true,
        order: 2,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-3",
        category: "booking",
        question: {
          en: "Why is National ID / Iqama verification required when booking?",
          ar: "لماذا يعد توثيق الهوية الوطنية أو الإقامة ورقم الجوال إلزامياً؟",
        },
        answer: {
          en: "Under Saudi hospitality and public security regulations, guest and host identities are validated via trusted national registries (Elm Yaqeen and Nafath) alongside mobile OTP confirmation to keep residential stays safe for families and property owners.",
          ar: "التزاماً بلوائح وزارة السياحة والضوابط الأمنية في المملكة، يتم التحقق من هوية النزيل عبر المنصات الوطنية المعتمدة (نفاذ ويقين) وتأكيد رقم الجوال لضمان بيئة إقامة آمنة وموثوقة للضيوف والمضيفين.",
        },
        enabled: true,
        order: 3,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-4",
        category: "booking",
        question: {
          en: "What are the check-in/out times, and what if I arrive late?",
          ar: "ما هي أوقات الدخول والخروج، وماذا أفعل إذا تأخرت عن الوصول؟",
        },
        answer: {
          en: "Check-in and check-out times are set per property on the listing details page (commonly 16:00 check-in and 12:00 noon check-out unless stated otherwise). If your arrival is delayed beyond the scheduled entry window, you must contact the Host directly in advance—failing to arrive without notice remains subject to our non-refundable policy.",
          ar: "تُحدد أوقات الدخول والخروج من قِبل المضيف وتظهر بوضوح في صفحة العقار قبل الدفع (وعادة تكون الساعة ١٦:٠٠ للدخول و١٢:٠٠ ظهراً للمغادرة). في حال تأخرك عن موعد الوصول، يجب التواصل مباشرة مع المضيف لإبلاغه مسبقاً.",
        },
        enabled: true,
        order: 4,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-5",
        category: "booking",
        question: {
          en: "How do I find the property location and contact the Host?",
          ar: "كيف أعرف موقع العقار وأتواصل مع المضيف قبل الحجز وبعده؟",
        },
        answer: {
          en: "Before booking, use the inquiry options available on the unit page. After confirmation, visit 'My Bookings', open your reservation card, and view Host contact details alongside directions/location coordinates to navigate smoothly to the property.",
          ar: "قبل إتمام الحجز يمكنك الاستفسار عبر خيارات التواصل في صفحة الوحدة. وبعد تأكيد الحجز، انتقل إلى 'حجوزاتي' لعرض بيانات التواصل مع المضيف وموقع العقار وإحداثيات الوصول بدقة.",
        },
        enabled: true,
        order: 5,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-6",
        category: "deposit",
        question: {
          en: "When, how, and to whom is the security deposit paid and returned?",
          ar: "متى ولمن يُدفع مبلغ التأمين وكيف يتم استرجاعه عند المغادرة؟",
        },
        answer: {
          en: "Security deposit amounts vary by unit and are displayed transparently on the property page. Where applicable, the deposit is typically paid directly on-site to the Host (or their representative) prior to entry. Upon checkout, the Host inspects the property condition and returns the deposit in full provided there are no damages or policy violations.",
          ar: "تختلف قيمة مبلغ التأمين من وحدة لأخرى وتُعرض بوضوح في تفاصيل العقار، ويُسلّم مبلغ التأمين غالباً للمضيف مباشرة عند الوصول وقبل استلام الوحدة. عند المغادرة يقوم المضيف بفحص العقار وإعادة كامل التأمين فوراً ما لم توجد تلفيات أو مخالفات.",
        },
        enabled: true,
        order: 6,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-7",
        category: "smartlock",
        question: {
          en: "How do I receive my Smart Lock PIN for Self Check-In properties?",
          ar: "كيف أحصل على رمز القفل الذكي في وحدات الدخول الذاتي؟",
        },
        answer: {
          en: "For units offering Keyless Self Check-In, once payment is confirmed the Host manually configures your personal Smart Lock PIN, which appears inside 'My Bookings' prior to arrival. Simply enter this code on the unit door keypad.",
          ar: "في العقارات المزودة بخدمة الدخول الذاتي، يقوم المضيف بتعيين رمز القفل الذكي الخاص بك يدوياً بعد تأكيد الدفع ليظهر مباشرة في صفحة 'حجوزاتي' قبل موعد الدخول.",
        },
        enabled: true,
        order: 7,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-8",
        category: "smartlock",
        question: {
          en: "Can I check in late at night with Self Check-In?",
          ar: "هل يمكنني تسجيل الدخول في وقت متأخر ليلاً عبر الدخول الذاتي؟",
        },
        answer: {
          en: "Yes. Keyless Entry listings allow arrival anytime after your scheduled check-in hour once your Host assigns your access PIN, provided you notify the Host beforehand of your late arrival time.",
          ar: "نعم، في عقارات الدخول الذاتي يمكنك الوصول في أي ساعة بعد موعد الدخول المحدد فور تزويدك برمز القفل الذكي من المضيف، مع ضرورة تنبيه المضيف مسبقاً بموعد وصولك المتأخر.",
        },
        enabled: true,
        order: 8,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-9",
        category: "cancellations",
        question: {
          en: "Can a confirmed booking be cancelled, postponed, or refunded?",
          ar: "هل يمكن إلغاء الحجز أو تأجيله أو استرداد المبلغ بعد الدفع؟",
        },
        answer: {
          en: "The reservation cannot be cancelled or postponed. Once payment is completed on QafNest, reservations are strictly final and non-refundable (0%). Please verify dates, guest capacity, and house rules before payment. Exceptional verified cases of Host-side unit unavailability are handled directly by QafNest Operations.",
          ar: "لا يمكن إلغاء الحجز أو تأجيله. بمجرد إتمام السداد عبر قاف نست يصبح الحجز نهائياً وغير قابل للاسترداد (٠٪)، لذا يرجى مراجعة التواريخ والشروط بدقة قبل الدفع. وتتعامل إدارة العمليات مباشرة مع الحالات النادرة الموثقة لتعذر تسليم الوحدة من قِبل المضيف.",
        },
        enabled: true,
        order: 9,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-10",
        category: "deposit",
        question: {
          en: "What happens if property damages occur during a stay?",
          ar: "ما الإجراء في حال حدوث تلفيات أو أضرار داخل العقار أثناء الإقامة؟",
        },
        answer: {
          en: "Guests must maintain cleanliness, observe quiet hours/family rules, and protect property contents. Any verified direct damages or missing items caused during the stay are assessed against the security deposit or billed to the Guest via formal damage settlement links under QafNest's Host Protection framework.",
          ar: "يلتزم الضيف بالمحافظة على نظافة ومحتويات الوحدة والالتزام بالذوق العام، ويتحمل المسؤولية المادية عن أي تلفيات مباشرة، حيث تُخصم من مبلغ التأمين أو تُسوى عبر فواتير برنامج حماية المضيف الموثقة.",
        },
        enabled: true,
        order: 10,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-11",
        category: "payments",
        question: {
          en: "What electronic payment methods are supported on QafNest?",
          ar: "ما هي وسائل الدفع الإلكترونية المدعومة في قاف نست؟",
        },
        answer: {
          en: "QafNest supports Mada, Visa, Mastercard, Apple Pay, STC Pay, SADAD / direct Saudi bank wire transfers for helpline bookings, and Sharia-compliant installment plans via Tabby and Tamara where enabled at checkout.",
          ar: "ندعم الدفع الإلكتروني الآمن عبر بطاقات مدى، فيزا، ماستركارد، أبل باي (Apple Pay)، STC Pay، سداد/التحويل البنكي للحجوزات الهاتفية، وخدمات التقسيط المتوافقة مع الشريعة عبر تابي وتمارا عند توفرها.",
        },
        enabled: true,
        order: 11,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-12",
        category: "payments",
        question: {
          en: "Are displayed prices inclusive of 15% ZATCA VAT and tax invoices?",
          ar: "هل تشمل الأسعار ضريبة القيمة المضافة ١٥٪ وكيف أحصل على الفاتورة الضريبية؟",
        },
        answer: {
          en: "Yes. All final checkout totals transparently display applicable 15% VAT in accordance with ZATCA regulations. You can view and print your Phase-2 compliant e-invoice containing the encrypted TLV QR code directly from 'My Bookings'.",
          ar: "نعم، تشمل الأسعار الإجمالية عند الدفع ضريبة القيمة المضافة ١٥٪ بكل شفافية دون رسوم خفية، وتستطيع استعراض وطباعة فاتورتك الضريبية المعتمدة من هيئة الزكاة المزودة برمز QR من صفحة 'حجوزاتي'.",
        },
        enabled: true,
        order: 12,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-13",
        category: "hosts",
        question: {
          en: "How do Hosts list a property, receive payouts, and use Host Protection?",
          ar: "كيف يسجل المضيف عقاره، ومتى يستلم المستحقات، وما هو برنامج حماية المضيف؟",
        },
        answer: {
          en: "Owners or authorized sublessors with a valid Ministry of Tourism license can list furnished, clean properties with real photos via the Host Portal (in English & Arabic). Net earnings (after standard platform commission & VAT) transfer to the Host's verified Saudi IBAN within 24–48 hours of stay settlement, and confirmed stays qualify for Host Protection if damage proof (photos/videos and repair invoices) is submitted within 48 hours of checkout.",
          ar: "يمكن للمالك أو المستثمر المفوض تسجيل عقاره المفروش والجاهز بصور واقعية ورقم ترخيص وزارة السياحة عبر بوابة المضيفين. تُحول المستحقات الصافية بعد عمولة المنصة إلى حساب الآيبان السعودي المعتمد خلال ٢٤ إلى ٤٨ ساعة من التسوية، كما يغطي برنامج حماية المضيف التلفيات المباشرة الموثقة بالصور والفواتير خلال ٤٨ ساعة من المغادرة.",
        },
        enabled: true,
        order: 13,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },
      {
        id: "faq-14",
        category: "helpline",
        question: {
          en: "How can Guests or Hosts reach Customer Support for urgent assistance?",
          ar: "كيف أتواصل مع خدمة العملاء للمساعدة الفورية أو الحجز عبر الهاتف؟",
        },
        answer: {
          en: "Our support team is available 24/7 via phone and WhatsApp on 0576707709 or email at support@qafnest.com to help verify bookings, coordinate arrival issues, assist Hosts, or arrange helpline reservations.",
          ar: "فريق خدمة العملاء متاح على مدار الساعة عبر الاتصال والواتساب على الرقم 0576707709 أو البريد الإلكتروني support@qafnest.com لمساعدة الضيوف والمضيفين وإتمام حجوزات الهاتف الفورية.",
        },
        enabled: true,
        order: 14,
        updatedAt: "2026-03-31T00:00:00.000Z",
      },

];

export async function getServerPublicCmsWorkspace(): Promise<PublicCmsWorkspace> {
  try {
    const raw = await hydrateSharedJsonFile<Record<string, unknown>>(
      "cms-workspace-v2.json",
      () => ({})
    );
    const globals = (raw?.globals && typeof raw.globals === "object"
      ? raw.globals
      : {}) as Record<string, unknown>;

    const rawGtm = (globals.gtm && typeof globals.gtm === "object"
      ? globals.gtm
      : {}) as Record<string, unknown>;
    const gtmId = String(rawGtm.gtmId || "").trim();
    const gtmEnabled = Boolean(rawGtm.enabled) && /^GTM-[A-Z0-9]+$/i.test(gtmId);

    return {
      faqs: (() => {
        const stored = Array.isArray(raw?.faqs) ? (raw.faqs as PublicCmsFaq[]) : [];
        if (stored.length >= 10) return stored;
        // Auto-upgrade and persist to Supabase if missing or legacy
        void persistSharedJsonFile("cms-workspace-v2.json", {
          ...(raw || {}),
          faqs: DEFAULT_PUBLIC_FAQS,
        }).catch(() => null);
        return DEFAULT_PUBLIC_FAQS;
      })(),
      legalPages: Array.isArray(raw?.legalPages)
        ? (raw.legalPages as PublicCmsLegalPage[])
        : [],
      navigationLinks: Array.isArray(raw?.navigationLinks)
        ? (raw.navigationLinks as PublicCmsNavLink[])
        : [],
      socialLinks: Array.isArray(raw?.socialLinks)
        ? (raw.socialLinks as PublicCmsSocialLink[])
        : [],
      destinations: Array.isArray(raw?.destinations)
        ? (raw.destinations as PublicCmsDestination[])
        : [],
      categories: Array.isArray(raw?.categories)
        ? (raw.categories as PublicCmsWorkspace["categories"])
        : [],
      globals: {
        contactUs:
          globals.contactUs && typeof globals.contactUs === "object"
            ? (globals.contactUs as PublicCmsContactUs)
            : undefined,
        siteSeo:
          globals.siteSeo && typeof globals.siteSeo === "object"
            ? (globals.siteSeo as PublicCmsSiteSeo)
            : undefined,
        gtm: {
          enabled: gtmEnabled,
          gtmId: gtmEnabled ? gtmId : "",
        },
        aboutUs:
          globals.aboutUs && typeof globals.aboutUs === "object"
            ? (globals.aboutUs as PublicCmsAboutUs)
            : undefined,
      },
    };
  } catch {
    return {
      faqs: [],
      legalPages: [],
      navigationLinks: [],
      socialLinks: [],
      destinations: [],
      categories: [],
      globals: {},
    };
  }
}

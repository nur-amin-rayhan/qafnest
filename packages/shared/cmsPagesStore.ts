import fs from "fs";
import path from "path";
import { QAFNEST_SUPPORT_CONTACT } from "./index";
import {
  CmsPageSection,
  CmsFaqItem,
  CmsContactInfo,
  CmsPageRecord,
} from "./cmsTypes";

export type { CmsPageSection, CmsFaqItem, CmsContactInfo, CmsPageRecord };

const DATA_DIR = path.resolve(__dirname, "./data");
const PAGES_FILE = path.join(DATA_DIR, "cms-pages.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const DEFAULT_CMS_PAGES: Record<string, CmsPageRecord> = {
  terms: {
    id: "terms",
    titleEn: "Terms & Conditions",
    titleAr: "الشروط والأحكام",
    subtitleEn: "User agreement, Guest & Host obligations, deposits, and legal framework governing QafNest under Saudi law.",
    subtitleAr: "اتفاقية الاستخدام والتزامات الضيوف والمضيفين والضمانات المالية المنظمة لمنصة قاف نست وفق أنظمة المملكة.",
    lastUpdated: "2026-11-14",
    sections: [
      {
        id: "platform-role",
        titleEn: "1. Binding Agreement & Intermediary Platform Role",
        titleAr: "١. الاتفاقية الملزمة ودور المنصة الوسيط",
        contentEn: "QafNest is a licensed Saudi digital hospitality marketplace (Ministry of Tourism License #73102999) connecting property owners and authorized operators (Hosts) with travelers seeking short-term residential stays across chalets, villas, resorts (istirahat), apartments, farms, and camps (Guests). QafNest does not own or physically manage listed accommodations; each confirmed booking creates a direct accommodation agreement between Guest and Host.",
        contentAr: "قاف نست منصة إلكترونية سعودية مرخصة من وزارة السياحة (ترخيص رقم 73102999) تعمل كوسيط تقني يربط بين المضيفين وأصحاب الوحدات المرخصة والضيوف الباحثين عن إقامات قصيرة في الشاليهات والفلل والاستراحات والشقق والمزارع والمخيمات. لا تمتلك المنصة العقارات المعروضة أو تديرها مباشرة، وينشئ كل حجز مؤكد عقد إقامة ملزماً بين الضيف والمضيف.",
      },
      {
        id: "accounts-verification",
        titleEn: "2. Eligibility, Guest Verification & Host Authorization",
        titleAr: "٢. الأهلية وتوثيق حساب الضيف وتفويض المضيف",
        contentEn: "Users must be 18+ with full legal capacity. Guests undergo mandatory identity verification (National ID/Iqama via Nafath/Yaqeen and OTP confirmation) in compliance with Saudi hospitality security rules. Hosts must provide truthful photos and specifications, hold valid property ownership or explicit owner subleasing authorization, and comply with Tourism Ministry and municipal safety permits.",
        contentAr: "يُشترط أن يكون المستخدم بعمر ١٨ عاماً فأكثر وبأهلية نظامية كاملة. يخضع الضيوف للتحقق الإلزامي من الهوية (عبر نفاذ ويقين ورمز التحقق) وفق الأنظمة السعودية، كما يلتزم المضيف بتقديم صور ووصف واقعي ودقيق للعقار مع إثبات الملكية أو وجود موافقة نظامية صريحة للتأجير واستيفاء التراخيص السياحية والسلامة.",
      },
      {
        id: "booking-checkin-deposit",
        titleEn: "3. Booking Confirmation, Check-In & Security Deposits",
        titleAr: "٣. تأكيد الحجز وتسجيل الدخول ومبلغ التأمين",
        contentEn: "No reservation is finalized until payment is completed electronically via authorized channels (Mada, Visa, Mastercard, Apple Pay, STC Pay, SADAD, or Tabby/Tamara where available). Check-in/check-out times, location coordinates, and manual Smart Lock PINs (when offered) appear in 'My Bookings'. Where a Host requires a security deposit, it is collected on-site prior to entry and returned by the Host at checkout upon inspecting unit condition.",
        contentAr: "لا يُؤكد أي حجز نهائياً إلا بعد إتمام السداد الإلكتروني عبر وسائل الدفع المعتمدة (مدى، فيزا، ماستركارد، أبل باي، STC Pay، سداد، أو خيارات التقسيط المتاحة). تظهر تفاصيل الموقع وأوقات الدخول والخروج ورمز القفل الذكي في صفحة 'حجوزاتي'. وعند اشتراط مبلغ تأمين، يُسلّم للمضيف قبل الدخول ويُسترد عند المغادرة بعد فحص سلامة الوحدة.",
      },
      {
        id: "cancellation-policy",
        titleEn: "4. Cancellation & Modification Policy",
        titleAr: "٤. سياسة الإلغاء والتأجيل والاسترداد",
        contentEn: "Once payment for a booking is completed on QafNest, the reservation is strictly final: the reservation cannot be cancelled or postponed, and paid amounts are non-refundable (0%). Guests should carefully review unit details, house rules, and selected dates before payment. Rare documented cases of verified host unit unavailability are handled directly by QafNest Operations.",
        contentAr: "بمجرد إتمام دفع قيمة الحجز عبر قاف نست، يصبح الحجز نهائياً وملزماً: لا يمكن إلغاء الحجز أو تأجيله، وتكون المبالغ المدفوعة غير قابلة للاسترداد (٠٪). يرجى مراجعة تفاصيل الوحدة وتواريخ الإقامة بعناية قبل الدفع، وتتولى إدارة العمليات معالجة الحالات الاستثنائية النادرة عند تعذر تسليم الوحدة من قِبل المضيف.",
      },
      {
        id: "commission-payouts-vat",
        titleEn: "5. Platform Service Fees, Payouts & 15% ZATCA VAT",
        titleAr: "٥. عمولة المنصة وتحويل المستحقات وضريبة القيمة المضافة",
        contentEn: "All listed totals are priced transparently in Saudi Riyals (SAR) inclusive of 15% Value Added Tax with Phase-2 ZATCA e-invoices and encrypted QR codes. Standard platform commissions/service fees apply per confirmed booking to sustain operations, payments, and 24/7 support. Net host earnings are transferred to the Host's verified Saudi IBAN according to the platform settlement cycle.",
        contentAr: "تُعرض كافة الأسعار بالريال السعودي شاملة ضريبة القيمة المضافة ١٥٪ مع إصدار فواتير إلكترونية معتمدة من هيئة الزكاة والضريبة والجمارك (زاتكا) مزودة برمز QR. تستقطع المنصة عمولة الخدمة المتفق عليها نظير الوساطة والدعم، وتُحول مستحقات المضيف الصافية إلى حسابه البنكي السعودي المعتمد وفق دورة التسوية الرسمية.",
      },
      {
        id: "host-protection-ip-law",
        titleEn: "6. Host Protection, Intellectual Property & Governing Law",
        titleAr: "٦. برنامج حماية المضيف والملكية الفكرية والنظام الحاكم",
        contentEn: "QafNest supports Hosts via its Host Protection Program for verified direct property damages or missing items from confirmed platform bookings when documented with photos/videos and repair estimates within 48 hours of checkout, with corresponding indemnification recovery from responsible Guests. All platform trademarks, UI, software, and content remain exclusive QafNest intellectual property. These Terms are governed by the laws of the Kingdom of Saudi Arabia, with exclusive jurisdiction vested in Riyadh courts.",
        contentAr: "يدعم برنامج حماية المضيف حالات الأضرار المباشرة أو المفقودات الناتجة عن حجوزات المنصة عند توثيقها بالصور والفواتير التقديرية خلال ٤٨ ساعة من المغادرة مع إلزام الضيف المتسبب بالتعويض. جميع العلامات والتصاميم والبرمجيات محمية بحقوق الملكية الفكرية لقاف نست. تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية وتختص محاكم مدينة الرياض حصراً بأي نزاع.",
      },
    ],
  },
  privacy: {
    id: "privacy",
    titleEn: "Privacy Policy & Data Protection",
    titleAr: "سياسة الخصوصية وحماية البيانات",
    subtitleEn: "Personal Data Protection Law (PDPL) notice detailing collection, purpose, retention, and SDAIA rights.",
    subtitleAr: "إشعار الخصوصية وفق نظام حماية البيانات الشخصية السعودي (PDPL) وضوابط هيئة سدايا.",
    lastUpdated: "2026-11-14",
    sections: [
      {
        id: "pdpl-compliance",
        titleEn: "1. Commitment Under Saudi PDPL & Regulatory Oversight",
        titleAr: "١. الإطار النظامي والامتثال لنظام حماية البيانات الشخصية",
        contentEn: "QafNest processes all Guest, Host, and visitor personal data in strict adherence to the Saudi Personal Data Protection Law (PDPL, Royal Decree M/19), SDAIA Implementing Regulations, NCA cybersecurity controls, and Ministry of Tourism transparency guidelines.",
        contentAr: "تعالج منصة قاف نست جميع البيانات الشخصية للضيوف والمضيفين والزوار وفق أحكام نظام حماية البيانات الشخصية السعودي الصادر بالمرسوم الملكي (م/١٩) ولائحته التنفيذية، وضوابط الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) والهيئة الوطنية للأمن السيبراني.",
      },
      {
        id: "collected-data",
        titleEn: "2. Categories of Personal Data We Collect",
        titleAr: "٢. فئات البيانات الشخصية التي نجمعها",
        contentEn: "Following data minimization principles, we collect only information necessary for platform operations: identity details (full name, National ID/Iqama, nationality verified via Nafath/Yaqeen), contact records (OTP-verified phone, email, city), Host property/permit/IBAN records, reservation & Smart Lock logs, encrypted gateway transaction references (never storing full card numbers), and essential technical/location telemetry.",
        contentAr: "انطلاقاً من مبدأ تقليل البيانات، نجمع فقط المعلومات اللازمة لتشغيل الخدمة: بيانات الهوية (الاسم، رقم الهوية/الإقامة الموثق عبر نفاذ ويقين)، بيانات التواصل (رقم الجوال الموثق بالـ OTP والبريد الإلكتروني)، بيانات المضيفين والتراخيص والحساب البنكي (IBAN)، سجلات الحجز والتواصل والدخول، مراجع الدفع وفواتير زاتكا (دون تخزين أرقام البطاقات الائتمانية)، والبيانات التقنية والموقع بموافقتك.",
      },
      {
        id: "sharing-retention-security",
        titleEn: "3. Data Sharing, Sovereign Hosting & Retention",
        titleAr: "٣. الإفصاح المشروع والاستضافة السيادية وفترات الاحتفاظ",
        contentEn: "QafNest never sells personal data. Limited necessary data is shared strictly with the confirmed Host/Guest for check-in coordination, licensed Saudi payment/verification/communication partners (Elm, SAMA-regulated gateways), and government authorities when legally mandated. Data is stored within Saudi Arabia using TLS 1.3 & AES-256 encryption and retained only until fulfillment of stay obligations and statutory ZATCA/regulatory retention windows.",
        contentAr: "لا تبيع قاف نست بياناتك مطلقاً، ويقتصر الإفصاح اللازم على الطرف المؤكد في الحجز (الضيف أو المضيف) لتنسيق الوصول، والشركاء المعتمدين للبنية التحتية والدفع داخل المملكة، والجهات الرسمية عند وجود مسوغ نظامي. تُستضاف البيانات داخل المملكة بتشفير TLS 1.3 و AES-256 وتُحفظ فقط للمدة اللازمة لتنفيذ الخدمات والالتزام بالمدد المحاسبية والضريبية النظامية.",
      },
      {
        id: "user-rights-dpo",
        titleEn: "4. Your PDPL Rights, 30-Day SLA & DPO Contact",
        titleAr: "٤. حقوقك النظامية ومهلة ٣٠ يوماً ومسؤول حماية البيانات",
        contentEn: "You have the right to be informed, access and obtain copies of your personal data, request correction of inaccuracies, request erasure once legal retention expires, and withdraw direct marketing consent. Privacy requests sent to our Data Protection Officer at privacy@qafnest.com are addressed within 30 days, and unresolved concerns may be escalated to SDAIA via the National Data Governance Platform.",
        contentAr: "يحق لك العلم بمسوغات جمع بياناتك، والاطلاع عليها وطلب نسخة منها، وطلب تصحيحها، وطلب إتلافها بعد انتهاء المدد النظامية، وسحب الموافقة على الرسائل التسويقية في أي وقت. تتم معالجة طلبات الخصوصية المرسلة إلى مسؤول حماية البيانات (privacy@qafnest.com) خلال ٣٠ يوماً، مع حفظ حقك في رفع الشكاوى إلى هيئة سدايا عبر منصة حوكمة البيانات الوطنية.",
      },
    ],
  },
  cookies: {
    id: "cookies",
    titleEn: "Cookies & Tracking Technologies Policy",
    titleAr: "سياسة ملفات تعريف الارتباط (الكوكيز)",
    subtitleEn: "How QafNest uses strictly necessary, preference, analytics, and security cookies with user consent controls.",
    subtitleAr: "كيفية استخدام ملفات تعريف الارتباط الضرورية وملفات التفضيلات والأداء والأمان مع خيارات التحكم للمستخدم.",
    lastUpdated: "2026-11-14",
    sections: [
      {
        id: "what-are-cookies",
        titleEn: "1. What Cookies Are & Why We Use Them",
        titleAr: "١. ما هي ملفات تعريف الارتباط ولماذا نستخدمها",
        contentEn: "Cookies and browser storage tokens are small text files stored on your device when browsing QafNest websites or apps to maintain authenticated sessions, preserve Arabic/English localization choices, prevent fraud, and measure platform speed without interrupting your booking journey.",
        contentAr: "ملفات تعريف الارتباط وتقنيات التخزين المحلية هي ملفات نصية صغيرة تُحفظ في متصفحك عند زيارة موقع وتطبيقات قاف نست، وتُستخدم لحفظ جلسة الدخول، وتذكر اختيار اللغة العربية أو الإنجليزية، وحماية عمليات الحجز من التلاعب، وتحسين سرعة الأداء.",
      },
      {
        id: "cookie-categories",
        titleEn: "2. Categories & Browser Controls",
        titleAr: "٢. تصنيف الملفات وطريقة التحكم بها",
        contentEn: "We classify cookies into Essential Security & Authentication Cookies (mandatory for login, CSRF defense, and booking checkout), Preference Cookies (language, dark/light theme, recent search cities), and Aggregated Performance Analytics. You can review or clear browser cookies anytime; disabling mandatory cookies may limit checkout and account login functionality.",
        contentAr: "تنقسم الملفات إلى ملفات أساسية إلزامية (للمصادقة وتأمين الجلسات وإتمام الحجز)، وملفات التفضيلات (اللغة والمظهر وتفضيلات البحث)، وملفات تحليل الأداء المجمعة. يمكنك حذف أو تعطيل الملفات من إعدادات متصفحك في أي وقت، مع العلم أن تعطيل الملفات الأساسية قد يعيق تسجيل الدخول وإتمام الحجز.",
      },
    ],
  },
  faq: {
    id: "faq",
    titleEn: "Frequently Asked Questions",
    titleAr: "الأسئلة الشائعة",
    subtitleEn: "Everything Guests & Hosts need to know about booking, security deposits, check-in, non-cancellation policy, payments, and hosting on QafNest.",
    subtitleAr: "دليل الإجابات الشاملة للضيوف والمضيفين حول الحجز، مبلغ التأمين، الدخول، سياسة عدم الإلغاء، الدفع، والاستضافة على قاف نست.",
    lastUpdated: "2026-11-14",
    faqs: [
      {
        id: "faq-1",
        category: "booking",
        questionEn: "How do I know my booking on QafNest is confirmed?",
        questionAr: "كيف أتأكد من أن حجزي في قاف نست قد تم تأكيده نهائياً؟",
        answerEn: "Your reservation is confirmed immediately once electronic payment is completed. You can verify booking status, view unit location coordinates, and download your ZATCA tax invoice anytime from 'My Bookings'.",
        answerAr: "يُؤكد الحجز نهائياً فور إتمام السداد الإلكتروني عبر وسائل الدفع المتاحة. ويمكنك متابعة حالة الحجز، ومعرفة إحداثيات الموقع، وتحميل الفاتورة الضريبية في أي وقت عبر صفحة 'حجوزاتي'.",
      },
      {
        id: "faq-2",
        category: "deposit",
        questionEn: "When, how, and to whom is the security deposit paid and refunded?",
        questionAr: "متى ولمن يُدفع مبلغ التأمين وكيف يتم استرداده؟",
        answerEn: "When a unit specifies a security deposit, the exact amount is displayed on the listing page before payment and paid directly to the Host upon arrival prior to check-in. The Host inspects the unit at checkout and returns the deposit in full if the property is left in sound condition under house rules.",
        answerAr: "تختلف قيمة مبلغ التأمين (إن وجد) حسب كل وحدة وتظهر بوضوح في صفحة العقار، ويُدفع مباشرة للمضيف عند الوصول وقبل استلام الوحدة. يلتزم المضيف بفحص العقار عند المغادرة وإعادة كامل مبلغ التأمين فور التأكد من سلامة الممتلكات والالتزام بالقواعد.",
      },
      {
        id: "faq-3",
        category: "cancellations",
        questionEn: "Can a confirmed booking be cancelled, postponed, or refunded?",
        questionAr: "هل يمكن إلغاء الحجز أو تأجيله أو استرداد المبلغ بعد الدفع؟",
        answerEn: "The reservation cannot be cancelled or postponed. Once payment is completed on QafNest, bookings are strictly final and non-refundable (0%). Only rare verified unit-unavailability situations are handled directly by QafNest Operations.",
        answerAr: "لا يمكن إلغاء الحجز أو تأجيله. بمجرد إتمام دفع الحجز في قاف نست يصبح الحجز نهائياً وغير قابل للاسترداد (٠٪)، ولا يتم الاستثناء إلا في الحالات النادرة الموثقة لتعذر تسليم الوحدة من قِبل المضيف عبر فريق العمليات.",
      },
      {
        id: "faq-4",
        category: "booking",
        questionEn: "How do I contact the Host and find check-in instructions?",
        questionAr: "كيف أتواصل مع المضيف وأعرف موقع العقار وتعليمات الدخول؟",
        answerEn: "Before booking, use the inquiry options on the property page. After confirmation, open 'My Bookings' to view Host contact details, property directions/coordinates, and check-in/out times (including manual Smart Lock PIN if provided). Please notify the Host directly if you will arrive later than the scheduled check-in time.",
        answerAr: "بعد تأكيد الحجز، انتقل إلى صفحة 'حجوزاتي' لعرض بيانات التواصل مع المضيف، وموقع العقار، ومواعيد الدخول والخروج (ورمز القفل الذكي إن وجد). وفي حال التأخر عن موعد الوصول المحدد، يجب التواصل مباشرة مع المضيف لإبلاغه مسبقاً.",
      },
      {
        id: "faq-5",
        category: "payment",
        questionEn: "What payment methods are accepted and are prices tax-inclusive?",
        questionAr: "ما هي طرق الدفع المتاحة وهل تشمل الأسعار الضريبة؟",
        answerEn: "QafNest supports Mada, Visa, Mastercard, Apple Pay, STC Pay, SADAD wire transfers for helpline reservations, and Tabby/Tamara installments where eligible. All totals transparently include 15% ZATCA VAT with instant Phase-2 QR tax invoices.",
        answerAr: "ندعم الدفع عبر مدى، فيزا، ماستركارد، أبل باي، STC Pay، نظام سداد لحجوزات الهاتف، وخيارات التقسيط المتاحة (تابي/تمارا). وتشمل جميع الأسعار الإجمالية ضريبة القيمة المضافة ١٥٪ مع فاتورة إلكترونية مزودة برمز QR.",
      },
      {
        id: "faq-6",
        category: "hosting",
        questionEn: "How do Hosts list a property, receive payouts, and qualify for Host Protection?",
        questionAr: "كيف يسجل المضيف عقاره، ومتى تُحول المستحقات، وما هو برنامج حماية المضيف؟",
        answerEn: "Property owners or authorized sublessors with a Saudi Ministry of Tourism permit can list chalets, villas, apartments, farms, or camps in minutes via the Host Portal using accurate photos and Arabic/English details. Net booking payouts (less standard platform commission & VAT) are remitted directly to the Host's verified Saudi IBAN, and confirmed stays qualify for QafNest Host Protection if direct damages are documented with photos and repair invoices within 48 hours of checkout.",
        answerAr: "يمكن للمالك أو المستثمر المفوض نظامياً تسجيل الشاليهات والفلل والشقق والمزارع والمخيمات عبر بوابة المضيفين برقم ترخيص وزارة السياحة وصور واقعية وبيانات دقيقة بالعربية والإنجليزية. تُحول المستحقات الصافية بعد خصم عمولة المنصة إلى حساب الآيبان السعودي المعتمد، كما يغطي برنامج حماية المضيف الأضرار المباشرة الموثقة بالصور والفواتير خلال ٤٨ ساعة من المغادرة.",
      },
    ],
  },
  contact: {
    id: "contact",
    titleEn: "Contact Us",
    titleAr: "اتصل بنا",
    subtitleEn: "Get in touch with the QafNest central operations team for reservations, partner support, and inquiries.",
    subtitleAr: "تواصل مع فريق عمليات منصة قاف نست المركزية للحجوزات ودعم المضيفين والاستفسارات.",
    lastUpdated: "2026-11-12",
    contactInfo: {
      phone: QAFNEST_SUPPORT_CONTACT.displayPhone,
      whatsapp: QAFNEST_SUPPORT_CONTACT.displayPhone,
      supportEmail: QAFNEST_SUPPORT_CONTACT.supportEmail,
      hostsEmail: "hosts@qafnest.com",
      financeEmail: "finance@qafnest.com",
      addressEn: QAFNEST_SUPPORT_CONTACT.hqAddressEn,
      addressAr: QAFNEST_SUPPORT_CONTACT.hqAddressAr,
      licenseNumber: "Ministry of Tourism License #73102999",
    },
  },
};

export function getAllCmsPages(): Record<string, CmsPageRecord> {
  ensureDirectoryExists();
  try {
    if (fs.existsSync(PAGES_FILE)) {
      const raw = fs.readFileSync(PAGES_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Record<string, CmsPageRecord>;
      return { ...DEFAULT_CMS_PAGES, ...parsed };
    }
  } catch (err) {
    console.warn("Failed reading cms-pages.json, falling back to defaults", err);
  }
  return DEFAULT_CMS_PAGES;
}

export function getCmsPage(id: string): CmsPageRecord | null {
  const pages = getAllCmsPages();
  return pages[id] || null;
}

export function saveCmsPage(page: CmsPageRecord): boolean {
  ensureDirectoryExists();
  try {
    const pages = getAllCmsPages();
    pages[page.id] = {
      ...page,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed saving cms page:", err);
    return false;
  }
}

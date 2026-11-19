import type { CmsWorkspaceData, RolePermissionGroup } from "@/types/cms";

const ALL_TRUE: RolePermissionGroup = { read: true, create: true, update: true, delete: true };
const EDITOR_PERMS: RolePermissionGroup = { read: true, create: true, update: true, delete: false };
const READ_ONLY: RolePermissionGroup = { read: true, create: false, update: false, delete: false };

export function createDefaultCmsWorkspace(): CmsWorkspaceData {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: "usr-1",
        email: "team@qafnest.com",
        firstName: "QafNest",
        lastName: "Team",
        role: "Editor",
        updatedAt: now,
      },
      {
        id: "usr-2",
        email: "info@qafnest.com",
        firstName: "Nur",
        lastName: "Amin",
        role: "Editor",
        updatedAt: now,
      },
      {
        id: "usr-3",
        email: "cms.dev@qafnest.com",
        firstName: "CMS",
        lastName: "Admin",
        role: "Admin",
        updatedAt: now,
      },
      {
        id: "usr-4",
        email: "admin@qafnest.com",
        firstName: "QafNest",
        lastName: "Super Admin",
        role: "Super Admin",
        updatedAt: now,
      },
    ],
    media: [
      {
        id: "med-1",
        filename: "riyadh-luxury-chalet-hero.webp",
        alt: "QafNest luxury private chalet in Riyadh with pool",
        url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        mimeType: "image/webp",
        sizeKb: 284,
        width: 1600,
        height: 900,
        createdAt: now,
      },
      {
        id: "med-2",
        filename: "jeddah-seafront-villa.webp",
        alt: "Jeddah Red Sea luxury beachfront villa",
        url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
        mimeType: "image/webp",
        sizeKb: 312,
        width: 1600,
        height: 900,
        createdAt: now,
      },
      {
        id: "med-3",
        filename: "abha-mountain-retreat.webp",
        alt: "Abha misty mountain cabin stay in Asir",
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        mimeType: "image/webp",
        sizeKb: 245,
        width: 1600,
        height: 900,
        createdAt: now,
      },
      {
        id: "med-4",
        filename: "alula-desert-camp-glamping.webp",
        alt: "AlUla desert luxury glamping camp under the stars",
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
        mimeType: "image/webp",
        sizeKb: 298,
        width: 1600,
        height: 900,
        createdAt: now,
      },
      {
        id: "med-5",
        filename: "taif-rose-farm-resort.webp",
        alt: "Taif highlands private farm resort and gardens",
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        mimeType: "image/webp",
        sizeKb: 267,
        width: 1600,
        height: 900,
        createdAt: now,
      },
      {
        id: "med-6",
        filename: "qafnest-og-brand-banner.png",
        alt: "QafNest Saudi Hospitality Official SEO Logo",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        mimeType: "image/png",
        sizeKb: 190,
        width: 1200,
        height: 630,
        createdAt: now,
      },
      {
        id: "med-dest-monthly",
        filename: "monthly-stays-destination.webp",
        alt: "QafNest Monthly Stays Destination",
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 140,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-riyadh",
        filename: "riyadh-destination.webp",
        alt: "QafNest Riyadh Destination Photo",
        url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 160,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-jeddah",
        filename: "jeddah-destination.webp",
        alt: "QafNest Jeddah Destination Photo",
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 155,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-khobar",
        filename: "khobar-destination.webp",
        alt: "QafNest Al Khobar Destination Photo",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 170,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-abha",
        filename: "abha-destination.webp",
        alt: "QafNest Abha Destination Photo",
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 165,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-alula",
        filename: "alula-destination.webp",
        alt: "QafNest AlUla Destination Photo",
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 150,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-taif",
        filename: "taif-destination.webp",
        alt: "QafNest Taif Destination Photo",
        url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 145,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-mecca",
        filename: "mecca-destination.webp",
        alt: "QafNest Mecca Destination Photo",
        url: "https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 160,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-dammam",
        filename: "dammam-destination.webp",
        alt: "QafNest Dammam Destination Photo",
        url: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 155,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-alhafuf",
        filename: "alhafuf-destination.webp",
        alt: "QafNest Alhafuf Destination Photo",
        url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 150,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-tabuk",
        filename: "tabuk-destination.webp",
        alt: "QafNest Tabuk Destination Photo",
        url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 160,
        width: 400,
        height: 400,
        createdAt: now,
      },
      {
        id: "med-dest-buraidah",
        filename: "buraidah-destination.webp",
        alt: "QafNest Buraidah Destination Photo",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&fit=crop",
        mimeType: "image/webp",
        sizeKb: 165,
        width: 400,
        height: 400,
        createdAt: now,
      },
    ],
    categories: [
      {
        id: "cat-1",
        name: { en: "Chalets & Smart Living", ar: "شاليهات وإقامة ذكية" },
        slug: "chalet",
        description: {
          en: "Modern private chalets with smart locks and pools across KSA.",
          ar: "شاليهات خاصة حديثة بأقفال ذكية ومسابح في جميع أنحاء المملكة.",
        },
        updatedAt: now,
      },
      {
        id: "cat-2",
        name: { en: "Luxury Escapes & Villas", ar: "ملاذات فاخرة وفلل" },
        slug: "villa",
        description: {
          en: "Licensed VIP family villas and resorts.",
          ar: "فلل ومنتجعات عائلية فاخرة مرخصة.",
        },
        updatedAt: now,
      },
      {
        id: "cat-3",
        name: { en: "Country Farms", ar: "مزارع ريفية" },
        slug: "farm",
        description: {
          en: "Private greenery escapes in Diriyah, Taif, and Al-Ahsa.",
          ar: "مزارع ريفية خاصة في الدرعية والطائف والأحساء.",
        },
        updatedAt: now,
      },
      {
        id: "cat-4",
        name: { en: "Desert Camps", ar: "مخيمات صحراوية" },
        slug: "camp",
        description: {
          en: "Authentic Saudi desert glamping experiences.",
          ar: "تجارب تخييم صحراوية فاخرة وأصيلة.",
        },
        updatedAt: now,
      },
      {
        id: "cat-5",
        name: { en: "Saudi Tourism Guides", ar: "أدلة السياحة السعودية" },
        slug: "guides",
        description: {
          en: "Seasonal travel itineraries for Riyadh, Jeddah, Abha, and AlUla.",
          ar: "أدلة سفر موسمية للرياض وجدة وأبها والعلا.",
        },
        updatedAt: now,
      },
      {
        id: "cat-6",
        name: { en: "Host Insights & Revenue", ar: "إرشادات المضيفين والعوائد" },
        slug: "host-tips",
        description: {
          en: "Ministry of Tourism licensing, pricing, and ZATCA compliance.",
          ar: "تراخيص وزارة السياحة والتسعير والامتثال لهيئة الزكاة والضريبة.",
        },
        updatedAt: now,
      },
    ],
    roles: [
      {
        id: "role-1",
        name: "Admin",
        description: "Manage content, collections, SEO, and editorial operations.",
        permissions: {
          blogs: ALL_TRUE,
          categories: ALL_TRUE,
          users: EDITOR_PERMS,
          media: ALL_TRUE,
          roles: READ_ONLY,
          businessPages: ALL_TRUE,
          legalPages: ALL_TRUE,
        },
        updatedAt: now,
      },
      {
        id: "role-2",
        name: "Editor",
        description: "Create and edit blogs, categories, media, and FAQs.",
        permissions: {
          blogs: EDITOR_PERMS,
          categories: EDITOR_PERMS,
          users: READ_ONLY,
          media: EDITOR_PERMS,
          roles: READ_ONLY,
          businessPages: EDITOR_PERMS,
          legalPages: READ_ONLY,
        },
        updatedAt: now,
      },
      {
        id: "role-3",
        name: "Super Admin",
        description: "Full access to the entire system.",
        permissions: {
          blogs: ALL_TRUE,
          categories: ALL_TRUE,
          users: ALL_TRUE,
          media: ALL_TRUE,
          roles: ALL_TRUE,
          businessPages: ALL_TRUE,
          legalPages: ALL_TRUE,
        },
        updatedAt: now,
      },
    ],
    faqs: [
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
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
        updatedAt: now,
      },
    ],
    homePopups: [],
    destinations: [
      {
        id: "monthly",
        city: "all",
        name: { en: "Monthly Stays", ar: "إقامة شهرية" },
        subtitle: { en: "Save up to 35% on extended bookings", ar: "وفر حتى ٣٥٪ على الحجوزات الشهرية" },
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&fit=crop",
        isMonthly: true,
        badgeText: "-35%",
        enabled: true,
        order: 1,
        updatedAt: now,
      },
      {
        id: "riyadh",
        city: "riyadh",
        name: { en: "Riyadh", ar: "الرياض" },
        subtitle: { en: "Al-Ammariyah & Diriyah Chalets", ar: "شاليهات العمارية والدرعية" },
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&fit=crop",
        enabled: true,
        order: 2,
        updatedAt: now,
      },
      {
        id: "jeddah",
        city: "jeddah",
        name: { en: "Jeddah", ar: "جدة" },
        subtitle: { en: "Obhur Waterfront Villas", ar: "فلل أبحر البحرية" },
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&fit=crop",
        enabled: true,
        order: 3,
        updatedAt: now,
      },
      {
        id: "khobar",
        city: "khobar",
        name: { en: "Al Khobar", ar: "الخبر" },
        subtitle: { en: "Eastern Province Seaside Retreats", ar: "منتجعات المنطقة الشرقية البحرية" },
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&fit=crop",
        enabled: true,
        order: 4,
        updatedAt: now,
      },
      {
        id: "abha",
        city: "abha",
        name: { en: "Abha", ar: "أبها" },
        subtitle: { en: "Al-Soudah Misty Mountain Chalets", ar: "شاليهات السودة الجبلية" },
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&fit=crop",
        enabled: true,
        order: 5,
        updatedAt: now,
      },
      {
        id: "alula",
        city: "alula",
        name: { en: "AlUla", ar: "العلا" },
        subtitle: { en: "Desert & Stargazing Glamping", ar: "مخيمات صحراوية فاخرة" },
        image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&fit=crop",
        enabled: true,
        order: 6,
        updatedAt: now,
      },
      {
        id: "taif",
        city: "taif",
        name: { en: "Taif", ar: "الطائف" },
        subtitle: { en: "Al Hada & Rose Valley Retreats", ar: "منتجعات الهدا والورد" },
        image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&fit=crop",
        enabled: true,
        order: 7,
        updatedAt: now,
      },
      {
        id: "mecca",
        city: "mecca",
        name: { en: "Mecca", ar: "مكة المكرمة" },
        subtitle: { en: "Holy City Luxury Accommodations", ar: "إقامات فاخرة في مكة المكرمة" },
        image: "https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=400&fit=crop",
        enabled: true,
        order: 8,
        updatedAt: now,
      },
      {
        id: "dammam",
        city: "dammam",
        name: { en: "Dammam", ar: "الدمام" },
        subtitle: { en: "Arabian Gulf Shoreline Chalets", ar: "شاليهات ساحل الخليج العربي" },
        image: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&fit=crop",
        enabled: true,
        order: 9,
        updatedAt: now,
      },
      {
        id: "alhafuf",
        city: "alhafuf",
        name: { en: "Alhafuf", ar: "الهفوف" },
        subtitle: { en: "Al-Ahsa Oasis Heritage Farms", ar: "مزارع واحة الأحساء التراثية" },
        image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&fit=crop",
        enabled: true,
        order: 10,
        updatedAt: now,
      },
      {
        id: "tabuk",
        city: "tabuk",
        name: { en: "Tabuk", ar: "تبوك" },
        subtitle: { en: "Red Sea Shoreline & Desert Lodges", ar: "منتجعات ساحل البحر الأحمر وتبوك" },
        image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=400&fit=crop",
        enabled: true,
        order: 11,
        updatedAt: now,
      },
      {
        id: "buraidah",
        city: "buraidah",
        name: { en: "Buraidah", ar: "بريدة" },
        subtitle: { en: "Al-Qassim Date Palm Ranches", ar: "مزارع ونخيل القصيم" },
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&fit=crop",
        enabled: true,
        order: 12,
        updatedAt: now,
      },
    ],
    businessPages: [],
    legalPages: [
      {
        id: "leg-1",
        title: { en: "Privacy Policy & Data Protection", ar: "سياسة الخصوصية وحماية البيانات" },
        slug: "privacy-policy",
        content: {
          en: `<h2>1. Privacy Notice, PDPL &amp; SDAIA Framework</h2>
<p>QafNest treats personal privacy as a core responsibility. We operate in strict compliance with the Saudi Personal Data Protection Law (PDPL) enacted under Royal Decree No. (M/19), its Implementing Regulations issued by the Saudi Data and Artificial Intelligence Authority (SDAIA), and National Cybersecurity Authority (NCA) standards.</p>
<p>Applying data minimization and purpose limitation principles, QafNest collects and processes only the personal information strictly required to deliver secure vacation rental bookings, host settlements, and regulatory verification.</p>
<h2>2. Personal Data We Collect</h2>
<ul>
<li><strong>Identity Verification Data:</strong> Full legal name, Saudi National ID / Iqama / Passport details verified through authorized national channels (Nafath &amp; Elm Yaqeen) as required by the Ministry of Tourism.</li>
<li><strong>Contact &amp; Account Details:</strong> Verified mobile number, email address, preferred language, and communication preferences.</li>
<li><strong>Booking &amp; Financial Records:</strong> Reservation history, stay dates, ZATCA Phase 2 VAT invoices, masked card references (last 4 digits via PCI-DSS Level 1 gateways — full PAN &amp; CVV are never exposed), and host Saudi IBAN settlement details.</li>
<li><strong>Technical &amp; Security Metadata:</strong> IP address, device fingerprint, session logs, and anti-fraud diagnostics to prevent unauthorized access and account abuse.</li>
</ul>
<h2>3. Legal Basis &amp; Processing Purpose</h2>
<ul>
<li>Executing accommodation booking contracts between Guests and licensed Hosts.</li>
<li>Fulfilling mandatory Saudi regulatory compliance (Ministry of Tourism permits, ZATCA e-invoicing, SAMA payment rules, and public safety verification).</li>
<li>Providing 24/7 customer support, dispute resolution, smart-lock check-in delivery, and refund/payout settlements.</li>
<li>Improving platform performance, search accuracy, and fraud prevention under legitimate interest and explicit user consent.</li>
</ul>
<h2>4. Data Sharing &amp; Permitted Disclosure</h2>
<p>QafNest never sells personal data. Limited, purpose-bound sharing occurs strictly with: (a) the booked Host (name, verified check-in details, and guest count after reservation confirmation), (b) licensed payment &amp; installment providers (MyFatoorah, Mada, Apple Pay, STC Pay, Tabby, Tamara), (c) authorized identity &amp; tax authorities (SDAIA, Ministry of Tourism, ZATCA, Nafath/Elm) when mandated by Saudi law.</p>
<h2>5. Storage, Encryption &amp; Retention</h2>
<p>All sensitive records are encrypted in transit (TLS 1.3) and at rest (AES-256-GCM). Tax invoices and settlement ledgers are retained for the statutory period mandated by ZATCA and Saudi commercial regulations, after which non-statutory personal data is securely anonymized or purged.</p>
<h2>6. Cookies &amp; Browser Technologies</h2>
<p>We use strictly necessary session cookies, language/theme preference storage, and optional performance analytics. Full details are published in our Cookies Policy.</p>
<h2>7. PDPL Rights &amp; SDAIA Escalation</h2>
<p>Under the Saudi PDPL, you hold the right to be informed, access your personal data, request correction or updating, request destruction of data no longer legally required, and withdraw consent for optional marketing communications. Unresolved privacy complaints may be escalated to SDAIA.</p>
<h2>8. Data Protection Officer &amp; Updates</h2>
<p>To exercise your PDPL rights or contact our Data Protection Officer, email <strong>qafnest@gmail.com</strong> or call our 24/7 support desk. Material updates to this notice are published here with a revised effective date.</p>`,
          ar: `<h2>١. إشعار الخصوصية والإطار النظامي (PDPL وسدايا)</h2>
<p>تلتزم منصة قاف نست بحماية خصوصية مستخدميها ومعالجة بياناتهم وفق أحكام نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/19) ولائحته التنفيذية الصادرة عن الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)، وضوابط الهيئة الوطنية للأمن السيبراني في المملكة العربية السعودية.</p>
<p>نلتزم بمبدأ تقليل البيانات وتحديد الغرض؛ حيث نقتصر في جمع البيانات الشخصية على الحد الأدنى اللازم لتقديم خدمات حجز مرافق الضيافة، وتسوية المدفوعات، والوفاء بالالتزامات النظامية.</p>
<h2>٢. البيانات الشخصية التي نجمعها</h2>
<ul>
<li><strong>بيانات التحقق والهوية:</strong> الاسم الكامل، وبيانات الهوية الوطنية أو الإقامة أو جواز السفر الموثقة عبر القنوات الوطنية المعتمدة (نفاذ ويقين) وفق متطلبات وزارة السياحة.</li>
<li><strong>بيانات التواصل والحساب:</strong> رقم الجوال الموثق، البريد الإلكتروني، اللغة المفضلة، وتفضيلات الإشعارات.</li>
<li><strong>بيانات الحجز والمدفوعات:</strong> سجل الحجوزات وتواريخ الإقامة، فواتير ضريبة القيمة المضافة المتوافقة مع هيئة الزكاة والضريبة والجمارك، مراجع البطاقات المشفرة (آخر 4 أرقام فقط عبر بوابات PCI-DSS)، وبيانات الآيبان السعودي للمضيفين.</li>
<li><strong>البيانات التقنية والأمنية:</strong> عنوان IP، وبصمة الجهاز، وسجلات الأمان لمنع الاحتيال والوصول غير المصرح به.</li>
</ul>
<h2>٣. المسوغات والأغراض النظامية للمعالجة</h2>
<ul>
<li>تنفيذ عقود الإقامة والحجز بين الضيوف والمضيفين المرخصين.</li>
<li>الامتثال للأنظمة السعودية الإلزامية (تصاريح وزارة السياحة، الفوترة الإلكترونية لزاتكا، وضوابط البنك المركزي السعودي).</li>
<li>تقديم الدعم الفني على مدار الساعة، وتسليم رموز الدخول الذكي، وحل النزاعات، وتسوية المدفوعات والمستحقات.</li>
<li>تحسين أداء المنصة ودقة البحث ومنع الاحتيال.</li>
</ul>
<h2>٤. مشاركة البيانات والإفصاح المحدود</h2>
<p>لا تقوم قاف نست ببيع البيانات الشخصية نهائياً. تقتصر المشاركة المحدودة على: (أ) المضيف المؤكد لديه الحجز بالقدر اللازم لإتمام الاستضافة، (ب) مزودي خدمات الدفع المرخصين (ماي فاتورة، مدى، أبل باي، STC Pay، تابي، تمارا)، (ج) الجهات الحكومية والتنظيمية المختصة (وزارة السياحة، زاتكا، سدايا، نفاذ) عند الطلب النظامي.</p>
<h2>٥. التخزين السيادي والتشفير وفترات الاحتفاظ</h2>
<p>يتم تشفير كافة البيانات أثناء النقل (TLS 1.3) وأثناء التخزين (AES-256-GCM). ويُحتفظ بالفواتير الضريبية والسجلات المالية للمدة النظامية المقررة من هيئة الزكاة والضريبة والجمارك، ثم تُتلف أو تُجهّل البيانات غير المطلوبة نظامياً بأمان.</p>
<h2>٦. ملفات تعريف الارتباط والتقنيات المشابهة</h2>
<p>نستخدم ملفات تعريف الارتباط الضرورية للأمان وتسجيل الدخول، وتفضيلات اللغة والمظهر، وتحليلات الأداء المجمعة كما هو موضح في سياسة الكوكيز.</p>
<h2>٧. حقوقك النظامية وفق نظام حماية البيانات الشخصية</h2>
<p>لك الحق في العلم، والوصول إلى بياناتك الشخصية، وطلب تصحيحها أو تحديثها، وطلب إتلاف ما لم يعد مطلوباً نظامياً، وسحب الموافقة على الرسائل التسويقية. وفي حال عدم معالجة شكواك يمكنك التصعيد لدى هيئة سدايا.</p>
<h2>٨. مسؤول حماية البيانات وتحديث السياسة</h2>
<p>لممارسة حقوقك أو التواصل مع مسؤول حماية البيانات، راسلنا عبر <strong>qafnest@gmail.com</strong> أو تواصل مع خدمة العملاء على مدار الساعة.</p>`,
        },
        showSection: true,
        metaTitle: { en: "Privacy Policy | QafNest", ar: "سياسة الخصوصية | قاف نست" },
        metaDescription: {
          en: "Learn how QafNest protects your personal data under Saudi PDPL and SDAIA regulations.",
          ar: "تعرف على كيفية حماية قاف نست لبياناتك الشخصية وفق نظام حماية البيانات الشخصية وضوابط سدايا.",
        },
        canonicalUrl: "https://qafnest.com/en/privacy",
        updatedAt: now,
      },
      {
        id: "leg-2",
        title: { en: "Terms and Conditions of Use", ar: "الشروط والأحكام العامة للمنصة" },
        slug: "terms-and-conditions",
        content: {
          en: `<h2>1. Binding Agreement &amp; Platform Role</h2>
<p>Accessing, browsing, or registering on QafNest constitutes your unconditional agreement to these Terms, our Privacy Policy, and all supplemental policies published on the Platform.</p>
<p>QafNest operates strictly as an electronic hospitality intermediary licensed by the Saudi Ministry of Tourism (License #73102999), connecting licensed Hosts with Guests across chalets, private villas, resorts (istirahat), apartments, farms, and desert camps.</p>
<h2>2. Eligibility, Guest &amp; Host Accounts</h2>
<p>Users must be at least 18 years old with valid legal capacity. Mandatory identity verification via National ID / Iqama / Passport (Nafath &amp; Elm Yaqeen) and OTP mobile verification applies prior to booking confirmation or listing activation.</p>
<h2>3. Booking Confirmation &amp; Stay Rules</h2>
<p>Reservations become legally confirmed only upon successful electronic payment through QafNest's approved channels. Guests must adhere to stated check-in/out times, maximum occupancy, family-only designations, and neighborhood quiet hours.</p>
<h2>4. Security Deposit &amp; Self Check-In</h2>
<p>Where a listing specifies a security deposit, terms are displayed transparently prior to checkout. For keyless self check-in stays, Smart Lock access codes are delivered securely inside My Bookings after payment verification.</p>
<h2>5. Cancellation &amp; Modification Policy</h2>
<p>Unless explicitly stated otherwise on the listing page, confirmed bookings follow the property's published cancellation tier. Verified Host-side unavailability or material misrepresentation is resolved directly by QafNest Operations with full protection for the Guest.</p>
<h2>6. Service Fees, Payouts &amp; 15% VAT</h2>
<p>All service fees and 15% ZATCA Value Added Tax (VAT) are itemized transparently before payment. Every confirmed booking issues a ZATCA Phase 2 compliant e-invoice with QR code. Net Host payouts are disbursed to verified Saudi IBAN accounts via SAMA SARIE within 24 hours of check-in.</p>
<h2>7. Host Standards &amp; Protection</h2>
<p>Hosts warrant that every listed unit holds an active Ministry of Tourism permit, accurate photos/amenities, and safe habitable conditions. Verified guest-caused physical damages are covered under QafNest's documented Host Protection assessment process.</p>
<h2>8. Guest Conduct &amp; Damage Liability</h2>
<p>Guests are responsible for preserving property condition, refraining from unauthorized parties or commercial subleasing, and compensating verified direct damages incurred during their stay.</p>
<h2>9. Intellectual Property &amp; Indemnification</h2>
<p>All QafNest trademarks, interface designs, software, and content remain the exclusive intellectual property of QafNest Hospitality Group. Unauthorized scraping, copying, or impersonation is strictly prohibited.</p>
<h2>10. Governing Law &amp; Dispute Resolution</h2>
<p>These Terms are governed by the laws and regulations of the Kingdom of Saudi Arabia. Any unresolved dispute shall fall under the jurisdiction of the competent courts in Riyadh, Kingdom of Saudi Arabia.</p>`,
          ar: `<h2>١. الاتفاقية الملزمة ودور المنصة الوسيط</h2>
<p>يُعد دخولك إلى منصة قاف نست أو تصفحك أو تسجيلك فيها موافقةً تامة ودون قيد أو شرط على هذه الشروط والأحكام وسياسة الخصوصية وجميع السياسات المكملة المنشورة على المنصة.</p>
<p>تعمل منصة قاف نست كوسيط إلكتروني تقني مرخص من وزارة السياحة في المملكة العربية السعودية (ترخيص رقم 73102999) يربط بين المضيفين المرخصين والضيوف لحجز الشاليهات والفلل والاستراحات والشقق والمزارع والمخيمات.</p>
<h2>٢. الأهلية وحسابات الضيف والمضيف</h2>
<p>يشترط ألا يقل عمر المستخدم عن 18 عاماً وأن يتمتع بالأهلية النظامية، مع الالتزام بتوثيق الهوية الوطنية أو الإقامة أو جواز السفر (عبر نفاذ ويقين) ورقم الجوال قبل تأكيد الحجز أو تفعيل الإعلان.</p>
<h2>٣. تأكيد الحجز وقواعد الإقامة</h2>
<p>لا يصبح الحجز مؤكداً إلا بعد إتمام السداد الإلكتروني عبر قنوات الدفع المعتمدة في المنصة، ويلتزم الضيف بمواعيد الدخول والخروج والحد الأقصى للنزلاء وقواعد الذوق العام والهدوء.</p>
<h2>٤. مبلغ التأمين والدخول الذاتي</h2>
<p>تُعرض تفاصيل مبلغ التأمين بوضوح قبل الدفع متى ما وُجد، وفي وحدات الدخول الذاتي يتم تسليم رمز القفل الذكي بأمان داخل صفحة «حجوزاتي» بعد تأكيد السداد.</p>
<h2>٥. سياسة الإلغاء والتعديل والاسترداد</h2>
<p>تخضع الحجوزات المؤكدة لسياسة الإلغاء المعلنة في صفحة العقار قبل السداد. وفي حالات تعذر تسليم الوحدة من قِبل المضيف أو عدم مطابقتها الجوهرية، تتدخل إدارة العمليات فوراً لحماية حقوق الضيف.</p>
<h2>٦. رسوم الخدمة والمستحقات وضريبة القيمة المضافة ١٥٪</h2>
<p>تُعرض رسوم الخدمة وضريبة القيمة المضافة (١٥٪) بشفافية تامة قبل الدفع، وتصدر فاتورة إلكترونية معتمدة ومتوافقة مع المرحلة الثانية لزاتكا. وتُحول صافي مستحقات المضيف عبر نظام سريع خلال ٢٤ ساعة من تسجيل الدخول.</p>
<h2>٧. معايير المضيف وبرنامج حماية المضيف</h2>
<p>يضمن المضيف سريان تصريح وزارة السياحة ودقة الصور والمواصفات وجاهزية الوحدة، ويُغطى أي ضرر موثق يسببه النزيل وفق إجراءات برنامج حماية المضيف.</p>
<h2>٨. التزامات الضيف والمسؤولية عن الأضرار</h2>
<p>يتحمل الضيف مسؤولية المحافظة على العقار ومحتوياته والامتناع عن التجمعات المخالفة أو التأجير من الباطن، وتعويض أي تلفيات مباشرة موثقة.</p>
<h2>٩. الملكية الفكرية</h2>
<p>جميع العلامات التجارية والتصاميم والبرمجيات والمحتوى مملوكة حصرياً لمجموعة قاف نست للضيافة ويُحظر نسخها أو استغلالها دون إذن خطي مسبق.</p>
<h2>١٠. النظام الحاكم وتسوية النزاعات</h2>
<p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختص المحاكم المختصة في مدينة الرياض بالفصل في أي نزاع لم يُحل ودياً.</p>`,
        },
        showSection: true,
        metaTitle: { en: "Terms and Conditions | QafNest", ar: "الشروط والأحكام | قاف نست" },
        metaDescription: {
          en: "Official QafNest platform terms, booking rules, VAT invoicing, and Ministry of Tourism compliance.",
          ar: "الشروط والأحكام الرسمية لاستخدام منصة قاف نست وحجز العقارات والامتثال لوزارة السياحة.",
        },
        canonicalUrl: "https://qafnest.com/en/terms",
        updatedAt: now,
      },
      {
        id: "leg-3",
        title: { en: "Cookies Policy", ar: "سياسة ملفات تعريف الارتباط (الكوكيز)" },
        slug: "cookies-policy",
        content: {
          en: `<h2>What Are Cookies?</h2>
<p>Cookies are small data files stored on your browser or device when you visit websites. They allow QafNest to remember your sessions, security tokens, and preferences for a fast, seamless booking experience.</p>
<h2>How We Categorize Our Cookies</h2>
<ul>
<li><strong>1. Strictly Necessary Cookies (Mandatory):</strong> Essential for platform security, account authentication, anti-CSRF protection, booking checkout continuity, and PDPL consent state tracking.</li>
<li><strong>2. Preference &amp; Localization Cookies (Optional):</strong> Preserve your selected language (English / Arabic), display theme (Light / Dark), and recent Saudi city/category filters.</li>
<li><strong>3. Performance &amp; Diagnostic Analytics (Optional):</strong> Gather aggregated, non-identifying metrics on page speed, map loading, and search reliability across Saudi Arabia.</li>
<li><strong>4. Security &amp; Anti-Fraud Protection (Mandatory):</strong> Safeguard Guest and Host accounts from automated scraping, rate abuse, and payment tampering.</li>
</ul>
<h2>Managing and Disabling Cookies</h2>
<p>You may manage or delete cookies anytime from your browser settings. Note that disabling strictly necessary cookies may prevent sign-in or checkout completion.</p>`,
          ar: `<h2>ما هي ملفات تعريف الارتباط؟</h2>
<p>ملفات تعريف الارتباط هي ملفات نصية صغيرة تُحفظ على متصفحك أو جهازك عند زيارة الموقع، وتمكّن منصة قاف نست من حفظ جلستك وتفضيلاتك لتقديم تجربة حجز سريعة وآمنة.</p>
<h2>تصنيف ملفات الكوكيز في المنصة</h2>
<ul>
<li><strong>١. ملفات تعريف الارتباط الأساسية (إلزامي):</strong> ضرورية لتأمين المنصة، تسجيل الدخول، الحماية من CSRF، واستقرار خطوات الدفع والحجز.</li>
<li><strong>٢. ملفات التفضيلات واللغة والمظهر (اختياري):</strong> تحفظ اختيارك للغة (العربية / الإنجليزية)، ونمط العرض (فاتح / داكن)، وآخر مدن وفئات البحث.</li>
<li><strong>٣. ملفات قياس الأداء والتحليلات التشغيلية (اختياري):</strong> تجمع مؤشرات إحصائية مجهولة الهوية لتحسين سرعة التصفح والبحث وعرض الخرائط.</li>
<li><strong>٤. ملفات الحماية ومكافحة الاحتيال (إلزامي):</strong> تحمي حسابات الضيوف والمضيفين من محاولات الدخول غير المصرح بها والتلاعب بعمليات السداد.</li>
</ul>
<h2>إدارة وتعطيل ملفات الكوكيز</h2>
<p>يمكنك إدارة أو مسح ملفات الكوكيز في أي وقت من إعدادات متصفحك، مع مراعاة أن تعطيل الملفات الأساسية قد يؤثر على تسجيل الدخول أو إتمام الحجز.</p>`,
        },
        showSection: true,
        metaTitle: { en: "Cookies Policy | QafNest", ar: "سياسة ملفات تعريف الارتباط | قاف نست" },
        metaDescription: {
          en: "Learn how QafNest uses cookies and browser storage for security, preferences, and analytics.",
          ar: "تعرف على كيفية استخدام قاف نست لملفات تعريف الارتباط للأمان والتفضيلات وتحسين الأداء.",
        },
        canonicalUrl: "https://qafnest.com/en/cookies",
        updatedAt: now,
      },
      {
        id: "leg-4",
        title: { en: "Cancellation & Refund Policy", ar: "سياسة الإلغاء والاسترداد" },
        slug: "cancellation-refund-policy",
        content: {
          en: `<h2>Cancellation &amp; Refund Policy</h2>
<p>QafNest displays the exact cancellation tier on every property page before checkout. Once payment is completed on non-refundable stays, reservations are final. For eligible cancellations or verified Host-side unavailability, refunds are returned automatically to your QafNest Wallet or original Mada/Visa/Mastercard within SAMA settlement windows.</p>`,
          ar: `<h2>سياسة الإلغاء والاسترداد</h2>
<p>تعرض منصة قاف نست سياسة الإلغاء الدقيقة في صفحة كل عقار قبل الدفع. وفي حالات الاسترداد المؤهلة أو تعذر تسليم الوحدة من قِبل المضيف، يُعاد المبلغ تلقائياً إلى محفظة قاف نست أو البطاقة الأصلية وفق المدد النظامية للبنك المركزي السعودي.</p>`,
        },
        showSection: true,
        metaTitle: { en: "Cancellation & Refund Policy | QafNest", ar: "سياسة الإلغاء والاسترداد | قاف نست" },
        metaDescription: {
          en: "Understand QafNest cancellation and automatic refund settlement policies.",
          ar: "تعرف على سياسات الإلغاء والاسترداد التلقائي في قاف نست.",
        },
        canonicalUrl: "https://qafnest.com/en/legal/cancellation-refund-policy",
        updatedAt: now,
      },
      {
        id: "leg-5",
        title: { en: "Host Licensing & Compliance Policy", ar: "سياسة تراخيص المضيفين والامتثال" },
        slug: "host-compliance-policy",
        content: {
          en: `<h2>Host Licensing &amp; Compliance Policy</h2>
<p>All short-term rentals listed on QafNest must hold a valid Saudi Ministry of Tourism accommodation permit, pass identity verification via Nafath, maintain accurate listing media and pricing, and comply with local municipal safety and quiet-hour codes.</p>`,
          ar: `<h2>سياسة تراخيص المضيفين والامتثال</h2>
<p>يجب أن تحمل جميع وحدات الضيافة المدرجة على قاف نست تصريحاً سارياً من وزارة السياحة السعودية، وأن تجتاز التحقق من الهوية عبر نفاذ، مع الالتزام بدقة الصور والأسعار ومعايير السلامة والذوق العام.</p>`,
        },
        showSection: true,
        metaTitle: { en: "Host Compliance Policy | QafNest", ar: "سياسة امتثال المضيفين | قاف نست" },
        metaDescription: {
          en: "Saudi Ministry of Tourism licensing guidelines for QafNest hosts.",
          ar: "إرشادات تراخيص وزارة السياحة لمضيفي قاف نست.",
        },
        canonicalUrl: "https://qafnest.com/en/legal/host-compliance-policy",
        updatedAt: now,
      },
    ],
    navigationLinks: [
      {
        id: "nav-1",
        title: { en: "Home", ar: "الرئيسية" },
        link: "/",
        showInNavbar: true,
        showInFooter: true,
        openInNewTab: false,
        order: 1,
      },
      {
        id: "nav-2",
        title: { en: "Explore Stays", ar: "استكشف العقارات" },
        link: "/search",
        showInNavbar: true,
        showInFooter: true,
        openInNewTab: false,
        order: 2,
      },
      {
        id: "nav-3",
        title: { en: "Blog", ar: "المدونة" },
        link: "/blog",
        showInNavbar: true,
        showInFooter: true,
        openInNewTab: false,
        order: 3,
      },
      {
        id: "nav-4",
        title: { en: "About Us", ar: "من نحن" },
        link: "/about",
        showInNavbar: true,
        showInFooter: true,
        openInNewTab: false,
        order: 4,
      },
      {
        id: "nav-5",
        title: { en: "Contact Us", ar: "تواصل معنا" },
        link: "/contact",
        showInNavbar: false,
        showInFooter: true,
        openInNewTab: false,
        order: 5,
      },
    ],
    socialLinks: [
      {
        id: "soc-1",
        platform: "Snapchat",
        url: "https://www.snapchat.com/@qafnest",
        enabled: true,
        updatedAt: now,
      },
      {
        id: "soc-2",
        platform: "Instagram",
        url: "https://www.instagram.com/qafnest/",
        enabled: true,
        updatedAt: now,
      },
      {
        id: "soc-3",
        platform: "Facebook",
        url: "https://www.facebook.com/qafnest.sa",
        enabled: true,
        updatedAt: now,
      },
      {
        id: "soc-4",
        platform: "WhatsApp",
        url: "https://wa.me/966500000000",
        enabled: true,
        updatedAt: now,
      },
    ],
    globals: {
      homeHero: {
        badge: {
          en: "Verified Saudi Hospitality · Vision 2030",
          ar: "ضيافة سعودية موثقة · رؤية 2030",
        },
        titleLine1: {
          en: "Curated Private Stays",
          ar: "إقامات خاصة استثنائية",
        },
        titleLine2: {
          en: "Built for Memorable Getaways",
          ar: "مصممة لتجارب لا تُنسى",
        },
        description: {
          en: "QafNest is Saudi Arabia's premier tech-enabled vacation rental platform offering licensed chalets, villas, farms, and smart self-check-in retreats across the Kingdom.",
          ar: "قاف نست هي المنصة الرائدة لحجز الشاليهات والفلل والمنتجعات الخاصة المرخصة في المملكة العربية السعودية بتجربة حجز فوري ودخول ذاتي ذكي.",
        },
        heroImage: "",
        profileButton: {
          label: { en: "Explore Destinations", ar: "استكشف الوجهات" },
          url: "/search",
          openInNewTab: false,
        },
        contactButton: {
          label: { en: "Contact Us", ar: "تواصل معنا" },
          url: "/contact",
          openInNewTab: false,
        },
      },
      features: {
        showSection: true,
        title: { en: "WHY CHOOSE QAFNEST?", ar: "لماذا تختار قاف نست؟" },
        subtitle: {
          en: "The hospitality standard engineered for Saudi families and travelers",
          ar: "معيار الضيافة المبتكر للعائلات والمسافرين في المملكة",
        },
        slaBadge: { en: "Licensed & Verified Stays", ar: "وحدات مرخصة وموثقة" },
        cards: [
          {
            id: "feat-1",
            badge: { en: "TECH", ar: "تقنية" },
            icon: "sparkles",
            title: { en: "Instant Book & Smart Lock PIN", ar: "حجز فوري ودخول ذاتي ذكي" },
            description: {
              en: "Confirm your stay in seconds and receive an automated smart lock access code with WhatsApp notifications.",
              ar: "أكّد حجزك خلال ثوانٍ واستلم رمز الدخول الذكي تلقائياً مع إشعارات فورية.",
            },
            metaText: { en: "Zero Waiting Time", ar: "دخول فوري بلا انتظار" },
            metaIcon: "bell",
          },
          {
            id: "feat-2",
            badge: { en: "NETWORK", ar: "التغطية" },
            icon: "globe",
            title: { en: "Comprehensive KSA Destinations", ar: "تغطية شاملة لمدن المملكة" },
            description: {
              en: "Handpicked retreats across Riyadh, Jeddah, Al-Khobar, Abha, Taif, AlUla, Makkah, and Madinah.",
              ar: "وحدات مختارة بعناية في الرياض وجدة والخبر وأبها والطائف والعلا ومكة والمدينة.",
            },
            metaText: { en: "13 Saudi Provinces", ar: "13 منطقة سعودية" },
            metaIcon: "map",
          },
          {
            id: "feat-3",
            badge: { en: "TRUST", ar: "الموثوقية" },
            icon: "shield",
            title: { en: "100% Tourism Licensed & ZATCA", ar: "مرخصة 100% ومتوافقة ضريبياً" },
            description: {
              en: "Every property holds an active Ministry of Tourism permit with instant ZATCA Phase 2 VAT invoicing.",
              ar: "كل عقار يحمل تصريحاً سارياً من وزارة السياحة مع فواتير ضريبية فورية معتمدة.",
            },
            metaText: { en: "Verified Compliance", ar: "امتثال معتمد" },
            metaIcon: "check",
          },
          {
            id: "feat-4",
            badge: { en: "PAYMENTS", ar: "المدفوعات" },
            icon: "credit-card",
            title: { en: "Mada, Apple Pay & Split Payments", ar: "مدى و Apple Pay والدفع المقسط" },
            description: {
              en: "Secure local checkout supporting Mada, Visa/Mastercard, Apple Pay, and instant wallet cashback rewards.",
              ar: "دفع آمن يدعم مدى وبطاقات الائتمان و Apple Pay مع مكافآت المحفظة الفورية.",
            },
            metaText: { en: "PCI-DSS Secured", ar: "دفع آمن ومشفر" },
            metaIcon: "lock",
          },
        ],
      },
      fleetCapabilities: {
        showSection: true,
        title: { en: "PROPERTY STANDARDS & AMENITIES", ar: "معايير الوحدات والمرافق" },
        subtitle: {
          en: "Curated categories inspected for privacy, cleanliness, and comfort",
          ar: "فئات متنوعة مفحوصة للخصوصية والنظافة والراحة القصوى",
        },
        slaBadge: { en: "Quality Inspected", ar: "جودة مفحوصة" },
        cards: [
          {
            id: "cap-1",
            badge: { en: "CHALETS", ar: "شاليهات" },
            icon: "home",
            title: { en: "Private Heated Pool Chalets", ar: "شاليهات بمسابح خاصة مدفأة" },
            description: {
              en: "Complete family privacy with outdoor majlis, BBQ zones, and climate-controlled pools.",
              ar: "خصوصية عائلية كاملة مع مجالس خارجية ومسابح مدفأة.",
            },
            metaText: { en: "Family Privacy", ar: "خصوصية تامة" },
            metaIcon: "check",
          },
          {
            id: "cap-2",
            badge: { en: "VILLAS", ar: "فلل" },
            icon: "building",
            title: { en: "Luxury Multi-Bedroom Villas", ar: "فلل فاخرة متعددة الغرف" },
            description: {
              en: "Spacious designer villas ideal for gatherings, Eid holidays, and weekend retreats.",
              ar: "فلل واسعة مثالية للتجمعات العائلية وإجازات نهاية الأسبوع.",
            },
            metaText: { en: "Up to 20 Guests", ar: "تتسع للعائلات الكبيرة" },
            metaIcon: "users",
          },
        ],
      },
      coverageNetwork: {
        showSection: true,
        title: { en: "KINGDOM-WIDE STAY NETWORK", ar: "شبكة الإقامات في جميع أنحاء المملكة" },
        description: {
          en: "Seamless access to verified chalets, villas, and seasonal destinations across Saudi Arabia",
          ar: "وصول سلس إلى أفضل الشاليهات والفلل والوجهات الموسمية في المملكة العربية السعودية",
        },
        badge: { en: "Live Instant Availability", ar: "توافر فوري مباشر" },
        highlightCards: [
          {
            id: "hl-1",
            value: "13",
            label: { en: "Saudi Regions", ar: "منطقة سعودية" },
            description: {
              en: "Complete coverage from Riyadh and Jeddah to Abha and AlUla",
              ar: "تغطية شاملة من الرياض وجدة حتى أبها والعلا",
            },
          },
          {
            id: "hl-2",
            value: "100%",
            label: { en: "Licensed Units", ar: "وحدات مرخصة" },
            description: {
              en: "Ministry of Tourism verified listings with transparent pricing",
              ar: "وحدات معتمدة من وزارة السياحة بأسعار شفافة",
            },
          },
          {
            id: "hl-3",
            value: "24/7",
            label: { en: "Concierge Support", ar: "دعم على مدار الساعة" },
            description: {
              en: "Dedicated bilingual guest and host helpline team",
              ar: "فريق دعم متخصص للضيوف والمضيفين باللغتين العربية والإنجليزية",
            },
          },
          {
            id: "hl-4",
            value: "24h",
            label: { en: "Host Settlement", ar: "تحويل أرباح المضيف" },
            description: {
              en: "Automated Saudi IBAN payouts after guest check-in",
              ar: "تسوية آلية سريعة إلى الحساب البنكي للمضيف",
            },
          },
        ],
        showSecondaryCards: true,
      },
      industries: {
        showSection: true,
        title: { en: "STAY SEGMENTS & EXPERIENCES", ar: "فئات الإقامة والتجارب" },
        subtitle: {
          en: "Tailored accommodation collections for every traveler and occasion",
          ar: "مجموعات إقامة مخصصة لكل مسافر ومناسبة",
        },
        slaBadge: { en: "All Occasions", ar: "لجميع المناسبات" },
        cards: [
          {
            id: "ind-1",
            badge: { en: "FAMILY", ar: "العائلات" },
            icon: "heart",
            title: { en: "Weekend Family Retreats", ar: "عطلات العائلات الأسبوعية" },
            description: {
              en: "Safe, private compounds with kids' play areas and private pools.",
              ar: "منتجعات آمنة وخاصة مع مناطق ألعاب أطفال ومسابح مستقلة.",
            },
            metaText: { en: "Most Popular", ar: "الأكثر طلباً" },
            metaIcon: "star",
          },
          {
            id: "ind-2",
            badge: { en: "CORPORATE", ar: "الأعمال" },
            icon: "briefcase",
            title: { en: "Executive & Bleisure Stays", ar: "إقامات رجال الأعمال" },
            description: {
              en: "High-speed fiber Wi-Fi, workspaces, and instant ZATCA company tax invoices.",
              ar: "إنترنت فائق السرعة ومساحات عمل وفواتير ضريبية فورية للشركات.",
            },
            metaText: { en: "ZATCA Ready", ar: "فواتير ضريبية فورية" },
            metaIcon: "check",
          },
        ],
      },
      contactUs: {
        phone: "+966500000000",
        address: {
          en: "Riyadh (HQ) & Jeddah Hubs, Kingdom of Saudi Arabia",
          ar: "الرياض (المقر الرئيسي) وجدة، المملكة العربية السعودية",
        },
        supportEmail: "support@qafnest.com",
        generalEmail: "info@qafnest.com",
        businessEmail: "hosts@qafnest.com",
        facebook: "https://www.facebook.com/qafnest.sa",
        instagram: "https://www.instagram.com/qafnest/",
        whatsapp: "+966500000000",
      },
      siteSeo: {
        siteName: { en: "QafNest", ar: "قاف نست" },
        defaultTitle: {
          en: "QafNest - Luxury Chalets, Villas & Vacation Stays in Saudi Arabia",
          ar: "قاف نست - حجز الشاليهات والفلل والمنتجعات الفاخرة في السعودية",
        },
        defaultDescription: {
          en: "Book verified private chalets, villas, resorts, and desert camps across Riyadh, Jeddah, Abha, Taif, and AlUla with instant confirmation on QafNest.",
          ar: "احجز أفضل الشاليهات الخاصة والفلل والمنتجعات والمخيمات المرخصة في الرياض وجدة وأبها والطائف والعلا مع تأكيد فوري عبر قاف نست.",
        },
        keywords: {
          en: "QafNest, Saudi chalets, Riyadh villas, Jeddah resorts, vacation rentals KSA, smart self check-in",
          ar: "قاف نست، شاليهات الرياض، فلل جدة، منتجعات السعودية، حجز شاليهات، دخول ذاتي",
        },
        openGraph: {
          title: {
            en: "QafNest - Curated Private Stays Across Saudi Arabia",
            ar: "قاف نست - إقامات خاصة مختارة في جميع أنحاء المملكة",
          },
          description: {
            en: "Verified Saudi hospitality with instant booking, smart check-in, and Mada/Apple Pay.",
            ar: "ضيافة سعودية موثقة مع حجز فوري ودخول ذكي ودفع عبر مدى و Apple Pay.",
          },
          url: "https://qafnest.com",
          type: "website",
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        },
        twitter: {
          handle: "@qafnest",
          card: "summary_large_image",
          title: { en: "QafNest Saudi Hospitality", ar: "قاف نست للضيافة السعودية" },
          description: {
            en: "Instant booking for private chalets and villas across KSA.",
            ar: "حجز فوري لأفضل الشاليهات والفلل في المملكة.",
          },
        },
        socialProfiles: {
          facebook: "https://www.facebook.com/qafnest.sa",
          instagram: "https://www.instagram.com/qafnest",
          linkedin: "https://linkedin.com/company/qafnest",
          twitter: "https://x.com/qafnest",
          youtube: "https://youtube.com/@qafnest",
          tiktok: "https://www.tiktok.com/@qafnest",
          pinterest: "https://pinterest.com/qafnest",
        },
        robots: {
          noIndex: false,
          noFollow: false,
        },
      },
      gtm: {
        enabled: true,
        gtmId: "GTM-QAFNEST1",
      },
      aboutUs: {
        content: {
          en: "<p><strong>Corporate Profile · Saudi Vision 2030 Hospitality Partner</strong></p><h2>Redefining Private Vacation Stays Across Saudi Arabia</h2><p>Headquartered in Riyadh, <strong>QafNest</strong> is a premier technology-driven hospitality marketplace connecting families and travelers with verified chalets, luxury villas, private farms, and desert camps across all 13 Saudi provinces.</p><h3>100% Ministry of Tourism Licensed</h3><p>Every property is reviewed and verified for compliance and quality.</p><h3>24/7 Smart Hospitality</h3><p>Instant booking confirmation, smart lock PIN codes, and bilingual concierge support.</p>",
          ar: "<p><strong>الملف التعريفي · شريك الضيافة في رؤية السعودية 2030</strong></p><h2>نعيد تعريف تجربة الإقامات الخاصة في المملكة العربية السعودية</h2><p>انطلاقاً من مقرها الرئيسي في الرياض، تقدم <strong>قاف نست</strong> منصة ضيافة تقنية رائدة تربط العائلات والمسافرين بأفضل الشاليهات والفلل والمزارع والمخيمات المرخصة في جميع مناطق المملكة.</p><h3>مرخصة 100% من وزارة السياحة</h3><p>تخضع كل وحدة لمراجعة دقيقة لضمان أعلى معايير الجودة والأمان.</p>",
        },
        metaTitle: {
          en: "About QafNest | Tech-Driven Vacation Rentals in KSA",
          ar: "عن قاف نست | منصة حجز الشاليهات والفلل في السعودية",
        },
        metaDescription: {
          en: "Learn about QafNest, Saudi Arabia's leading verified vacation rental platform for chalets, villas, and resorts.",
          ar: "تعرف على قاف نست، المنصة السعودية الرائدة لحجز الشاليهات والفلل والمنتجعات الخاصة.",
        },
        keywords: {
          en: "QafNest, about QafNest, Saudi hospitality platform, Vision 2030 tourism",
          ar: "قاف نست، عن قاف نست، منصة الضيافة السعودية، السياحة السعودية",
        },
        ogImage: "",
        noIndex: false,
        canonicalUrl: "https://qafnest.com/en/about",
      },
    },
  };
}

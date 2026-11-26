"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";
import { QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import type { PublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";
import {
  HelpCircle,
  CheckCircle2,
  CalendarCheck,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Building2,
  Headphones,
  ChevronDown,
  ChevronUp,
  Search,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";

interface FaqItem {
  id: string;
  category: string;
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
}

interface FaqCategory {
  id: string;
  num: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "booking",
    num: "01",
    labelEn: "Booking & Check-In",
    labelAr: "الحجز ومواعيد الوصول",
    descEn: "Verification procedures, check-in windows, and arrival guidelines.",
    descAr: "إجراءات تأكيد الحجز، التوثيق عبر يقين ونفاذ، وضوابط الوصول والمغادرة.",
    icon: CalendarCheck,
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
  {
    id: "smartlock",
    num: "02",
    labelEn: "Self Check-In & Smart Locks",
    labelAr: "الدخول الذاتي والأقفال الذكية",
    descEn: "Automated door access, dynamic PIN codes, and late arrivals.",
    descAr: "استلام رموز الأقفال الذكية، الدخول الآلي، ومواعيد الوصول المتأخر.",
    icon: KeyRound,
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  },
  {
    id: "deposit",
    num: "03",
    labelEn: "Security Deposit & Stay Rules",
    labelAr: "مبلغ التأمين وشروط الإقامة",
    descEn: "On-site deposit settlement, property inspection, and damage policies.",
    descAr: "طريقة تسليم واسترجاع مبلغ التأمين، فحص الوحدة، وحماية الممتلكات.",
    icon: ShieldCheck,
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
  {
    id: "cancellations",
    num: "04",
    labelEn: "Transparent Cancellation Tiers",
    labelAr: "سياسات الإلغاء الشفافة والتعويض",
    descEn: "Certified cancellation tiers, refund windows, and guest default protection.",
    descAr: "مستويات الإلغاء المعتمدة، مدد الاسترجاع البنكي، وضمان حماية النزيل.",
    icon: RefreshCw,
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  {
    id: "payments",
    num: "05",
    labelEn: "Payments & ZATCA E-Invoicing",
    labelAr: "المدفوعات والفوترة الضريبية",
    descEn: "Mada, Apple Pay, Tabby/Tamara, and 15% ZATCA tax invoices.",
    descAr: "وسائل الدفع الرقمية، تقسيط تابي وتمارا، وفواتير زاتكا الإلكترونية المعتمدة.",
    icon: CreditCard,
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
  },
  {
    id: "hosts",
    num: "06",
    labelEn: "For Verified Hosts",
    labelAr: "أسئلة المضيفين والتراخيص",
    descEn: "Ministry of Tourism permits, SARIE bank payouts, and host protection.",
    descAr: "تراخيص وزارة السياحة، تحويل المستحقات عبر سريع، وبرنامج حماية المضيف.",
    icon: Building2,
    badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
  },
  {
    id: "helpline",
    num: "07",
    labelEn: "Hospitality Helpline & Support",
    labelAr: "خدمة العملاء والحجوزات الهاتفية",
    descEn: "24/7 multi-channel assistance, dispute resolution, and urgent inquiries.",
    descAr: "قنوات التواصل على مدار الساعة، المساعدة الفورية، وتنسيق الحجوزات الطارئة.",
    icon: Headphones,
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
  },
];

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "booking",
    qEn: "What is QafNest and how does it work?",
    qAr: "ما هي منصة قاف نست وكيف تعمل؟",
    aEn: "QafNest is an electronic vacation rental platform connecting Guests with verified Hosts across chalets, villas, resorts (istirahat), apartments, farms, and desert camps. QafNest acts strictly as a secure digital intermediary ensuring identity verification, secure payments, and compliant tax invoicing.",
    aAr: "منصة قاف نست هي منصة إلكترونية سعودية تعمل كوسيط تقني يربط الضيوف بالمضيفين المعتمدين لحجز الشاليهات والفلل والاستراحات والشقق والمزارع والمخيمات، مع ضمان توثيق الهوية وأمان المدفوعات والفوترة الضريبية.",
  },
  {
    id: "faq-2",
    category: "booking",
    qEn: "How do I confirm my reservation and verify its status?",
    qAr: "كيف يُؤكد الحجز وكيف أتحقق من حالته؟",
    aEn: "No booking is confirmed until the required payment or deposit is completed electronically through supported channels. Once paid, your booking is confirmed immediately—open 'My Bookings' anytime to inspect status, stay details, and your official receipt.",
    aAr: "لا يُعد أي حجز مؤكداً نهائياً إلا بعد سداد قيمة الحجز إلكترونياً عبر وسائل الدفع المتاحة في المنصة. وبمجرد إتمام السداد يظهر الحجز فوراً في صفحة 'حجوزاتي' متضمناً التفاصيل والفاتورة الرسمية.",
  },
  {
    id: "faq-3",
    category: "booking",
    qEn: "Why is National ID / Iqama verification required when booking?",
    qAr: "لماذا يعد توثيق الهوية الوطنية أو الإقامة ورقم الجوال إلزامياً؟",
    aEn: "Under Saudi hospitality and public security regulations, guest and host identities are validated via trusted national registries (Elm Yaqeen and Nafath) alongside mobile OTP confirmation to keep residential stays safe for families and property owners.",
    aAr: "التزاماً بلوائح وزارة السياحة والضوابط الأمنية في المملكة، يتم التحقق من هوية النزيل عبر المنصات الوطنية المعتمدة (نفاذ ويقين) وتأكيد رقم الجوال لضمان بيئة إقامة آمنة وموثوقة للضيوف والمضيفين.",
  },
  {
    id: "faq-4",
    category: "booking",
    qEn: "What are the check-in/out times, and what if I arrive late?",
    qAr: "ما هي أوقات الدخول والخروج، وماذا أفعل إذا تأخرت عن الوصول؟",
    aEn: "Check-in and check-out times are set per property on the listing details page (commonly 16:00 check-in and 12:00 noon check-out unless stated otherwise). If your arrival is delayed beyond the scheduled entry window, you must contact the Host directly in advance—failing to arrive without notice remains subject to our policy.",
    aAr: "تُحدد أوقات الدخول والخروج من قِبل المضيف وتظهر بوضوح في صفحة العقار قبل الدفع (وعادة تكون الساعة ١٦:٠٠ للدخول و١٢:٠٠ ظهراً للمغادرة). في حال تأخرك عن موعد الوصول، يجب التواصل مباشرة مع المضيف لإبلاغه مسبقاً.",
  },
  {
    id: "faq-5",
    category: "booking",
    qEn: "How do I find the property location and contact the Host?",
    qAr: "كيف أعرف موقع العقار وأتواصل مع المضيف قبل الحجز وبعده؟",
    aEn: "Before booking, use the inquiry options available on the unit page. After confirmation, visit 'My Bookings', open your reservation card, and view Host contact details alongside directions/location coordinates to navigate smoothly to the property.",
    aAr: "قبل إتمام الحجز يمكنك الاستفسار عبر خيارات التواصل في صفحة الوحدة. وبعد تأكيد الحجز، انتقل إلى 'حجوزاتي' لعرض بيانات التواصل مع المضيف وموقع العقار وإحداثيات الوصول بدقة.",
  },
  {
    id: "faq-6",
    category: "smartlock",
    qEn: "How do I receive my Smart Lock PIN for Self Check-In properties?",
    qAr: "كيف أحصل على رمز القفل الذكي في وحدات الدخول الذاتي؟",
    aEn: "For units offering Keyless Self Check-In, once payment is confirmed the Host manually configures your personal Smart Lock PIN, which appears inside 'My Bookings' prior to arrival. Simply enter this code on the unit door keypad.",
    aAr: "في العقارات المزودة بخدمة الدخول الذاتي، يقوم المضيف بتعيين رمز القفل الذكي الخاص بك يدوياً بعد تأكيد الدفع ليظهر مباشرة في صفحة 'حجوزاتي' قبل موعد الدخول.",
  },
  {
    id: "faq-7",
    category: "smartlock",
    qEn: "Can I check in late at night with Self Check-In?",
    qAr: "هل يمكنني تسجيل الدخول في وقت متأخر ليلاً عبر الدخول الذاتي؟",
    aEn: "Yes. Keyless Entry listings allow arrival anytime after your scheduled check-in hour once your Host assigns your access PIN, provided you notify the Host beforehand of your late arrival time.",
    aAr: "نعم، في عقارات الدخول الذاتي يمكنك الوصول في أي ساعة بعد موعد الدخول المحدد فور تزويدك برمز القفل الذكي من المضيف، مع ضرورة تنبيه المضيف مسبقاً بموعد وصولك المتأخر.",
  },
  {
    id: "faq-8",
    category: "deposit",
    qEn: "When, how, and to whom is the security deposit paid and returned?",
    qAr: "متى ولمن يُدفع مبلغ التأمين وكيف يتم استرجاعه عند المغادرة؟",
    aEn: "Security deposit amounts vary by unit and are displayed transparently on the property page. Where applicable, the deposit is typically paid directly on-site to the Host (or their representative) prior to entry. Upon checkout, the Host inspects the property condition and returns the deposit in full provided there are no damages or policy violations.",
    aAr: "تختلف قيمة مبلغ التأمين من وحدة لأخرى وتُعرض بوضوح في تفاصيل العقار، ويُسلّم مبلغ التأمين غالباً للمضيف مباشرة عند الوصول وقبل استلام الوحدة. عند المغادرة يقوم المضيف بفحص العقار وإعادة كامل التأمين فوراً ما لم توجد تلفيات أو مخالفات.",
  },
  {
    id: "faq-9",
    category: "deposit",
    qEn: "What happens if property damages occur during a stay?",
    qAr: "ما الإجراء في حال حدوث تلفيات أو أضرار داخل العقار أثناء الإقامة؟",
    aEn: "Guests must maintain cleanliness, observe quiet hours/family rules, and protect property contents. Any verified direct damages or missing items caused during the stay are assessed against the security deposit or billed to the Guest via formal damage settlement links under QafNest's Host Protection framework.",
    aAr: "يلتزم الضيف بالمحافظة على نظافة ومحتويات الوحدة والالتزام بالذوق العام، ويتحمل المسؤولية المادية عن أي تلفيات مباشرة، حيث تُخصم من مبلغ التأمين أو تُسوى عبر فواتير برنامج حماية المضيف الموثقة.",
  },
  {
    id: "faq-10",
    category: "cancellations",
    qEn: "How do QafNest's three cancellation tiers (Flexible, Moderate, Strict) work?",
    qAr: "كيف تعمل مستويات الإلغاء الثلاثة في قاف نست (المرنة، المعتدلة، الصارمة)؟",
    aEn: "Each property transparently adopts one of three certified tiers: (1) Flexible: 100% full refund up to 24 hours prior to check-in. (2) Moderate: 100% refund up to 5 days before arrival; 50% thereafter up to 24 hours. (3) Strict: 100% refund if cancelled within 48 hours of booking (if >14 days to arrival); 50% up to 7 days prior. All approved refunds are processed automatically under SAMA banking timelines.",
    aAr: "يعتمد كل عقار أحد المستويات الثلاثة بوضوح قبل الدفع: (١) المرنة: استرداد ١٠٠٪ عند الإلغاء قبل الوصول بـ ٢٤ ساعة. (٢) المعتدلة: استرداد ١٠٠٪ قبل ٥ أيام، و٥٠٪ بعدها حتى ٢٤ ساعة. (٣) الصارمة: استرداد ١٠٠٪ خلال ٤٨ ساعة من الحجز، و٥٠٪ حتى ٧ أيام قبل الوصول. وتُعاد المبالغ المستحقة تلقائياً لحسابك وفق أنظمة ساما.",
  },
  {
    id: "faq-11",
    category: "cancellations",
    qEn: "What is the Instant Guest Protection Guarantee if a Host fails to deliver?",
    qAr: "ما هو ضمان حماية النزيل في حال تعذر تسليم العقار من قِبل المضيف؟",
    aEn: "If a Host cancels unexpectedly, fails to provide access, or the unit materially differs from verified specifications, QafNest Operations intervenes within 60 minutes with: (a) Immediate comparable or superior relocation with price difference absorbed by QafNest, (b) 100% unconditional refund to the original payment method, and (c) 10% courtesy travel credit for future stays.",
    aAr: "إذا ألغى المضيف الحجز فجأة أو تعذر تسليم الوحدة أو اختلفت عن الصور، يتدخل فريق العمليات خلال ٦٠ دقيقة بتوفير: إقامة بديلة مماثلة أو أعلى مع تحمل المنصة للفارق، أو استرداد كامل المبلغ بنسبة ١٠٠٪ فورياً، بالإضافة إلى ١٠٪ رصيد اعتذاري في محفظتك.",
  },
  {
    id: "faq-12",
    category: "payments",
    qEn: "What electronic payment methods are supported on QafNest?",
    qAr: "ما هي وسائل الدفع الإلكترونية المدعومة في قاف نست؟",
    aEn: "QafNest supports Mada, Visa, Mastercard, Apple Pay, STC Pay, SADAD / direct Saudi bank wire transfers for helpline bookings, and Sharia-compliant installment plans via Tabby and Tamara where enabled at checkout.",
    aAr: "ندعم الدفع الإلكتروني الآمن عبر بطاقات مدى، فيزا، ماستركارد، أبل باي (Apple Pay)، STC Pay، سداد/التحويل البنكي للحجوزات الهاتفية، وخدمات التقسيط المتوافقة مع الشريعة عبر تابي وتمارا عند توفرها.",
  },
  {
    id: "faq-13",
    category: "payments",
    qEn: "Are displayed prices inclusive of 15% ZATCA VAT and tax invoices?",
    qAr: "هل تشمل الأسعار ضريبة القيمة المضافة ١٥٪ وكيف أحصل على الفاتورة الضريبية؟",
    aEn: "Yes. All final checkout totals transparently display applicable 15% VAT in accordance with ZATCA regulations. You can view and print your Phase-2 compliant e-invoice containing the encrypted TLV QR code directly from 'My Bookings'.",
    aAr: "نعم، تشمل الأسعار الإجمالية عند الدفع ضريبة القيمة المضافة ١٥٪ بكل شفافية دون رسوم خفية، وتستطيع استعراض وطباعة فاتورتك الضريبية المعتمدة من هيئة الزكاة المزودة برمز QR من صفحة 'حجوزاتي'.",
  },
  {
    id: "faq-14",
    category: "hosts",
    qEn: "How do Hosts list a property, receive payouts, and use Host Protection?",
    qAr: "كيف يسجل المضيف عقاره، ومتى يستلم المستحقات، وما هو برنامج حماية المضيف؟",
    aEn: "Owners or authorized sublessors with a valid Ministry of Tourism license can list furnished, clean properties with real photos via the Host Portal. Net earnings transfer to the Host's verified Saudi IBAN within 24 hours of stay checkout via SAMA SARIE, and confirmed stays qualify for Host Protection if damage proof is submitted within 48 hours of checkout.",
    aAr: "يمكن للمالك أو المستثمر المرخص من وزارة السياحة تسجيل عقاره المفروش عبر بوابة المضيفين. تُحول المستحقات الصافية لحساب الآيبان السعودي خلال ٢٤ ساعة من تسجيل المغادرة عبر نظام سريع (ساما)، ويغطي برنامج حماية المضيف التلفيات الموثقة بالصور والفواتير خلال ٤٨ ساعة.",
  },
  {
    id: "faq-15",
    category: "helpline",
    qEn: "How can Guests or Hosts reach Customer Support for urgent assistance?",
    qAr: "كيف أتواصل مع خدمة العملاء للمساعدة الفورية أو الحجز عبر الهاتف؟",
    aEn: "Our support team is available 24/7 via phone and WhatsApp on +966576707709 or email at support@qafnest.com to help verify bookings, coordinate arrival issues, assist Hosts, or arrange helpline reservations.",
    aAr: "فريق خدمة العملاء متاح على مدار الساعة عبر الاتصال والواتساب على الرقم 0576707709 أو البريد الإلكتروني support@qafnest.com لمساعدة الضيوف والمضيفين وإتمام حجوزات الهاتف الفورية.",
  },
];

interface FaqMasterContainerProps {
  initialCms?: PublicCmsWorkspace;
}

export default function FaqMasterContainer({ initialCms }: FaqMasterContainerProps = {}) {
  const { language } = useApp();
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const { workspace: clientWorkspace } = usePublicCmsWorkspace();
  const cmsWorkspace = clientWorkspace || initialCms;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "faq-1": true,
    "faq-6": true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const cmsContact = cmsWorkspace?.globals?.contactUs;
  const rawPhone =
    cmsContact?.phone?.trim() && !cmsContact.phone.includes("500000000")
      ? cmsContact.phone.trim()
      : QAFNEST_SUPPORT_CONTACT.displayPhone;
  const displayPhone = rawPhone.startsWith("05")
    ? `+966${rawPhone.slice(1)}`
    : rawPhone.startsWith("966")
    ? `+${rawPhone}`
    : rawPhone;
  const telHref = `tel:${displayPhone.replace(/[^\d+]/g, "")}`;
  const supportEmail = cmsContact?.supportEmail?.trim() || "support@qafnest.com";

  // Merge CMS FAQs if present
  const allFaqs = useMemo<FaqItem[]>(() => {
    const cmsFaqs: FaqItem[] = (cmsWorkspace?.faqs || [])
      .filter((f) => f.enabled !== false && (f.question?.en || f.question?.ar))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      .map((f) => {
        const qLower = `${f.question?.en || ""} ${f.answer?.en || ""}`.toLowerCase();
        const inferredCategory =
          qLower.includes("host") || qLower.includes("payout")
            ? "hosts"
            : qLower.includes("cancel") || qLower.includes("refund")
            ? "cancellations"
            : qLower.includes("zatca") ||
              qLower.includes("vat") ||
              qLower.includes("payment") ||
              qLower.includes("tabby") ||
              qLower.includes("mada")
            ? "payments"
            : qLower.includes("lock") || qLower.includes("pin") || qLower.includes("smart")
            ? "smartlock"
            : qLower.includes("deposit") || qLower.includes("damage")
            ? "deposit"
            : qLower.includes("support") || qLower.includes("contact") || qLower.includes("helpline")
            ? "helpline"
            : "booking";
        return {
          id: f.id,
          category: f.category || inferredCategory,
          qEn: f.question?.en || f.question?.ar || "",
          qAr: f.question?.ar || f.question?.en || "",
          aEn: f.answer?.en || f.answer?.ar || "",
          aAr: f.answer?.ar || f.answer?.en || "",
        };
      });

    if (cmsFaqs.length >= 10) return cmsFaqs;
    if (cmsFaqs.length > 0) {
      return [
        ...cmsFaqs,
        ...DEFAULT_FAQS.filter(
          (df) => !cmsFaqs.some((cf) => cf.id === df.id || cf.qEn.toLowerCase() === df.qEn.toLowerCase())
        ),
      ];
    }
    return DEFAULT_FAQS;
  }, [cmsWorkspace?.faqs]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allFaqs.length };
    for (const f of allFaqs) {
      counts[f.category] = (counts[f.category] || 0) + 1;
    }
    return counts;
  }, [allFaqs]);

  // Filtered FAQs based on search and active category
  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((f) => {
      if (activeCategory !== "all" && f.category !== activeCategory && !searchTerm.trim()) {
        // In full scroll mode, we keep all visible, but if search is active filter
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        f.qEn.toLowerCase().includes(q) ||
        f.qAr.toLowerCase().includes(q) ||
        f.aEn.toLowerCase().includes(q) ||
        f.aAr.toLowerCase().includes(q)
      );
    });
  }, [allFaqs, activeCategory, searchTerm]);

  // Group displayed FAQs by category for clean section layout
  const groupedSections = useMemo(() => {
    const groups: Array<{ category: FaqCategory; items: FaqItem[] }> = [];
    for (const cat of FAQ_CATEGORIES) {
      const items = filteredFaqs.filter((f) => f.category === cat.id);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [filteredFaqs]);

  // ScrollSpy / IntersectionObserver to track visible category as user scrolls
  useEffect(() => {
    if (searchTerm.trim()) return;

    // Listen to hash changes on initial mount
    const currentHash = window.location.hash.replace("#", "").replace("cat-", "");
    if (currentHash && FAQ_CATEGORIES.some((c) => c.id === currentHash)) {
      setActiveCategory(currentHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target?.id) {
          const catId = visible.target.id.replace("cat-", "");
          setActiveCategory(catId);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    FAQ_CATEGORIES.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [allFaqs, searchTerm]);

  const handleSelectCategory = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveCategory(catId);
    if (catId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.history.pushState) {
        window.history.pushState(null, "", window.location.pathname);
      }
    } else {
      const target = document.getElementById(`cat-${catId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (window.history.pushState) {
          window.history.pushState(null, "", `#cat-${catId}`);
        }
      }
    }
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const f of filteredFaqs) next[f.id] = true;
    setOpenItems(next);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
      {/* Header: Unified with Policy Charter architecture */}
      <header className="mb-10 sm:mb-12 border-b border-slate-200/80 dark:border-white/10 pb-8 sm:pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-4">
          <HelpCircle className="w-3.5 h-3.5 text-[#4F2396] dark:text-violet-300" />
          <span>{label("Official Knowledge Base & Help Desk", "مركز المساعدة وقاعدة المعرفة المعتمدة")}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25]">
          {label("Frequently Asked Questions", "الأسئلة المتكررة ودليل الضيافة الموحد")}
        </h1>

        <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {label(
            "Clear, instant, and transparent answers for Guests and Hosts regarding verified reservations, security deposits, keyless entry PINs, cancellation tiers, and electronic ZATCA invoicing.",
            "إجابات فورية وواضحة وشاملة للضيوف والمضيفين حول الحجوزات المعتمدة، مبالغ التأمين، رموز الدخول الذاتي، سياسات الإلغاء الشفافة، والفوترة الإلكترونية المعتمدة في المملكة."
          )}
        </p>

        {/* Regulatory & Service Credential Badges */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("24/7 Hospitality Support", "دعم فني وضيافة ٢٤/٧")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("Ministry of Tourism Standards", "معايير وزارة السياحة")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("Keyless Self Check-In", "دخول ذاتي ذكي ومعتمد")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label("SAMA & ZATCA Compliant", "متوافق مع ساما وهيئة الزكاة")}</span>
          </div>
        </div>
      </header>

      {/* Master 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] xl:grid-cols-[350px_1fr] gap-8 xl:gap-12 items-start">
        {/* Column 1: Sticky Navigation & Helpdesk Sidebar */}
        <aside className="lg:sticky lg:top-28 space-y-4">
          {/* Categories Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/10">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {label("Question Topics", "فهرس الأسئلة والمواضيع")}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {allFaqs.length} {label("Questions", "سؤال")}
              </span>
            </div>

            <nav aria-label={label("FAQ Categories", "تصنيفات الأسئلة")} className="space-y-1.5">
              <button
                type="button"
                onClick={(e) => handleSelectCategory("all", e)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition group cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-[#4F2396] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Sparkles
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      activeCategory === "all"
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                    }`}
                  />
                  <span className="text-start leading-snug">{label("All Questions", "جميع الأسئلة")}</span>
                </div>
                <span
                  className={`text-[11px] font-mono shrink-0 ms-2 transition-colors ${
                    activeCategory === "all" ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  {categoryCounts.all || 0}
                </span>
              </button>

              {FAQ_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={(e) => handleSelectCategory(cat.id, e)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition group cursor-pointer ${
                      isActive
                        ? "bg-[#4F2396] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                        }`}
                      />
                      <span className="text-start leading-snug whitespace-normal">
                        {label(cat.labelEn, cat.labelAr)}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono shrink-0 ms-2 transition-colors ${
                        isActive ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 24/7 Hospitality Concierge Box (Matches Policy Sidebar) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 text-xs space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <Headphones className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
              <span>{label("Hospitality Concierge", "خدمة العناية بالنزلاء")}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {label(
                "Need help with a booking or have an unanswered question? Our verified Saudi support team is available 24/7.",
                "هل لديك استفسار إضافي أو تحتاج مساعدة فورية في حجزك؟ فريق خدمة النزلاء في قاف نست متاح على مدار الساعة."
              )}
            </p>
            <div className="pt-1 flex flex-col gap-1.5 font-semibold">
              <a
                href={telHref}
                className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
              >
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{label("Phone / Support:", "الهاتف المباشر:")}</span>
                </span>
                <span dir="ltr">{displayPhone}</span>
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
              >
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>{label("Direct Email:", "البريد الإلكتروني:")}</span>
                </span>
                <span>{supportEmail}</span>
              </a>
            </div>
          </div>
        </aside>

        {/* Column 2: Continuous Content Area */}
        <div className="space-y-6">
          {/* Top Search & Actions Bar */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-[#4F2396] dark:text-violet-300 shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={label(
                  "Search any question or keyword (e.g. self check-in, deposit, refund, VAT)...",
                  "ابحث عن أي سؤال أو كلمة مفتاحية (مثل: الدخول الذاتي، التأمين، الاسترداد، الضريبة)..."
                )}
                className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base focus:outline-hidden focus:ring-0"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  {label("Clear", "مسح")}
                </button>
              )}
            </div>

            {/* Quick Filter Info & Accordion Toggle Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  {label("Showing", "عرض")}{" "}
                  <strong className="text-slate-900 dark:text-white">{filteredFaqs.length}</strong>{" "}
                  {label("questions", "سؤال")}
                </span>
                {searchTerm && (
                  <span className="text-purple-600 dark:text-violet-400 font-semibold">
                    ({label("filtered by search", "نتائج مخصصة للبحث")})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-slate-900 dark:hover:text-white transition font-medium cursor-pointer"
                >
                  {label("Expand All", "فتح الكل")}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-slate-900 dark:hover:text-white transition font-medium cursor-pointer"
                >
                  {label("Collapse All", "إغلاق الكل")}
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Sections */}
          {groupedSections.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-12 text-center shadow-xs space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {label("No matching questions found", "لم نجد نتائج مطابقة لبحثك")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {label(
                  "Try searching with broader terms or choose another category from the sidebar navigation.",
                  "جرب البحث بكلمات عامة أو اختر تصنيفاً آخر من القائمة الجانبية."
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory("all");
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#4F2396] text-white hover:bg-violet-800 transition cursor-pointer"
              >
                {label("Reset Filters", "إعادة ضبط البحث")}
              </button>
            </div>
          ) : (
            groupedSections.map((group) => {
              const cat = group.category;
              const Icon = cat.icon;

              return (
                <article
                  id={`cat-${cat.id}`}
                  key={cat.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-8 shadow-xs space-y-6"
                >
                  {/* Category Section Header (Matches Policy Charter Chapters) */}
                  <header className="pb-5 border-b border-slate-100 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-400">
                        {label(`Section ${cat.num}`, `القسم ${cat.num}`)}
                      </span>
                      <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${cat.badgeColor}`}>
                        {label(cat.labelEn, cat.labelAr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-[#4F2396] dark:text-violet-300 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                          {label(cat.labelEn, cat.labelAr)}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {label(cat.descEn, cat.descAr)}
                        </p>
                      </div>
                    </div>
                  </header>

                  {/* FAQ Accordion Items */}
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const isOpen = Boolean(openItems[item.id]);

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden transition"
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className="w-full p-4 sm:p-5 text-start flex items-center justify-between gap-4 hover:bg-slate-100/50 dark:hover:bg-white/5 transition cursor-pointer"
                          >
                            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                              {label(item.qEn, item.qAr)}
                            </span>
                            <span
                              className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                isOpen
                                  ? "bg-[#4F2396] text-white"
                                  : "bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="px-4 sm:px-5 pb-5 pt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-white/10 leading-relaxed space-y-2">
                              <p className="whitespace-pre-line">{label(item.aEn, item.aAr)}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

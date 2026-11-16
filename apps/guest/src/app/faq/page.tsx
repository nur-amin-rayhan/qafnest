"use client";

import React, { useState } from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function FaqPage() {
  const { language } = useApp();
  const label = (en: string, ar: string) => (language === "ar" ? ar : en);

  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ "faq-1": true });
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "all", labelEn: "All Questions", labelAr: "جميع الأسئلة" },
    { id: "booking", labelEn: "Booking & Check-In", labelAr: "الحجز والوصول" },
    { id: "deposit", labelEn: "Security Deposit & Stay", labelAr: "مبلغ التأمين والإقامة" },
    { id: "smartlock", labelEn: "Self Check-In", labelAr: "الدخول الذاتي والأقفال" },
    { id: "cancellations", labelEn: "Cancellation Policy", labelAr: "الإلغاء والتأجيل" },
    { id: "payments", labelEn: "Payments & VAT", labelAr: "الدفع والفواتير" },
    { id: "hosts", labelEn: "For Hosts", labelAr: "أسئلة المضيفين" },
    { id: "helpline", labelEn: "Support & Helpline", labelAr: "خدمة العملاء" },
  ];

  const faqs = [
    {
      id: "faq-1",
      category: "booking",
      qEn: "How does QafNest work and is it licensed by the Ministry of Tourism?",
      qAr: "ما هي منصة قاف نست وهل هي مرخصة رسمياً من وزارة السياحة؟",
      aEn: "QafNest is an electronic vacation rental platform licensed by the Saudi Ministry of Tourism (License #73102999) connecting Guests with verified Hosts across chalets, villas, resorts (istirahat), apartments, farms, and desert camps. QafNest acts strictly as an authorized digital intermediary ensuring identity verification, secure payments, and compliant tax invoicing.",
      aAr: "منصة قاف نست هي منصة إلكترونية سعودية مرخصة من وزارة السياحة (ترخيص رقم 73102999) تعمل كوسيط تقني يربط الضيوف بالمضيفين المعتمدين لحجز الشاليهات والفلل والاستراحات والشقق والمزارع والمخيمات، مع ضمان توثيق الهوية وأمان المدفوعات والفوترة الضريبية.",
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
      aEn: "Check-in and check-out times are set per property on the listing details page (commonly 16:00 check-in and 12:00 noon check-out unless stated otherwise). If your arrival is delayed beyond the scheduled entry window, you must contact the Host directly in advance—failing to arrive without notice remains subject to our non-refundable policy.",
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
      category: "deposit",
      qEn: "When, how, and to whom is the security deposit paid and returned?",
      qAr: "متى ولمن يُدفع مبلغ التأمين وكيف يتم استرجاعه عند المغادرة؟",
      aEn: "Security deposit amounts vary by unit and are displayed transparently on the property page. Where applicable, the deposit is typically paid directly on-site to the Host (or their representative) prior to entry. Upon checkout, the Host inspects the property condition and returns the deposit in full provided there are no damages or policy violations.",
      aAr: "تختلف قيمة مبلغ التأمين من وحدة لأخرى وتُعرض بوضوح في تفاصيل العقار، ويُسلّم مبلغ التأمين غالباً للمضيف مباشرة عند الوصول وقبل استلام الوحدة. عند المغادرة يقوم المضيف بفحص العقار وإعادة كامل التأمين فوراً ما لم توجد تلفيات أو مخالفات.",
    },
    {
      id: "faq-7",
      category: "smartlock",
      qEn: "How do I receive my Smart Lock PIN for Self Check-In properties?",
      qAr: "كيف أحصل على رمز القفل الذكي في وحدات الدخول الذاتي؟",
      aEn: "For units offering Keyless Self Check-In, once payment is confirmed the Host manually configures your personal Smart Lock PIN, which appears inside 'My Bookings' prior to arrival. Simply enter this code on the unit door keypad.",
      aAr: "في العقارات المزودة بخدمة الدخول الذاتي، يقوم المضيف بتعيين رمز القفل الذكي الخاص بك يدوياً بعد تأكيد الدفع ليظهر مباشرة في صفحة 'حجوزاتي' قبل موعد الدخول.",
    },
    {
      id: "faq-8",
      category: "smartlock",
      qEn: "Can I check in late at night with Self Check-In?",
      qAr: "هل يمكنني تسجيل الدخول في وقت متأخر ليلاً عبر الدخول الذاتي؟",
      aEn: "Yes. Keyless Entry listings allow arrival anytime after your scheduled check-in hour once your Host assigns your access PIN, provided you notify the Host beforehand of your late arrival time.",
      aAr: "نعم، في عقارات الدخول الذاتي يمكنك الوصول في أي ساعة بعد موعد الدخول المحدد فور تزويدك برمز القفل الذكي من المضيف، مع ضرورة تنبيه المضيف مسبقاً بموعد وصولك المتأخر.",
    },
    {
      id: "faq-9",
      category: "cancellations",
      qEn: "Can a confirmed booking be cancelled, postponed, or refunded?",
      qAr: "هل يمكن إلغاء الحجز أو تأجيله أو استرداد المبلغ بعد الدفع؟",
      aEn: "The reservation cannot be cancelled or postponed. Once payment is completed on QafNest, reservations are strictly final and non-refundable (0%). Please verify dates, guest capacity, and house rules before payment. Exceptional verified cases of Host-side unit unavailability are handled directly by QafNest Operations.",
      aAr: "لا يمكن إلغاء الحجز أو تأجيله. بمجرد إتمام السداد عبر قاف نست يصبح الحجز نهائياً وغير قابل للاسترداد (٠٪)، لذا يرجى مراجعة التواريخ والشروط بدقة قبل الدفع. وتتعامل إدارة العمليات مباشرة مع الحالات النادرة الموثقة لتعذر تسليم الوحدة من قِبل المضيف.",
    },
    {
      id: "faq-10",
      category: "deposit",
      qEn: "What happens if property damages occur during a stay?",
      qAr: "ما الإجراء في حال حدوث تلفيات أو أضرار داخل العقار أثناء الإقامة؟",
      aEn: "Guests must maintain cleanliness, observe quiet hours/family rules, and protect property contents. Any verified direct damages or missing items caused during the stay are assessed against the security deposit or billed to the Guest via formal damage settlement links under QafNest's Host Protection framework.",
      aAr: "يلتزم الضيف بالمحافظة على نظافة ومحتويات الوحدة والالتزام بالذوق العام، ويتحمل المسؤولية المادية عن أي تلفيات مباشرة، حيث تُخصم من مبلغ التأمين أو تُسوى عبر فواتير برنامج حماية المضيف الموثقة.",
    },
    {
      id: "faq-11",
      category: "payments",
      qEn: "What electronic payment methods are supported on QafNest?",
      qAr: "ما هي وسائل الدفع الإلكترونية المدعومة في قاف نست؟",
      aEn: "QafNest supports Mada, Visa, Mastercard, Apple Pay, STC Pay, SADAD / direct Saudi bank wire transfers for helpline bookings, and Sharia-compliant installment plans via Tabby and Tamara where enabled at checkout.",
      aAr: "ندعم الدفع الإلكتروني الآمن عبر بطاقات مدى، فيزا، ماستركارد، أبل باي (Apple Pay)، STC Pay، سداد/التحويل البنكي للحجوزات الهاتفية، وخدمات التقسيط المتوافقة مع الشريعة عبر تابي وتمارا عند توفرها.",
    },
    {
      id: "faq-12",
      category: "payments",
      qEn: "Are displayed prices inclusive of 15% ZATCA VAT and tax invoices?",
      qAr: "هل تشمل الأسعار ضريبة القيمة المضافة ١٥٪ وكيف أحصل على الفاتورة الضريبية؟",
      aEn: "Yes. All final checkout totals transparently display applicable 15% VAT in accordance with ZATCA regulations. You can view and print your Phase-2 compliant e-invoice containing the encrypted TLV QR code directly from 'My Bookings'.",
      aAr: "نعم، تشمل الأسعار الإجمالية عند الدفع ضريبة القيمة المضافة ١٥٪ بكل شفافية دون رسوم خفية، وتستطيع استعراض وطباعة فاتورتك الضريبية المعتمدة من هيئة الزكاة المزودة برمز QR من صفحة 'حجوزاتي'.",
    },
    {
      id: "faq-13",
      category: "hosts",
      qEn: "How do Hosts list a property, receive payouts, and use Host Protection?",
      qAr: "كيف يسجل المضيف عقاره، ومتى يستلم المستحقات، وما هو برنامج حماية المضيف؟",
      aEn: "Owners or authorized sublessors with a valid Ministry of Tourism license can list furnished, clean properties with real photos via the Host Portal (in English & Arabic). Net earnings (after standard platform commission & VAT) transfer to the Host's verified Saudi IBAN within 24–48 hours of stay settlement, and confirmed stays qualify for Host Protection if damage proof (photos/videos and repair invoices) is submitted within 48 hours of checkout.",
      aAr: "يمكن للمالك أو المستثمر المفوض تسجيل عقاره المفروش والجاهز بصور واقعية ورقم ترخيص وزارة السياحة عبر بوابة المضيفين. تُحول المستحقات الصافية بعد عمولة المنصة إلى حساب الآيبان السعودي المعتمد خلال ٢٤ إلى ٤٨ ساعة من التسوية، كما يغطي برنامج حماية المضيف التلفيات المباشرة الموثقة بالصور والفواتير خلال ٤٨ ساعة من المغادرة.",
    },
    {
      id: "faq-14",
      category: "helpline",
      qEn: "How can Guests or Hosts reach Customer Support for urgent assistance?",
      qAr: "كيف أتواصل مع خدمة العملاء للمساعدة الفورية أو الحجز عبر الهاتف؟",
      aEn: "Our support team is available 24/7 via phone and WhatsApp on 0576707709 or email at support@qafnest.com to help verify bookings, coordinate arrival issues, assist Hosts, or arrange helpline reservations.",
      aAr: "فريق خدمة العملاء متاح على مدار الساعة عبر الاتصال والواتساب على الرقم 0576707709 أو البريد الإلكتروني support@qafnest.com لمساعدة الضيوف والمضيفين وإتمام حجوزات الهاتف الفورية.",
    },
  ];

  const filteredFaqs = faqs.filter((f) => {
    if (activeCategory !== "all" && f.category !== activeCategory) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.qEn.toLowerCase().includes(q) ||
      f.qAr.toLowerCase().includes(q) ||
      f.aEn.toLowerCase().includes(q) ||
      f.aAr.toLowerCase().includes(q)
    );
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE] dark:bg-[#08070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 sm:pb-14">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-violet-800 text-white p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-violet-300" />
              {label("Knowledge Base & Help Desk", "مركز المساعدة والأسئلة الشائعة")}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {label("Frequently Asked Questions", "الأسئلة المتكررة")}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-violet-100 leading-relaxed">
              {label(
                "Clear answers for Guests and Hosts regarding bookings, security deposits, check-in, self-entry PINs, non-cancellation terms, ZATCA invoices, and payouts on QafNest.",
                "إجابات واضحة وشاملة للضيوف والمضيفين حول الحجوزات، مبلغ التأمين، مواعيد الدخول، سياسة عدم الإلغاء، طرق الدفع والفواتير، وبرنامج حماية المضيف في قاف نست."
              )}
            </p>

            {/* Search Input */}
            <div className="mt-6 relative max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={label("Search question or keyword...", "ابحث عن سؤال أو كلمة مفتاحية...")}
                className="w-full h-11 ps-10 pe-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-violet-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-white/40 backdrop-blur-md"
              />
              <Search className="w-4 h-4 text-violet-200 absolute start-3.5 top-3.5" />
            </div>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeCategory === c.id
                  ? "bg-[#4F2396] text-white shadow-xs"
                  : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10"
              }`}
            >
              {label(c.labelEn, c.labelAr)}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">{label("No matching questions found.", "لم يتم العثور على نتائج مطابقة للبحث.")}</p>
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const isOpen = Boolean(openItems[item.id]);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101a] shadow-2xs overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-5 text-start flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {label(item.qEn, item.qAr)}
                    </span>
                    <span className="p-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-white/10 leading-relaxed">
                      {label(item.aEn, item.aAr)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

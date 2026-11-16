"use client";

import React, { useState } from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { FileText, Shield, Clock, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  const { language } = useApp();
  const label = (en: string, ar: string) => (language === "ar" ? ar : en);
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", titleEn: "1. Binding Agreement & Platform Role", titleAr: "١. الاتفاقية ودور المنصة الوسيط" },
    { id: "eligibility", titleEn: "2. Eligibility, Guest & Host Accounts", titleAr: "٢. الأهلية وحسابات الضيف والمضيف" },
    { id: "booking-rules", titleEn: "3. Booking Confirmation & Stay Rules", titleAr: "٣. تأكيد الحجز وقواعد الإقامة" },
    { id: "smart-locks", titleEn: "4. Security Deposit & Self Check-In", titleAr: "٤. مبلغ التأمين والدخول الذاتي" },
    { id: "cancellations", titleEn: "5. Cancellation & Modification Policy", titleAr: "٥. سياسة الإلغاء والتأجيل والاسترداد" },
    { id: "financials", titleEn: "6. Service Fees, Payouts & 15% VAT", titleAr: "٦. العمولة والمستحقات وضريبة القيمة المضافة" },
    { id: "host-rules", titleEn: "7. Host Standards & Host Protection", titleAr: "٧. معايير العقار وبرنامج حماية المضيف" },
    { id: "guest-conduct", titleEn: "8. Guest Conduct, Rules & Damage Liability", titleAr: "٨. التزامات الضيف والمسؤولية عن الأضرار" },
    { id: "intellectual-property", titleEn: "9. Intellectual Property & Indemnification", titleAr: "٩. الملكية الفكرية والتعويض النظامي" },
    { id: "governance", titleEn: "10. Updates, Governing Law & Disputes", titleAr: "١٠. التعديلات والنظام الحاكم والنزاعات" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFE] dark:bg-[#08070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 sm:pb-14">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#4F2396] via-[#6B2BB8] to-[#904BE6] text-white p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs mb-3">
              <FileText className="w-3.5 h-3.5" />
              {label("Official Regulatory Agreement", "وثيقة الشروط والأحكام الرسمية")}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {label("Terms and Conditions of Use", "الشروط والأحكام العامة للمنصة")}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-violet-100 leading-relaxed">
              {label(
                "These Terms constitute a binding agreement governing access to and use of the QafNest marketplace for booking and listing licensed vacation homes, chalets, villas, apartments, farms, and camps in the Kingdom of Saudi Arabia.",
                "تمثل هذه الوثيقة اتفاقية قانونية ملزمة تنظم استخدام منصة قاف نست لحجز وتأجير بيوت العطلات والشاليهات والفلل والاستراحات والمزارع والمخيمات داخل المملكة العربية السعودية."
              )}
            </p>
            <div className="mt-4 text-xs text-violet-200">
              <span>{label("Last Revised: November 2026", "آخر تحديث: جمادى الأولى ١٤٤٨هـ / نوفمبر ٢٠٢٦م")}</span>
              <span className="mx-2">•</span>
              <span>{label("Compliant with Ministry of Tourism & Saudi PDPL", "متوافق مع لوائح وزارة السياحة ونظام حماية البيانات")}</span>
            </div>
          </div>
        </div>

        {/* Layout Grid: Sidebar Navigation + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Sticky Nav Sidebar */}
          <aside className="hidden lg:block sticky top-24 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-3 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              {label("Table of Contents", "فهرس البنود")}
            </h2>
            <nav className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                    activeSection === s.id
                      ? "bg-violet-50 text-[#4F2396] font-bold dark:bg-violet-950/40 dark:text-violet-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{label(s.titleEn, s.titleAr)}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Terms Content */}
          <div className="space-y-8 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101a] p-6 sm:p-10 shadow-xs">
            {/* Section 1 */}
            <section id="overview" className="space-y-3 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <span>{label("Binding Agreement & Platform Role", "الاتفاقية الملزمة ودور المنصة الوسيط")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "Accessing, browsing, or registering on QafNest constitutes your unconditional agreement to these Terms, our Privacy Policy, and all supplemental policies published on the Platform, effective from first use or account creation.",
                    "يُعد دخولك إلى منصة قاف نست أو تصفحك أو تسجيلك فيها موافقةً تامة ودون قيد أو شرط على هذه الشروط والأحكام وسياسة الخصوصية وجميع السياسات المكملة المنشورة على المنصة، وتكون سارية من تاريخ الاستخدام أو التسجيل."
                  )}
                </p>
                <p>
                  {label(
                    "QafNest ('Platform', 'We', or 'Us') operates strictly as an electronic hospitality intermediary licensed by the Saudi Ministry of Tourism (License #73102999), connecting property owners and authorized lessors ('Hosts') with travelers ('Guests') across chalets, private villas, resorts (istirahat), apartments, farms, and camps.",
                    "تعمل منصة قاف نست ('المنصة' أو 'نحن') كوسيط إلكتروني تقني مرخص من وزارة السياحة في المملكة العربية السعودية (ترخيص رقم 73102999) يربط بين مالكي ومشغلي الوحدات السكنية ('المضيفين') والباحثين عن إقامات سياحية قصيرة ('الضيوف') من شاليهات وفلل واستراحات وشقق ومزارع ومخيمات."
                  )}
                </p>
                <p>
                  {label(
                    "QafNest does not directly own, physically operate, or possess listed residential properties. Every confirmed booking establishes a direct accommodation rental relationship between the Guest and the Host, supported by QafNest's digital booking, payment, invoicing, and verification infrastructure.",
                    "لا تمتلك منصة قاف نست أي من العقارات المعروضة ولا تتولى تشغيلها ميدانياً بشكل مباشر، وينشئ كل حجز مؤكد علاقة تعاقدية مباشرة للإقامة بين الضيف والمضيف، مع توفير المنصة لبنية الحجز الإلكتروني والتوثيق والدفع والفوترة والدعم."
                  )}
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="eligibility" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <span>{label("Eligibility, Guest & Host Accounts & Identity Verification", "الأهلية وحسابات الضيف والمضيف وتوثيق الهوية")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "Users must be at least 18 years old and possess full legal capacity under the laws of the Kingdom of Saudi Arabia. Guests use their accounts to search units, review stay details, pay securely electronically, and manage confirmed reservations. Hosts may register only if they legally own the unit or hold explicit written authorization/contract from the property owner permitting short-term tourist rental.",
                    "يُشترط في كل مستخدم ألا يقل عمره عن ١٨ عاماً وأن يتمتع بالأهلية النظامية الكاملة وفق أنظمة المملكة. يتيح حساب الضيف استعراض الوحدات وإتمام الحجز وسداد المستحقات إلكترونياً، بينما لا يُسمح بتسجيل المضيف إلا للمالك النظامي أو المستثمر الحاصل على تفويض أو عقد صريح يخول له التأجير السياحي."
                  )}
                </p>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <span>{label("Mandatory National Identity & Phone Verification", "التوثيق الإلزامي للهوية الوطنية ورقم الجوال")}</span>
                  </div>
                  <p>
                    {label(
                      "In compliance with Saudi hospitality and public security regulations, guest and host identities may be verified through competent national platforms (Elm Yaqeen / Nafath) using a valid 10-digit National ID or Iqama alongside mobile OTP confirmation to maintain a safe environment for families and property owners.",
                      "امتثالاً لاشتراطات وزارة السياحة والجهات الأمنية بالمملكة، يتم توثيق بيانات الضيوف والمضيفين عبر المنصات الرسمية المعتمدة (نفاذ ويقين) برقم الهوية الوطنية أو الإقامة وتأكيد الجوال عبر رمز التحقق (OTP) لضمان بيئة إقامة آمنة وموثوقة للجميع."
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="booking-rules" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <span>{label("Booking Confirmation & Stay Rules", "تأكيد الحجز وقواعد الإقامة والوصول")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <ul className="list-disc list-inside space-y-1.5 marker:text-violet-600">
                  <li>
                    <strong>{label("Electronic Booking Confirmation: ", "تأكيد الحجز الإلكتروني: ")}</strong>
                    {label("No reservation is confirmed until the required payment is completed through QafNest's authorized electronic payment methods (Mada, Visa, Mastercard, Apple Pay, STC Pay, SADAD, or Tabby/Tamara installments where available). Confirmation creates a binding booking summary and tax receipt in 'My Bookings'.", "لا يُؤكد أي حجز نهائياً إلا بعد إتمام دفع قيمة الحجز إلكترونياً عبر وسائل الدفع المعتمدة في المنصة (مدى، فيزا، ماستركارد، أبل باي، STC Pay، سداد، أو خيارات التقسيط المتاحة)، ويظهر ملخص الحجز والفاتورة مباشرة في 'حجوزاتي'.")}
                  </li>
                  <li>
                    <strong>{label("Check-In, Check-Out & Late Arrival Notice: ", "مواعيد الدخول والمغادرة وإشعار التأخر: ")}</strong>
                    {label("Check-in and check-out hours vary by property and are displayed clearly on each unit's page before booking. Standard overnight stays typically open at 16:00 and close at 12:00 noon Riyadh time unless stated otherwise. If a Guest expects to arrive later than the scheduled check-in time, the Guest must contact the Host directly in advance; uncoordinated no-shows do not qualify for refunds.", "تلتزم الأطراف بمواعيد الدخول والخروج المحددة من قِبل المضيف في صفحة كل وحدة (ويكون الدخول الافتراضي عادة ١٦:٠٠ والمغادرة ١٢:٠٠ ظهراً ما لم يحدد المضيف خلاف ذلك). وفي حال تأخر الضيف عن موعد الوصول المحدد، يجب التواصل مباشرة مع المضيف لإبلاغه، ولا يترتب على عدم الحضور أي استرداد.")}
                  </li>
                  <li>
                    <strong>{label("Unit Location & Host Contact: ", "موقع العقار والتواصل مع المضيف: ")}</strong>
                    {label("Following confirmation, full unit directions/coordinates and Host communication channels are unlocked inside 'My Bookings'. Assisted bookings made via helpline holds release automatically if payment is not settled within the designated hold window.", "بعد تأكيد الحجز تتاح إحداثيات الموقع وبيانات التواصل مع المضيف في صفحة 'حجوزاتي'. أما الحجوزات المعلقة عبر الهاتف بانتظار الدفع فتُحجز مؤقتاً خلال المهلة المحددة ثم تتحرر تلقائياً إذا لم يُستكمل السداد.")}
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="smart-locks" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  4
                </span>
                <span>{label("Security Deposit & Keyless Access", "مبلغ التأمين والدخول الذاتي")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "Security Deposit Terms: Any security deposit amount specified by the Host is displayed transparently on the property listing prior to checkout. Unless collected electronically in advance under unit terms, the security deposit is typically paid directly on-site to the Host (or their authorized representative) prior to property handover and is returned by the Host at checkout upon inspecting the unit and verifying compliance with house rules.",
                    "مبلغ التأمين المسترد: تختلف قيمة مبلغ التأمين من عقار لآخر وتُوضح في صفحة الوحدة قبل الحجز. ما لم تنص شروط الوحدة على سداده إلكترونياً، يُدفع مبلغ التأمين مباشرة للمضيف (أو من ينوب عنه) عند الوصول وقبل تسليم الوحدة، ويكون المضيف مسؤولاً عن فحص العقار وإعادة كامل التأمين عند المغادرة حال عدم وجود تلفيات أو مخالفات."
                  )}
                </p>
                <p>
                  {label(
                    "Smart Locks & Self Check-In: Units offering Keyless Access provide a personal Smart Lock PIN manually configured by the Host prior to arrival and visible in 'My Bookings'. Access codes are strictly personal, confidential, and non-transferable to unauthorized third parties.",
                    "الدخول الذاتي والأقفال الذكية: في الوحدات الداعمة للدخول الذكي، يقوم المضيف بتعيين رمز القفل الذكي يدوياً قبل موعد الوصول ويظهر مباشرة في صفحة 'حجوزاتي'. يُعد الرمز شخصياً وسرياً، ويلتزم الضيف بعدم مشاركته مع غير المصرح لهم."
                  )}
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="cancellations" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  5
                </span>
                <span>{label("Cancellation, Modification & Non-Refundable Policy", "سياسة الإلغاء والتأجيل والاسترداد")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  {label(
                    "Unlike multi-tier flexible marketplaces, QafNest applies a single, crystal-clear reservation commitment rule clearly presented on every listing page and checkout screen prior to payment:",
                    "حرصاً على وضوح الالتزامات وتثبيت حجوزات المضيفين والضيوف بدقة، تطبق قاف نست سياسة حجز واضحة وموحدة تُعرض أمام الضيف قبل إتمام الدفع:"
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-950/20 space-y-1.5">
                    <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{label("Strict No-Cancellation & No-Postponement Rule", "منع الإلغاء والتأجيل بعد الدفع")}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      {label(
                        "The reservation cannot be cancelled or postponed. Once payment is completed on QafNest, the booking becomes strictly final and non-refundable (0% refund).",
                        "لا يمكن إلغاء الحجز أو تأجيله. بمجرد إتمام الدفع عبر قاف نست، يصبح الحجز مؤكداً ونهائياً وغير قابل للاسترداد (٠٪)."
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-950/20 space-y-1.5">
                    <div className="font-bold text-[#4F2396] dark:text-violet-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#4F2396] dark:text-violet-400" />
                      <span>{label("Pre-Booking Review & Exceptional Failures", "المراجعة قبل الدفع وحالات التعذر الاستثنائية")}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      {label(
                        "Guests must confirm check-in/out dates, guest count, and unit rules prior to payment. If a confirmed unit becomes unavailable due to a verified Host fault or force majeure, QafNest Operations steps in to offer a suitable alternative or process an authorized refund.",
                        "يجب على الضيف التحقق التام من التواريخ وعدد الضيوف والشروط قبل السداد. وفي الحالات الاستثنائية الموثقة التي يتعذر فيها تسليم الوحدة بسبب تقصير المضيف، تتدخل إدارة قاف نست لتوفير بديل مناسب أو معالجة الاسترداد أصولياً."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="financials" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  6
                </span>
                <span>{label("Platform Fees, Commissions, Payouts & ZATCA 15% VAT", "عمولة المنصة وتحويل المستحقات وضريبة القيمة المضافة")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "All rates, service charges, and commissions are quoted transparently in Saudi Riyals (SAR) with no hidden billing. QafNest deducts an agreed platform commission/service fee (inclusive of VAT on commission services) to cover payment processing, digital verification, platform infrastructure, and 24/7 customer support.",
                    "تُعرض كافة الأسعار والرسوم بشفافية بالريال السعودي (ر.س) دون أي رسوم خفية. تستقطع المنصة عمولة الوساطة المتفق عليها نظير تشغيل المنظومة التقنية ومعالجة المدفوعات والتحقق وخدمة العملاء على مدار الساعة."
                  )}
                </p>
                <p>
                  {label(
                    "ZATCA Compliance & Host Settlement: Total prices incorporate 15% Value Added Tax where applicable, with Phase-2 compliant electronic tax invoices containing encrypted QR codes accessible immediately after checkout. Net Host booking proceeds are remitted directly to the Host's verified Saudi bank IBAN or payout account within the platform's 24-to-48-hour settlement window following stay milestone confirmation.",
                    "الامتثال الضريبي وتحويل مستحقات المضيفين: تشمل الأسعار ضريبة القيمة المضافة ١٥٪ مع إصدار فاتورة إلكترونية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (زاتكا) مزودة برمز QR. وتُحول مستحقات المضيف الصافية إلى حسابه البنكي (IBAN) داخل المملكة خلال ٢٤ إلى ٤٨ ساعة من إتمام مرحلة التسوية المعتمدة للإقامة."
                  )}
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="host-rules" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  7
                </span>
                <span>{label("Host Obligations & Host Protection Program", "التزامات المضيف وبرنامج حماية المضيف")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "Host Responsibilities: Hosts must publish accurate titles (in English and Arabic), real current photos, complete specifications, and true availability calendars. Every listed unit must be clean, furnished, equipped with essential utilities and linens, and maintain valid Saudi Ministry of Tourism and civil defense permits.",
                    "التزامات المضيف: يضمن المضيف تطابق الصور والبيانات المعروضة مع واقع العقار، وجاهزيته الكاملة بالنظافة والتأثيث والمستلزمات الأساسية والمرافق، مع استيفاء تصريح وزارة السياحة واشتراطات السلامة وحسن استقبال الضيف وسرعة الاستجابة."
                  )}
                </p>
                <p>
                  {label(
                    "Host Protection Program: QafNest maintains a Host Protection framework covering rare direct physical damages, missing unit contents, or extraordinary post-stay cleaning resulting strictly from a confirmed platform reservation. To qualify, the Host must submit clear timestamped photo/video proof and itemized repair invoices via Support within 48 hours of guest checkout; fraudulent claims result in immediate listing removal and legal accountability.",
                    "برنامج حماية المضيف: توفر قاف نست تغطية حماية لحالات التلفيات المباشرة أو فقدان الممتلكات أو تكاليف النظافة الاستثنائية الناتجة عن حجز مؤكد عبر المنصة، بشرط رفع البلاغ وتوثيقه بالصور والفيديو والفواتير التقديرية خلال ٤٨ ساعة من موعد المغادرة؛ وتُعرّض أي مطالبة مضللة صاحبها للشطب والمساءلة النظامية."
                  )}
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="guest-conduct" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  8
                </span>
                <span>{label("Guest Conduct, House Rules & Damage Compensation", "التزامات الضيف والذوق العام والتعويض عن الأضرار")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "Guests agree to observe all unit house rules disclosed prior to booking (maximum guest counts, family-only criteria where set, smoking/pet restrictions, pool safety), respect neighbors, comply with the Saudi Public Decency Regulation, preserve neighborhood quiet after 23:00, and refrain from unauthorized events or illegal/commercial uses.",
                    "يلتزم الضيف بقواعد الوحدة المعلنة قبل الحجز (كالسعة القصوى للضيوف والخصوصية العائلية وسياسة التدخين والفعاليات)، والالتزام بنظام الذوق العام السعودي واللوائح البلدية والحفاظ على هدوء الحي، وتجنب أي نشاط غير نظامي أو تجاري غير مصرح به."
                  )}
                </p>
                <p>
                  {label(
                    "Direct Damage Reimbursement: If a Guest or their companions cause physical damage, missing items, or Host Protection losses during a stay, the Guest is liable to reimburse the assessed damage amount to the Host/QafNest via designated settlement links. Failure to settle confirmed damage balances may result in negative wallet balance adjustment, booking blocks, and account suspension until settled.",
                    "المسؤولية عن التلفيات: يلتزم الضيف بتعويض المضيف والمنصة عن أي أضرار أو تلفيات يسببها هو أو مرافقوه للوحدة أو تجهيزاتها وفق التقدير المعتمد لدى المنصة. وفي حال الامتناع عن السداد، يحق للمنصة خصم الرصيد أو تعليق الحساب ومنع الحجوزات المستقبلية حتى تسوية المبلغ."
                  )}
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="intellectual-property" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  9
                </span>
                <span>{label("Intellectual Property, Indemnification & Enforcement", "الملكية الفكرية والتعويض النظامي وإجراءات الإنفاذ")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "Intellectual Property: All QafNest brand assets, trademarks, user interfaces, layouts, software architecture, graphics, icons, and platform copy belong exclusively to QafNest or its licensors. Users are strictly forbidden from copying, scraping, deep-linking, modifying, distributing, republishing any platform content without prior written authorization, removing copyright notices, or uploading materials infringing third-party copyrights.",
                    "حقوق الملكية الفكرية: جميع محتويات موقع وتطبيق قاف نست من علامات تجارية ونصوص وتصاميم وبرمجيات وأيقونات مملوكة حصرياً للمنصة أو مرخصة لها. ويُحظر منعاً باتاً نسخ أي جزء من المنصة أو تعديله أو استخراجه آلياً أو عمل روابط عميقة أو إزالة إشعارات الملكية أو رفع محتوى ينتهك حقوق الغير دون إذن كتابي مسبق."
                  )}
                </p>
                <p>
                  {label(
                    "Indemnification & Account Enforcement: You agree to indemnify and hold QafNest harmless from all claims, liabilities, losses, and legal expenses arising from your breach of these Terms, listing inaccuracies, property damages, or unlawful conduct. QafNest reserves the right to suspend accounts, cancel non-compliant listings, or report violations to relevant Saudi authorities.",
                    "التعويض والإنفاذ النظامي: يوافق المستخدم على تعويض منصة قاف نست عن كافة الخسائر والمطالبات والمصاريف القانونية الناشئة عن استخدامه غير النظامي أو مخالفته لهذه الاتفاقية، كما يحق للمنصة إيقاف الحسابات المخالفة أو حجب الإعلانات أو الإبلاغ لدى الجهات المختصة."
                  )}
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="governance" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-[#4F2396] dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                  10
                </span>
                <span>{label("Modifications, Governing Law & Dispute Resolution", "التعديلات والنظام الحاكم وتسوية النزاعات")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "QafNest reserves the right to amend or update these Terms & Conditions whenever operational or regulatory requirements evolve; updates take effect immediately upon publication on the Platform, and continued use constitutes acceptance.",
                    "تحتفظ إدارة قاف نست بحق تعديل وتحديث هذه الشروط والأحكام متى دعت الحاجة التنظيمية أو التشغيلية، وتصبح أي تعديلات نافذة فور نشرها على المنصة، ويُعد استمرار الاستخدام موافقة صريحة عليها."
                  )}
                </p>
                <p>
                  {label(
                    "These Terms and any accommodation transaction facilitated through QafNest are governed exclusively by the laws and regulations of the Kingdom of Saudi Arabia. Following amicable mediation attempts via QafNest Support, the competent judicial courts in Riyadh hold sole and exclusive jurisdiction over any dispute.",
                    "تخضع هذه الشروط وتفسر وفقاً لأنظمة وقوانين المملكة العربية السعودية. وفي حال عدم التوصل إلى تسوية ودية عبر فريق الدعم بالمنصة، تختص المحاكم المختصة في مدينة الرياض حصراً بالفصل في أي نزاع ينشأ عن تنفيذ أو تفسير هذه الشروط."
                  )}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

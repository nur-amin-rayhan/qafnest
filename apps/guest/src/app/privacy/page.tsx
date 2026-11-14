"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { language } = useApp();
  const label = (en: string, ar: string) => (language === "ar" ? ar : en);
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", titleEn: "1. Privacy Notice, PDPL & SDAIA", titleAr: "١. إشعار الخصوصية ونظام حماية البيانات" },
    { id: "collected-data", titleEn: "2. Personal Data We Collect", titleAr: "٢. البيانات الشخصية التي نجمعها" },
    { id: "purpose", titleEn: "3. Legal Basis & Processing Purpose", titleAr: "٣. المسوغات والأغراض النظامية للمعالجة" },
    { id: "sharing", titleEn: "4. Data Sharing & Permitted Disclosure", titleAr: "٤. مشاركة البيانات والإفصاح المحدود" },
    { id: "security", titleEn: "5. Storage, Encryption & Retention", titleAr: "٥. التخزين السيادي والأمان وفترات الاحتفاظ" },
    { id: "cookies-ref", titleEn: "6. Cookies & Browser Technologies", titleAr: "٦. ملفات تعريف الارتباط والتقنيات المشابهة" },
    { id: "user-rights", titleEn: "7. PDPL Rights & SDAIA Escalation", titleAr: "٧. حقوقك النظامية وتقديم الشكاوى" },
    { id: "contact-dpo", titleEn: "8. Data Protection Officer & Updates", titleAr: "٨. مسؤول حماية البيانات وتحديث السياسة" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFE] dark:bg-[#08070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-700 text-white p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              {label("Saudi PDPL Compliance", "نظام حماية البيانات الشخصية بالمملكة")}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {label("Privacy Policy & Data Protection", "سياسة الخصوصية وحماية البيانات")}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-emerald-100 leading-relaxed">
              {label(
                "This Privacy Notice explains how QafNest collects, processes, secures, and retains personal data of Guests, Hosts, and visitors in compliance with the Saudi Personal Data Protection Law (PDPL) and SDAIA standards.",
                "يوضح إشعار الخصوصية هذا كيفية جمع ومعالجة وحفظ وحماية البيانات الشخصية للضيوف والمضيفين وزوار منصة قاف نست وفقاً لنظام حماية البيانات الشخصية السعودي وضوابط هيئة سدايا."
              )}
            </p>
            <div className="mt-4 text-xs text-emerald-200">
              <span>{label("Version 2.5 · Effective November 2026", "النسخة ٢.٥ · سارية اعتباراً من نوفمبر ٢٠٢٦م")}</span>
              <span className="mx-2">•</span>
              <span>{label("Aligned with PDPL, SDAIA & NCA Controls", "متوافقة مع نظام حماية البيانات وهيئة سدايا والأمن السيبراني")}</span>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Sticky Nav Sidebar */}
          <aside className="hidden lg:block sticky top-24 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101a] p-3 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              {label("Privacy Sections", "أقسام السياسة")}
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
                      ? "bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{label(s.titleEn, s.titleAr)}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Privacy Content */}
          <div className="space-y-8 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101a] p-6 sm:p-10 shadow-xs">
            {/* Section 1 */}
            <section id="overview" className="space-y-3 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <span>{label("Privacy Notice, PDPL & SDAIA Framework", "إشعار الخصوصية والإطار النظامي")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "QafNest treats personal privacy as a core responsibility. We operate in strict compliance with the Saudi Personal Data Protection Law (PDPL) enacted under Royal Decree No. (M/19), its Implementing Regulations issued by the Saudi Data and Artificial Intelligence Authority (SDAIA), and National Cybersecurity Authority (NCA) standards.",
                    "تلتزم منصة قاف نست بحماية خصوصية مستخدميها ومعالجة بياناتهم وفق أحكام نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/19) ولائحته التنفيذية الصادرة عن الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)، وضوابط الهيئة الوطنية للأمن السيبراني في المملكة العربية السعودية."
                  )}
                </p>
                <p>
                  {label(
                    "Applying data minimization and purpose limitation principles, QafNest collects and processes only the personal information strictly required to deliver secure vacation rental bookings, host settlements, and regulatory verification.",
                    "نلتزم بمبدأ تقليل البيانات وتحديد الغرض؛ حيث نقتصر في جمع البيانات الشخصية على الحد الأدنى اللازم لتقديم خدمات حجز مرافق الضيافة، وتسوية المدفوعات، والوفاء بالالتزامات النظامية."
                  )}
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="collected-data" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <span>{label("Personal Data We Collect", "البيانات الشخصية التي نجمعها")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <ul className="list-disc list-inside space-y-1.5 marker:text-emerald-600">
                  <li>
                    <strong>{label("Identity Verification Data: ", "بيانات التحقق والهوية: ")}</strong>
                    {label("Full legal name, National ID or Iqama number, date of birth, and nationality authenticated through official channels (Elm Yaqeen and Nafath).", "الاسم القانوني الكامل، رقم الهوية الوطنية أو الإقامة، تاريخ الميلاد، والجنسية الموثقة عبر المنصات الرسمية المعتمدة (نفاذ ويقين).")}
                  </li>
                  <li>
                    <strong>{label("Contact & Account Details: ", "بيانات التواصل والحساب: ")}</strong>
                    {label("Verified Saudi/international mobile number (confirmed via OTP), email address, preferred language, and national city/district details.", "رقم الجوال الموثق عبر رمز التحقق (OTP)، البريد الإلكتروني، لغة العرض المفضلة، وبيانات العنوان الوطني.")}
                  </li>
                  <li>
                    <strong>{label("Host & Listing Records: ", "بيانات المضيف والوحدات: ")}</strong>
                    {label("Property title, address details, Ministry of Tourism license numbers, ownership or sublease authorization proofs, photos, and bank IBAN / payout preferences.", "بيانات العقار وعنوانه، رقم ترخيص وزارة السياحة، مستندات التفويض أو الملكية، الصور، وبيانات الآيبان البنكي لتحويل المستحقات.")}
                  </li>
                  <li>
                    <strong>{label("Booking, Communication & Access Logs: ", "سجلات الحجوزات والتواصل: ")}</strong>
                    {label("Stay dates, guest counts, support inquiries, Host Protection claims, and check-in / manual Smart Lock instructions.", "تواريخ الإقامة، عدد النزلاء، محادثات خدمة العملاء، طلبات حماية المضيف، وبيانات تسجيل الدخول أو رمز القفل الذكي.")}
                  </li>
                  <li>
                    <strong>{label("Payment & Transaction Records: ", "البيانات المالية والفواتير: ")}</strong>
                    {label("Payment confirmation IDs, SADAD references, refund adjustments, and ZATCA Phase-2 tax invoices. Raw credit card numbers are never stored on QafNest servers and are processed solely via SAMA-regulated PCI-DSS gateways.", "مراجع عمليات السداد وأرقام فواتير سداد والضرائب الإلكترونية (زاتكا). لا تُحفظ أرقام البطاقات الائتمانية الكاملة على خوادمنا، وتتم المعالجة عبر بوابات دفع مرخصة ومتوافقة مع معيار PCI-DSS.")}
                  </li>
                  <li>
                    <strong>{label("Device, Technical & Location Data: ", "البيانات التقنية والموقع: ")}</strong>
                    {label("IP address, browser/OS metadata, diagnostics, cookies, and approximate map coordinates where enabled to show nearby accommodations.", "عنوان IP، نوع الجهاز والمتصفح، بيانات الكوكيز، وإحداثيات الموقع التقريبية بموافقتك لتسهيل البحث عن العقارات القريبة.")}
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="purpose" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <span>{label("Legal Basis & Purpose of Processing", "المسوغات والأغراض النظامية للمعالجة")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "We process personal data lawfully to execute accommodation contracts between Guests and Hosts, validate mandatory guest and property permits under Ministry of Tourism bylaws, disburse host earnings and maintain ZATCA tax ledgers, investigate disputes or Host Protection claims, prevent fraud, and improve platform reliability. Promotional messages are sent only with prior consent and can be opted out of anytime.",
                    "نعالج البيانات استناداً إلى مسوغات نظامية تشمل تنفيذ عقود الحجز بين الضيف والمضيف، والتحقق الإلزامي من الهويات والتراخيص السياحية، وتحويل مستحقات المضيفين وإصدار فواتير زاتكا الضريبية، ومعالجة الشكاوى ومطالبات حماية المضيف، ومنع الاحتيال وتطوير المنصة. ولا تُرسل أي رسائل ترويجية إلا بموافقتك مع إتاحة إلغاء الاشتراك في أي وقت."
                  )}
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="sharing" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  4
                </span>
                <span>{label("Data Sharing & Permitted Disclosures", "مشاركة البيانات والإفصاح النظامي")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "QafNest never sells or trades your personal data. Disclosure is strictly limited to:",
                    "لا تبيع قاف نست بياناتك الشخصية أو تتاجر بها إطلاقاً، ويقتصر الإفصاح المحدود على الحالات التالية:"
                  )}
                </p>
                <ul className="list-disc list-inside space-y-1.5 marker:text-emerald-600">
                  <li>
                    {label("Confirmed Stay Counterparty: Sharing verified Guest name and contact phone with the Host (and property location/Host contact with the Guest) strictly to coordinate arrival and check-in.", "الطرف المؤكد في الحجز: مشاركة اسم الضيف ورقم جواله مع المضيف (وإحداثيات الموقع وبيانات التواصل مع الضيف) لتنسيق الدخول والإقامة فقط.")}
                  </li>
                  <li>
                    {label("Authorized Infrastructure & Financial Partners: Licensed Saudi payment processors (MyFatoorah/Mada), national identity providers (Elm/Nafath), and vetted cloud/SMS vendors under strict confidentiality agreements.", "مزودو الخدمات المرخصون: بوابات الدفع المعتمدة بالمملكة، ومنصات التحقق الوطني، ومزودو السحابة والرسائل بموجب اتفاقيات سرية وأمان ملزمة.")}
                  </li>
                  <li>
                    {label("Saudi Competent Authorities: Ministry of Tourism, ZATCA, SDAIA, security or judicial bodies where required by valid Saudi law or official request.", "الجهات الحكومية والرقابية المختصة داخل المملكة عند وجود متطلب نظامي ملزم.")}
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="security" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  5
                </span>
                <span>{label("Data Storage, Encryption & Retention", "التخزين السيادي والأمان وفترات الاحتفاظ")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "All platform databases are hosted in compliance with Kingdom data residency rules. Transmissions are secured via TLS 1.3 and sensitive fields via AES-256 encryption with strict role-based access controls.",
                    "تُحفظ البيانات وفق ضوابط الاستضافة السيادية بالمملكة، مع تأمين كافة الاتصالات بتشفير TLS 1.3 وتشفير الحقول الحساسة بمعيار AES-256 وتطبيق ضوابط الصلاحيات الدقيقة."
                  )}
                </p>
                <p>
                  {label(
                    "Retention Period: Personal data is retained only as long as needed to deliver bookings, manage Host Protection disputes, and comply with statutory Saudi accounting, ZATCA tax (minimum 5–6 years), and Ministry of Tourism record obligations, after which it is securely destroyed or anonymized.",
                    "مدة الاحتفاظ بالبيانات: نحتفظ بالبيانات فقط للمدة اللازمة لإتمام الحجوزات ومعالجة النزاعات والامتثال للمدد المحاسبية والضريبية (زاتكا) ولوائح وزارة السياحة في المملكة، ثم يتم إتلافها أو إخفاء هويتها بأمان."
                  )}
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="cookies-ref" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  6
                </span>
                <span>{label("Cookies & Browser Technologies", "ملفات تعريف الارتباط والتقنيات المشابهة")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "QafNest uses essential authentication cookies, localization preferences (Arabic/English & theme), and aggregated analytics to keep sessions secure and fast across web and mobile. Full details and browser controls are provided in our ",
                    "تستخدم قاف نست ملفات تعريف الارتباط الأساسية لتأمين الجلسات وتذكر تفضيلات اللغة والمظهر وقياس الأداء التشغيلي للموقع والتطبيق. يمكنك الاطلاع على كافة التفاصيل عبر صفحة "
                  )}
                  <Link href="/cookies" className="text-emerald-700 dark:text-emerald-300 font-bold underline">
                    {label("Cookies Policy", "سياسة ملفات الكوكيز")}
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="user-rights" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  7
                </span>
                <span>{label("Your Rights Under Saudi PDPL & Complaint Escalation", "حقوقك النظامية وتقديم الشكاوى")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "Under the Saudi Personal Data Protection Law, you enjoy the following statutory rights:",
                    "يمنحك نظام حماية البيانات الشخصية في المملكة العربية السعودية الحقوق التالية:"
                  )}
                </p>
                <ul className="list-disc list-inside space-y-1.5 marker:text-emerald-600">
                  <li><strong>{label("Right to Be Informed & Access: ", "حق العلم والوصول: ")}</strong>{label("Know the legal basis for collecting your data and request a readable copy of your stored records.", "معرفة المسوغ النظامي لجمع بياناتك وطلب نسخة واضحة ومقروءة من بياناتك المحفوظة لدينا.")}</li>
                  <li><strong>{label("Right to Rectification & Updating: ", "حق التصحيح والتحديث: ")}</strong>{label("Correct or complete inaccurate personal information via your account profile or DPO request.", "طلب تعديل أو تحديث أي بيانات غير دقيقة عبر حسابك أو التواصل معنا.")}</li>
                  <li><strong>{label("Right to Erasure & Withdraw Consent: ", "حق الإتلاف وسحب الموافقة: ")}</strong>{label("Request destruction of personal data once mandatory retention windows expire, and withdraw marketing consent anytime.", "طلب إتلاف بياناتك بعد انتهاء المدد النظامية الملزمة، وسحب موافقتك على التسويق المباشر في أي وقت.")}</li>
                </ul>
                <p className="text-xs text-slate-500">
                  {label(
                    "Response SLA & Escalation: Our Data Protection Officer responds to verified rights requests within 30 days. If you remain dissatisfied with how your privacy inquiry or complaint was handled, you retain the right to lodge a complaint with SDAIA or the National Data Governance Platform (DGP).",
                    "مهلة الرد والشكاوى: نلتزم بالرد على طلبات ممارسة الحقوق خلال ٣٠ يوماً من استلام الطلب. وفي حال عدم رضاك عن معالجة شكواك، يحق لك رفع شكوى لدى الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) عبر منصة حوكمة البيانات الوطنية."
                  )}
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="contact-dpo" className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/10 scroll-mt-28">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  8
                </span>
                <span>{label("Data Protection Officer (DPO) & Notice Updates", "مسؤول حماية البيانات وتحديث الإشعار")}</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  {label(
                    "We may revise this Privacy Policy periodically as regulations or platform features evolve, with changes taking effect upon publication. For inquiries, consent withdrawal, or PDPL requests, contact our Data Protection Office:",
                    "نحتفظ بحق تحديث هذه السياسة عند الحاجة النظامية أو التشغيلية وتصبح نافذة فور نشرها. ولأي استفسارات أو طلبات متعلقة بحقوق البيانات، يرجى التواصل مع مسؤول حماية البيانات:"
                  )}
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs space-y-1">
                  <p><strong>{label("Data Protection Email:", "بريد مسؤول حماية البيانات:")}</strong> <a href="mailto:privacy@qafnest.com" className="text-emerald-600 underline">privacy@qafnest.com</a></p>
                  <p><strong>{label("Support Helpline:", "هاتف خدمة العملاء:")}</strong> <span dir="ltr">0576707709</span></p>
                  <p><strong>{label("Headquarters:", "المقر الرئيسي:")}</strong> {label("King Fahd Road, Al Malqa District, Riyadh 13524, Kingdom of Saudi Arabia", "طريق الملك فهد، حي الملقا، الرياض 13524، المملكة العربية السعودية")}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

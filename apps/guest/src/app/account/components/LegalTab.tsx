"use client";

import React from "react";

interface LegalTabProps {
  type: "terms" | "privacy";
  t: (en: string, ar: string) => string;
}

export default function LegalTab({ type, t }: LegalTabProps) {
  if (type === "terms") {
    return (
      <div className="space-y-6">
        <div className="pb-6 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Terms of Use & Booking Policies", "شروط الاستخدام وسياسات الحجز")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Compliant with Saudi Tourism Ministry guidelines and hospitality bylaws.",
              "متوافقة مع لوائح وزارة السياحة ونظام حجز الوحدات السياحية في المملكة."
            )}
          </p>
        </div>

        <div className="prose dark:prose-invert text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              {t("1. Intermediary Platform Role & Check-In Verification", "١. دور المنصة الوسيط وتوثيق الدخول")}
            </h4>
            <p>
              {t(
                "QafNest connects verified Guests (18+ with valid National ID/Iqama and OTP check) directly with licensed Hosts across Saudi Arabia. Check-in/check-out windows apply strictly as displayed on each property page; please notify the Host in advance of late arrival.",
                "تعمل قاف نست كوسيط تقني مرخص يربط الضيوف الموثقين (١٨ عاماً فأكثر بهوية وطنية أو إقامة سارية) مباشرة بالمضيفين المرخصين بالمملكة. تسري أوقات الدخول والخروج المحددة في صفحة كل عقار مع وجوب إبلاغ المضيف حال التأخر."
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              {t("2. Non-Cancellation Policy & On-Site Security Deposit", "٢. سياسة عدم الإلغاء ومبلغ التأمين")}
            </h4>
            <p>
              {t(
                "The reservation cannot be cancelled or postponed; once payment is completed, bookings are final and non-refundable (0%). Where a Host requires a security deposit, it is paid directly to the Host prior to check-in and refunded upon clean checkout inspection.",
                "لا يمكن إلغاء الحجز أو تأجيله؛ فبعد إتمام السداد يصبح الحجز نهائياً وغير قابل للاسترداد (٠٪). وعند اشتراط مبلغ تأمين، يُسلّم للمضيف عند الوصول ويُسترد بالكامل عند المغادرة بعد فحص سلامة الوحدة."
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              {t("3. Conduct, Intellectual Property & Saudi Governing Law", "٣. الالتزامات والملكية الفكرية والنظام الحاكم")}
            </h4>
            <p>
              {t(
                "Guests agree to observe house rules, Saudi Public Decency laws, and reimburse confirmed direct damages under QafNest Host Protection. Platform trademarks and content remain protected intellectual property, and all disputes fall under Saudi law and Riyadh courts.",
                "يلتزم الضيف بقواعد الوحدة ولائحة الذوق العام وتعويض أي تلفيات مباشرة مثبتة ضمن برنامج حماية المضيف. جميع حقوق المنصة محمية بالملكية الفكرية، وتخضع هذه الشروط لأنظمة المملكة ومحاكم مدينة الرياض."
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-100 dark:border-white/10">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t("Privacy Policy & Data Protection", "سياسة الخصوصية وأمان البيانات")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t(
            "In compliance with the Saudi Personal Data Protection Law (PDPL) & SDAIA.",
            "ملتزمون بنظام حماية البيانات الشخصية السعودي (PDPL) وضوابط هيئة سدايا."
          )}
        </p>
      </div>

      <div className="prose dark:prose-invert text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
        <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
            {t("Minimization, Encryption & Sovereign Storage", "تقليل البيانات والتشفير والاستضافة السيادية")}
          </h4>
          <p>
            {t(
              "We collect strictly necessary identity, booking, and contact details hosted in Saudi-compliant infrastructure encrypted with TLS 1.3 and AES-256. QafNest never sells personal data and limits disclosures only to stay counterparties and legally authorized Saudi bodies.",
              "نجمع البيانات الضرورية للهوية والحجز والتواصل فقط وفق مبدأ تقليل البيانات، وتُحفظ مشفرة (TLS 1.3 و AES-256) وفق الاستضافة السيادية بالمملكة دون بيع أو تداول، مع حصر المشاركة على طرف الحجز المؤكد والجهات الرقابية المختصة."
            )}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
            {t("Financial Security & Your 30-Day PDPL Rights", "أمان المدفوعات وحقوقك النظامية (مهلة ٣٠ يوماً)")}
          </h4>
          <p>
            {t(
              "Card processing runs strictly through SAMA/PCI-DSS certified gateways with zero raw card storage. To access, correct, delete, or withdraw marketing consent, email privacy@qafnest.com (addressed within 30 days), with the right to escalate unresolved complaints to SDAIA.",
              "تُعالج المدفوعات عبر بوابات مرخصة من البنك المركزي السعودي دون تخزين أرقام البطاقات. ولممارسة حقوق الوصول أو التصحيح أو الإتلاف أو سحب الموافقة، راسل privacy@qafnest.com (يُرد خلال ٣٠ يوماً)، مع حق التصعيد لهيئة سدايا."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}


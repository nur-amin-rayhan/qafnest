"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Award, MessageCircle, PhoneCall } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ECOSYSTEM_URLS, QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import { localizePath, stripLocaleFromPathname } from "@/lib/localization/localeHelper";
import { PAYMENT_METHODS, PaymentMark, SocialMark } from "./footer/FooterMarks";

export default function Footer() {
  const { setSelectedCategory, language, t } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const browseCategory = (value: string) => {
    setSelectedCategory(value);

    const cleanPath = stripLocaleFromPathname(pathname);
    const section = document.getElementById("properties");
    if (cleanPath === "/" && section) {
      section.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push(localizePath(`/search?category=${encodeURIComponent(value)}`, language));
  };

  const label = (en: string, ar: string) => (language === "ar" ? ar : en);

  const hostPortalUrl =
    process.env.NEXT_PUBLIC_HOST_PORTAL_URL ||
    process.env.NEXT_PUBLIC_HOST_URL ||
    ECOSYSTEM_URLS.host;

  const categoryItems = [
    {
      id: "all",
      en: "Apartments, Studios, rooms, Villas",
      ar: "شقق، استوديو، غرف، فلل",
    },
    {
      id: "chalet",
      en: "Chalets, Istrahas and Resorts",
      ar: "شاليهات، استراحات، منتجعات فندقية",
    },
    { id: "farm", en: "Farms", ar: "مزارع" },
    { id: "camp", en: "Camps", ar: "مخيمات" },
    { id: "penthouse", en: "Serviced Apartments", ar: "شقق مخدومة" },
  ];

  return (
    <footer
      id="contact"
      className="border-t border-gray-100 bg-[#FAFAFC] py-8 text-gray-900 dark:border-white/10 dark:bg-[#08070D] dark:text-white sm:py-12"
    >
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Band 1: Gathern-style Upper Rounded Card */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-8 dark:border-white/10 dark:bg-[#12101a] sm:px-10 sm:py-9">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_1fr_0.75fr] lg:items-start lg:gap-10">
            {/* Left Column: QafNest Brand + Official Licensing Crest + Support Number */}
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={localizePath("/", language)}
                  aria-label="QafNest home"
                  className="inline-flex items-center select-none"
                >
                  <span className="text-[28px] sm:text-[32px] font-black tracking-[-0.05em] text-[#4F2396] dark:text-white">
                    Qaf<span className="text-[#7c3aed] dark:text-violet-300">Nest</span>
                    <span className="text-[#FF9750]">.</span>
                  </span>
                </Link>

                <span
                  aria-hidden="true"
                  className="h-9 w-px bg-gray-200 dark:bg-white/15"
                />

                <div className="inline-flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-[#4F2396] dark:border-violet-400/25 dark:bg-violet-950/50 dark:text-violet-300">
                    <Award className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <span className="block text-[11px] font-bold text-[#4F2396] dark:text-violet-300">
                      منصة سياحية مرخصة
                    </span>
                    <span className="block text-[11px] font-semibold text-[#4F2396]/90 dark:text-violet-300/90">
                      Licensed Platform
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-1 text-[13px] leading-6 text-[#1f2937] dark:text-gray-300">
                <p>{t.footer.licensedBy}</p>
                <p>{t.footer.license}</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[13px]">
                <a
                  href={QAFNEST_SUPPORT_CONTACT.telHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-1.5 font-semibold text-[#1f2937] transition hover:border-[#4F2396] hover:text-[#4F2396] dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-violet-300"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-[#4F2396] dark:text-violet-300" />
                  <span>{label("Support:", "الدعم:")}</span>
                  <span dir="ltr" className="font-bold">
                    {QAFNEST_SUPPORT_CONTACT.displayPhone}
                  </span>
                </a>
                <a
                  href={QAFNEST_SUPPORT_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{label("WhatsApp", "واتساب")}</span>
                </a>
              </div>
            </div>

            {/* Middle & Right Columns: 2-col compact grid on mobile, separate cols on desktop */}
            <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6 dark:border-white/10 lg:contents lg:border-t-0 lg:pt-0">
              {/* Middle Column: 5 Property Category Links */}
              <ul className="space-y-3 text-[13.5px] font-medium text-[#2c2c2c] dark:text-gray-200">
                {categoryItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => browseCategory(item.id)}
                      className="text-start transition hover:text-[#4F2396] dark:hover:text-violet-300 cursor-pointer"
                    >
                      {label(item.en, item.ar)}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Right Column: Policy & Support Links */}
              <ul className="space-y-3 text-[13.5px] font-medium text-[#2c2c2c] dark:text-gray-200">
                <li>
                  <Link
                    href={localizePath("/terms", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                  >
                    {label("Terms & Conditions", "شروط الاستخدام")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={localizePath("/privacy", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                  >
                    {label("Privacy Policy", "سياسة الخصوصية")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={localizePath("/cookies", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                  >
                    {label("Cookies Policy", "سياسة الكوكيز")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={localizePath("/faq", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                  >
                    {label("FAQs", "الأسئلة المتكررة")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={localizePath("/contact", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                  >
                    {label("Contact Us", "تواصل معنا")}
                  </Link>
                </li>
                <li>
                  <a
                    href={`${hostPortalUrl}/?lang=${language}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                  >
                    {label("Host Portal", "بوابة المضيفين")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Band 2: Standalone Payment Methods Card */}
        <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white px-6 py-5 dark:border-white/10 dark:bg-[#12101a] sm:flex-row sm:px-10">
          <h2 className="text-[14px] font-bold text-[#111827] dark:text-white">
            {label("Multiple and secure payment methods", "وسائل دفع متعددة وآمنة")}
          </h2>
          <ul
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:justify-end"
            aria-label={label("Payment method brands", "علامات طرق الدفع")}
          >
            {PAYMENT_METHODS.map((method) => (
              <li key={method}>
                <PaymentMark name={method} />
              </li>
            ))}
          </ul>
        </div>

        {/* Band 3: Bottom Copyright & Purple Social Badges */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 pt-5 text-xs text-[#6b7280] dark:text-gray-400 sm:flex-row">
          <p>{t.footer.rights}</p>
          <div
            className="flex w-full items-center justify-center gap-2.5 border-b border-gray-200 pb-4 dark:border-white/10 sm:w-auto sm:justify-end sm:border-b-0 sm:pb-0"
            aria-label={label("Social media", "وسائل التواصل الاجتماعي")}
          >
            <SocialMark name="Facebook" />
            <SocialMark name="X" />
            <SocialMark name="Instagram" />
            <SocialMark name="YouTube" />
          </div>
        </div>
      </div>
    </footer>
  );
}

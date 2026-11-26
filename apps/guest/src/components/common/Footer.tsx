"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PhoneCall } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ECOSYSTEM_URLS, QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import { localizePath, stripLocaleFromPathname } from "@/lib/localization/localeHelper";
import { usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";
import { PAYMENT_METHODS, PaymentMark, SocialMark } from "./footer/FooterMarks";

export default function Footer() {
  const { setSelectedCategory, language, t } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const { workspace: cmsWorkspace } = usePublicCmsWorkspace();

  const cmsContact = cmsWorkspace?.globals?.contactUs;
  const rawPhone = cmsContact?.phone?.trim();
  const displayPhone =
    rawPhone && !rawPhone.includes("500000000")
      ? rawPhone
      : QAFNEST_SUPPORT_CONTACT.displayPhone;
  const telHref = displayPhone
    ? `tel:${displayPhone.replace(/[^\d+]/g, "")}`
    : QAFNEST_SUPPORT_CONTACT.telHref;

  const cmsSocials = (cmsWorkspace?.socialLinks || []).filter(
    (s) => s.enabled !== false && s.platform && !s.platform.toLowerCase().includes("whatsapp")
  );

  const getSocialHref = (platform: string, fallback: string) => {
    const found = cmsSocials.find((s) => s.platform.toLowerCase() === platform.toLowerCase());
    return found?.url || fallback;
  };

  const socialItems = [
    { name: "Snapchat", href: getSocialHref("Snapchat", "https://www.snapchat.com/@qafnest") },
    { name: "Instagram", href: getSocialHref("Instagram", "https://www.instagram.com/qafnest/") },
    { name: "Facebook", href: getSocialHref("Facebook", "https://www.facebook.com/qafnest.sa") },
    { name: "X", href: getSocialHref("X", "https://x.com/qafnest") },
  ];

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
      suppressHydrationWarning
      className="border-t border-gray-100 bg-[#FAFAFC] py-8 text-gray-900 dark:border-white/10 dark:bg-[#08070D] dark:text-white sm:py-12"
    >
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        {/* Band 1: Upper Rounded Card */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-8 dark:border-white/10 dark:bg-[#12101a] sm:px-10 sm:py-9">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_1fr_0.75fr] lg:items-start lg:gap-10">
            {/* Left Column: Brand + Support Phone + Social Media */}
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
              </div>

              <div className="mt-3 text-[13px] leading-6 text-[#1f2937] dark:text-gray-300 max-w-sm">
                <p suppressHydrationWarning>{t.footer.desc}</p>
              </div>

              {/* Support Phone Only - No WhatsApp here */}
              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[13px]">
                <a
                  href={telHref}
                  suppressHydrationWarning
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-1.5 font-semibold text-[#1f2937] transition hover:border-[#4F2396] hover:text-[#4F2396] dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-violet-300"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-[#4F2396] dark:text-violet-300" />
                  <span suppressHydrationWarning>{label("Support:", "الدعم:")}</span>
                  <span dir="ltr" className="font-bold" suppressHydrationWarning>
                    {displayPhone}
                  </span>
                </a>
              </div>

              {/* Social Media Links: Snapchat, Instagram, Facebook, X */}
              <div
                className="mt-4 flex flex-wrap items-center gap-2.5"
                aria-label={label("Social media", "وسائل التواصل الاجتماعي")}
                suppressHydrationWarning
              >
                {socialItems.map((soc) => (
                  <SocialMark key={soc.name} name={soc.name} href={soc.href} />
                ))}
              </div>
            </div>

            {/* Middle & Right Columns: 2-col compact grid on mobile, separate cols on desktop */}
            <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6 dark:border-white/10 lg:contents lg:border-t-0 lg:pt-0">
              {/* Middle Column: 5 Property Category Links */}
              <ul
                suppressHydrationWarning
                className="space-y-3 text-[13.5px] font-medium text-[#2c2c2c] dark:text-gray-200"
              >
                {categoryItems.map((item) => (
                  <li key={item.id} suppressHydrationWarning>
                    <button
                      type="button"
                      onClick={() => browseCategory(item.id)}
                      className="text-start transition hover:text-[#4F2396] dark:hover:text-violet-300 cursor-pointer"
                      suppressHydrationWarning
                    >
                      {label(item.en, item.ar)}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Right Column: Unified Policy & Quick Links (Exactly 5 items in EN and AR) */}
              <ul
                suppressHydrationWarning
                className="space-y-3 text-[13.5px] font-medium text-[#2c2c2c] dark:text-gray-200"
              >
                <li suppressHydrationWarning>
                  <Link
                    href={localizePath("/policies", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300 font-semibold"
                    suppressHydrationWarning
                  >
                    {label("Policies & Legal Terms", "السياسات والشروط")}
                  </Link>
                </li>
                <li suppressHydrationWarning>
                  <Link
                    href={localizePath("/about", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                    suppressHydrationWarning
                  >
                    {label("About Us", "من نحن")}
                  </Link>
                </li>
                <li suppressHydrationWarning>
                  <Link
                    href={localizePath("/faq", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                    suppressHydrationWarning
                  >
                    {label("FAQs", "الأسئلة المتكررة")}
                  </Link>
                </li>
                <li suppressHydrationWarning>
                  <Link
                    href={localizePath("/contact", language)}
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                    suppressHydrationWarning
                  >
                    {label("Contact Us", "تواصل معنا")}
                  </Link>
                </li>
                <li suppressHydrationWarning>
                  <a
                    href={`${hostPortalUrl}/?lang=${language}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396] dark:hover:text-violet-300"
                    suppressHydrationWarning
                  >
                    {label("Host Portal", "بوابة المضيفين")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Band 2: Standalone Payment Methods Card */}
        <div
          suppressHydrationWarning
          className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white px-6 py-5 dark:border-white/10 dark:bg-[#12101a] sm:flex-row sm:px-10"
        >
          <h2 className="text-[14px] font-bold text-[#111827] dark:text-white" suppressHydrationWarning>
            {label("Multiple and secure payment methods", "وسائل دفع متعددة وآمنة")}
          </h2>
          <ul
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:justify-end"
            aria-label={label("Payment method brands", "علامات طرق الدفع")}
            suppressHydrationWarning
          >
            {PAYMENT_METHODS.map((method) => (
              <li key={method} suppressHydrationWarning>
                <PaymentMark name={method} />
              </li>
            ))}
          </ul>
        </div>

        {/* Band 3: Bottom Copyright */}
        <div
          suppressHydrationWarning
          className="flex flex-col items-center justify-between gap-4 pt-5 text-xs text-[#6b7280] dark:text-gray-400 sm:flex-row"
        >
          <p suppressHydrationWarning>{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import {
  Award,
  PhoneCall,
  Flame,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Footer() {
  const { setSelectedCategory, setSelectedCity, language, t } = useApp();

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    const el = document.getElementById("properties");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    const el = document.getElementById("properties");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer id="contact" className="py-16 border-t border-violet-400/10 relative overflow-hidden bg-surface/[0.02]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-14 border-b border-gray-200 dark:border-white/5">
          {/* Brand Info & Official Regulation */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-700 to-fuchsia-400 flex items-center justify-center font-display font-bold text-white">
                Q
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                QAF<span className="text-gradient">NEST</span>
              </span>
            </div>
            <p className="text-gray-600 dark:text-muted/70 text-xs font-light leading-relaxed mb-4">
              {t.footer.desc}
            </p>
            <div className="space-y-1.5 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold glass px-3 py-1 rounded-full border border-emerald-500/20">
                <Award className="w-3.5 h-3.5" /> {t.footer.license}
              </span>
              <span className="block text-[10px] text-gray-500 dark:text-muted/60 pl-2 rtl:pr-2 rtl:pl-0">
                {t.footer.cr}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted">
              <a
                href="#"
                className="h-8 w-8 rounded-full glass flex items-center justify-center hover:text-fg hover:border-violet-400 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full glass flex items-center justify-center hover:text-fg hover:border-violet-400 transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full glass flex items-center justify-center hover:text-fg hover:border-violet-400 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Property Categories */}
          <div>
            <h4 className="font-display text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              {language === "ar" ? "أنواع الإقامات" : "Explore Categories"}
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-600 dark:text-muted/70">
              <li>
                <button
                  onClick={() => handleCategoryClick("chalet")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "شاليهات ومنتجعات" : "Chalets & Resorts"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("villa")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "فلل خاصة فاخرة" : "Private Luxury Villas"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("farm")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "مزارع واستراحات ريفية" : "Country Heritage Farms"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("camp")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "مخيمات وقباب صحراوية" : "Desert Camps & Domes"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("penthouse")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "شقق وبنتهاوس مخدومة" : "Sky Penthouses"}
                </button>
              </li>
              <li>
                <Link
                  href="#properties"
                  className="hover:text-fuchsia-400 transition-colors flex items-center gap-1"
                >
                  <Flame className="w-3 h-3 text-fuchsia-400" />{" "}
                  {language === "ar" ? "عروض اللحظة الأخيرة" : "Last-Minute Offers"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="font-display text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              {language === "ar" ? "أبرز الوجهات" : "Top Destinations"}
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-600 dark:text-muted/70">
              <li>
                <button
                  onClick={() => handleCityClick("riyadh")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "شاليهات وفلل الرياض" : "Chalets in Riyadh"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("jeddah")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "منتجعات وفلل جدة" : "Villas in Jeddah"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("alula")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "مخيمات وتجارب العلا" : "Glamping in AlUla"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("khobar")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "منتجعات وشاليهات الخبر" : "Resorts in Al Khobar"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("abha")}
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  {language === "ar" ? "أكواخ وضباب أبها" : "Mountain Chalets in Abha"}
                </button>
              </li>
              <li>
                <Link
                  href="#stories"
                  className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
                >
                  {language === "ar" ? "قصص السفر واستكشاف المملكة" : "Saudi Travel Stories"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct VIP Concierge & Support */}
          <div>
            <h4 className="font-display text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              {language === "ar" ? "الدعم والمنصة" : "Support & Platform"}
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-muted/70 mb-4">
              <li>
                <Link href="#faq" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                  {language === "ar" ? "الأسئلة الشائعة" : "Customer FAQs"}
                </Link>
              </li>
              <li>
                <Link href="#host" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                  {language === "ar" ? "بوابة المضيفين" : "Host Portal"}
                </Link>
              </li>
              <li>
                <Link href="#app" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                  {language === "ar" ? "تحميل تطبيق قف نست" : "Download QafNest App"}
                </Link>
              </li>
              <li>
                <Link href="#guarantee" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                  {language === "ar" ? "ضمان حماية الضيوف" : "Guest Protection Guarantee"}
                </Link>
              </li>
            </ul>
            <div className="glass rounded-2xl p-3 border border-violet-400/20">
              <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-300 block mb-0.5">
                {language === "ar" ? "خدمة الضيوف على مدار الساعة" : "24/7 Guest Assistance"}
              </span>
              <a
                href="tel:+966559600576"
                className="text-xs font-bold text-gray-900 dark:text-white hover:text-fuchsia-500 flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3 h-3 text-fuchsia-500 shrink-0" />
                <span dir="ltr">+966 55 960 0576</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright & Legal Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-muted/50 gap-4">
          <p>{t.footer.rights}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {language === "ar" ? "شروط الاستخدام" : "Terms of Use"}
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {language === "ar" ? "شروط الاستضافة" : "Host Terms"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import {
  Award,
  PhoneCall,
  Flame,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Footer() {
  const { setSelectedCategory, setSelectedCity } = useApp();

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-14 border-b border-white/5">
          {/* Brand Info & Official Regulation */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-700 to-fuchsia-400 flex items-center justify-center font-display font-bold text-white">
                Q
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-fg">
                QAF<span className="text-gradient">NEST</span>
              </span>
            </div>
            <p className="text-muted/70 text-xs font-light leading-relaxed mb-4">
              Saudi Arabia&apos;s licensed peer-to-peer vacation rental and luxury stays platform. Officially regulated by the Ministry of Tourism.
            </p>
            <div className="space-y-1.5 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold glass px-3 py-1 rounded-full">
                <Award className="w-3.5 h-3.5" /> License No. 73102999
              </span>
              <span className="block text-[10px] text-muted/60 pl-2">
                Ministry of Tourism Approved · CR 1010648921
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
            <h4 className="font-display text-sm font-bold text-fg uppercase tracking-wider mb-4">
              Explore Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-muted/70">
              <li>
                <button
                  onClick={() => handleCategoryClick("chalet")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Chalets & Resorts (شاليهات ومنتجعات)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("villa")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Private Villas (فلل خاصة فاخرة)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("farm")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Country Farms (مزارع واستراحات)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("camp")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Desert Camps (مخيمات وقباب فلكية)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("penthouse")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Sky Penthouses (بنتهاوس وشقق خاصة)
                </button>
              </li>
              <li>
                <Link
                  href="#deals"
                  className="hover:text-fuchsia-300 transition-colors flex items-center gap-1"
                >
                  <Flame className="w-3 h-3 text-fuchsia-400" /> Last-Minute Offers (عروض اللحظة الأخيرة)
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="font-display text-sm font-bold text-fg uppercase tracking-wider mb-4">
              Top Destinations
            </h4>
            <ul className="space-y-2.5 text-xs text-muted/70">
              <li>
                <button
                  onClick={() => handleCityClick("riyadh")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Chalets in Riyadh (الرياض)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("jeddah")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Villas in Jeddah (جدة وأبحر)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("alula")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Glamping in AlUla (العلا)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("khobar")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Resorts in Al Khobar (الخبر والدمام)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCityClick("abha")}
                  className="hover:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  Mountain Chalets in Abha (أبها)
                </button>
              </li>
              <li>
                <Link
                  href="#stories"
                  className="hover:text-violet-300 transition-colors"
                >
                  Saudi Travel Stories (مدونة السفر)
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct VIP Concierge & Support */}
          <div>
            <h4 className="font-display text-sm font-bold text-fg uppercase tracking-wider mb-4">
              Support & Platform
            </h4>
            <ul className="space-y-2 text-xs text-muted/70 mb-4">
              <li>
                <Link href="#faq" className="hover:text-violet-300 transition-colors">
                  Customer FAQs (الأسئلة الشائعة)
                </Link>
              </li>
              <li>
                <Link href="#host" className="hover:text-violet-300 transition-colors">
                  Host Portal (بوابة المضيفين)
                </Link>
              </li>
              <li>
                <Link href="#app" className="hover:text-violet-300 transition-colors">
                  Download QafNest App (تطبيق الجوال)
                </Link>
              </li>
              <li>
                <Link href="#guarantee" className="hover:text-violet-300 transition-colors">
                  Guest Protection Guarantee
                </Link>
              </li>
            </ul>
            <div className="glass rounded-2xl p-3 border border-violet-400/20">
              <span className="text-[10px] uppercase font-bold text-violet-300 block mb-0.5">
                24/7 Guest Assistance
              </span>
              <a
                href="tel:+966559600576"
                className="text-xs font-bold text-white hover:text-fuchsia-300 flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3 h-3 text-fuchsia-400" /> +966 55 960 0576
              </a>
            </div>
          </div>
        </div>

        {/* Copyright & Legal Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted/50 gap-4">
          <p>© 2016-2026 QAFNEST Hospitality Platform. All rights reserved. Licensed by Ministry of Tourism.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-fg transition-colors">
              Terms of Use (شروط الاستخدام)
            </a>
            <a href="#" className="hover:text-fg transition-colors">
              Privacy Policy (سياسة الخصوصية)
            </a>
            <a href="#" className="hover:text-fg transition-colors">
              Host Terms (شروط المضيف)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

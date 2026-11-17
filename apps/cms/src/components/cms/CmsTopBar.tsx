"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  PanelLeft,
  Sun,
  Moon,
  User,
  Globe,
  Check,
  LogOut,
  Search,
  X,
  ArrowRight,
} from "lucide-react";
import type { CmsLocale, CmsTab } from "@/types/cms";

interface QuickSearchEntry {
  tab: CmsTab;
  titleEn: string;
  titleAr: string;
  groupEn: string;
  groupAr: string;
}

const SEARCH_ENTRIES: QuickSearchEntry[] = [
  { tab: "dashboard", titleEn: "Dashboard", titleAr: "لوحة التحكم", groupEn: "Overview", groupAr: "عام" },
  { tab: "users", titleEn: "Users", titleAr: "المستخدمون", groupEn: "Collections", groupAr: "المجموعات" },
  { tab: "media", titleEn: "Media", titleAr: "الوسائط", groupEn: "Collections", groupAr: "المجموعات" },
  { tab: "categories", titleEn: "Categories", titleAr: "التصنيفات", groupEn: "Collections", groupAr: "المجموعات" },
  { tab: "blogs", titleEn: "Blogs", titleAr: "المقالات", groupEn: "Collections", groupAr: "المجموعات" },
  { tab: "roles", titleEn: "Roles", titleAr: "الأدوار والصلاحيات", groupEn: "Collections", groupAr: "المجموعات" },
  { tab: "faqs", titleEn: "FAQs", titleAr: "الأسئلة الشائعة", groupEn: "Collections", groupAr: "المجموعات" },
  { tab: "home-popups", titleEn: "Home Popups", titleAr: "النوافذ المنبثقة", groupEn: "Home", groupAr: "الرئيسية" },
  { tab: "home-hero", titleEn: "Home Hero", titleAr: "القسم الرئيسي", groupEn: "Home", groupAr: "الرئيسية" },
  { tab: "features", titleEn: "Features", titleAr: "المميزات", groupEn: "Home", groupAr: "الرئيسية" },
  { tab: "fleet-capabilities", titleEn: "Fleet Capabilities", titleAr: "قدرات التشغيل", groupEn: "Home", groupAr: "الرئيسية" },
  { tab: "coverage-network", titleEn: "Coverage Network", titleAr: "شبكة التغطية", groupEn: "Home", groupAr: "الرئيسية" },
  { tab: "industries", titleEn: "Industries", titleAr: "القطاعات", groupEn: "Home", groupAr: "الرئيسية" },
  { tab: "business-pages", titleEn: "Business Pages", titleAr: "صفحات الأعمال", groupEn: "Business", groupAr: "الأعمال" },
  { tab: "legal-pages", titleEn: "Legal Pages", titleAr: "الصفحات القانونية", groupEn: "Legal", groupAr: "القانونية" },
  { tab: "navigation-links", titleEn: "Navigation Links", titleAr: "روابط التنقل", groupEn: "Global", groupAr: "العامة" },
  { tab: "social-links", titleEn: "Social Links", titleAr: "روابط التواصل", groupEn: "Global", groupAr: "العامة" },
  { tab: "contact-us", titleEn: "Contact Us", titleAr: "تواصل معنا", groupEn: "Global", groupAr: "العامة" },
  { tab: "site-seo", titleEn: "Site SEO", titleAr: "سيو الموقع", groupEn: "SEO Settings", groupAr: "السيو" },
  { tab: "google-tag-manager", titleEn: "Google Tag Manager", titleAr: "مدير وسوم جوجل", groupEn: "SEO Settings", groupAr: "السيو" },
  { tab: "about-us", titleEn: "About Us", titleAr: "من نحن", groupEn: "About", groupAr: "عن المنصة" },
  { tab: "identity", titleEn: "Identity & Licenses", titleAr: "الهوية والتراخيص", groupEn: "KSA Compliance", groupAr: "الامتثال" },
  { tab: "zatca", titleEn: "ZATCA & VAT", titleAr: "الزكاة والضريبة", groupEn: "KSA Compliance", groupAr: "الامتثال" },
];

interface CmsTopBarProps {
  activeTab: CmsTab;
  locale: CmsLocale;
  setLocale: (loc: CmsLocale) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userEmail?: string;
  onSignOut: () => void;
  onSelectTab: (tab: CmsTab) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export function CmsTopBar({
  activeTab,
  locale,
  setLocale,
  darkMode,
  setDarkMode,
  collapsed,
  setCollapsed,
  userEmail,
  onSignOut,
  onSelectTab,
  searchOpen,
  setSearchOpen,
}: CmsTopBarProps) {
  const isAr = locale === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const currentEntry = SEARCH_ENTRIES.find((e) => e.tab === activeTab);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEntries = SEARCH_ENTRIES.filter((entry) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      entry.titleEn.toLowerCase().includes(q) ||
      entry.titleAr.toLowerCase().includes(q) ||
      entry.groupEn.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <header
        className={`h-14 border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 ${
          darkMode
            ? "bg-[#0F1117]/95 border-[#222634] text-slate-100"
            : "bg-white/95 border-[#E5E7EB] text-[#111827]"
        } backdrop-blur`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg border transition ${
              darkMode
                ? "border-[#2A2F3E] text-slate-300 hover:bg-white/5"
                : "border-[#E5E7EB] text-gray-600 hover:bg-gray-100"
            }`}
            title={isAr ? "تبديل القائمة الجانبية" : "Toggle Sidebar"}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs md:text-sm truncate">
            <button
              onClick={() => onSelectTab("dashboard")}
              className={`hover:underline ${darkMode ? "text-slate-400" : "text-gray-500"}`}
            >
              {isAr ? "لوحة التحكم" : "Dashboard"}
            </button>
            {activeTab !== "dashboard" && currentEntry && (
              <>
                <span className={darkMode ? "text-slate-600" : "text-gray-300"}>/</span>
                <span className={`font-medium ${darkMode ? "text-slate-100" : "text-[#111827]"}`}>
                  {isAr ? currentEntry.titleAr : currentEntry.titleEn}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Locale Quick Pill */}
          <button
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              darkMode
                ? "border-[#2A2F3E] bg-[#181B24] text-slate-200 hover:border-blue-500/50"
                : "border-[#E5E7EB] bg-[#F9FAFB] text-gray-700 hover:bg-gray-100"
            }`}
            title={isAr ? "تغيير لغة المحتوى" : "Switch Content Locale"}
          >
            <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{locale === "en" ? "English (en)" : "العربية (ar)"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg border transition ${
              darkMode
                ? "border-[#2A2F3E] text-amber-400 hover:bg-white/5"
                : "border-[#E5E7EB] text-gray-600 hover:bg-gray-100"
            }`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Avatar & Dropdown (Matching Screenshot 6) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
                darkMode
                  ? "border-[#2A2F3E] bg-[#181B24] text-slate-200 hover:border-blue-500"
                  : "border-[#E5E7EB] bg-[#F3F4F6] text-gray-700 hover:border-gray-300"
              }`}
              title={userEmail || "Account"}
            >
              <User className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className={`absolute ${isAr ? "left-0" : "right-0"} mt-2 w-60 rounded-xl border shadow-xl z-50 overflow-hidden ${
                  darkMode
                    ? "bg-[#151822] border-[#2A2F3E] text-slate-100"
                    : "bg-white border-[#E5E7EB] text-[#111827]"
                }`}
              >
                <div className={`px-3.5 py-2.5 border-b ${darkMode ? "border-[#2A2F3E]" : "border-gray-100"}`}>
                  <div className="text-xs font-semibold truncate">{userEmail || "admin@qafnest.com"}</div>
                  <div className={`text-[11px] ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                    {isAr ? "مدير نظام المحتوى" : "CMS Administrator"}
                  </div>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => {
                      onSelectTab("users");
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                      darkMode ? "hover:bg-white/5 text-slate-200" : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isAr ? "الحساب" : "Account"}</span>
                  </button>
                </div>

                <div className={`px-3 py-2 border-t ${darkMode ? "border-[#2A2F3E]" : "border-gray-100"}`}>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? "text-slate-400" : "text-gray-400"}`}>
                    {isAr ? "اللغة (Locale)" : "Locale"}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setLocale("en");
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        locale === "en"
                          ? darkMode
                            ? "bg-[#2563EB]/20 text-blue-400 font-semibold"
                            : "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                          : darkMode
                          ? "hover:bg-white/5 text-slate-300"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <span>English (en)</span>
                      {locale === "en" && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setLocale("ar");
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        locale === "ar"
                          ? darkMode
                            ? "bg-[#2563EB]/20 text-blue-400 font-semibold"
                            : "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                          : darkMode
                          ? "hover:bg-white/5 text-slate-300"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <span>العربية (ar)</span>
                      {locale === "ar" && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className={`p-1.5 border-t ${darkMode ? "border-[#2A2F3E]" : "border-gray-100"}`}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-red-500 transition ${
                      darkMode ? "hover:bg-red-500/10" : "hover:bg-red-50"
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isAr ? "تسجيل الخروج" : "Log out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Search Modal (Ctrl K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-start justify-center pt-[12vh] px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              darkMode ? "bg-[#151822] border-[#2A2F3E] text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${darkMode ? "border-[#2A2F3E]" : "border-gray-200"}`}>
              <Search className="w-4 h-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن المجموعات أو الصفحات أو الإعدادات..." : "Search collections, globals, or settings..."}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded hover:bg-gray-500/10"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.tab}
                  onClick={() => {
                    onSelectTab(entry.tab);
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition ${
                    darkMode ? "hover:bg-white/5" : "hover:bg-[#EFF6FF]"
                  }`}
                >
                  <div>
                    <div className="font-medium">{isAr ? entry.titleAr : entry.titleEn}</div>
                    <div className={`text-[11px] ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                      {isAr ? entry.groupAr : entry.groupEn}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
              {filteredEntries.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500">
                  {isAr ? "لا توجد نتائج مطابقة" : "No matching sections found"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

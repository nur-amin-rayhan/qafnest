"use client";

import React, { useState } from "react";
import {
  Search,
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  FolderTree,
  FileText,
  ShieldCheck,
  HelpCircle,
  Megaphone,
  Sparkles,
  Layers,
  Truck,
  Globe,
  Building2,
  Briefcase,
  Scale,
  Link2,
  Share2,
  PhoneCall,
  SearchCheck,
  Code2,
  Info,
  BadgeCheck,
  Receipt,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { CmsLocale, CmsTab } from "@/types/cms";

interface NavItem {
  id: CmsTab;
  labelEn: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  key: string;
  titleEn: string;
  titleAr: string;
  items: NavItem[];
}

interface CmsShellSidebarProps {
  activeTab: CmsTab;
  onSelectTab: (tab: CmsTab) => void;
  onOpenSearch: () => void;
  locale: CmsLocale;
  darkMode: boolean;
  collapsed: boolean;
  userEmail?: string;
  counts?: Partial<Record<CmsTab, number>>;
}

export function CmsShellSidebar({
  activeTab,
  onSelectTab,
  onOpenSearch,
  locale,
  darkMode,
  collapsed,
  userEmail,
  counts = {},
}: CmsShellSidebarProps) {
  const isAr = locale === "ar";

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    collections: true,
    home: true,
    business: true,
    legal: true,
    global: true,
    seo: true,
    about: true,
    compliance: false,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groups: NavGroup[] = [
    {
      key: "collections",
      titleEn: "Collections",
      titleAr: "المجموعات",
      items: [
        { id: "users", labelEn: "Users", labelAr: "المستخدمون", icon: Users, badge: counts.users },
        { id: "media", labelEn: "Media", labelAr: "الوسائط", icon: ImageIcon, badge: counts.media },
        { id: "categories", labelEn: "Categories", labelAr: "التصنيفات", icon: FolderTree, badge: counts.categories },
        { id: "blogs", labelEn: "Blogs", labelAr: "المقالات", icon: FileText, badge: counts.blogs },
        { id: "roles", labelEn: "Roles", labelAr: "الأدوار والصلاحيات", icon: ShieldCheck, badge: counts.roles },
        { id: "faqs", labelEn: "FAQs", labelAr: "الأسئلة الشائعة", icon: HelpCircle, badge: counts.faqs },
      ],
    },
    {
      key: "home",
      titleEn: "Home",
      titleAr: "الصفحة الرئيسية",
      items: [
        { id: "home-popups", labelEn: "Home Popups", labelAr: "النوافذ المنبثقة", icon: Megaphone, badge: counts["home-popups"] },
        { id: "home-hero", labelEn: "Home Hero", labelAr: "القسم الرئيسي", icon: Sparkles },
        { id: "features", labelEn: "Features", labelAr: "المميزات", icon: Layers },
        { id: "fleet-capabilities", labelEn: "Fleet Capabilities", labelAr: "قدرات التشغيل", icon: Truck },
        { id: "coverage-network", labelEn: "Coverage Network", labelAr: "شبكة التغطية", icon: Globe },
        { id: "industries", labelEn: "Industries", labelAr: "القطاعات", icon: Building2 },
      ],
    },
    {
      key: "business",
      titleEn: "Business",
      titleAr: "الأعمال",
      items: [
        { id: "business-pages", labelEn: "Business Pages", labelAr: "صفحات الأعمال", icon: Briefcase, badge: counts["business-pages"] },
      ],
    },
    {
      key: "legal",
      titleEn: "Legal",
      titleAr: "القانونية",
      items: [
        { id: "legal-pages", labelEn: "Legal Pages", labelAr: "الصفحات القانونية", icon: Scale, badge: counts["legal-pages"] },
      ],
    },
    {
      key: "global",
      titleEn: "Global",
      titleAr: "الإعدادات العامة",
      items: [
        { id: "navigation-links", labelEn: "Navigation Links", labelAr: "روابط التنقل", icon: Link2, badge: counts["navigation-links"] },
        { id: "social-links", labelEn: "Social Links", labelAr: "روابط التواصل", icon: Share2, badge: counts["social-links"] },
        { id: "contact-us", labelEn: "Contact Us", labelAr: "تواصل معنا", icon: PhoneCall },
      ],
    },
    {
      key: "seo",
      titleEn: "SEO Settings",
      titleAr: "إعدادات السيو",
      items: [
        { id: "site-seo", labelEn: "Site SEO", labelAr: "سيو الموقع", icon: SearchCheck },
        { id: "google-tag-manager", labelEn: "Google Tag Manager", labelAr: "مدير وسوم جوجل", icon: Code2 },
      ],
    },
    {
      key: "about",
      titleEn: "About",
      titleAr: "عن المنصة",
      items: [
        { id: "about-us", labelEn: "About Us", labelAr: "من نحن", icon: Info },
      ],
    },
    {
      key: "compliance",
      titleEn: "KSA Compliance",
      titleAr: "الامتثال السعودي",
      items: [
        { id: "identity", labelEn: "Identity & Licenses", labelAr: "الهوية والتراخيص", icon: BadgeCheck },
        { id: "zatca", labelEn: "ZATCA & VAT", labelAr: "الزكاة والضريبة", icon: Receipt },
      ],
    },
  ];

  const baseBg = darkMode
    ? "bg-[#11131A] border-[#222634] text-slate-200"
    : "bg-[#F8F9FA] border-[#E5E7EB] text-[#111827]";

  if (collapsed) {
    return (
      <aside className={`w-[64px] shrink-0 border-r flex flex-col items-center py-3 gap-2 select-none ${baseBg}`}>
        <button
          onClick={() => onSelectTab("dashboard")}
          className="w-9 h-9 rounded-lg bg-[#2563EB] text-white font-bold text-sm flex items-center justify-center shadow-sm"
          title="QafNest CMS"
        >
          QN
        </button>
        <button
          onClick={onOpenSearch}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
            darkMode ? "hover:bg-white/10 text-slate-400" : "hover:bg-gray-200/70 text-gray-500"
          }`}
          title="Search (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectTab("dashboard")}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
            activeTab === "dashboard"
              ? "bg-[#2563EB]/10 text-[#2563EB]"
              : darkMode
              ? "hover:bg-white/10 text-slate-400"
              : "hover:bg-gray-200/70 text-gray-600"
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
        </button>
        <div className="w-6 border-t border-current opacity-15 my-1" />
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-1.5 w-full px-2">
          {groups.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isAr ? item.labelAr : item.labelEn}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition shrink-0 ${
                  active
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : darkMode
                    ? "text-slate-400 hover:bg-white/10 hover:text-white"
                    : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`w-[252px] shrink-0 border-r flex flex-col h-screen sticky top-0 select-none ${baseBg}`}>
      {/* Brand Header */}
      <div className={`px-4 py-3.5 border-b flex items-center justify-between ${darkMode ? "border-[#222634]" : "border-[#E5E7EB]"}`}>
        <button
          onClick={() => onSelectTab("dashboard")}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white font-extrabold text-xs tracking-wider flex items-center justify-center shadow-sm">
            QN
          </div>
          <div className="leading-tight">
            <div className={`text-[15px] font-extrabold tracking-tight ${darkMode ? "text-white" : "text-[#0F172A]"}`}>
              QafNest
            </div>
            <div className={`text-[10px] font-medium uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {isAr ? "نظام إدارة المحتوى" : "Content Studio"}
            </div>
          </div>
        </button>
      </div>

      {/* Search Trigger */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onOpenSearch}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition ${
            darkMode
              ? "bg-[#181B24] border-[#2A2F3E] text-slate-400 hover:border-slate-500"
              : "bg-white border-[#E5E7EB] text-gray-500 hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          }`}
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>{isAr ? "بحث..." : "Search"}</span>
          </span>
          <kbd
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              darkMode ? "bg-white/10 text-slate-300" : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 dropdown-scroll">
        {/* Dashboard Link */}
        <button
          onClick={() => onSelectTab("dashboard")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition ${
            activeTab === "dashboard"
              ? darkMode
                ? "bg-[#2563EB]/20 text-blue-400 font-semibold"
                : "bg-[#EFF6FF] text-[#2563EB] font-semibold"
              : darkMode
              ? "text-slate-300 hover:bg-white/5"
              : "text-[#374151] hover:bg-gray-200/60"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>{isAr ? "لوحة التحكم" : "Dashboard"}</span>
        </button>

        {/* Groups */}
        {groups.map((group) => {
          const isOpen = openGroups[group.key] !== false;
          return (
            <div key={group.key} className="space-y-0.5">
              <button
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                  darkMode ? "text-slate-400 hover:text-slate-200" : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <span>{isAr ? group.titleAr : group.titleEn}</span>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition ${
                          active
                            ? darkMode
                              ? "bg-[#2563EB] text-white font-semibold shadow-sm"
                              : "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                            : darkMode
                            ? "text-slate-300 hover:bg-white/5 hover:text-white"
                            : "text-[#374151] hover:bg-gray-200/60 hover:text-[#111827]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "" : darkMode ? "text-slate-400" : "text-[#6B7280]"}`} />
                          <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                        </span>
                        {typeof item.badge === "number" && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              active
                                ? darkMode
                                  ? "bg-white/20 text-white"
                                  : "bg-[#DBEAFE] text-[#1D4ED8]"
                                : darkMode
                                ? "bg-white/10 text-slate-400"
                                : "bg-gray-200/80 text-gray-600"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className={`px-3.5 py-2.5 border-t text-xs flex items-center gap-2.5 ${darkMode ? "border-[#222634] bg-[#0D0F15]" : "border-[#E5E7EB] bg-white"}`}>
        <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white font-semibold text-xs flex items-center justify-center shrink-0">
          {(userEmail?.[0] || "A").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`font-medium truncate text-[12px] ${darkMode ? "text-white" : "text-[#111827]"}`}>
            {userEmail || "admin@qafnest.com"}
          </div>
          <div className={`text-[10px] ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
            {isAr ? "مدير النظام" : "Super Admin"}
          </div>
        </div>
      </div>
    </aside>
  );
}

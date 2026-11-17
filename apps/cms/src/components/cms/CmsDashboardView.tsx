"use client";

import React from "react";
import {
  Users,
  Image as ImageIcon,
  FolderTree,
  FileText,
  ShieldCheck,
  HelpCircle,
  Megaphone,
  Scale,
  Link2,
  Share2,
  Sparkles,
  PhoneCall,
  SearchCheck,
  Code2,
  Info,
  ArrowUpRight,
} from "lucide-react";
import type { CmsLocale, CmsTab, CmsWorkspaceData } from "@/types/cms";

interface CmsDashboardViewProps {
  workspace: CmsWorkspaceData;
  blogsCount: number;
  locale: CmsLocale;
  darkMode: boolean;
  onSelectTab: (tab: CmsTab) => void;
}

function MiniSparkline({ color = "#2563EB", seed = 0 }: { color?: string; seed?: number }) {
  const paths = [
    "M2 22 L12 18 L22 20 L32 12 L42 15 L52 8 L62 10 L72 4",
    "M2 20 L14 21 L24 14 L36 16 L48 9 L60 11 L72 5",
    "M2 24 L16 17 L28 19 L40 13 L54 10 L72 6",
    "M2 18 L15 22 L28 15 L42 11 L56 14 L72 4",
  ];
  const d = paths[seed % paths.length];
  return (
    <svg viewBox="0 0 74 28" className="w-16 h-7 overflow-visible" fill="none">
      <path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CmsDashboardView({
  workspace,
  blogsCount,
  locale,
  darkMode,
  onSelectTab,
}: CmsDashboardViewProps) {
  const isAr = locale === "ar";

  const collectionCards: Array<{
    tab: CmsTab;
    titleEn: string;
    titleAr: string;
    count: number;
    trend: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = [
    { tab: "blogs", titleEn: "Blogs", titleAr: "المقالات", count: blogsCount, trend: "Live", icon: FileText, color: "#10B981" },
    { tab: "categories", titleEn: "Categories", titleAr: "التصنيفات", count: workspace.categories.length, trend: "Active", icon: FolderTree, color: "#8B5CF6" },
    { tab: "media", titleEn: "Media", titleAr: "الوسائط", count: workspace.media.length, trend: "Library", icon: ImageIcon, color: "#0EA5E9" },
    { tab: "faqs", titleEn: "FAQs", titleAr: "الأسئلة الشائعة", count: workspace.faqs.length, trend: "Published", icon: HelpCircle, color: "#F59E0B" },
    { tab: "home-popups", titleEn: "Home Popups", titleAr: "النوافذ المنبثقة", count: workspace.homePopups.length, trend: "Banners", icon: Megaphone, color: "#EC4899" },
    { tab: "legal-pages", titleEn: "Legal Pages", titleAr: "الصفحات القانونية", count: workspace.legalPages.length, trend: "Synced", icon: Scale, color: "#64748B" },
    { tab: "navigation-links", titleEn: "Navigation Links", titleAr: "روابط التنقل", count: workspace.navigationLinks.length, trend: "Menu", icon: Link2, color: "#3B82F6" },
    { tab: "social-links", titleEn: "Social Links", titleAr: "روابط التواصل", count: workspace.socialLinks.length, trend: "Social", icon: Share2, color: "#06B6D4" },
    { tab: "users", titleEn: "Users", titleAr: "المستخدمون", count: workspace.users.length, trend: "Team", icon: Users, color: "#2563EB" },
    { tab: "roles", titleEn: "Roles", titleAr: "الأدوار والصلاحيات", count: workspace.roles.length, trend: "RBAC", icon: ShieldCheck, color: "#6366F1" },
  ];

  const globalCards: Array<{
    tab: CmsTab;
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { tab: "home-hero", titleEn: "Home Hero", titleAr: "القسم الرئيسي", descEn: "Manage homepage hero banner & CTAs", descAr: "إدارة الواجهة الرئيسية والأزرار", icon: Sparkles },
    { tab: "contact-us", titleEn: "Contact Us", titleAr: "تواصل معنا", descEn: "Manage phone, WhatsApp & support emails", descAr: "إدارة الهاتف وواتساب والبريد", icon: PhoneCall },
    { tab: "site-seo", titleEn: "Site SEO", titleAr: "سيو الموقع", descEn: "Manage meta tags, Open Graph & robots", descAr: "إدارة الميتا تاج والسيو", icon: SearchCheck },
    { tab: "google-tag-manager", titleEn: "Google Tag Manager", titleAr: "مدير وسوم جوجل", descEn: "Manage GTM analytics container", descAr: "إدارة تتبع جوجل تاج مانجر", icon: Code2 },
    { tab: "about-us", titleEn: "About Us", titleAr: "من نحن", descEn: "Manage QafNest brand story & SEO", descAr: "إدارة قصة قاف نست والسيو", icon: Info },
  ];

  const cardCls = darkMode
    ? "bg-[#151822] border-[#222634] hover:border-blue-500/60 text-white"
    : "bg-white border-[#E5E7EB] hover:border-[#2563EB]/60 text-[#111827] shadow-sm hover:shadow-md";

  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-[#111827]"}`}>
          {isAr ? "لوحة التحكم" : "Dashboard"}
        </h1>
        <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
          {isAr
            ? "إدارة مقالات قاف نست، الوسائط، الأسئلة الشائعة، الصفحات القانونية وإعدادات السيو"
            : "Manage QafNest blogs, media assets, FAQs, legal pages, navigation, and global SEO"}
        </p>
      </div>

      {/* Collections Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${darkMode ? "text-slate-200" : "text-[#374151]"}`}>
            {isAr ? "المجموعات (Collections)" : "Collections"}
          </h2>
          <span className={`text-xs ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
            {collectionCards.length} {isAr ? "مجموعات" : "collections"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {collectionCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={card.tab}
                type="button"
                onClick={() => onSelectTab(card.tab)}
                className={`group rounded-xl border p-4 text-left transition flex flex-col justify-between gap-4 ${cardCls}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        darkMode ? "bg-white/5" : "bg-[#EFF6FF]"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {isAr ? card.titleAr : card.titleEn}
                      </div>
                      <div className={`text-[11px] ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                        {isAr ? "مجموعة" : "Collection"}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#2563EB] transition shrink-0" />
                </div>

                <div className="flex items-end justify-between gap-2 pt-1">
                  <div>
                    <div className="text-2xl font-bold leading-none">{card.count}</div>
                    <span className="inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {card.trend}
                    </span>
                  </div>
                  <MiniSparkline color={card.color} seed={idx} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Globals Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${darkMode ? "text-slate-200" : "text-[#374151]"}`}>
            {isAr ? "الإعدادات العامة (Globals)" : "Globals"}
          </h2>
          <span className={`text-xs ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
            {globalCards.length} {isAr ? "إعدادات" : "globals"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {globalCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.tab}
                type="button"
                onClick={() => onSelectTab(card.tab)}
                className={`group rounded-xl border p-4 text-left transition flex flex-col justify-between gap-3 ${cardCls}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      darkMode ? "bg-white/5" : "bg-[#EFF6FF]"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#2563EB] transition" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{isAr ? card.titleAr : card.titleEn}</div>
                  <div className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                    {isAr ? card.descAr : card.descEn}
                  </div>
                </div>
                <div className="text-[11px] font-medium text-[#2563EB]">
                  {isAr ? "إدارة الإعدادات ←" : "Manage configuration →"}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

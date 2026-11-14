"use client";

import React from "react";
import {
  User,
  Wallet,
  CreditCard,
  Users,
  ThumbsUp,
  Mail,
  MessageSquare,
  BookOpen,
  FileText,
  ChevronRight,
  Power,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { TabId } from "./types";

interface SidebarMenuItem {
  id: TabId;
  icon: LucideIcon;
  titleEn: string;
  titleAr: string;
  badgeEn?: string;
  badgeAr?: string;
  highlight?: boolean;
}

interface SidebarMenuCategory {
  headingEn: string;
  headingAr: string;
  items: SidebarMenuItem[];
}

interface AccountSidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  walletBalance: number;
  language: string;
  user: SupabaseUser | null;
  openAuthModal: (mode: "signin" | "signup") => void;
  signOut: () => void;
  t: (en: string, ar: string) => string;
}

export default function AccountSidebar({
  activeTab,
  setActiveTab,
  walletBalance,
  language,
  user,
  openAuthModal,
  signOut,
  t,
}: AccountSidebarProps) {
  const menuCategories: SidebarMenuCategory[] = [
    {
      headingEn: "My Account & Finance",
      headingAr: "حسابي والمالية",
      items: [
        {
          id: "profile" as TabId,
          icon: User,
          titleEn: "Profile",
          titleAr: "الملف الشخصي",
          badgeEn: "Verified",
          badgeAr: "موثق",
        },
        {
          id: "wallet" as TabId,
          icon: Wallet,
          titleEn: "Wallet record",
          titleAr: "سجل المحفظة",
          badgeEn: `${walletBalance.toFixed(2)} SAR`,
          badgeAr: `${walletBalance.toFixed(2)} ر.س`,
        },
        {
          id: "payments" as TabId,
          icon: CreditCard,
          titleEn: "Payment methods",
          titleAr: "طرق الدفع",
          badgeEn: "Mada & Apple Pay",
          badgeAr: "مدى وأبل باي",
        },
      ],
    },
    {
      headingEn: "Rewards & Referrals",
      headingAr: "المكافآت والدعوات",
      items: [
        {
          id: "invite" as TabId,
          icon: Users,
          titleEn: "Invite Friends",
          titleAr: "دعوة الأصدقاء",
          badgeEn: "+50 SAR",
          badgeAr: "+٥٠ ر.س",
        },
        {
          id: "rate" as TabId,
          icon: ThumbsUp,
          titleEn: "Rate us",
          titleAr: "قيّمنا وملاحظات الخدمة",
        },
      ],
    },
    {
      headingEn: "Support & Legal",
      headingAr: "الدعم والأنظمة",
      items: [
        {
          id: "contact" as TabId,
          icon: Mail,
          titleEn: "Contact Guest Experience",
          titleAr: "تواصل مع تجربة الضيف",
          badgeEn: "24/7 Live",
          badgeAr: "متاح ٢٤/٧",
        },
        {
          id: "faqs" as TabId,
          icon: MessageSquare,
          titleEn: "FAQs",
          titleAr: "الأسئلة الشائعة",
        },
        {
          id: "terms" as TabId,
          icon: FileText,
          titleEn: "Terms of use",
          titleAr: "شروط الاستخدام",
        },
        {
          id: "privacy" as TabId,
          icon: BookOpen,
          titleEn: "Privacy policy",
          titleAr: "سياسة الخصوصية",
        },
      ],
    },
  ];

  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="bg-white dark:bg-[#0E0E1A] rounded-3xl border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 shadow-xs">
        <div className="space-y-6">
          {menuCategories.map((cat, catIdx) => (
            <div key={catIdx}>
              <p className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                {language === "ar" ? cat.headingAr : cat.headingEn}
              </p>

              <div className="space-y-1">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#4F2396] text-white shadow-md shadow-purple-900/20"
                          : item.highlight
                          ? "bg-amber-50/70 dark:bg-amber-950/20 text-[#4F2396] dark:text-[#FF9750] hover:bg-amber-100/70"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                            isActive
                              ? "bg-white/20 text-white"
                              : item.highlight
                              ? "bg-[#FF9750]/20 text-[#FF9750]"
                              : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <span>{language === "ar" ? item.titleAr : item.titleEn}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badgeEn && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : item.highlight
                                ? "bg-[#FF9750] text-slate-950 font-black"
                                : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {language === "ar" ? item.badgeAr : item.badgeEn}
                          </span>
                        )}
                        <ChevronRight
                          size={15}
                          className={`opacity-50 rtl:rotate-180 transition ${
                            isActive ? "opacity-100" : ""
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button in sidebar */}
        <div className="pt-4 mt-6 border-t border-slate-100 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              if (user) signOut();
              else openAuthModal("signin");
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <Power size={16} />
              </div>
              <span>{t("Logout", "تسجيل الخروج")}</span>
            </div>
            <ChevronRight size={15} className="rtl:rotate-180 opacity-50" />
          </button>
        </div>
      </div>

      {/* Official Saudi Regulatory Badge Card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-purple-50/80 to-white dark:from-[#0E0E1A] dark:to-[#141224] border border-purple-200/60 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 space-y-2.5">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1">
          <ShieldCheck className="text-emerald-500" size={18} />
          <span>{t("Regulatory Accreditation", "الاعتماد النظامي والتراخيص")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t("Commercial Registration", "السجل التجاري")}</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">7007384501</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t("MOT License", "ترخيص وزارة السياحة")}</span>
          <span className="font-mono font-bold text-[#4F2396] dark:text-purple-300">73102999</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t("License Category", "فئة الترخيص")}</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {t("Accommodation Unit Reservation", "حجز وحدات الضيافة والإيواء")}
          </span>
        </div>
        <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 text-center font-bold">
          QafNest Luxury Stays · v1.0 Production
        </div>
      </div>
    </div>
  );
}


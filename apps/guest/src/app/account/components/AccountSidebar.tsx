"use client";

import React from "react";
import {
  User,
  Wallet,
  CreditCard,
  Users,
  ThumbsUp,
  ChevronRight,
  Power,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { TabId } from "./types";

interface SidebarMenuItem {
  id: TabId;
  icon: LucideIcon;
  titleEn: string;
  titleAr: string;
  metaEn?: string;
  metaAr?: string;
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
  isIdentityVerified: boolean;
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
  isIdentityVerified,
  language,
  user,
  openAuthModal,
  signOut,
  t,
}: AccountSidebarProps) {
  const menuCategories: SidebarMenuCategory[] = [
    {
      headingEn: "Account & Wallet",
      headingAr: "الحساب والمحفظة",
      items: [
        {
          id: "profile",
          icon: User,
          titleEn: "Profile",
          titleAr: "الملف الشخصي",
          metaEn: isIdentityVerified ? "Verified" : "Pending ID",
          metaAr: isIdentityVerified ? "موثق" : "بانتظار الهوية",
        },
        {
          id: "wallet",
          icon: Wallet,
          titleEn: "Wallet record",
          titleAr: "سجل المحفظة",
          metaEn: `${walletBalance.toFixed(2)} SAR`,
          metaAr: `${walletBalance.toFixed(2)} ر.س`,
        },
        {
          id: "payments",
          icon: CreditCard,
          titleEn: "Payment methods",
          titleAr: "طرق الدفع",
        },
      ],
    },
    {
      headingEn: "Rewards & Feedback",
      headingAr: "المكافآت والتقييم",
      items: [
        {
          id: "invite",
          icon: Users,
          titleEn: "Invite Friends",
          titleAr: "دعوة الأصدقاء",
        },
        {
          id: "rate",
          icon: ThumbsUp,
          titleEn: "Rate us",
          titleAr: "قيّمنا",
        },
      ],
    },
  ];

  return (
    <div className="lg:col-span-4">
      <div className="bg-white dark:bg-[#0E0E1A] rounded-2xl border border-[#E4DFF0] dark:border-white/[0.08] shadow-xs p-4">
        <div className="space-y-5">
          {menuCategories.map((cat, catIdx) => (
            <div key={catIdx}>
              <p className="px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#4F2396] text-white"
                          : "text-slate-800 dark:text-slate-200 hover:bg-[#F5F1FC] dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          size={16}
                          strokeWidth={1.75}
                          className={
                            isActive
                              ? "text-white shrink-0"
                              : "text-slate-600 dark:text-slate-400 shrink-0"
                          }
                        />
                        <span className="truncate">
                          {language === "ar" ? item.titleAr : item.titleEn}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.metaEn && (
                          <span
                            className={`text-xs font-mono tabular-nums ${
                              isActive
                                ? "text-white/90"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <bdi dir="ltr">
                              {language === "ar" ? item.metaAr : item.metaEn}
                            </bdi>
                          </span>
                        )}
                        <ChevronRight
                          size={14}
                          className={`rtl:rotate-180 ${
                            isActive ? "opacity-95" : "opacity-70"
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

        <div className="pt-3 mt-4 border-t border-slate-200 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              if (user) signOut();
              else openAuthModal("signin");
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Power size={16} strokeWidth={1.75} className="shrink-0" />
              <span>{t("Sign out", "تسجيل الخروج")}</span>
            </div>
            <ChevronRight size={14} className="rtl:rotate-180 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
}

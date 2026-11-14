"use client";

import React from "react";
import { User, CreditCard, Bell, ShieldCheck } from "lucide-react";
import type { SettingsTab, SettingsTabItem } from "./types";

interface SettingsTabsNavProps {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  lang: "ar" | "en";
}

const TABS: SettingsTabItem[] = [
  {
    id: "profile",
    labelEn: "Personal Information",
    labelAr: "المعلومات الشخصية",
    descriptionEn: "Profile, phone & ID details",
    descriptionAr: "الاسم، الهوية، ومعلومات التواصل",
  },
  {
    id: "payout",
    labelEn: "Payout Methods",
    labelAr: "طرق استلام المستحقات",
    descriptionEn: "Bank accounts & schedule",
    descriptionAr: "الآيبان والجدولة البنكية",
  },
  {
    id: "notifications",
    labelEn: "Notification Preferences",
    labelAr: "تفضيلات الإشعارات",
    descriptionEn: "Alerts, SMS & WhatsApp",
    descriptionAr: "التنبيهات، الرسائل وواتساب",
  },
  {
    id: "security",
    labelEn: "Security Settings",
    labelAr: "إعدادات الأمان",
    descriptionEn: "Password & 2FA protection",
    descriptionAr: "كلمة المرور وحماية الحساب",
  },
];

export function SettingsTabsNav({
  activeTab,
  onSelectTab,
  lang,
}: SettingsTabsNavProps) {
  const isAr = lang === "ar";

  const getIcon = (id: SettingsTab) => {
    switch (id) {
      case "profile":
        return <User size={18} />;
      case "payout":
        return <CreditCard size={18} />;
      case "notifications":
        return <Bell size={18} />;
      case "security":
        return <ShieldCheck size={18} />;
    }
  };

  return (
    <div className="w-full border-b border-slate-200/90 bg-white">
      <div className="mx-auto flex max-w-[1640px] items-center gap-2 overflow-x-auto px-4 sm:px-8 py-2 no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`group flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#4F2396] text-white shadow-md shadow-violet-950/15"
                  : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
              }`}
            >
              <div
                className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                }`}
              >
                {getIcon(tab.id)}
              </div>
              <div className="text-left rtl:text-right">
                <span className="block leading-tight font-extrabold">
                  {isAr ? tab.labelAr : tab.labelEn}
                </span>
                <span
                  className={`mt-0.5 block text-[11px] font-medium leading-none ${
                    isActive ? "text-violet-200" : "text-slate-400"
                  }`}
                >
                  {isAr ? tab.descriptionAr : tab.descriptionEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


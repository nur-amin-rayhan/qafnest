"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Headphones,
  WalletCards,
  Tag,
  Award,
  Users,
  MessageSquare,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getAdminTabHref } from "@/lib/adminRoutes";
import type { NavTab } from "./types";

interface AdminSidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pendingPayoutsCount?: number;
  overduePayoutsCount?: number;
  onNavItemClick?: () => void;
}

interface NavGroup {
  title: string;
  items: Array<{ id: NavTab; label: string }>;
}

const NAV_ICONS: Record<NavTab, LucideIcon> = {
  "dashboard-overview": LayoutDashboard,
  "properties-management": Building2,
  "bookings-and-reservations": Calendar,
  "helpline-booking": Headphones,
  "financials-and-payouts": WalletCards,
  "promotions-and-coupons": Tag,
  "loyalty-and-rewards": Award,
  "user-management": Users,
  "guest-reviews": MessageSquare,
  "settings": Settings,
};

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  pendingPayoutsCount = 0,
  overduePayoutsCount = 0,
  onNavItemClick,
}: AdminSidebarProps) {
  const { dir, t, mobileSidebarOpen, setMobileSidebarOpen } = useAdminAuth();

  const navGroups: NavGroup[] = [
    {
      title: t("Operations", "العمليات"),
      items: [
        {
          id: "dashboard-overview",
          label: t("Dashboard", "لوحة التحكم"),
        },
        {
          id: "properties-management",
          label: t("Properties", "العقارات"),
        },
        {
          id: "bookings-and-reservations",
          label: t("Bookings", "الحجوزات"),
        },
        {
          id: "helpline-booking",
          label: t("Helpline Booking", "الحجز الهاتفي"),
        },
      ],
    },
    {
      title: t("Finance & Growth", "المالية والنمو"),
      items: [
        {
          id: "financials-and-payouts",
          label: t("Financials & Payouts", "المالية والمدفوعات"),
        },
        {
          id: "promotions-and-coupons",
          label: t("Promotions", "العروض والخصومات"),
        },
        {
          id: "loyalty-and-rewards",
          label: t("Loyalty", "نقاط الولاء"),
        },
      ],
    },
    {
      title: t("Platform", "المنصة"),
      items: [
        {
          id: "user-management",
          label: t("Users", "المستخدمون"),
        },
        {
          id: "guest-reviews",
          label: t("Reviews", "التقييمات"),
        },
        {
          id: "settings",
          label: t("Settings", "الإعدادات"),
        },
      ],
    },
  ];

  return (
    <>
      {mobileSidebarOpen && (
        <div
          role="presentation"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        dir={dir}
        className={`fixed top-0 bottom-0 start-0 h-full w-64 bg-white dark:bg-[#0E0D16] z-50 flex flex-col justify-between border-e border-[#E5E7EB] dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen
            ? "translate-x-0"
            : dir === "rtl"
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800 shrink-0">
            <Link
              href={getAdminTabHref("dashboard-overview")}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("dashboard-overview");
                setMobileSidebarOpen(false);
                onNavItemClick?.();
              }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-[#4F2396] flex items-center justify-center text-white font-bold text-sm tracking-wider shrink-0 shadow-2xs">
                QN
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  QafNest
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                  {t("Admin Hub", "لوحة الإدارة")}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t("Close Menu", "إغلاق القائمة")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Grouped Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.title}
                </div>

                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const IconComp = NAV_ICONS[item.id] || LayoutDashboard;
                  return (
                    <Link
                      key={item.id}
                      href={getAdminTabHref(item.id)}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                        onNavItemClick?.();
                      }}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        isActive
                          ? "bg-purple-50 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                      }`}
                    >
                      <IconComp
                        size={18}
                        strokeWidth={1.75}
                        className={`shrink-0 ${
                          isActive
                            ? "text-[#4F2396] dark:text-purple-400"
                            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        }`}
                      />

                      <span className="truncate flex-1" title={item.label}>
                        {item.label}
                      </span>

                      {item.id === "financials-and-payouts" && pendingPayoutsCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold shrink-0 ${
                            overduePayoutsCount > 0
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {pendingPayoutsCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Live Sync Status Footer */}
        <div className="px-4 py-3 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t("Live sync", "مزامنة فورية")}
            </span>
          </div>
          <a
            href="tel:+966576707709"
            className="text-xs font-mono text-[#4F2396] dark:text-purple-400 font-semibold hover:underline"
          >
            0576707709
          </a>
        </div>
      </aside>
    </>
  );
}

"use client";

import React from "react";
import Link from "next/link";
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
  items: Array<{ id: NavTab; label: string; icon: string }>;
}

export default function AdminSidebar({
  activeTab,
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
          icon: "dashboard",
        },
        {
          id: "properties-management",
          label: t("Properties", "العقارات"),
          icon: "villa",
        },
        {
          id: "bookings-and-reservations",
          label: t("Bookings", "الحجوزات"),
          icon: "calendar_month",
        },
        {
          id: "helpline-booking",
          label: t("Helpline Booking", "الحجز الهاتفي"),
          icon: "support_agent",
        },
      ],
    },
    {
      title: t("Finance & Growth", "المالية والنمو"),
      items: [
        {
          id: "financials-and-payouts",
          label: t("Financials & Payouts", "المالية والمدفوعات"),
          icon: "payments",
        },
        {
          id: "promotions-and-coupons",
          label: t("Promotions", "العروض والخصومات"),
          icon: "loyalty",
        },
        {
          id: "loyalty-and-rewards",
          label: t("Loyalty", "نقاط الولاء"),
          icon: "stars",
        },
      ],
    },
    {
      title: t("Platform", "المنصة"),
      items: [
        {
          id: "user-management",
          label: t("Users", "المستخدمون"),
          icon: "manage_accounts",
        },
        {
          id: "guest-reviews",
          label: t("Reviews", "التقييمات"),
          icon: "reviews",
        },
        {
          id: "settings",
          label: t("Settings", "الإعدادات"),
          icon: "tune",
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
        className={`fixed top-0 bottom-0 start-0 h-full w-64 bg-white z-50 flex flex-col justify-between border-e border-[#E5E7EB] transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen
            ? "translate-x-0"
            : dir === "rtl"
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Clean Brand Header matching CMS Studio */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#E5E7EB] shrink-0">
            <Link
              href={getAdminTabHref("dashboard-overview")}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-extrabold text-xs tracking-wider shrink-0">
                QN
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[15px] font-extrabold tracking-tight text-[#0F172A] truncate">
                  QafNest
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold truncate">
                  {t("Admin Hub", "لوحة الإدارة")}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title={t("Close Menu", "إغلاق القائمة")}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Clean Grouped Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  {group.title}
                </div>

                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={getAdminTabHref(item.id)}
                      onClick={() => {
                        setMobileSidebarOpen(false);
                        onNavItemClick?.();
                      }}
                      className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                          : "text-[#374151] hover:bg-gray-100 hover:text-[#111827] font-medium"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] shrink-0 ${
                          isActive ? "text-[#2563EB]" : "text-[#6B7280] group-hover:text-[#111827]"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span className="truncate flex-1" title={item.label}>
                        {item.label}
                      </span>

                      {item.id === "financials-and-payouts" && pendingPayoutsCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            overduePayoutsCount > 0
                              ? "bg-rose-600 text-white"
                              : "bg-amber-100 text-amber-800"
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

        {/* Minimal Live Sync Status Footer */}
        <div className="px-4 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium text-gray-700">
              {t("Live Sync Active", "مزامنة فورية")}
            </span>
          </div>
          <a
            href="tel:+966576707709"
            className="text-[#2563EB] font-semibold hover:underline"
          >
            0576707709
          </a>
        </div>
      </aside>
    </>
  );
}

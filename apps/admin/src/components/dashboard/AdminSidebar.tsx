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

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  pendingPayoutsCount = 0,
  overduePayoutsCount = 0,
  onNavItemClick,
}: AdminSidebarProps) {
  const { lang, dir, t, mobileSidebarOpen, setMobileSidebarOpen } = useAdminAuth();

  const navItems: Array<{ id: NavTab; label: string; icon: string }> = [
    {
      id: "dashboard-overview",
      label: t("Dashboard Overview", "نظرة عامة على لوحة التحكم"),
      icon: "dashboard",
    },
    {
      id: "properties-management",
      label: t("Properties & Chalets", "العقارات والشاليهات"),
      icon: "villa",
    },
    {
      id: "bookings-and-reservations",
      label: t("Bookings & Schedule", "الحجوزات والجدول"),
      icon: "calendar_month",
    },
    {
      id: "helpline-booking",
      label: t("Helpline Booking", "الحجز الهاتفي والدعم"),
      icon: "support_agent",
    },
    {
      id: "user-management",
      label: t("User Management", "إدارة المستخدمين"),
      icon: "manage_accounts",
    },
    {
      id: "promotions-and-coupons",
      label: t("Promotions & Coupons", "العروض وأكواد الخصم"),
      icon: "loyalty",
    },
    {
      id: "loyalty-and-rewards",
      label: t("Loyalty & Rewards", "نقاط الولاء والمكافآت"),
      icon: "stars",
    },
    {
      id: "financials-and-payouts",
      label: t("Financials & Payouts", "المالية والمدفوعات"),
      icon: "payments",
    },
    {
      id: "guest-reviews",
      label: t("Guest Reviews", "تقييمات الضيوف"),
      icon: "reviews",
    },
    {
      id: "settings",
      label: t("Platform Settings", "إعدادات المنصة"),
      icon: "tune",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          role="presentation"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar (Fixed on Desktop, Slide-over Drawer on Mobile) */}
      <aside
        dir={dir}
        className={`fixed top-0 bottom-0 start-0 h-full w-64 xl:w-72 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_12px_rgba(0,0,0,0.06)] border-e border-surface-container transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen
            ? "translate-x-0"
            : dir === "rtl"
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Logo & Operations Title */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-surface-container-low shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary font-black text-lg shadow-sm shrink-0">
                Q
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-base font-black tracking-tight text-primary leading-none truncate">
                  QafNest
                </span>
                <span className="font-label-sm text-[10px] text-outline tracking-wider uppercase font-bold mt-0.5 truncate">
                  {t("Operations Hub", "مركز العمليات")}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title={t("Close Menu", "إغلاق القائمة")}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Section Header */}
          <div className="px-5 pt-4 pb-2 shrink-0">
            <div className="font-label-sm text-[10.5px] uppercase text-outline font-bold tracking-wider">
              {t("Management Console", "لوحة الإدارة المركزية")}
            </div>
          </div>

          {/* Navigation Links with ample spacing to completely prevent label clipping */}
          <nav className="flex flex-col gap-1.5 px-3 py-1 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={getAdminTabHref(item.id)}
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    onNavItemClick?.();
                  }}
                  className={`group relative min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isActive
                      ? "bg-primary-container text-on-primary font-bold shadow-[0_2px_8px_-2px_rgba(79,35,150,0.25)]"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium"
                  }`}
                >
                  {/* Subtle active pill indicator on start edge */}
                  {isActive && (
                    <span className="absolute start-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-[#FF9750]" />
                  )}

                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                      isActive ? "text-on-primary" : "text-outline group-hover:text-primary"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* Fluid, non-clipping menu label */}
                  <span
                    className={`text-[13px] xl:text-[13.5px] font-semibold tracking-tight text-start truncate leading-snug ${
                      isActive ? "text-on-primary" : "text-on-surface-variant group-hover:text-on-surface"
                    }`}
                    title={item.label}
                  >
                    {item.label}
                  </span>

                  {item.id === "financials-and-payouts" && pendingPayoutsCount > 0 && (
                    <span
                      className={`ms-auto px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        overduePayoutsCount > 0
                          ? "bg-rose-600 text-white"
                          : isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {pendingPayoutsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Status Footer: v1.0.0 and Centralized Mode */}
        <div className="p-3.5 m-3.5 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-primary uppercase font-bold tracking-wider">
              {t("System Status", "حالة النظام")}
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-emerald"></span>
            </span>
          </div>
          <p className="font-body-sm text-[11px] text-on-surface-variant font-medium">
            {t("Centralized Operations • Live Sync", "عمليات مركزية • مزامنة فورية")}
          </p>
          <div className="pt-2 border-t border-surface-container-high/60 flex items-center justify-between text-outline font-code-sm text-[11px]">
            <span className="font-bold text-on-surface">v1.0.0</span>
            <a
              href="tel:+966576707709"
              className="px-2 py-0.5 rounded-md bg-surface-container font-semibold text-primary hover:underline"
            >
              {t("Support: 0576707709", "الدعم: 0576707709")}
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

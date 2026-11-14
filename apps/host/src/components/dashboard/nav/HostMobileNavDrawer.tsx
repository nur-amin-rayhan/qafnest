"use client";

import React from "react";
import Link from "next/link";
import { Module } from "../HostTopNav";

interface HostMobileNavDrawerProps {
  isOpen: boolean;
  active: Module;
  setActive: (module: Module) => void;
  onClose: () => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function HostMobileNavDrawer({
  isOpen,
  active,
  setActive,
  onClose,
  lang,
  t,
}: HostMobileNavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="border-t border-slate-200 bg-white p-4 lg:hidden animate-in slide-in-from-top-2">
      <div className="grid grid-cols-2 gap-2 text-xs font-black">
        {[
          { key: "overview", label: t("MAIN", "الرئيسية") },
          { key: "calendar", label: t("CALENDAR", "التقويم") },
          { key: "reservations", label: t("RESERVATIONS", "الحجوزات") },
          { key: "analytics", label: t("ANALYTICS", "التحليلات") },
          { key: "reviews", label: t("REVIEWS", "التقييمات") },
          { key: "properties", label: t("PROPERTY", "العقار") },
          { key: "finance", label: t("FINANCIAL TRANSACTIONS", "المعاملات المالية") },
          { key: "pricing", label: t("PRICES", "الأسعار") },
          { key: "settings", label: t("SETTINGS", "الاعدادات") },
        ].map((item) => (
          <Link
            key={item.key}
            href={`/${lang}/app/${item.key === "overview" ? "overview" : item.key}`}
            onClick={(e) => {
              e.preventDefault();
              setActive(item.key as Module);
              onClose();
            }}
            className={`rounded-xl px-3 py-2.5 text-center transition cursor-pointer ${
              active === item.key
                ? "bg-[#4F2396] text-white"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

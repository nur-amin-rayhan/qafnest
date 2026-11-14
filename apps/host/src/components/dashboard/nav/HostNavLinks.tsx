"use client";

import React from "react";
import Link from "next/link";
import { Module } from "../HostTopNav";

interface HostNavLinksProps {
  active: Module;
  setActive: (module: Module) => void;
  submittedPropertiesCount: number;
  hasPropertyIssues: boolean;
  bookingsCount: number;
  t: (en: string, ar: string) => string;
}

export function HostNavLinks({
  active,
  setActive,
  submittedPropertiesCount,
  hasPropertyIssues,
  bookingsCount,
  t,
}: HostNavLinksProps) {
  return (
    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 h-full">
      {/* 1. الرئيسية / OVERVIEW */}
      <Link
        href="/app/overview"
        onClick={(e) => {
          e.preventDefault();
          setActive("overview");
        }}
        className={`relative h-full px-3 inline-flex items-center text-[14px] font-extrabold transition cursor-pointer ${
          active === "overview" ? "text-[#4F2396]" : "text-slate-500 hover:text-[#4F2396]"
        }`}
      >
        <span>{t("OVERVIEW", "الرئيسية")}</span>
        {active === "overview" && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#4F2396]" />
        )}
      </Link>

      {/* 2. العقارات / PROPERTIES */}
      <Link
        href="/app/properties"
        onClick={(e) => {
          e.preventDefault();
          setActive("properties");
        }}
        className={`relative h-full px-3 inline-flex items-center gap-1.5 text-[14px] font-extrabold transition cursor-pointer ${
          active === "properties" ? "text-[#4F2396]" : "text-slate-500 hover:text-[#4F2396]"
        }`}
      >
        <span>{t("PROPERTIES", "العقارات")}</span>
        {hasPropertyIssues ? (
          <span className="rounded-full bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 animate-pulse">
            !
          </span>
        ) : submittedPropertiesCount > 0 ? (
          <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-black px-1.5 py-0.2">
            {submittedPropertiesCount}
          </span>
        ) : null}
        {active === "properties" && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#4F2396]" />
        )}
      </Link>

      {/* 3. الحجوزات / RESERVATIONS */}
      <Link
        href="/app/reservations"
        onClick={(e) => {
          e.preventDefault();
          setActive("reservations");
        }}
        className={`relative h-full px-3 inline-flex items-center gap-1.5 text-[14px] font-extrabold transition cursor-pointer ${
          active === "reservations" ? "text-[#4F2396]" : "text-slate-500 hover:text-[#4F2396]"
        }`}
      >
        <span>{t("RESERVATIONS", "الحجوزات")}</span>
        {bookingsCount > 0 && (
          <span className="rounded-full bg-violet-100 text-[#4F2396] text-[10px] font-black px-1.5 py-0.2">
            {bookingsCount}
          </span>
        )}
        {active === "reservations" && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#4F2396]" />
        )}
      </Link>

      {/* 4. التقويم والأسعار / CALENDAR & RATES */}
      <Link
        href="/app/calendar"
        onClick={(e) => {
          e.preventDefault();
          setActive("calendar");
        }}
        className={`relative h-full px-3 inline-flex items-center text-[14px] font-extrabold transition cursor-pointer ${
          active === "calendar" || active === "pricing"
            ? "text-[#4F2396]"
            : "text-slate-500 hover:text-[#4F2396]"
        }`}
      >
        <span>{t("CALENDAR & RATES", "التقويم والأسعار")}</span>
        {(active === "calendar" || active === "pricing") && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#4F2396]" />
        )}
      </Link>

      {/* 5. المبيعات والتحليلات / ANALYTICS */}
      <Link
        href="/app/analytics"
        onClick={(e) => {
          e.preventDefault();
          setActive("analytics");
        }}
        className={`relative h-full px-3 inline-flex items-center text-[14px] font-extrabold transition cursor-pointer ${
          active === "analytics" ? "text-[#4F2396]" : "text-slate-500 hover:text-[#4F2396]"
        }`}
      >
        <span>{t("SALES & ANALYTICS", "المبيعات والتحليلات")}</span>
        {active === "analytics" && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#4F2396]" />
        )}
      </Link>

      {/* 6. التقييمات / REVIEWS */}
      <Link
        href="/app/reviews"
        onClick={(e) => {
          e.preventDefault();
          setActive("reviews");
        }}
        className={`relative h-full px-3 inline-flex items-center text-[14px] font-extrabold transition cursor-pointer ${
          active === "reviews" ? "text-[#4F2396]" : "text-slate-500 hover:text-[#4F2396]"
        }`}
      >
        <span>{t("REVIEWS", "التقييمات")}</span>
        {active === "reviews" && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#4F2396]" />
        )}
      </Link>

      {/* 7. الحوالات المالية / FINANCIALS */}
      <Link
        href="/app/finance"
        onClick={(e) => {
          e.preventDefault();
          setActive("finance");
        }}
        className={`relative h-full px-3 inline-flex items-center text-[14px] font-extrabold transition cursor-pointer ${
          active === "finance" ? "text-[#4F2396]" : "text-slate-500 hover:text-[#4F2396]"
        }`}
      >
        <span>{t("FINANCIALS", "الحوالات المالية")}</span>
        {active === "finance" && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#4F2396]" />
        )}
      </Link>
    </nav>
  );
}

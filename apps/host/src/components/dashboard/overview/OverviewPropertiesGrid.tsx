"use client";

import React from "react";
import Link from "next/link";
import { Building2, Plus, CheckCircle2, AlertTriangle, Clock, Trash2 } from "lucide-react";
import { getLocalizedSaudiCity } from "@qafnest/shared";
import type { DeletePropertyTarget } from "../properties/DeletePropertyModal";
import type { HostPropertySummary, OverviewNavigateTab } from "./types";

interface OverviewPropertiesGridProps {
  properties: HostPropertySummary[];
  approvedPropertiesCount: number;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onNavigateTab: (tab: OverviewNavigateTab) => void;
  onDeleteProperty?: (prop: DeletePropertyTarget) => void;
}

export function OverviewPropertiesGrid({
  properties,
  approvedPropertiesCount,
  lang,
  t,
  onNavigateTab,
  onDeleteProperty,
}: OverviewPropertiesGridProps) {
  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121324] p-5 sm:p-8 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t("Your Properties Summary", "عقاراتك ووحداتك المسجلة")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t(
                `You have ${properties.length} listing(s) in total (${approvedPropertiesCount} published and live).`,
                `لديك ${properties.length} عقار مسجل (${approvedPropertiesCount} معتمد ومعروض للضيوف).`
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link
            href={`/${lang}/properties/new?mode=new`}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-violet-600 dark:hover:bg-violet-500 hover:bg-slate-800 text-white px-3.5 sm:px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>{t("Add Another Property", "إضافة عقار آخر")}</span>
          </Link>
          <button
            type="button"
            onClick={() => onNavigateTab("properties")}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 sm:px-4 py-2 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <span>{t("Manage All Properties", "إدارة كافة العقارات")}</span>
          </button>
        </div>
      </div>

      {/* Quick Property Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.slice(0, 3).map((prop) => {
          const isApproved = prop.isApproved || prop.status === "approved";
          const isRejected = prop.status === "rejected" || Boolean(prop.adminFeedback);

          return (
            <div
              key={prop.id}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0c0d1b] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{t("Live on Guest App", "معتمد ومعروض")}</span>
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-[11px] font-black text-rose-800 dark:text-rose-300">
                        <AlertTriangle size={12} className="text-rose-600 dark:text-rose-400" />
                        <span>{t("Revisions Requested", "مطلوب تعديلات")}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-black text-amber-800 dark:text-amber-300">
                        <Clock size={12} className="text-amber-600 dark:text-amber-400" />
                        <span>{t("Under Review", "قيد مراجعة الإدارة")}</span>
                      </span>
                    )}
                    {prop.deletionRequest?.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 text-[11px] font-black text-amber-900 dark:text-amber-300">
                        <Clock size={11} className="text-amber-600 dark:text-amber-400" />
                        <span>{t("Removal Under Review", "طلب الحذف قيد المراجعة")}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    #{prop.unitCode || prop.id.slice(0, 8)}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white line-clamp-1">
                  {t(prop.title || prop.titleAr || "", prop.titleAr || prop.title || "")}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {getLocalizedSaudiCity(prop.city, t("en", "ar") as "en" | "ar")} · {t(prop.district || prop.districtAr || "", prop.districtAr || prop.district || "")} · {prop.category}
                </p>

                {/* Feedback snippet if any */}
                {isRejected && prop.adminFeedback && (
                  <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 text-xs text-amber-900 dark:text-amber-300">
                    <p className="font-semibold line-clamp-2">
                      {prop.adminFeedback}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {prop.basePrice} <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">{t("SAR / night", "ر.س / ليلة")}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {onDeleteProperty && (
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteProperty({
                          id: prop.id,
                          unitCode: prop.unitCode,
                          title: prop.title,
                          titleAr: prop.titleAr,
                          isApproved: prop.isApproved,
                          status: prop.status,
                          deletionRequest: prop.deletionRequest ?? null,
                        })
                      }
                      aria-label={
                        prop.deletionRequest?.status === "pending"
                          ? t("Manage Removal Request", "إدارة طلب الحذف")
                          : t("Request Property Removal", "طلب حذف العقار")
                      }
                      title={
                        prop.deletionRequest?.status === "pending"
                          ? t("Manage Removal Request", "إدارة طلب الحذف")
                          : t("Request Property Removal", "طلب حذف العقار")
                      }
                      className={`min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg border transition cursor-pointer ${
                        prop.deletionRequest?.status === "pending"
                          ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                          : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <Link
                    href={`/${lang}/properties/new?edit=${prop.id}`}
                    className={`min-h-[36px] inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      isRejected
                        ? "bg-slate-900 dark:bg-violet-600 text-white hover:bg-slate-800 dark:hover:bg-violet-500"
                        : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isRejected
                      ? t("Edit & Resubmit", "تعديل وإعادة الإرسال")
                      : t("Edit Property", "تعديل العقار")}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


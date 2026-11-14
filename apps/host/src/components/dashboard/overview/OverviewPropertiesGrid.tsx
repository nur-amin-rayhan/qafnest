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
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {t("Your Properties Summary", "عقاراتك ووحداتك المسجلة")}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t(
                `You have ${properties.length} listing(s) in total (${approvedPropertiesCount} published and live).`,
                `لديك ${properties.length} عقار مسجل (${approvedPropertiesCount} معتمد ومعروض للضيوف).`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/properties/new?mode=new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] text-white px-4 py-2 text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>{t("Add Another Property", "إضافة عقار آخر")}</span>
          </Link>
          <button
            type="button"
            onClick={() => onNavigateTab("properties")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-black shadow-xs transition cursor-pointer"
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
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-800">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>{t("Live on Guest App", "معتمد ومعروض")}</span>
                    </span>
                  ) : isRejected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-black text-rose-800">
                      <AlertTriangle size={12} className="text-rose-600" />
                      <span>{t("Revisions Requested", "مطلوب تعديلات")}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-black text-amber-800">
                      <Clock size={12} className="text-amber-600" />
                      <span>{t("Under Review", "قيد مراجعة الإدارة")}</span>
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">#{prop.id.slice(0, 8)}</span>
                </div>

                <h3 className="mt-3 text-base font-black text-slate-900 line-clamp-1">
                  {t(prop.title || prop.titleAr || "", prop.titleAr || prop.title || "")}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {getLocalizedSaudiCity(prop.city, t("en", "ar") as "en" | "ar")} · {t(prop.district || prop.districtAr || "", prop.districtAr || prop.district || "")} · {prop.category}
                </p>

                {/* Feedback snippet if any */}
                {isRejected && prop.adminFeedback && (
                  <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                    <p className="font-semibold line-clamp-2">
                      {prop.adminFeedback}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-black text-[#4F2396]">
                  {prop.basePrice} {t("SAR / night", "ر.س / ليلة")}
                </span>
                <div className="flex items-center gap-1.5">
                  {onDeleteProperty && (
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteProperty({
                          id: prop.id,
                          title: prop.title,
                          titleAr: prop.titleAr,
                          isApproved: prop.isApproved,
                          status: prop.status,
                        })
                      }
                      aria-label={t("Delete Property", "حذف العقار")}
                      title={t("Delete Property", "حذف العقار")}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <Link
                    href={`/properties/new?edit=${prop.id}`}
                    className={`text-xs font-black px-3 py-1.5 rounded-lg transition-colors ${
                      isRejected
                        ? "bg-[#4F2396] text-white hover:bg-[#3D1A78]"
                        : "text-[#4F2396] hover:bg-violet-50"
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


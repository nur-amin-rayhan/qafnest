"use client";

import React from "react";
import Link from "next/link";
import { ECOSYSTEM_URLS, getLocalizedSaudiCity } from "@qafnest/shared";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Edit3,
  MapPin,
  Trash2,
} from "lucide-react";
import { HostPropertySummary } from "../HostOverviewHub";
import type { DeletePropertyTarget } from "./DeletePropertyModal";

interface PropertyCardItemProps {
  prop: HostPropertySummary;
  t: (en: string, ar: string) => string;
  onDelete?: (prop: DeletePropertyTarget) => void;
}

export function PropertyCardItem({ prop, t, onDelete }: PropertyCardItemProps) {
  const isApproved = prop.isApproved || prop.status === "approved";
  const isRejected = prop.status === "rejected" || Boolean(prop.adminFeedback);
  const coverImage = prop.images && prop.images.length > 0 ? prop.images[0] : null;

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Property Cover / Photo */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={t(prop.title || prop.titleAr || "", prop.titleAr || prop.title || "")}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-violet-100 to-slate-100 text-slate-400">
              <Building2 size={36} />
            </div>
          )}

          {/* Status Badge Overlay */}
          <div className="absolute top-3 start-3">
            {isApproved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 text-white px-3 py-1 text-[11px] font-black backdrop-blur-md shadow-xs">
                <CheckCircle2 size={13} />
                <span>{t("Approved & Live", "معتمد ومعروض")}</span>
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/95 text-white px-3 py-1 text-[11px] font-black backdrop-blur-md shadow-xs">
                <AlertTriangle size={13} />
                <span>{t("Revisions Requested", "مطلوب تعديلات")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/95 text-white px-3 py-1 text-[11px] font-black backdrop-blur-md shadow-xs">
                <Clock size={13} />
                <span>{t("Under Review", "قيد المراجعة")}</span>
              </span>
            )}
          </div>

          {/* ID & Category Pill */}
          <div className="absolute top-3 end-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-mono text-white backdrop-blur-md">
            #{prop.id.slice(0, 8)}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1 text-[#4F2396]">
              <Building2 size={13} />
              <span>{prop.category}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} />
              <span>
                {getLocalizedSaudiCity(prop.city, t("en", "ar") as "en" | "ar")} ·{" "}
                {t(prop.district || prop.districtAr || "", prop.districtAr || prop.district || "")}
              </span>
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-1">
            {t(prop.title || prop.titleAr || "", prop.titleAr || prop.title || "")}
          </h2>

          {/* Admin Review Feedback Box */}
          {isRejected && prop.adminFeedback && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span>{t("Admin Review Comments:", "ملاحظات وتوجيهات الإدارة:")}</span>
              </div>
              <p className="font-semibold leading-relaxed text-amber-800">
                {prop.adminFeedback}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Pricing and Action Buttons */}
      <div className="p-5 pt-0 space-y-3">
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-xs font-bold text-slate-400 block">
              {t("Base Nightly Rate", "سعر الليلة الأساسي")}
            </span>
            <span className="text-base font-black text-[#4F2396]">
              {prop.basePrice} {t("SAR", "ر.س")}
            </span>
          </div>

          {/* Direct Links */}
          <div className="flex items-center gap-2">
            <a
              href={`${ECOSYSTEM_URLS.guest}/${t("en", "ar")}/property/${prop.id}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#4F2396] hover:bg-violet-50 transition cursor-pointer"
              title={t("Preview on Guest App", "معاينة على منصة الضيوف")}
            >
              <ExternalLink size={15} />
            </a>

            {onDelete && (
              <button
                type="button"
                onClick={() =>
                  onDelete({
                    id: prop.id,
                    title: prop.title,
                    titleAr: prop.titleAr,
                    isApproved: prop.isApproved,
                    status: prop.status,
                  })
                }
                aria-label={t("Delete Property", "حذف العقار")}
                title={t("Delete Property", "حذف العقار")}
                className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            )}

            <Link
              href={`/${t("en", "ar")}/properties/new?edit=${prop.id}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs ${
                isRejected
                  ? "bg-[#4F2396] text-white hover:bg-[#3D1A78] ring-2 ring-violet-300"
                  : "bg-[#4F2396] text-white hover:bg-[#3D1A78]"
              }`}
            >
              <Edit3 size={13} />
              <span>
                {isRejected
                  ? t("Fix & Resubmit", "تعديل وإعادة الإرسال")
                  : t("Edit Property", "تعديل العقار")}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


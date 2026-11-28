"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface PropertiesKpiStripProps {
  counts: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  statusFilter: "all" | "approved" | "pending" | "rejected";
  setStatusFilter: (filter: "all" | "approved" | "pending" | "rejected") => void;
  t: (en: string, ar: string) => string;
}

export function PropertiesKpiStrip({
  counts,
  statusFilter,
  setStatusFilter,
  t,
}: PropertiesKpiStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <button
        type="button"
        onClick={() => setStatusFilter("all")}
        className={`h-full flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-start transition cursor-pointer ${
          statusFilter === "all"
            ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 shadow-2xs ring-1 ring-slate-900 dark:ring-white"
            : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121324] hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
          {t("Total Properties", "إجمالي العقارات")}
        </span>
        <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{counts.total}</p>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("approved")}
        className={`h-full flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-start transition cursor-pointer ${
          statusFilter === "approved"
            ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-2xs ring-1 ring-emerald-600"
            : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121324] hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
            {t("Live & Approved", "معتمد ومعروض")}
          </span>
          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>
        <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">{counts.approved}</p>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("pending")}
        className={`h-full flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-start transition cursor-pointer ${
          statusFilter === "pending"
            ? "border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 shadow-2xs ring-1 ring-amber-600"
            : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121324] hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
            {t("Under Review", "قيد المراجعة")}
          </span>
          <Clock size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
        </div>
        <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-400">{counts.pending}</p>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("rejected")}
        className={`h-full flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-start transition cursor-pointer ${
          statusFilter === "rejected"
            ? "border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 shadow-2xs ring-1 ring-rose-600"
            : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121324] hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
            {t("Revisions Requested", "مطلوب تعديلات")}
          </span>
          <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
        </div>
        <p className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-400">{counts.rejected}</p>
      </button>
    </div>
  );
}


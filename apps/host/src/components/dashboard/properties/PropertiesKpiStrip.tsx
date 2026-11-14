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
        className={`rounded-2xl border p-4 text-start transition cursor-pointer ${
          statusFilter === "all"
            ? "border-[#4F2396] bg-violet-50/70 shadow-xs ring-2 ring-[#4F2396]/20"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        <span className="text-[11px] font-extrabold uppercase text-slate-400">
          {t("Total Properties", "إجمالي العقارات")}
        </span>
        <p className="mt-1 text-2xl font-black text-slate-900">{counts.total}</p>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("approved")}
        className={`rounded-2xl border p-4 text-start transition cursor-pointer ${
          statusFilter === "approved"
            ? "border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">
            {t("Live & Approved", "معتمد ومعروض")}
          </span>
          <CheckCircle2 size={15} className="text-emerald-600" />
        </div>
        <p className="mt-1 text-2xl font-black text-emerald-700">{counts.approved}</p>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("pending")}
        className={`rounded-2xl border p-4 text-start transition cursor-pointer ${
          statusFilter === "pending"
            ? "border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">
            {t("Under Review", "قيد المراجعة")}
          </span>
          <Clock size={15} className="text-amber-600" />
        </div>
        <p className="mt-1 text-2xl font-black text-amber-700">{counts.pending}</p>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("rejected")}
        className={`rounded-2xl border p-4 text-start transition cursor-pointer ${
          statusFilter === "rejected"
            ? "border-rose-500 bg-rose-50/70 shadow-xs ring-2 ring-rose-500/20"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">
            {t("Revisions Requested", "مطلوب تعديلات")}
          </span>
          <AlertTriangle size={15} className="text-rose-600" />
        </div>
        <p className="mt-1 text-2xl font-black text-rose-700">{counts.rejected}</p>
      </button>
    </div>
  );
}


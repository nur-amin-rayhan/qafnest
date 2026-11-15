"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Copy, Search, Eye, Download } from "lucide-react";
import type { HostRemittance } from "@/lib/services/hostFinancialsService";
import { downloadHostRemittanceVoucher } from "@/lib/services/downloadHostVoucher";
import { RemittanceDetailsModal } from "./RemittanceDetailsModal";

export type { HostRemittance as RemittanceItem };

interface RemittancesListProps {
  remittances: HostRemittance[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function RemittancesList({ remittances, lang, t }: RemittancesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRemittance, setSelectedRemittance] = useState<HostRemittance | null>(null);

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filtered = remittances.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.id.toLowerCase().includes(q) || r.amount.includes(q) || r.bank.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {t("Bank Transfer History", "سجل الحوالات البنكية المكتملة")}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t("Click any remittance row to inspect included guest stays and fee deductions.", "انقر على أي حوالة للاطلاع على تفاصيل الحجوزات المشمولة واحتساب الرسوم.")}
            </p>
          </div>

          <div className="relative">
            <Search size={15} className="absolute inset-y-0 start-3 my-auto text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search by reference ID...", "ابحث برقم الحوالة...")}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 ps-9 pe-3 text-xs font-semibold outline-none focus:bg-white focus:border-[#4F2396]"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              {search.trim()
                ? t("No remittances matching your search query.", "لا توجد حوالات مطابقة لمعايير البحث.")
                : t("No bank transfers recorded for this view yet.", "لا توجد حوالات بنكية مسجلة لهذا العرض حتى الآن.")}
            </div>
          ) : (
            filtered.map((rem) => (
              <div
                key={rem.id}
                onClick={() => setSelectedRemittance(rem)}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-2xl transition cursor-pointer"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                      rem.status === "settled"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-violet-50 text-violet-600"
                    }`}
                  >
                    {rem.status === "settled" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 font-mono">{rem.id}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(rem.id, rem.id, e)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                        title={t("Copy Reference", "نسخ الرقم المرجعي")}
                      >
                        <Copy size={13} />
                      </button>
                      {copiedId === rem.id && (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {t("Copied!", "تم النسخ!")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {lang === "ar" ? rem.dateAr : rem.dateEn} · {rem.bank}
                    </p>
                    <span className="text-[11px] font-bold text-slate-400">
                      {rem.staysCount} {t("guest reservations", "حجوزات ضيوف مشمولة")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                  <div className="text-end">
                    <span className="text-base font-black text-slate-900 block">
                      {rem.amount} {t("SAR", "ر.س")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black mt-1 ${
                        rem.status === "settled"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-violet-100 text-violet-800"
                      }`}
                    >
                      {rem.status === "settled"
                        ? t("Transferred to bank", "تم الإيداع بالحساب")
                        : t("Processing Bank Transfer", "قيد التحويل البنكي")}
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadHostRemittanceVoucher(rem);
                      }}
                      title={t("Download Voucher", "تحميل السند")}
                      aria-label={t("Download Voucher", "تحميل السند")}
                      className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                      <Eye size={15} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <RemittanceDetailsModal
        remittance={selectedRemittance}
        onClose={() => setSelectedRemittance(null)}
        lang={lang}
        t={t}
      />
    </>
  );
}

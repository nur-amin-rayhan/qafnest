"use client";

import React, { useState } from "react";
import { Download, Printer, Settings, ShieldCheck, Clock, AlertTriangle, CheckCircle2, ChevronRight, FileText, Send } from "lucide-react";
import type { HostSettlementSummary, HostSettlementSettings } from "@/lib/services/hostFinancialsTypes";
import { SettlementSettingsModal } from "./SettlementSettingsModal";

interface SettlementStatementTabProps {
  settlement: HostSettlementSummary;
  selectedPropertyId?: string;
  onUpdateSettings: (settings: HostSettlementSettings) => Promise<void>;
  onRequestPayout?: () => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function SettlementStatementTab({
  settlement,
  selectedPropertyId = "all",
  onUpdateSettings,
  onRequestPayout,
  lang,
  t,
}: SettlementStatementTabProps) {
  const [period, setPeriod] = useState<"month" | "last_month" | "ytd">("month");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const feePct = settlement.commissionRatePercent ?? 20;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownloadCsv = () => {
    if (typeof window !== "undefined") {
      const qs =
        selectedPropertyId && selectedPropertyId !== "all"
          ? `&propertyId=${encodeURIComponent(selectedPropertyId)}`
          : "";
      window.location.href = `/api/host/financials?format=statement_csv${qs}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {t("Host Account Settlement & Earnings Reconciliation", "كشف التسوية المالية وتصفية الأرباح")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              `Official reconciliation statement for booking revenues, ${feePct}% QafNest service fees, and SAMA SARIE payouts.`,
              "الكشف المالي الرسمي المعتمد لتسوية حجوزات الاستضافة، ورسوم الوساطة، وحوالات سريع البنكية."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            {[
              { id: "month", en: "Nov 2026", ar: "نوفمبر ٢٠٢٦" },
              { id: "last_month", en: "Oct 2026", ar: "أكتوبر ٢٠٢٦" },
              { id: "ytd", en: "Year 2026", ar: "عام ٢٠٢٦" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id as any)}
                className={`rounded-xl px-3 py-1.5 transition cursor-pointer ${
                  period === p.id ? "bg-white text-[#4F2396] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "ar" ? p.ar : p.en}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
          >
            <Download size={13} className="text-[#4F2396]" />
            <span>{t("Statement (.CSV)", "تحميل الكشف (.CSV)")}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
          >
            <Printer size={13} />
            <span>{t("Print / PDF", "طباعة / PDF")}</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50 text-[#4F2396] hover:bg-violet-100 px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Settings size={13} />
            <span>{t("Schedule Settings", "إعدادات التسوية")}</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 block">
            {t("Gross Booking Sales", "إجمالي مبيعات الحجوزات")}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block font-mono">
            {settlement.grossRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
          </span>
          <span className="text-[11px] text-slate-500 font-medium block">
            {t("Gross accommodation revenue", "إجمالي إيراد الإقامة")}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 block">
            {t("Host Commission & Promo", "عمولة المنصة والخصومات")}
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 block font-mono">
            - {settlement.commissionAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
          </span>
          <span className="text-[11px] text-slate-500 font-medium block">
            {t(`${feePct}% QafNest Service Fee`, `عمولة قاف نست (${feePct}٪)`)}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 block">
            {t("Net Disbursed to Bank", "المبالغ المحولة بنجاح")}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 block font-mono">
            {settlement.disbursedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
          </span>
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> {t("Settled via SAMA SARIE", "تمت التسوية بنظام سريع")}
          </span>
        </div>

        <div className="rounded-3xl border border-violet-200 bg-violet-50/50 p-5 space-y-1 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase text-[#4F2396] block">
              {t("Available to Settle", "رصيد التسوية الحالي")}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#4F2396] block font-mono">
              {settlement.pendingSettlement.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
            </span>
            <span className="text-[11px] text-violet-700 font-medium flex items-center gap-1">
              <Clock size={12} /> {t("Ready for transfer", "جاهز للصرف والتحويل")}
            </span>
          </div>
          {onRequestPayout && (
            <button
              type="button"
              onClick={onRequestPayout}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#4F2396] hover:bg-[#3d1979] text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send size={12} />
              <span>{t("Request Instant Transfer", "طلب تحويل فوري")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Settlement Policy & Auto-Disbursement Ribbon */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <h3 className="text-xs font-black text-slate-900 uppercase">
              {t("Active Settlement Rules & Automation", "قواعد وضوابط التسوية التلقائية المعتمدة")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="text-xs font-bold text-[#4F2396] hover:underline cursor-pointer self-start sm:self-auto"
          >
            {t("Edit Preferences", "تعديل تفضيلات التسوية")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">{t("Disbursement Schedule", "دورية التحويل")}</span>
            <span className="font-bold text-slate-900 block capitalize">
              {settlement.settings.payoutFrequency === "weekly" ? t("Weekly (Every Wednesday)", "أسبوعياً (كل أربعاء)") : settlement.settings.payoutFrequency}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">{t("Release Guarantee", "ضمان تحرير المستحقات")}</span>
            <span className="font-bold text-emerald-600 block">
              {t("24h Post Check-In Active", "مفعل (بعد 24 ساعة من الوصول)")}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">{t("Min Threshold", "الحد الأدنى للتحويل")}</span>
            <span className="font-bold text-slate-900 block font-mono">
              {settlement.settings.minPayoutThreshold > 0 ? `${settlement.settings.minPayoutThreshold} SAR` : t("None", "بدون حد أدنى")}
            </span>
          </div>
        </div>
      </div>

      {/* Security Deposit Holds & Claims Section */}
      {settlement.adjustments && settlement.adjustments.length > 0 && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase">
                {t("Security Deposit Holds & Ongoing Claims", "التأمين المحتجز ومطالبات الضمان قيد الدراسة")}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t(
                  "Amounts temporarily held under Ministry of Tourism & QafNest dispute guidelines.",
                  "مبالغ محتجزة مؤقتاً تحت مظلة حماية النزاعات المعتمدة من وزارة السياحة وقاف نست."
                )}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-medium">
            {settlement.adjustments.map((adj) => (
              <div key={adj.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{adj.bookingRef}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                      {lang === "ar" ? "قيد المراجعة الفنية" : "Under Assessment"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 block">
                    {lang === "ar" ? adj.descriptionAr : adj.descriptionEn}
                  </span>
                </div>
                <span className="font-mono font-black text-rose-600 text-sm">
                  {adj.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettlementSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settlement.settings}
        onSaveSettings={onUpdateSettings}
        lang={lang}
        t={t}
      />
    </div>
  );
}


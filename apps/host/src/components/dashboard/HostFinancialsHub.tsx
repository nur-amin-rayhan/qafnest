"use client";

import React, { useEffect, useState } from "react";
import { Wallet, CheckCircle2, Clock, ShieldCheck, Send, RefreshCw } from "lucide-react";
import { RemittancesList } from "./financials/RemittancesList";
import { PayoutIbanCard } from "./financials/PayoutIbanCard";
import { VatInvoicesList } from "./financials/VatInvoicesList";
import { SettlementStatementTab } from "./financials/SettlementStatementTab";
import { PropertyBreakdownSection } from "./financials/PropertyBreakdownSection";
import { RequestPayoutModal } from "./financials/RequestPayoutModal";
import { useHostFinancials } from "./financials/useHostFinancials";

interface HostFinancialsHubProps {
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export default function HostFinancialsHub({ lang, t }: HostFinancialsHubProps) {
  const [activeSubTab, setActiveSubTabState] = useState<"remittances" | "settlement" | "iban" | "invoices">(
    "remittances"
  );
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "remittances" || tabParam === "settlement" || tabParam === "iban" || tabParam === "invoices") {
      setActiveSubTabState(tabParam);
    }
  }, []);

  const setActiveSubTab = (next: "remittances" | "settlement" | "iban" | "invoices") => {
    setActiveSubTabState(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "remittances") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", next);
      }
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  const {
    loading,
    selectedPropertyId,
    selectProperty,
    propertyLedgers,
    kpis,
    iban,
    remittances,
    vatInvoices,
    settlement,
    toastMsg,
    loadFinancials,
    handleUpdateIban,
    handleDeleteIban,
    handleRequestPayout,
    handleUpdateSettlementSettings,
  } = useHostFinancials();

  return (
    <div className="mx-auto w-full max-w-[1640px] px-4 py-6 sm:px-8 sm:py-8 space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#4F2396] text-white shadow-xs">
              <Wallet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {t("Financial Remittances & Payouts", "المعاملات المالية والحوالات البنكية")}
                </h1>
                <button
                  type="button"
                  onClick={() => loadFinancials()}
                  className="rounded-xl p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={t("Refresh data", "تحديث البيانات")}
                >
                  <RefreshCw size={14} className={loading ? "animate-spin text-[#4F2396]" : ""} />
                </button>
              </div>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">
                {t(
                  "Track your bank transfers, verify payout IBAN, and download tax invoices for your bookings.",
                  "متابعة تحويلات الحساب البنكي، وتفاصيل الآيبان المعتمد، وتحميل الفواتير الضريبية."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Sub-Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPayoutModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-4 py-2 text-xs font-black text-white transition shadow-sm cursor-pointer"
          >
            <Send size={13} />
            <span>{t("Request Payout", "طلب صرف المستحقات")}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {[
              { id: "remittances", ar: "سجل الحوالات", en: "Remittances" },
              { id: "settlement", ar: "كشف التسوية", en: "Settlement" },
              { id: "iban", ar: "الحساب البنكي (IBAN)", en: "Payout Method" },
              { id: "invoices", ar: "الفواتير الضريبية", en: "VAT Invoices" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
                  activeSubTab === tab.id
                    ? "bg-white text-[#4F2396] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "ar" ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized Property Filter Bar (Overall vs Specific Property) */}
      {propertyLedgers.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="host-finance-scope-all"
              onClick={() => selectProperty("all")}
              className={`rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer ${
                selectedPropertyId === "all"
                  ? "bg-[#4F2396] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {t(`All Properties Overview (${propertyLedgers.length})`, `نظرة عامة على كل العقارات (${propertyLedgers.length})`)}
            </button>

            {propertyLedgers.map((prop) => (
              <button
                key={prop.propertyId}
                type="button"
                data-testid={`host-finance-scope-${prop.propertyId}`}
                onClick={() => selectProperty(prop.propertyId)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  selectedPropertyId === prop.propertyId
                    ? "bg-violet-100 text-[#4F2396] border border-violet-300 shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {prop.propertyTitle}
              </button>
            ))}
          </div>

          <select
            value={selectedPropertyId}
            onChange={(e) => selectProperty(e.target.value)}
            aria-label={t("Filter financials by property", "تصفية الحسابات حسب العقار")}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#4F2396] cursor-pointer"
          >
            <option value="all">{t("All Properties (Overall)", "جميع العقارات (الكل)")}</option>
            {propertyLedgers.map((prop) => (
              <option key={prop.propertyId} value={prop.propertyId}>
                {prop.propertyTitle} ({prop.netEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-extrabold text-slate-400 uppercase">
            {t("Total Paid Out", "إجمالي المبالغ المحولة")}
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {kpis.totalPaidOut}
            </span>
            <span className="text-xs font-bold text-slate-500">{t("SAR", "ر.س")}</span>
          </div>
          <span
            className={`mt-2 text-xs font-bold flex items-center gap-1 ${
              parseFloat(kpis.totalPaidOut.replace(/,/g, "")) > 0 ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <CheckCircle2 size={13} />
            {parseFloat(kpis.totalPaidOut.replace(/,/g, "")) > 0
              ? t("Successfully transferred to your bank", "تم التحويل بنجاح لحسابك البنكي")
              : t("No transfers disbursed yet", "لم يتم صرف أي تحويلات بعد")}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-extrabold text-slate-400 uppercase">
            {t("Escrow & Unlocked Payouts", "المستحقات (الضمان والمتاح)")}
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#4F2396]">
              {kpis.availableInstantBalance}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {t("SAR Unlocked", "ر.س متاح للصرف")}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-xs font-bold">
            <div className="text-amber-700 flex items-center justify-between gap-2">
              <span>{t("Locked in Escrow (Pre-Check-Out):", "محجوز بالضمان (قبل المغادرة):")}</span>
              <span className="font-mono">{kpis.escrowedBalance || "0.00"} {t("SAR", "ر.س")}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Clock size={12} />
              {t(
                "Unlocks at guest check-out (request early or 24h manual settlement)",
                "يُحرر بعد مغادرة الضيف (طلب مبكر أو تحويل خلال ٢٤ ساعة)"
              )}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-extrabold text-slate-400 uppercase">
            {t("Payout Method Status", "حالة الحساب البنكي")}
          </span>
          <div className="mt-3 flex items-center gap-2">
            <ShieldCheck
              size={24}
              className={iban.iban && iban.isVerified ? "text-emerald-500" : "text-slate-300"}
            />
            <span className="text-base font-black text-slate-900">
              {iban.iban
                ? lang === "ar"
                  ? iban.bankNameAr || iban.bankNameEn
                  : iban.bankNameEn || iban.bankNameAr
                : t("Not Configured", "غير مضاف")}
            </span>
          </div>
          <span className="mt-2 text-xs font-mono font-bold text-slate-500" dir={iban.iban ? "ltr" : undefined}>
            {iban.formattedIban || t("No IBAN linked yet", "لم يتم ربط حساب آيبان بعد")}
          </span>
        </div>
      </div>

      {/* Property-Wise Categorized Breakdown & Transactions */}
      {(activeSubTab === "remittances" || activeSubTab === "settlement") && (
        <PropertyBreakdownSection
          propertyLedgers={propertyLedgers}
          selectedPropertyId={selectedPropertyId}
          onSelectProperty={selectProperty}
          lang={lang}
          t={t}
        />
      )}

      {/* Sub-Tab 1: Remittances List */}
      {activeSubTab === "remittances" && (
        <RemittancesList remittances={remittances} lang={lang} t={t} />
      )}

      {/* Sub-Tab 2: Settlement Statement */}
      {activeSubTab === "settlement" && (
        <SettlementStatementTab
          settlement={settlement}
          selectedPropertyId={selectedPropertyId}
          onUpdateSettings={handleUpdateSettlementSettings}
          onRequestPayout={() => setPayoutModalOpen(true)}
          lang={lang}
          t={t}
        />
      )}

      {/* Sub-Tab 3: Payout Method (IBAN) */}
      {activeSubTab === "iban" && (
        <PayoutIbanCard
          ibanData={iban}
          onUpdateIban={handleUpdateIban}
          onDeleteIban={handleDeleteIban}
          lang={lang}
          t={t}
        />
      )}

      {/* Sub-Tab 3: VAT Invoices */}
      {activeSubTab === "invoices" && (
        <VatInvoicesList invoices={vatInvoices} lang={lang} t={t} />
      )}

      {/* Post-Checkout Payout Request Modal */}
      <RequestPayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        availableBalance={kpis.availableInstantBalance}
        escrowedBalance={kpis.escrowedBalance}
        ibanData={iban}
        onRequestPayout={handleRequestPayout}
        lang={lang}
        t={t}
      />
    </div>
  );
}

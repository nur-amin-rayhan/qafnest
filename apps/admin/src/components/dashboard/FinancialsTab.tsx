"use client";

import React, { useState } from "react";
import { Download, Search, RefreshCw, CheckCircle2, ShieldCheck, FileSpreadsheet, Wallet, Zap, Percent, Users } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminMetrics } from "./types";
import { FinancialsKpiStrip } from "./financials/FinancialsKpiStrip";
import { PayoutsLedgerTable } from "./financials/PayoutsLedgerTable";
import { HostLedgersSection } from "./financials/HostLedgersSection";
import { InvoicesLedgerTable } from "./financials/InvoicesLedgerTable";
import { ZatcaComplianceCard } from "./financials/ZatcaComplianceCard";
import { PlatformFeeConfigCard } from "./financials/PlatformFeeConfigCard";
import { Payout24hReminderBanner } from "./financials/Payout24hReminderBanner";
import { BatchSettlementTxnModal } from "./financials/BatchSettlementTxnModal";
import { useAdminFinancials } from "./financials/useAdminFinancials";

interface FinancialsTabProps {
  metrics: AdminMetrics;
}

export function FinancialsTab({}: FinancialsTabProps) {
  const { lang, dir, t } = useAdminAuth();
  const [showSarieBatchModal, setShowSarieBatchModal] = useState(false);
  const [settlingBatch, setSettlingBatch] = useState(false);

  const {
    loading,
    activeSection,
    setActiveSection,
    selectedHostId,
    setSelectedHostId,
    metrics,
    payouts,
    hostLedgers,
    filteredPayouts,
    policy,
    reminders,
    nowTick,
    supplierProbe,
    probingSuppliers,
    sendingReminders,
    filteredInvoices,
    statusFilter,
    setStatusFilter,
    invoiceTypeFilter,
    setInvoiceTypeFilter,
    searchQuery,
    setSearchQuery,
    toastMsg,
    handleUpdateStatus,
    handleBatchUpdateStatus,
    handleProcessSarieSettlement,
    handleReviewPayoutRequest,
    handleSendReminders,
    handleUpdatePolicy,
    handleCheckSuppliers,
    handleExportCsv,
    handleExportTaxJournal,
    loadFinancials,
  } = useAdminFinancials();

  const openPayoutDossierInUrl = (payoutId: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("payoutId", payoutId);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    setActiveSection("payouts");
    loadFinancials();
  };

  return (
    <div dir={dir} className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm space-y-6 overflow-x-hidden">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-on-surface px-5 py-3 text-xs sm:text-sm font-bold text-surface shadow-2xl">
          <CheckCircle2 size={16} className="text-status-emerald shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display-md text-xl sm:text-2xl font-black text-on-surface">
              {t("Financials & Tax Invoices Hub", "مركز المالية والفوترة الضريبية")}
            </h2>
            <button
              type="button"
              onClick={() => loadFinancials()}
              className="rounded-xl p-1 text-outline hover:text-on-surface cursor-pointer"
              title={t("Refresh Financial Data", "تحديث البيانات المالية")}
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            </button>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {t(
              "Real-time reconciliation, 24-hour host payout SLA reminders, ZATCA VAT, and SAMA SARIE bank disbursements.",
              "المطابقة اللحظية، تذكير صرف أرباح المضيفين خلال ٢٤ ساعة، ضريبة زاتكا والتحويل عبر سريع."
            )}
          </p>
        </div>

        {/* Section Navigation Tabs & Export Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-1 bg-surface-container p-1 rounded-xl">
            <button
              type="button"
              data-testid="admin-fin-tab-overall"
              onClick={() => setActiveSection("payouts")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeSection === "payouts"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Wallet size={13} />
              <span>{t("Overall Dashboard", "نظرة عامة")}</span>
            </button>
            <button
              type="button"
              data-testid="admin-fin-tab-hosts"
              onClick={() => setActiveSection("hosts")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeSection === "hosts"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Users size={13} />
              <span>{t(`By Host (${hostLedgers.length})`, `حسب المضيف (${hostLedgers.length})`)}</span>
            </button>
            <button
              type="button"
              data-testid="admin-fin-tab-invoices"
              onClick={() => setActiveSection("invoices")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeSection === "invoices"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>{t("ZATCA Invoices", "فواتير زاتكا")}</span>
            </button>
            <button
              type="button"
              data-testid="admin-fin-tab-fees"
              onClick={() => setActiveSection("fees")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeSection === "fees"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Percent size={13} />
              <span>{t("Platform Fee Rules", "عمولة المنصة")}</span>
            </button>
          </div>

          {activeSection === "payouts" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSarieBatchModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-status-emerald text-white hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs shrink-0"
                title={t("Process SAMA SARIE Settlement with Legal Bank Txn #", "صرف دفعات سريع المستحقة بالرقم المرجعي")}
              >
                <Zap size={14} />
                <span>{t("SAMA Settle All", "صرف دفعات سريع")}</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3.5 py-2 text-xs font-bold text-on-surface transition cursor-pointer shrink-0 shadow-xs"
              >
                <Download size={14} className="text-primary" />
                <span>{t("Export SARIE Batch (.CSV)", "تصدير ملف سريع (.CSV)")}</span>
              </button>
            </div>
          )}

          {activeSection === "invoices" && (
            <button
              type="button"
              onClick={handleExportTaxJournal}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition cursor-pointer shrink-0 shadow-xs"
            >
              <Download size={14} className="text-status-emerald" />
              <span>{t("Export ZATCA Tax Journal (.CSV)", "تصدير سجل ضريبة زاتكا (.CSV)")}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <FinancialsKpiStrip metrics={metrics} />

      {/* 24-Hour Host Payout SLA & Live Reminders Center (visible in payouts section) */}
      {activeSection === "payouts" && (
        <Payout24hReminderBanner
          payouts={payouts}
          reminders={reminders}
          policy={policy}
          nowTick={nowTick}
          onDisburseNow={async (id) => openPayoutDossierInUrl(id)}
          onSendReminders={handleSendReminders}
          sendingReminders={sendingReminders}
          onUpdatePolicy={handleUpdatePolicy}
          supplierProbe={supplierProbe}
          probingSuppliers={probingSuppliers}
          onCheckSuppliers={handleCheckSuppliers}
        />
      )}

      {/* ZATCA Phase 2 E-Invoicing Engine Card (visible in invoices section) */}
      {activeSection === "invoices" && <ZatcaComplianceCard />}

      {/* Platform Fee Configuration / Host Ledgers / Invoices / Payouts */}
      {activeSection === "fees" ? (
        <PlatformFeeConfigCard />
      ) : activeSection === "hosts" ? (
        <HostLedgersSection
          hostLedgers={hostLedgers}
          selectedHostId={selectedHostId}
          onSelectHost={setSelectedHostId}
          nowTick={nowTick}
          onUpdateStatus={handleUpdateStatus}
          onBatchUpdateStatus={handleBatchUpdateStatus}
          onReviewRequest={handleReviewPayoutRequest}
          onSendReminder={handleSendReminders}
        />
      ) : (
        <>
          {/* Filter and Search Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Sub-Filters */}
            {activeSection === "payouts" ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: "all", labelEn: "All Payouts", labelAr: "كل المدفوعات" },
                  { id: "host_requested", labelEn: "Host Requests", labelAr: "طلبات المضيفين" },
                  { id: "sla_urgent", labelEn: "24h Urgent / Overdue", labelAr: "عاجلة خلال ٢٤ ساعة" },
                  { id: "escrow", labelEn: "In Escrow (Pre-Check-Out)", labelAr: "في الضمان (قبل المغادرة)" },
                  { id: "pending", labelEn: "Pending", labelAr: "قيد الانتظار" },
                  { id: "processing", labelEn: "Processing", labelAr: "قيد المعالجة" },
                  { id: "disbursed", labelEn: "Disbursed", labelAr: "تم الصرف" },
                  { id: "on_hold", labelEn: "On Hold", labelAr: "معلقة" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
                      statusFilter === tab.id
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {t(tab.labelEn, tab.labelAr)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: "all", labelEn: "All Tax Invoices", labelAr: "كل الفواتير الضريبية" },
                  { id: "guest_stay", labelEn: "Guest Stay Invoices", labelAr: "فواتير إقامة الضيوف" },
                  { id: "host_commission", labelEn: "Host Commission Invoices", labelAr: "فواتير عمولة المضيفين" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInvoiceTypeFilter(tab.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
                      invoiceTypeFilter === tab.id
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {t(tab.labelEn, tab.labelAr)}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search size={14} className="absolute inset-y-0 start-3 my-auto text-outline" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSection === "payouts"
                    ? t("Search host, property, IBAN...", "ابحث بالمضيف، العقار، الآيبان...")
                    : t("Search invoice #, guest, ref...", "ابحث برقم الفاتورة، الضيف، المرجع...")
                }
                className="w-full rounded-xl border border-surface-container-high bg-surface-container-low py-2 ps-9 pe-3 text-xs font-semibold text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest"
              />
            </div>
          </div>

          {/* Tables depending on activeSection with responsive horizontal scrolling */}
          <div className="overflow-x-auto min-w-full pb-2">
            {activeSection === "payouts" ? (
              <PayoutsLedgerTable
                payouts={filteredPayouts}
                nowTick={nowTick}
                onUpdateStatus={handleUpdateStatus}
                onBatchUpdateStatus={handleBatchUpdateStatus}
                onReviewRequest={handleReviewPayoutRequest}
                onSendReminder={handleSendReminders}
              />
            ) : (
              <InvoicesLedgerTable invoices={filteredInvoices} />
            )}
          </div>
        </>
      )}

      {/* Compliance Strip */}
      <div className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-status-emerald shrink-0" />
          <span>
            <strong>{t("ZATCA Phase 2 E-Invoicing Active:", "الفوترة الإلكترونية (المرحلة ٢ - زاتكا) نشطة:")}</strong>{" "}
            {t(
              "All guest stay & commission invoices produce cryptographic TLV stamps & QR verification.",
              "كافة فواتير الإقامة والعمولات تصدر مشفرة بختم رقمي ورمز QR معتمد."
            )}
          </span>
        </div>
        <span className="font-mono text-[11px] text-outline">CR 1010648921 · VAT 310123456700003</span>
      </div>

      <BatchSettlementTxnModal
        isOpen={showSarieBatchModal}
        titleEn="Settle All Post-Checkout Eligible SARIE Payouts"
        titleAr="تسوية كافة دفعات سريع المؤهلة بعد المغادرة"
        subtitleEn="Enter the Legal Bank / SARIE Batch Transaction Number issued by Finance. Pre-checkout bookings remain safely locked in escrow."
        subtitleAr="أدخل رقم العملية البنكية الرسمي الصادر من قسم المالية. ستبقى الحجوزات التي لم يغادر ضيوفها مقفولة في الضمان."
        submitting={settlingBatch}
        onClose={() => setShowSarieBatchModal(false)}
        onConfirm={async (legalTxnId) => {
          setSettlingBatch(true);
          try {
            await handleProcessSarieSettlement(legalTxnId);
            setShowSarieBatchModal(false);
          } finally {
            setSettlingBatch(false);
          }
        }}
      />
    </div>
  );
}

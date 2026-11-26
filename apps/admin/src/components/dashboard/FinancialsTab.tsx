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
  const { dir, t } = useAdminAuth();
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

  const handleExportHostLedgersCsv = () => {
    if (!hostLedgers || hostLedgers.length === 0) return;
    const headers = [
      "Host ID",
      "Host Name",
      "Email",
      "Phone",
      "Bank Name",
      "IBAN",
      "Properties Count",
      "Bookings Count",
      "Gross Listing (SAR)",
      "Net Income (SAR)",
      "Paid Out (SAR)",
      "Due Payable (SAR)",
      "On Hold (SAR)",
      "Platform Net (SAR)",
    ];
    const rows = hostLedgers.map((h) => [
      `"${h.hostId}"`,
      `"${(h.hostName || "").replace(/"/g, '""')}"`,
      `"${h.hostEmail || ""}"`,
      `"${h.hostPhone || ""}"`,
      `"${h.bankName || ""}"`,
      `"${h.iban || ""}"`,
      h.propertiesCount,
      h.bookingsCount,
      h.grossListingEarnings.toFixed(2),
      h.hostNetEarnings.toFixed(2),
      h.totalPaidOut.toFixed(2),
      h.pendingDueAmount.toFixed(2),
      h.onHoldAmount.toFixed(2),
      h.platformNetFromHost.toFixed(2),
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `qafnest_host_ledgers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div dir={dir} className="bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 rounded-xl shadow-xs space-y-6 overflow-x-hidden">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-5 py-3 text-xs sm:text-sm font-semibold text-white dark:text-slate-900 shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t("Financials & Tax Invoices Hub", "مركز المالية والفوترة الضريبية")}
            </h2>
            <button
              type="button"
              onClick={() => loadFinancials()}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
              title={t("Refresh Financial Data", "تحديث البيانات المالية")}
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#4F2396]" : ""} />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Real-time reconciliation, 24-hour host payout SLA reminders, ZATCA VAT, and SAMA SARIE bank disbursements.",
              "المطابقة اللحظية، تذكير صرف أرباح المضيفين خلال ٢٤ ساعة، ضريبة زاتكا والتحويل عبر سريع."
            )}
          </p>
        </div>

        {/* Section Navigation Tabs & Export Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
            <button
              type="button"
              data-testid="admin-fin-tab-overall"
              onClick={() => setActiveSection("payouts")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeSection === "payouts"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              }`}
            >
              <Wallet size={13} />
              <span>{t("Overall Dashboard", "نظرة عامة")}</span>
            </button>
            <button
              type="button"
              data-testid="admin-fin-tab-hosts"
              onClick={() => setActiveSection("hosts")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeSection === "hosts"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              }`}
            >
              <Users size={13} />
              <span>{t(`By Host (${hostLedgers.length})`, `حسب المضيف (${hostLedgers.length})`)}</span>
            </button>
            <button
              type="button"
              data-testid="admin-fin-tab-invoices"
              onClick={() => setActiveSection("invoices")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeSection === "invoices"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>{t("ZATCA Invoices", "فواتير زاتكا")}</span>
            </button>
            <button
              type="button"
              data-testid="admin-fin-tab-fees"
              onClick={() => setActiveSection("fees")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeSection === "fees"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              }`}
            >
              <Percent size={13} />
              <span>{t("Platform Fee Rules", "عمولة المنصة")}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSarieBatchModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer shadow-xs shrink-0"
              title={t("Process SAMA SARIE Settlement with Legal Bank Txn #", "صرف دفعات سريع المستحقة بالرقم المرجعي")}
            >
              <Zap size={14} />
              <span>{t("SAMA Settle All", "صرف دفعات سريع")}</span>
            </button>

            {activeSection === "payouts" && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 shadow-xs"
              >
                <Download size={14} className="text-slate-500 dark:text-slate-400" />
                <span>{t("Export SARIE Batch (.CSV)", "تصدير ملف سريع (.CSV)")}</span>
              </button>
            )}

            {activeSection === "hosts" && (
              <button
                type="button"
                onClick={handleExportHostLedgersCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 shadow-xs"
              >
                <Download size={14} className="text-slate-500 dark:text-slate-400" />
                <span>{t("Export Host Ledgers (.CSV)", "تصدير سجل المضيفين (.CSV)")}</span>
              </button>
            )}

            {activeSection === "invoices" && (
              <button
                type="button"
                onClick={handleExportTaxJournal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 shadow-xs"
              >
                <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t("Export ZATCA Tax Journal (.CSV)", "تصدير سجل ضريبة زاتكا (.CSV)")}</span>
              </button>
            )}

            {activeSection === "fees" && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 shadow-xs"
              >
                <Download size={14} className="text-slate-500 dark:text-slate-400" />
                <span>{t("Export SARIE Batch (.CSV)", "تصدير ملف سريع (.CSV)")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <FinancialsKpiStrip metrics={metrics} loading={loading} />

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
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-2">
            {/* Sub-Filters */}
            {activeSection === "payouts" ? (
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
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
                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                    }`}
                  >
                    {t(tab.labelEn, tab.labelAr)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
                {[
                  { id: "all", labelEn: "All Tax Invoices", labelAr: "كل الفواتير الضريبية" },
                  { id: "guest_stay", labelEn: "Guest Stay Invoices", labelAr: "فواتير إقامة الضيوف" },
                  { id: "host_commission", labelEn: "Host Commission Invoices", labelAr: "فواتير عمولة المضيفين" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInvoiceTypeFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                      invoiceTypeFilter === tab.id
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                    }`}
                  >
                    {t(tab.labelEn, tab.labelAr)}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search size={16} className="absolute inset-y-0 start-3 my-auto text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSection === "payouts"
                    ? t("Search host, property, IBAN...", "ابحث بالمضيف، العقار، الآيبان...")
                    : t("Search invoice #, guest, ref...", "ابحث برقم الفاتورة، الضيف، المرجع...")
                }
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
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
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-slate-100">{t("ZATCA Phase 2 E-Invoicing Active:", "الفوترة الإلكترونية (المرحلة ٢ - زاتكا) نشطة:")}</strong>{" "}
            {t(
              "All guest stay & commission invoices produce cryptographic TLV stamps & QR verification.",
              "كافة فواتير الإقامة والعمولات تصدر مشفرة بختم رقمي ورمز QR معتمد."
            )}
          </span>
        </div>
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

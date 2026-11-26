"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  Building2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Wallet,
  CheckCircle2,
  Clock,
  PauseCircle,
  CreditCard,
} from "lucide-react";
import type { AdminHostLedger } from "@/lib/services/adminFinancialsService";
import { computePayoutSlaMetrics } from "@qafnest/shared";
import { PayoutsLedgerTable } from "./PayoutsLedgerTable";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface HostLedgersSectionProps {
  hostLedgers: AdminHostLedger[];
  selectedHostId: string;
  onSelectHost: (hostId: string) => void;
  nowTick?: number;
  onUpdateStatus: (
    payoutId: string,
    status: "disbursed" | "pending" | "processing" | "on_hold",
    holdReason?: string,
    sarieTxnId?: string
  ) => Promise<void>;
  onBatchUpdateStatus?: (
    payoutIds: string[],
    status: "disbursed" | "pending" | "processing" | "on_hold",
    sarieTxnId?: string
  ) => Promise<void>;
  onReviewRequest?: (
    payoutId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string
  ) => Promise<void>;
  onSendReminder?: (payoutIds: string[]) => Promise<void>;
}

function formatSar(value: number): string {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function HostLedgersSection({
  hostLedgers,
  selectedHostId,
  onSelectHost,
  nowTick,
  onUpdateStatus,
  onBatchUpdateStatus,
  onReviewRequest,
  onSendReminder,
}: HostLedgersSectionProps) {
  const { t, dir } = useAdminAuth();
  const [hostSearch, setHostSearch] = useState("");
  const [hostFilter, setHostFilter] = useState<
    "all" | "host_requested" | "sla_urgent" | "has_due" | "escrow" | "processing" | "settled" | "on_hold"
  >("all");
  const [hostPayoutStatusFilter, setHostPayoutStatusFilter] = useState<string>("all");
  const currencyLabel = t("SAR", "ر.س");

  const selectedHost = useMemo(
    () =>
      selectedHostId !== "all"
        ? hostLedgers.find((h) => h.hostId === selectedHostId) || null
        : null,
    [hostLedgers, selectedHostId]
  );

  const filteredHosts = useMemo(() => {
    return hostLedgers.filter((h) => {
      if (hostFilter === "host_requested") {
        const hasRequested = h.payouts?.some(
          (p) => p.status !== "disbursed" && p.payoutRequestStatus === "requested"
        );
        if (!hasRequested) return false;
      } else if (hostFilter === "sla_urgent") {
        const hasUrgent = h.payouts?.some((p) => {
          const m = computePayoutSlaMetrics(p, nowTick);
          return m.tier === "overdue" || m.tier === "urgent";
        });
        if (!hasUrgent) return false;
      } else if (hostFilter === "has_due") {
        if (h.pendingDueAmount <= 0 && !h.payouts?.some((p) => p.status === "pending")) {
          return false;
        }
      } else if (hostFilter === "escrow") {
        const hasEscrow = h.payouts?.some((p) => {
          if (p.status === "disbursed") return false;
          const m = computePayoutSlaMetrics(p, nowTick);
          return m.tier === "escrow";
        });
        if (!hasEscrow) return false;
      } else if (hostFilter === "processing") {
        const hasProcessing = h.payouts?.some((p) => p.status === "processing");
        if (!hasProcessing) return false;
      } else if (hostFilter === "settled") {
        if (
          h.pendingDueAmount + h.onHoldAmount > 0 ||
          (h.totalPaidOut <= 0 && !h.payouts?.some((p) => p.status === "disbursed"))
        ) {
          return false;
        }
      } else if (hostFilter === "on_hold") {
        if (h.onHoldAmount <= 0 && !h.payouts?.some((p) => p.status === "on_hold")) {
          return false;
        }
      }

      if (hostSearch.trim()) {
        const q = hostSearch.toLowerCase();
        const propMatch = h.properties.some((p) => p.propertyTitle.toLowerCase().includes(q));
        return (
          h.hostName.toLowerCase().includes(q) ||
          h.hostEmail.toLowerCase().includes(q) ||
          h.hostPhone.toLowerCase().includes(q) ||
          h.iban.toLowerCase().includes(q) ||
          h.hostId.toLowerCase().includes(q) ||
          propMatch
        );
      }
      return true;
    });
  }, [hostLedgers, hostFilter, hostSearch, nowTick]);

  const filteredHostPayouts = useMemo(() => {
    if (!selectedHost?.payouts) return [];
    return selectedHost.payouts.filter((p) => {
      if (hostPayoutStatusFilter === "sla_urgent") {
        const m = computePayoutSlaMetrics(p, nowTick);
        if (m.tier !== "overdue" && m.tier !== "urgent") return false;
      } else if (hostPayoutStatusFilter === "escrow") {
        const m = computePayoutSlaMetrics(p, nowTick);
        if (p.status === "disbursed" || m.tier !== "escrow") return false;
      } else if (hostPayoutStatusFilter === "host_requested") {
        if (p.status === "disbursed" || p.payoutRequestStatus !== "requested") return false;
      } else if (hostPayoutStatusFilter !== "all" && p.status !== hostPayoutStatusFilter) {
        return false;
      }
      return true;
    });
  }, [selectedHost?.payouts, hostPayoutStatusFilter, nowTick]);

  if (selectedHost) {
    const totalPayableAndHold = selectedHost.pendingDueAmount + selectedHost.onHoldAmount;
    return (
      <div dir={dir} className="space-y-6">
        {/* Selected Host Banner & Switcher */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center font-bold text-base shrink-0">
              {(selectedHost.hostName || "H").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedHost.hostName}</h3>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  {selectedHost.propertiesCount} {t("Properties", "عقار")} · {selectedHost.bookingsCount}{" "}
                  {t("Bookings", "حجز")}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {[selectedHost.hostEmail, selectedHost.hostPhone, selectedHost.bankName, selectedHost.iban]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedHost.hostId}
              onChange={(e) => onSelectHost(e.target.value)}
              data-testid="admin-host-ledger-selector"
              aria-label={t("Switch Host Ledger", "تبديل حساب المضيف")}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#4F2396] cursor-pointer"
            >
              <option value="all">
                {t(`All Hosts Directory (${hostLedgers.length})`, `دليل جميع المضيفين (${hostLedgers.length})`)}
              </option>
              {hostLedgers.map((h) => (
                <option key={h.hostId} value={h.hostId}>
                  {h.hostName} ({t("Due:", "المستحق:")} {currencyLabel}{" "}
                  {formatSar(h.pendingDueAmount + h.onHoldAmount)})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onSelectHost("all")}
              data-testid="admin-host-ledger-back"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} />
              <span>{t("All Hosts", "كل المضيفين")}</span>
            </button>
          </div>
        </div>

        {/* 6 Financial Summary Cards for This Host */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 text-xs">
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 shadow-xs">
            <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400 block">
              {t("Host Gross Listing", "إجمالي إيجارات المضيف")}
            </span>
            <span className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums block">
              {currencyLabel} {formatSar(selectedHost.grossListingEarnings)}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {selectedHost.bookingsCount} {t("confirmed stays", "إقامة مؤكدة")}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 shadow-xs">
            <span className="text-[10px] font-medium uppercase text-rose-600 dark:text-rose-400 block">
              {t("Comm & Promo", "العمولة والخصومات")}
            </span>
            <span className="mt-1.5 text-lg font-semibold text-rose-600 dark:text-rose-400 font-mono tabular-nums block">
              -{currencyLabel} {formatSar(selectedHost.hostCommissionTotal + selectedHost.promoDiscountTotal)}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {t("Promo:", "ترويج:")} {currencyLabel} {formatSar(selectedHost.promoDiscountTotal)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 shadow-xs">
            <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400 block">
              {t("Host Net Earnings", "صافي أرباح المضيف")}
            </span>
            <span className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums block">
              {currencyLabel} {formatSar(selectedHost.hostNetEarnings)}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {t("Total lifetime payable", "إجمالي المستحق التراكمي")}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 shadow-xs">
            <span className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300 block">
              {t("Paid / Disbursed", "المدفوع / المحوّل")}
            </span>
            <span className="mt-1.5 text-lg font-semibold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums block">
              {currencyLabel} {formatSar(selectedHost.totalPaidOut)}
            </span>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
              {t("Settled via SARIE", "تم التسديد عبر سريع")}
            </span>
          </div>

          <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30 p-4 shadow-xs">
            <span className="text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-300 block">
              {t("Remaining Due / Hold", "المتبقي / المعلق")}
            </span>
            <span className="mt-1.5 text-lg font-semibold text-amber-900 dark:text-amber-200 font-mono tabular-nums block">
              {currencyLabel} {formatSar(totalPayableAndHold)}
            </span>
            <span className="text-[11px] text-amber-800 dark:text-amber-300">
              {t("Due:", "مستحق:")} {formatSar(selectedHost.pendingDueAmount)} · {t("Hold:", "معلق:")}{" "}
              {formatSar(selectedHost.onHoldAmount)}
            </span>
          </div>

          <div className="rounded-xl border border-purple-200/80 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30 p-4 shadow-xs">
            <span className="text-[10px] font-semibold uppercase text-[#4F2396] dark:text-purple-300 block">
              {t("Platform Net Revenue", "صافي إيراد المنصة")}
            </span>
            <span className="mt-1.5 text-lg font-semibold text-[#4F2396] dark:text-purple-300 font-mono tabular-nums block">
              {currencyLabel} {formatSar(selectedHost.platformNetFromHost)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {t("Gov VAT:", "ضريبة الزكاة:")} {currencyLabel} {formatSar(selectedHost.vatCollectedOnHostStays)}
            </span>
          </div>
        </div>

        {/* Host's Properties Financial Breakdown */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 size={16} className="text-[#4F2396] dark:text-purple-400" />
              <span>
                {t(
                  `Properties Owned by ${selectedHost.hostName} (${selectedHost.properties.length})`,
                  `العقارات المملوكة للمضيف ${selectedHost.hostName} (${selectedHost.properties.length})`
                )}
              </span>
            </h4>
          </div>
          {selectedHost.properties.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-4">
              {t("No properties registered under this host yet.", "لا توجد عقارات مسجلة لهذا المضيف حتى الآن.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 pe-3 text-start">{t("Property", "العقار")}</th>
                    <th className="py-2.5 px-3 text-start">{t("Category / Rate", "الفئة / السعر")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Bookings", "الحجوزات")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Gross", "الإجمالي")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Comm + Promo", "العمولة والخصم")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Net Earned", "الصافي المستحق")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Paid", "المدفوع")}</th>
                    <th className="py-2.5 ps-3 text-end">{t("Due / Remaining", "المتبقي المستحق")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100">
                  {selectedHost.properties.map((p) => (
                    <tr key={p.propertyId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 pe-3 font-semibold text-slate-900 dark:text-slate-100">{p.propertyTitle}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {p.category} · {currencyLabel} {formatSar(p.basePrice)}/{t("night", "ليلة")}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono">{p.bookingsCount}</td>
                      <td className="py-2.5 px-3 text-end font-mono font-semibold">
                        {currencyLabel} {formatSar(p.grossListingSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-rose-600 dark:text-rose-400">
                        -{currencyLabel} {formatSar(p.hostCommissionSar + p.promoDiscountSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono font-semibold">
                        {currencyLabel} {formatSar(p.hostNetEarningsSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {currencyLabel} {formatSar(p.paidOutSar)}
                      </td>
                      <td className="py-2.5 ps-3 text-end font-mono font-semibold text-amber-700 dark:text-amber-300">
                        {currencyLabel} {formatSar(p.dueSar)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Host's Transaction Ledger */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 space-y-3 shadow-xs">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard size={16} className="text-[#4F2396] dark:text-purple-400" />
            <span>
              {t(
                `Host Booking & Settlement Transactions (${selectedHost.transactions.length})`,
                `حركات حجوزات وتسويات المضيف (${selectedHost.transactions.length})`
              )}
            </span>
          </h4>
          {selectedHost.transactions.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-4">
              {t("No confirmed transactions recorded for this host yet.", "لا توجد حركات مالية مؤكدة لهذا المضيف بعد.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-xs font-semibold">
                    <th className="py-2.5 pe-3 text-start">{t("Booking Ref", "مرجع الحجز")}</th>
                    <th className="py-2.5 px-3 text-start">{t("Property & Stay", "العقار والإقامة")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Guest Paid", "دفع الضيف")}</th>
                    <th className="py-2.5 px-3 text-end">{t("ZATCA VAT", "ضريبة الزكاة")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Host Gross", "إجمالي المضيف")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Comm + Promo", "عمولة وخصم")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Host Net", "صافي المضيف")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Platform Net", "صافي المنصة")}</th>
                    <th className="py-2.5 ps-3 text-end">{t("Status", "الحالة")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100">
                  {selectedHost.transactions.map((tx) => (
                    <tr key={tx.bookingId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 pe-3 font-mono font-semibold text-slate-900 dark:text-slate-100 text-sm">{tx.bookingReference}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{tx.propertyTitle}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {tx.checkIn} → {tx.checkOut} · {tx.guestName}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-sm">
                        {currencyLabel} {formatSar(tx.guestPaidTotalSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-amber-700 dark:text-amber-400 text-sm">
                        {currencyLabel} {formatSar(tx.govZatcaVatSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono font-semibold text-sm">
                        {currencyLabel} {formatSar(tx.listingGrossSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-rose-600 dark:text-rose-400 text-sm">
                        -{currencyLabel} {formatSar(tx.hostCommissionSar + tx.promoDiscountSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono font-semibold text-[#4F2396] dark:text-purple-300 text-sm">
                        {currencyLabel} {formatSar(tx.hostNetPayoutSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                        {currencyLabel} {formatSar(tx.platformNetRevenueSar)}
                      </td>
                      <td className="py-2.5 ps-3 text-end">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            tx.payoutStatus === "disbursed"
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                              : tx.payoutStatus === "on_hold"
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
                              : "bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50"
                          }`}
                        >
                          {tx.payoutStatus === "disbursed" ? (
                            <CheckCircle2 size={10} />
                          ) : tx.payoutStatus === "on_hold" ? (
                            <PauseCircle size={10} />
                          ) : (
                            <Clock size={10} />
                          )}
                          {tx.payoutStatus === "disbursed"
                            ? t("Disbursed", "تم الصرف")
                            : tx.payoutStatus === "on_hold"
                            ? t("On Hold", "معلق")
                            : tx.payoutStatus === "processing"
                            ? t("Processing", "قيد المعالجة")
                            : t("Pending", "قيد الانتظار")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Scoped Payout Controls for this Host */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wallet size={16} className="text-[#4F2396] dark:text-purple-400" />
              <span>
                {t(
                  `Payout Disbursement Actions for ${selectedHost.hostName}`,
                  `إجراءات صرف المستحقات للمضيف ${selectedHost.hostName}`
                )}
              </span>
            </h4>
          </div>

          {/* Sub-sections filter for this host's payouts */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
            {[
              { id: "all", labelEn: `All Payouts (${selectedHost.payouts.length})`, labelAr: `كل المدفوعات (${selectedHost.payouts.length})` },
              { id: "host_requested", labelEn: "Host Requests", labelAr: "طلبات المضيف" },
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
                onClick={() => setHostPayoutStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                  hostPayoutStatusFilter === tab.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                }`}
              >
                {t(tab.labelEn, tab.labelAr)}
              </button>
            ))}
          </div>

          <PayoutsLedgerTable
            payouts={filteredHostPayouts}
            nowTick={nowTick}
            onUpdateStatus={onUpdateStatus}
            onBatchUpdateStatus={onBatchUpdateStatus}
            onReviewRequest={onReviewRequest}
            onSendReminder={onSendReminder}
          />
        </div>
      </div>
    );
  }

  // All Hosts Overview Directory
  return (
    <div dir={dir} className="space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
          {[
            { id: "all", labelEn: `All Hosts (${hostLedgers.length})`, labelAr: `كل المضيفين (${hostLedgers.length})` },
            { id: "host_requested", labelEn: "Host Requests", labelAr: "طلبات المضيفين" },
            { id: "sla_urgent", labelEn: "24h Urgent / Overdue", labelAr: "عاجلة خلال ٢٤ ساعة" },
            { id: "escrow", labelEn: "In Escrow (Pre-Check-Out)", labelAr: "في الضمان (قبل المغادرة)" },
            { id: "has_due", labelEn: "Due / Payable", labelAr: "مستحق للدفع" },
            { id: "processing", labelEn: "Processing", labelAr: "قيد المعالجة" },
            { id: "settled", labelEn: "Paid Up", labelAr: "مكتمل السداد" },
            { id: "on_hold", labelEn: "On Hold", labelAr: "معلقة" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHostFilter(tab.id as typeof hostFilter)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                hostFilter === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              }`}
            >
              {t(tab.labelEn, tab.labelAr)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedHostId}
            onChange={(e) => onSelectHost(e.target.value)}
            data-testid="admin-host-ledger-selector"
            aria-label={t("Select Host Ledger", "اختيار حساب المضيف")}
            className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#4F2396] cursor-pointer"
          >
            <option value="all">{t("Jump to Host Dashboard...", "الانتقال إلى حساب مضيف...")}</option>
            {hostLedgers.map((h) => (
              <option key={h.hostId} value={h.hostId}>
                {h.hostName} ({h.propertiesCount} {t("props", "عقار")} · {t("Due", "مستحق")} {currencyLabel}{" "}
                {formatSar(h.pendingDueAmount + h.onHoldAmount)})
              </option>
            ))}
          </select>

          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search size={16} className="absolute inset-y-0 start-3 my-auto text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={hostSearch}
              onChange={(e) => setHostSearch(e.target.value)}
              placeholder={t(
                "Search host name, email, phone, IBAN...",
                "ابحث باسم المضيف، البريد، الجوال، الآيبان..."
              )}
              className="w-full h-10 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
            />
          </div>
        </div>
      </div>

      {filteredHosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-12 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("No hosts match your current filter.", "لا يوجد مضيفون يطابقون التصفية الحالية.")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16]">
          <table className="min-w-[880px] w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                <th className="py-3 ps-4 pe-3 text-start">{t("Host Partner", "الشريك المضيف")}</th>
                <th className="py-3 px-3 text-center">{t("Properties", "العقارات")}</th>
                <th className="py-3 px-3 text-center">{t("Bookings", "الحجوزات")}</th>
                <th className="py-3 px-3 text-end">{t("Host Gross", "إجمالي المضيف")}</th>
                <th className="py-3 px-3 text-end">{t("Net Income", "صافي الدخل")}</th>
                <th className="py-3 px-3 text-end">{t("Paid Out", "المدفوع")}</th>
                <th className="py-3 px-3 text-end">{t("Remaining Due", "المستحق المتبقي")}</th>
                <th className="py-3 px-3 text-end">{t("On Hold", "المعلق")}</th>
                <th className="py-3 px-3 text-end">{t("Platform Net", "صافي المنصة")}</th>
                <th className="py-3 ps-3 pe-4 text-end">{t("Action", "الإجراء")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-900 dark:text-slate-100">
              {filteredHosts.map((host) => (
                <tr
                  key={host.hostId}
                  onClick={() => onSelectHost(host.hostId)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="py-3.5 ps-4 pe-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Users size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{host.hostName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {[host.hostEmail || host.hostId.slice(0, 8), host.hostPhone].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-semibold">{host.propertiesCount}</td>
                  <td className="py-3.5 px-3 text-center font-mono">{host.bookingsCount}</td>
                  <td className="py-3.5 px-3 text-end font-mono font-semibold">
                    {currencyLabel} {formatSar(host.grossListingEarnings)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono font-semibold">
                    {currencyLabel} {formatSar(host.hostNetEarnings)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {currencyLabel} {formatSar(host.totalPaidOut)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono font-bold text-amber-600 dark:text-amber-400">
                    {currencyLabel} {formatSar(host.pendingDueAmount)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono text-amber-600 dark:text-amber-400">
                    {currencyLabel} {formatSar(host.onHoldAmount)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono text-slate-900 dark:text-slate-100 font-semibold">
                    {currencyLabel} {formatSar(host.platformNetFromHost)}
                  </td>
                  <td className="py-3.5 ps-3 pe-4 text-end">
                    <button
                      type="button"
                      data-testid={`open-host-ledger-${host.hostId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHost(host.hostId);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    >
                      <span>{t("View Ledger", "عرض السجل")}</span>
                      {dir === "rtl" ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

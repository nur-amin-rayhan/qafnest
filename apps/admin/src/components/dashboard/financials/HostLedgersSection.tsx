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
  const [hostFilter, setHostFilter] = useState<"all" | "has_due" | "settled" | "new_hosts">("all");
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
      if (hostFilter === "has_due" && h.pendingDueAmount + h.onHoldAmount <= 0) return false;
      if (hostFilter === "settled" && (h.pendingDueAmount + h.onHoldAmount > 0 || h.totalPaidOut <= 0)) {
        return false;
      }
      if (hostFilter === "new_hosts" && h.bookingsCount > 0) return false;
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
  }, [hostLedgers, hostFilter, hostSearch]);

  if (selectedHost) {
    const totalPayableAndHold = selectedHost.pendingDueAmount + selectedHost.onHoldAmount;
    return (
      <div dir={dir} className="space-y-6">
        {/* Selected Host Banner & Switcher */}
        <div className="rounded-2xl border border-primary/20 bg-surface-container-low p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-base shrink-0">
              {(selectedHost.hostName || "H").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-on-surface">{selectedHost.hostName}</h3>
                <span className="rounded-full bg-surface-container-lowest border border-surface-container-high px-2.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                  {selectedHost.propertiesCount} {t("Properties", "عقار")} · {selectedHost.bookingsCount}{" "}
                  {t("Bookings", "حجز")}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
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
              className="rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary cursor-pointer"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container px-3.5 py-2 text-xs font-bold text-on-surface transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>{t("All Hosts", "كل المضيفين")}</span>
            </button>
          </div>
        </div>

        {/* 6 Financial Summary Cards for This Host */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 text-xs">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <span className="text-[10px] font-extrabold uppercase text-outline block">
              {t("Host Gross Listing", "إجمالي إيجارات المضيف")}
            </span>
            <span className="mt-1.5 text-lg font-black text-on-surface font-mono block">
              {currencyLabel} {formatSar(selectedHost.grossListingEarnings)}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {selectedHost.bookingsCount} {t("confirmed stays", "إقامة مؤكدة")}
            </span>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <span className="text-[10px] font-extrabold uppercase text-rose-600 block">
              {t("Comm & Promo", "العمولة والخصومات")}
            </span>
            <span className="mt-1.5 text-lg font-black text-rose-600 font-mono block">
              -{currencyLabel} {formatSar(selectedHost.hostCommissionTotal + selectedHost.promoDiscountTotal)}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {t("Promo:", "ترويج:")} {currencyLabel} {formatSar(selectedHost.promoDiscountTotal)}
            </span>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <span className="text-[10px] font-extrabold uppercase text-outline block">
              {t("Host Net Earnings", "صافي أرباح المضيف")}
            </span>
            <span className="mt-1.5 text-lg font-black text-on-surface font-mono block">
              {currencyLabel} {formatSar(selectedHost.hostNetEarnings)}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {t("Total lifetime payable", "إجمالي المستحق التراكمي")}
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">
              {t("Paid / Disbursed", "المدفوع / المحوّل")}
            </span>
            <span className="mt-1.5 text-lg font-black text-emerald-700 font-mono block">
              {currencyLabel} {formatSar(selectedHost.totalPaidOut)}
            </span>
            <span className="text-[11px] text-emerald-700/80">
              {t("Settled via SARIE", "تم التسديد عبر سريع")}
            </span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
              {t("Remaining Due / Hold", "المتبقي / المعلق")}
            </span>
            <span className="mt-1.5 text-lg font-black text-amber-900 font-mono block">
              {currencyLabel} {formatSar(totalPayableAndHold)}
            </span>
            <span className="text-[11px] text-amber-800">
              {t("Due:", "مستحق:")} {formatSar(selectedHost.pendingDueAmount)} · {t("Hold:", "معلق:")}{" "}
              {formatSar(selectedHost.onHoldAmount)}
            </span>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <span className="text-[10px] font-extrabold uppercase text-primary block">
              {t("Platform Net Revenue", "صافي إيراد المنصة")}
            </span>
            <span className="mt-1.5 text-lg font-black text-primary font-mono block">
              {currencyLabel} {formatSar(selectedHost.platformNetFromHost)}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {t("Gov VAT:", "ضريبة الزكاة:")} {currencyLabel} {formatSar(selectedHost.vatCollectedOnHostStays)}
            </span>
          </div>
        </div>

        {/* Host's Properties Financial Breakdown */}
        <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-on-surface flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              <span>
                {t(
                  `Properties Owned by ${selectedHost.hostName} (${selectedHost.properties.length})`,
                  `العقارات المملوكة للمضيف ${selectedHost.hostName} (${selectedHost.properties.length})`
                )}
              </span>
            </h4>
          </div>
          {selectedHost.properties.length === 0 ? (
            <p className="text-xs text-outline py-4">
              {t("No properties registered under this host yet.", "لا توجد عقارات مسجلة لهذا المضيف حتى الآن.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-container-high text-outline uppercase text-[10px] font-extrabold">
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
                <tbody className="divide-y divide-surface-container">
                  {selectedHost.properties.map((p) => (
                    <tr key={p.propertyId} className="hover:bg-surface-container-low/60">
                      <td className="py-2.5 pe-3 font-bold text-on-surface">{p.propertyTitle}</td>
                      <td className="py-2.5 px-3 text-on-surface-variant">
                        {p.category} · {currencyLabel} {formatSar(p.basePrice)}/{t("night", "ليلة")}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono">{p.bookingsCount}</td>
                      <td className="py-2.5 px-3 text-end font-mono font-bold">
                        {currencyLabel} {formatSar(p.grossListingSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-rose-600">
                        -{currencyLabel} {formatSar(p.hostCommissionSar + p.promoDiscountSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono font-bold">
                        {currencyLabel} {formatSar(p.hostNetEarningsSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-emerald-700 font-bold">
                        {currencyLabel} {formatSar(p.paidOutSar)}
                      </td>
                      <td className="py-2.5 ps-3 text-end font-mono font-black text-amber-800">
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
        <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 space-y-3">
          <h4 className="text-sm font-black text-on-surface flex items-center gap-2">
            <CreditCard size={16} className="text-primary" />
            <span>
              {t(
                `Host Booking & Settlement Transactions (${selectedHost.transactions.length})`,
                `حركات حجوزات وتسويات المضيف (${selectedHost.transactions.length})`
              )}
            </span>
          </h4>
          {selectedHost.transactions.length === 0 ? (
            <p className="text-xs text-outline py-4">
              {t("No confirmed transactions recorded for this host yet.", "لا توجد حركات مالية مؤكدة لهذا المضيف بعد.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-container-high text-outline uppercase text-[10px] font-extrabold">
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
                <tbody className="divide-y divide-surface-container">
                  {selectedHost.transactions.map((tx) => (
                    <tr key={tx.bookingId} className="hover:bg-surface-container-low/60">
                      <td className="py-2.5 pe-3 font-mono font-black text-on-surface">{tx.bookingReference}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-on-surface">{tx.propertyTitle}</div>
                        <div className="text-[11px] text-outline">
                          {tx.checkIn} → {tx.checkOut} · {tx.guestName}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono">
                        {currencyLabel} {formatSar(tx.guestPaidTotalSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-amber-700">
                        {currencyLabel} {formatSar(tx.govZatcaVatSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono font-bold">
                        {currencyLabel} {formatSar(tx.listingGrossSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-rose-600">
                        -{currencyLabel} {formatSar(tx.hostCommissionSar + tx.promoDiscountSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono font-black text-primary">
                        {currencyLabel} {formatSar(tx.hostNetPayoutSar)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono text-emerald-700 font-bold">
                        {currencyLabel} {formatSar(tx.platformNetRevenueSar)}
                      </td>
                      <td className="py-2.5 ps-3 text-end">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tx.payoutStatus === "disbursed"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.payoutStatus === "on_hold"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-violet-100 text-violet-800"
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
        <div className="space-y-2">
          <h4 className="text-sm font-black text-on-surface flex items-center gap-2">
            <Wallet size={16} className="text-primary" />
            <span>
              {t(
                `Payout Disbursement Actions for ${selectedHost.hostName}`,
                `إجراءات صرف المستحقات للمضيف ${selectedHost.hostName}`
              )}
            </span>
          </h4>
          <PayoutsLedgerTable
            payouts={selectedHost.payouts}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: t(`All Hosts (${hostLedgers.length})`, `كل المضيفين (${hostLedgers.length})`) },
            { id: "has_due", label: t("Due / Payable", "مستحق للدفع") },
            { id: "settled", label: t("Paid Up", "مكتمل السداد") },
            { id: "new_hosts", label: t("New / 0 Bookings", "جديد / بدون حجوزات") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHostFilter(tab.id as typeof hostFilter)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                hostFilter === tab.id
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedHostId}
            onChange={(e) => onSelectHost(e.target.value)}
            data-testid="admin-host-ledger-selector"
            aria-label={t("Select Host Ledger", "اختيار حساب المضيف")}
            className="rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">{t("Jump to Host Dashboard...", "الانتقال إلى حساب مضيف...")}</option>
            {hostLedgers.map((h) => (
              <option key={h.hostId} value={h.hostId}>
                {h.hostName} ({h.propertiesCount} {t("props", "عقار")} · {t("Due", "مستحق")} {currencyLabel}{" "}
                {formatSar(h.pendingDueAmount + h.onHoldAmount)})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2 focus-within:border-primary focus-within:bg-surface-container-lowest min-w-[240px]">
            <Search size={14} className="text-outline shrink-0" />
            <input
              type="text"
              value={hostSearch}
              onChange={(e) => setHostSearch(e.target.value)}
              placeholder={t(
                "Search host name, email, phone, IBAN...",
                "ابحث باسم المضيف، البريد، الجوال، الآيبان..."
              )}
              className="flex-1 min-w-0 bg-transparent text-xs font-semibold text-on-surface outline-none"
            />
          </div>
        </div>
      </div>

      {filteredHosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-container-high py-12 text-center text-xs font-bold text-outline">
          {t("No hosts match your current filter.", "لا يوجد مضيفون يطابقون التصفية الحالية.")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-container-high bg-surface-container-lowest">
          <table className="min-w-[880px] w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-container-high bg-surface-container-low/70 text-outline uppercase text-[10px] font-extrabold">
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
            <tbody className="divide-y divide-surface-container">
              {filteredHosts.map((host) => (
                <tr
                  key={host.hostId}
                  onClick={() => onSelectHost(host.hostId)}
                  className="hover:bg-primary/5 transition cursor-pointer"
                >
                  <td className="py-3.5 ps-4 pe-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                        <Users size={14} />
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{host.hostName}</div>
                        <div className="text-[11px] text-outline">
                          {[host.hostEmail || host.hostId.slice(0, 8), host.hostPhone].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold">{host.propertiesCount}</td>
                  <td className="py-3.5 px-3 text-center font-mono">{host.bookingsCount}</td>
                  <td className="py-3.5 px-3 text-end font-mono font-bold">
                    {currencyLabel} {formatSar(host.grossListingEarnings)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono font-bold">
                    {currencyLabel} {formatSar(host.hostNetEarnings)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono text-emerald-700 font-bold">
                    {currencyLabel} {formatSar(host.totalPaidOut)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono font-black text-amber-800">
                    {currencyLabel} {formatSar(host.pendingDueAmount)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono text-amber-700">
                    {currencyLabel} {formatSar(host.onHoldAmount)}
                  </td>
                  <td className="py-3.5 px-3 text-end font-mono text-primary font-bold">
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
                      className="inline-flex items-center gap-1 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary hover:text-on-primary px-3 py-1.5 text-[11px] font-bold text-primary transition cursor-pointer"
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

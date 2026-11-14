"use client";

import React, { useState } from "react";
import {
  BellRing,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Copy,
  Send,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  computePayoutSlaMetrics,
  type HostPayoutPolicy,
  type PayoutReminderSummary,
  type SharedHostPayoutRecord,
} from "@qafnest/shared";
import type { MyFatoorahSupplierProbe } from "./useAdminFinancials";

interface Payout24hReminderBannerProps {
  payouts: SharedHostPayoutRecord[];
  reminders: PayoutReminderSummary;
  policy?: HostPayoutPolicy;
  nowTick?: number;
  compact?: boolean;
  onOpenFinancials?: () => void;
  onDisburseNow?: (payoutId: string) => Promise<void>;
  onSendReminders?: (payoutIds?: string[]) => Promise<void>;
  sendingReminders?: boolean;
  onUpdatePolicy?: (updates: Partial<HostPayoutPolicy>) => Promise<void>;
  supplierProbe?: MyFatoorahSupplierProbe | null;
  probingSuppliers?: boolean;
  onCheckSuppliers?: () => Promise<void>;
}

export function Payout24hReminderBanner({
  payouts,
  reminders,
  policy,
  nowTick = Date.now(),
  compact = false,
  onOpenFinancials,
  onDisburseNow,
  onSendReminders,
  sendingReminders = false,
  onUpdatePolicy,
  supplierProbe,
  probingSuppliers = false,
  onCheckSuppliers,
}: Payout24hReminderBannerProps) {
  const { lang, t } = useAdminAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [disbursingId, setDisbursingId] = useState<string | null>(null);
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);

  const urgentQueue = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .map((p) => ({
      payout: p,
      sla: computePayoutSlaMetrics(p, nowTick, policy?.reminderLeadHours ?? 6),
    }))
    .sort((a, b) => a.sla.remainingMs - b.sla.remainingMs)
    .slice(0, compact ? 3 : 4);

  const handleCopyIban = (id: string, iban: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(iban);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleQuickDisburse = async (payoutId: string) => {
    if (!onDisburseNow) return;
    setDisbursingId(payoutId);
    try {
      await onDisburseNow(payoutId);
    } finally {
      setDisbursingId(null);
    }
  };

  const hasUrgentOrOverdue = reminders.overdueCount > 0 || reminders.urgentCount > 0;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 shadow-xs transition-all ${
        reminders.overdueCount > 0
          ? "border-rose-300/70 bg-gradient-to-br from-rose-50/90 via-surface-container-lowest to-amber-50/40"
          : hasUrgentOrOverdue
          ? "border-amber-300/70 bg-gradient-to-br from-amber-50/80 via-surface-container-lowest to-violet-50/30"
          : "border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 via-surface-container-lowest to-surface-container-lowest"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
              reminders.overdueCount > 0
                ? "bg-rose-100 text-rose-700 border-rose-200"
                : hasUrgentOrOverdue
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-emerald-100 text-status-emerald border-emerald-200"
            }`}
          >
            {reminders.overdueCount > 0 ? (
              <ShieldAlert size={22} className="animate-pulse" />
            ) : (
              <BellRing size={21} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-title-sm text-sm sm:text-base font-extrabold text-on-surface">
                {t("24-Hour Host Payout SLA & Reminders", "نظام متابعة وتنبيهات تحويل المستحقات (خلال ٢٤ ساعة)")}
              </h3>

              {reminders.overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wide">
                  <AlertTriangle size={10} />
                  <span>
                    {reminders.overdueCount} {t("Overdue >24h", "متأخر >٢٤ ساعة")}
                  </span>
                </span>
              )}

              {reminders.urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wide">
                  <Clock size={10} />
                  <span>
                    {reminders.urgentCount} {t("Due <6h", "عاجل <٦ ساعات")}
                  </span>
                </span>
              )}

              {payouts.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-[10px] font-bold text-on-surface-variant border border-surface-container-high">
                  {t(`SLA Compliance: ${reminders.slaComplianceRate}%`, `نسبة الالتزام بمهلة ٢٤ ساعة: ${reminders.slaComplianceRate}٪`)}
                </span>
              )}
            </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
              {reminders.dueWithin24hCount > 0
                ? t(
                    `${reminders.dueWithin24hCount} host payout(s) totaling SAR ${reminders.dueWithin24hAmountSar.toLocaleString("en-US", { minimumFractionDigits: 2 })} awaiting transfer within the 24-hour window.`,
                    `يوجد ${reminders.dueWithin24hCount} حوالة لمضيفي قاف نست بإجمالي ${reminders.dueWithin24hAmountSar.toLocaleString("en-US", { minimumFractionDigits: 2 })} ر.س بانتظار التحويل خلال ٢٤ ساعة.`
                  )
                : payouts.length > 0
                ? t(
                    "All verified host earnings are settled within the 24-hour SLA commitment.",
                    "جميع مستحقات المضيفين المحققة تم تحويلها بنجاح ضمن مهلة ٢٤ ساعة."
                  )
                : t(
                    "No pending host payouts queued at this time.",
                    "لا توجد تحويلات معلقة لمضيفي المنصة في الوقت الحالي."
                  )}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!compact && policy && onUpdatePolicy && (
            <button
              type="button"
              onClick={() => setShowPolicyPanel(!showPolicyPanel)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition cursor-pointer"
            >
              <SlidersHorizontal size={13} className="text-primary" />
              <span>{t("Payout Rail & 24h Rules", "آلية التحويل وقواعد ٢٤ ساعة")}</span>
            </button>
          )}

          {onSendReminders && reminders.dueWithin24hCount > 0 && (
            <button
              type="button"
              onClick={() => onSendReminders()}
              disabled={sendingReminders}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 hover:bg-primary/15 px-3 py-2 text-xs font-bold text-primary transition cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              <span>
                {sendingReminders
                  ? t("Sending...", "جاري الإرسال...")
                  : t("Send 24h Reminder", "إرسال تذكير ٢٤ ساعة")}
              </span>
            </button>
          )}

          {compact && onOpenFinancials && (
            <button
              type="button"
              onClick={onOpenFinancials}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-on-primary hover:opacity-95 px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <span>{t("Open Payouts Queue", "فتح سجل التحويلات")}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Payout Channel & SLA Policy Panel */}
      {!compact && showPolicyPanel && policy && onUpdatePolicy && (
        <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 space-y-4 text-xs animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payout Rail Selector */}
            <div className="space-y-2">
              <span className="font-extrabold text-on-surface block">
                {t("Disbursement Method (Payout Rail)", "طريقة صرف مستحقات المضيفين")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ payoutRail: "sarie_bank" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.payoutRail === "sarie_bank"
                      ? "border-primary bg-primary/5 text-on-surface"
                      : "border-surface-container-high bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{t("SAMA SARIE Bank Transfer", "تحويل بنكي (SARIE ٢٤/٧)")}</span>
                    {policy.payoutRail === "sarie_bank" && <CheckCircle2 size={13} className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-outline mt-1 leading-snug">
                    {t(
                      "QafNest transfers net SAR from bank account to host IBAN within 24h (works weekends).",
                      "التحويل مباشرة من حساب المنصة البنكي لآيبان المضيف خلال ٢٤ ساعة."
                    )}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ payoutRail: "myfatoorah_split" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.payoutRail === "myfatoorah_split"
                      ? "border-primary bg-primary/5 text-on-surface"
                      : "border-surface-container-high bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{t("MyFatoorah Multi-Vendor", "تقسيم بوابة ماي فاتورة")}</span>
                    {policy.payoutRail === "myfatoorah_split" && <CheckCircle2 size={13} className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-outline mt-1 leading-snug">
                    {t(
                      "Auto-split before settlement using SupplierCode (requires Host KYC + Sun–Thu bank cycle).",
                      "توزيع تلقائي عند الدفع (يتطلب تفعيل Multi-Vendor وموافقة KYC لكل مضيف)."
                    )}
                  </p>
                </button>
              </div>
            </div>

            {/* 24h Clock Trigger */}
            <div className="space-y-2">
              <span className="font-extrabold text-on-surface block">
                {t("When Does the 24-Hour Clock Start?", "متى يبدأ عداد مهلة ٢٤ ساعة؟")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ slaTrigger: "payment_confirmed" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.slaTrigger === "payment_confirmed"
                      ? "border-primary bg-primary/5 text-on-surface"
                      : "border-surface-container-high bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{t("Upon Guest Payment", "فور تأكيد دفع الضيف")}</span>
                    {policy.slaTrigger === "payment_confirmed" && <CheckCircle2 size={13} className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-outline mt-1 leading-snug">
                    {t("24h deadline starts immediately when booking is paid.", "يبدأ العد التنازلي مباشرة لحظة سداد الحجز.")}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ slaTrigger: "check_in" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.slaTrigger === "check_in"
                      ? "border-primary bg-primary/5 text-on-surface"
                      : "border-surface-container-high bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{t("After Guest Check-In", "بعد تسجيل دخول الضيف")}</span>
                    {policy.slaTrigger === "check_in" && <CheckCircle2 size={13} className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-outline mt-1 leading-snug">
                    {t("Escrow protection: 24h window starts after check-in.", "حماية الضمان: تبدأ ٢٤ ساعة بعد دخول الضيف للعقار.")}
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Live MyFatoorah Multi-Vendor Readiness Probe */}
          {onCheckSuppliers && (
            <div className="pt-3 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] text-on-surface-variant">
                {supplierProbe ? (
                  <span>
                    <strong className="text-on-surface">{t("MyFatoorah Suppliers API:", "واجهة موردي ماي فاتورة:")}</strong>{" "}
                    {supplierProbe.message}{" "}
                    {typeof supplierProbe.activeSuppliersCount === "number" && (
                      <span className="font-mono font-bold text-primary">
                        {t(
                          `(${supplierProbe.activeSuppliersCount} active supplier(s))`,
                          `(${supplierProbe.activeSuppliersCount} مورد نشط)`
                        )}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>
                    {t(
                      "Check whether MyFatoorah Multi-Vendor split endpoint is enabled on your API key.",
                      "تحقق من جاهزية ميزة توزيع المستحقات (Suppliers API) في حساب ماي فاتورة."
                    )}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onCheckSuppliers}
                disabled={probingSuppliers}
                className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-[11px] font-bold text-on-surface transition cursor-pointer shrink-0"
              >
                <Zap size={12} className="text-amber-600" />
                <span>
                  {probingSuppliers
                    ? t("Checking...", "جاري الفحص...")
                    : t("Check MyFatoorah Split API", "فحص API ماي فاتورة")}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Priority 24-Hour Reminder Cards Queue */}
      {urgentQueue.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {urgentQueue.map(({ payout, sla }) => (
            <div
              key={payout.id}
              className={`rounded-2xl border p-3.5 bg-surface-container-lowest space-y-2.5 text-xs transition shadow-2xs ${
                sla.isOverdue
                  ? "border-rose-300 ring-1 ring-rose-200/70"
                  : sla.isUrgent
                  ? "border-amber-300 ring-1 ring-amber-200/60"
                  : "border-surface-container-high"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-bold text-on-surface block truncate">{payout.hostName}</span>
                  <span className="text-[11px] text-outline block truncate">{payout.propertyTitle}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                    sla.isOverdue
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : sla.isUrgent
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-violet-100 text-primary border border-violet-200"
                  }`}
                >
                  <Clock size={10} />
                  <span>{lang === "ar" ? sla.countdownLabelAr : sla.countdownLabel}</span>
                </span>
              </div>

              {/* Amount + IBAN */}
              <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-2.5 py-2 border border-surface-container">
                <div>
                  <span className="text-[10px] text-outline flex items-center gap-1">
                    <Building2 size={10} />
                    {payout.bankName.split("/")[0]?.trim()}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-[11px] text-on-surface" dir="ltr">
                      {payout.iban ? `SA**${payout.iban.slice(-6)}` : t("Not Configured", "غير محدد")}
                    </span>
                    {payout.iban && (
                      <button
                        type="button"
                        onClick={() => handleCopyIban(payout.id, payout.iban)}
                        className="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                        title={t("Copy full IBAN for bank transfer", "نسخ الآيبان الكامل للتحويل البنكي")}
                      >
                        <Copy size={10} />
                        <span>{copiedId === payout.id ? t("Copied", "تم") : t("IBAN", "نسخ")}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-[10px] text-outline block">{t("Net Payable", "المبلغ المستحق")}</span>
                  <span className="font-mono font-black text-sm text-status-emerald">
                    {t("SAR", "ر.س")} {payout.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] font-mono text-outline truncate">
                  {payout.remindedAt
                    ? t(`Reminded (${payout.reminderCount || 1}x)`, `تم التذكير (${payout.reminderCount || 1})`)
                    : payout.reference}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onSendReminders && (
                    <button
                      type="button"
                      onClick={() => onSendReminders([payout.id])}
                      disabled={sendingReminders}
                      className="inline-flex items-center gap-1 rounded-lg border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-2 py-1 text-[10px] font-bold text-on-surface transition cursor-pointer"
                      title={t("Notify host & log reminder", "إرسال تذكير للمضيف")}
                    >
                      <BellRing size={11} className="text-primary" />
                      <span>{t("Remind", "تذكير")}</span>
                    </button>
                  )}

                  {onDisburseNow && (
                    <button
                      type="button"
                      onClick={() => handleQuickDisburse(payout.id)}
                      disabled={disbursingId === payout.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-status-emerald hover:bg-emerald-700 text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={11} />
                      <span>{disbursingId === payout.id ? "..." : t("Disburse", "تم التحويل")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

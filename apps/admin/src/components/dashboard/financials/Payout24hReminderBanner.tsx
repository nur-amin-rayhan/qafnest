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
  Lock,
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
  onInspectPayout?: (payoutId: string) => void;
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
  onInspectPayout,
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
      className={`rounded-xl border p-4 sm:p-5 space-y-4 transition-colors ${
        reminders.overdueCount > 0
          ? "border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20"
          : hasUrgentOrOverdue
          ? "border-amber-300 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20"
          : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16]"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              reminders.overdueCount > 0
                ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                : hasUrgentOrOverdue
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            {reminders.overdueCount > 0 ? (
              <ShieldAlert size={20} className="animate-pulse" />
            ) : (
              <BellRing size={20} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("24-Hour Host Payout SLA & Reminders", "نظام متابعة وتنبيهات تحويل المستحقات (خلال ٢٤ ساعة)")}
              </h3>

              {reminders.overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wide">
                  <AlertTriangle size={12} />
                  <span>
                    {reminders.overdueCount} {t("Overdue >24h", "متأخر >٢٤ ساعة")}
                  </span>
                </span>
              )}

              {reminders.urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wide">
                  <Clock size={12} />
                  <span>
                    {reminders.urgentCount} {t("Due <6h", "عاجل <٦ ساعات")}
                  </span>
                </span>
              )}

              {payouts.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {t(`SLA Compliance: ${reminders.slaComplianceRate}%`, `نسبة الالتزام بمهلة ٢٤ ساعة: ${reminders.slaComplianceRate}٪`)}
                </span>
              )}

              {Boolean(reminders.escrowCount && reminders.escrowCount > 0) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Lock size={12} />
                  <span>
                    {reminders.escrowCount} {t("In Escrow (Pre-Check-Out)", "محجوز (قبل المغادرة)")}
                  </span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <SlidersHorizontal size={13} className="text-slate-500 dark:text-slate-400" />
              <span>{t("Payout Rail & 24h Rules", "آلية التحويل وقواعد ٢٤ ساعة")}</span>
            </button>
          )}

          {onSendReminders && reminders.dueWithin24hCount > 0 && (
            <button
              type="button"
              onClick={() => onSendReminders()}
              disabled={sendingReminders}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#4F2396]/30 bg-[#4F2396]/10 hover:bg-[#4F2396]/20 px-3 py-1.5 text-xs font-semibold text-[#4F2396] dark:text-purple-300 transition cursor-pointer disabled:opacity-50"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <span>{t("Open Payouts Queue", "فتح سجل التحويلات")}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Payout Channel & SLA Policy Panel */}
      {!compact && showPolicyPanel && policy && onUpdatePolicy && (
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-4 text-xs animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payout Rail Selector */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                {t("Disbursement Method (Payout Rail)", "طريقة صرف مستحقات المضيفين")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ payoutRail: "sarie_bank" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.payoutRail === "sarie_bank"
                      ? "border-[#4F2396] dark:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-slate-900 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>{t("SAMA SARIE Bank Transfer", "تحويل بنكي (SARIE ٢٤/٧)")}</span>
                    {policy.payoutRail === "sarie_bank" && <CheckCircle2 size={13} className="text-[#4F2396] dark:text-purple-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
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
                      ? "border-[#4F2396] dark:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-slate-900 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>{t("MyFatoorah Multi-Vendor", "تقسيم بوابة ماي فاتورة")}</span>
                    {policy.payoutRail === "myfatoorah_split" && <CheckCircle2 size={13} className="text-[#4F2396] dark:text-purple-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
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
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                {t("When Does the 24-Hour Clock Start?", "متى يبدأ عداد مهلة ٢٤ ساعة؟")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ slaTrigger: "check_out" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.slaTrigger === "check_out"
                      ? "border-[#4F2396] dark:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-slate-900 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between gap-1">
                    <span>{t("After Guest Check-Out", "بعد مغادرة الضيف")}</span>
                    {policy.slaTrigger === "check_out" && <CheckCircle2 size={13} className="text-[#4F2396] dark:text-purple-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {t("Full Escrow Lock: funds unlock only after guest check-out (Recommended).", "حماية كاملة: لا تصرف المستحقات إلا بعد تسجيل مغادرة الضيف.")}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ slaTrigger: "check_in" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.slaTrigger === "check_in"
                      ? "border-[#4F2396] dark:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-slate-900 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between gap-1">
                    <span>{t("After Guest Check-In", "بعد دخول الضيف")}</span>
                    {policy.slaTrigger === "check_in" && <CheckCircle2 size={13} className="text-[#4F2396] dark:text-purple-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {t("24h SLA window starts when check-in begins.", "تبدأ ٢٤ ساعة بعد دخول الضيف للعقار.")}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ slaTrigger: "payment_confirmed" })}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                    policy.slaTrigger === "payment_confirmed"
                      ? "border-[#4F2396] dark:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-slate-900 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between gap-1">
                    <span>{t("Upon Payment", "عند الدفع")}</span>
                    {policy.slaTrigger === "payment_confirmed" && <CheckCircle2 size={13} className="text-[#4F2396] dark:text-purple-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {t("24h deadline starts immediately when paid.", "يبدأ العد التنازلي فور تأكيد الدفع.")}
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Live MyFatoorah Multi-Vendor Readiness Probe */}
          {onCheckSuppliers && (
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {supplierProbe ? (
                  <span>
                    <strong className="text-slate-900 dark:text-slate-100">{t("MyFatoorah Suppliers API:", "واجهة موردي ماي فاتورة:")}</strong>{" "}
                    {supplierProbe.message}{" "}
                    {typeof supplierProbe.activeSuppliersCount === "number" && (
                      <span className="font-mono font-semibold text-[#4F2396] dark:text-purple-300">
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0"
              >
                <Zap size={12} className="text-amber-500" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {urgentQueue.map(({ payout, sla }) => (
            <div
              key={payout.id}
              className={`rounded-xl border p-3.5 bg-white dark:bg-[#0E0D16] space-y-2.5 text-xs transition shadow-2xs ${
                sla.isOverdue
                  ? "border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-200/50 dark:ring-rose-900/30"
                  : sla.isUrgent
                  ? "border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-200/50 dark:ring-amber-900/30"
                  : "border-slate-200/90 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">{payout.hostName}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{payout.propertyTitle}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                    sla.tier === "escrow"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      : sla.isOverdue
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      : sla.isUrgent
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      : "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  }`}
                >
                  {sla.tier === "escrow" ? <Lock size={10} /> : <Clock size={10} />}
                  <span>{lang === "ar" ? sla.countdownLabelAr : sla.countdownLabel}</span>
                </span>
              </div>

              {/* Amount + IBAN */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50/75 dark:bg-slate-900/60 px-2.5 py-2 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Building2 size={10} />
                    {payout.bankName.split("/")[0]?.trim()}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-semibold text-[11px] text-slate-900 dark:text-slate-100" dir="ltr">
                      {payout.iban ? `SA**${payout.iban.slice(-6)}` : t("Not Configured", "غير محدد")}
                    </span>
                    {payout.iban && (
                      <button
                        type="button"
                        onClick={() => handleCopyIban(payout.id, payout.iban)}
                        className="text-[#4F2396] dark:text-purple-400 hover:underline text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        title={t("Copy full IBAN for bank transfer", "نسخ الآيبان الكامل للتحويل البنكي")}
                      >
                        <Copy size={10} />
                        <span>{copiedId === payout.id ? t("Copied", "تم") : t("IBAN", "نسخ")}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t("Net Payable", "المبلغ المستحق")}</span>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {t("SAR", "ر.س")} {payout.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
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
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      title={t("Notify host & log reminder", "إرسال تذكير للمضيف")}
                    >
                      <BellRing size={11} className="text-[#4F2396] dark:text-purple-400" />
                      <span>{t("Remind", "تذكير")}</span>
                    </button>
                  )}

                  {(onInspectPayout || onDisburseNow) && (
                    <button
                      type="button"
                      onClick={() =>
                        onInspectPayout
                          ? onInspectPayout(payout.id)
                          : handleQuickDisburse(payout.id)
                      }
                      disabled={disbursingId === payout.id}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition cursor-pointer disabled:opacity-50 ${
                        sla.tier === "escrow"
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                    >
                      {sla.tier === "escrow" ? <Lock size={10} /> : <CheckCircle2 size={11} />}
                      <span>
                        {disbursingId === payout.id
                          ? "..."
                          : sla.tier === "escrow"
                          ? t("Escrow Details", "تفاصيل الضمان")
                          : t("Review & Settle", "مراجعة وصرف")}
                      </span>
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

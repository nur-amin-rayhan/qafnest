"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Clock, Bell, ShieldCheck, DollarSign } from "lucide-react";
import type { HostSettlementSettings } from "@/lib/services/hostFinancialsTypes";

interface SettlementSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HostSettlementSettings;
  onSaveSettings: (settings: HostSettlementSettings) => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function SettlementSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  lang,
  t,
}: SettlementSettingsModalProps) {
  const [frequency, setFrequency] = useState(settings.payoutFrequency);
  const [threshold, setThreshold] = useState(settings.minPayoutThreshold);
  const [autoRelease, setAutoRelease] = useState(settings.autoReleaseAfterCheckin);
  const [notifySms, setNotifySms] = useState(settings.notifySms);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSettings({
        payoutFrequency: frequency,
        minPayoutThreshold: threshold,
        autoReleaseAfterCheckin: autoRelease,
        notifySms,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#4F2396]" />
            <h3 className="font-black text-sm text-slate-900">
              {t("Settlement & Payout Schedule Settings", "إعدادات جدول التحويل والتسوية المالية")}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Payout Frequency */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-slate-700 block">
            {t("Automated Payout Frequency (SAMA SARIE)", "دورية التحويل البنكي التلقائي (نظام سريع)")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "weekly", en: "Weekly (Every Wed)", ar: "أسبوعياً (كل أربعاء)" },
              { id: "biweekly", en: "Bi-Weekly (Every 2 wks)", ar: "كل أسبوعين" },
              { id: "monthly", en: "Monthly (1st of month)", ar: "شهرياً (بداية الشهر)" },
              { id: "manual", en: "On-Demand (Manual)", ar: "يدوياً عند الطلب" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFrequency(opt.id as any)}
                className={`p-2.5 rounded-xl text-start font-bold border transition cursor-pointer ${
                  frequency === opt.id
                    ? "border-[#4F2396] bg-violet-50 text-[#4F2396]"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {lang === "ar" ? opt.ar : opt.en}
              </button>
            ))}
          </div>
        </div>

        {/* Minimum Threshold */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-slate-700 block">
            {t("Minimum Payout Threshold", "الحد الأدنى للتحويل التلقائي")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 0, label: t("No Minimum", "بدون حد أدنى") },
              { val: 500, label: "500 SAR" },
              { val: 1000, label: "1,000 SAR" },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setThreshold(opt.val)}
                className={`p-2 rounded-xl text-center font-bold border transition cursor-pointer ${
                  threshold === opt.val
                    ? "border-[#4F2396] bg-violet-50 text-[#4F2396]"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Policy & Notification Toggles */}
        <div className="space-y-3 pt-1 border-t border-slate-100 text-xs">
          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-bold block text-slate-900">
                {t("Post Check-Out Escrow Lock + 24h Settlement", "تحرير المستحقات بعد تسجيل مغادرة الضيف (خلال 24 ساعة)")}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {t("Funds remain in escrow until guest check-out completes", "حماية كاملة: لا يتم صرف المستحقات إلا بعد انتهاء الإقامة ومغادرة الضيف")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRelease}
              onChange={(e) => setAutoRelease(e.target.checked)}
              className="h-4 w-4 rounded accent-[#4F2396] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-bold block text-slate-900">
                {t("SMS & Email Settlement Alerts", "إشعارات الرسائل النصية والبريد عند كل تحويل")}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {t("Instant notification with SAMA SARIE reference", "إشعار فوري برقم الحوالة البنكية")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifySms}
              onChange={(e) => setNotifySms(e.target.checked)}
              className="h-4 w-4 rounded accent-[#4F2396] cursor-pointer"
            />
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            {t("Cancel", "إلغاء")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] text-white hover:bg-[#3d1979] px-5 py-2 text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            <span>{saving ? t("Saving...", "جاري الحفظ...") : t("Save Preferences", "حفظ الإعدادات")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


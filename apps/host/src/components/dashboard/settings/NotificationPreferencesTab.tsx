"use client";

import React, { useState } from "react";
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle2,
  Calendar,
  Sparkles,
  DollarSign,
  Loader2,
} from "lucide-react";
import type { HostNotificationSettings, BaseTabProps } from "./types";

interface NotificationPreferencesTabProps extends BaseTabProps {
  notifications: HostNotificationSettings;
  onSave: (data: Partial<HostNotificationSettings>) => Promise<void>;
}

export function NotificationPreferencesTab({
  notifications,
  onSave,
  lang,
  t,
  isSaving,
}: NotificationPreferencesTabProps) {
  const [form, setForm] = useState<HostNotificationSettings>(notifications);

  const toggle = async (key: keyof HostNotificationSettings) => {
    const nextVal = !form[key];
    setForm((prev) => ({ ...prev, [key]: nextVal }));
    if (key === "pushAlerts" && nextVal) {
      try {
        const { requestPushNotificationToken } = await import("@/lib/firebase/messaging");
        await requestPushNotificationToken();
      } catch (err) {
        console.warn("[Host Push] Failed to request token:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  const renderToggle = (
    key: keyof HostNotificationSettings,
    titleEn: string,
    titleAr: string,
    descEn: string,
    descAr: string,
    icon: React.ReactNode
  ) => {
    const isChecked = Boolean(form[key]);
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="flex items-center gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300">
            {icon}
          </div>
          <div>
            <span className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug">
              {lang === "ar" ? titleAr : titleEn}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {lang === "ar" ? descAr : descEn}
            </span>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isChecked}
          onClick={() => toggle(key)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer ${
            isChecked ? "bg-[#4F2396]" : "bg-slate-200 dark:bg-slate-800"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isChecked
                ? lang === "ar"
                  ? "-translate-x-5"
                  : "translate-x-5"
                : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Delivery Channels Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-xs">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {t("Notification Delivery Channels", "قنوات استلام التنبيهات")}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t(
              "Select the digital channels through which you wish to receive alerts.",
              "حدد المنصات والقنوات التي ترغب في تلقي إشعارات الحجوزات والعمليات من خلالها."
            )}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {renderToggle(
            "smsAlerts",
            "SMS Text Messages",
            "رسائل نصية قصيرة (SMS)",
            "Direct instant alerts on your verified Saudi mobile",
            "تنبيهات فورية على هاتفك المحمول المعتمد",
            <Smartphone size={18} />
          )}

          {renderToggle(
            "whatsappAlerts",
            "WhatsApp Business Alerts",
            "إشعارات واتساب للأعمال",
            "Booking confirmations and urgent guest messages",
            "تأكيدات الحجوزات ورسائل الضيوف العاجلة عبر واتساب",
            <MessageSquare size={18} />
          )}

          {renderToggle(
            "emailAlerts",
            "Email Notifications",
            "البريد الإلكتروني",
            "Detailed booking invoices and remittance reports",
            "الفواتير والتقارير المالية الدورية المفصلة",
            <Mail size={18} />
          )}

          {renderToggle(
            "pushAlerts",
            "In-App & Push Notifications",
            "إشعارات المتصفح والتطبيق",
            "Real-time banner notices inside the host workspace",
            "تنبيهات لحظية على الشاشة داخل لوحة تحكم المضيف",
            <Bell size={18} />
          )}
        </div>
      </div>

      {/* 2. Specific Event Triggers Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-xs">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {t("Event Alerts & Triggers", "أحداث الحجوزات والعمليات")}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t(
              "Control exactly which business updates trigger notifications.",
              "حدد الأحداث التي تريد إرسال تنبيه فوري بشأنها لتبقى على اطلاع دائم."
            )}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {renderToggle(
            "newBookingAlert",
            "New Bookings & Reservations",
            "حجوزات جديدة ومؤكدة",
            "Alert when a guest reserves or confirms payment",
            "تنبيه فوري بمجرد إتمام الضيف لحجز جديد",
            <CheckCircle2 size={18} className="text-emerald-600" />
          )}

          {renderToggle(
            "guestMessageAlert",
            "Guest Messages & Chat",
            "رسائل واستفسارات الضيوف",
            "Alert when a guest sends a question or request",
            "إشعار مباشر عند إرسال الضيف استفساراً أو رسالة",
            <MessageSquare size={18} className="text-violet-600" />
          )}

          {renderToggle(
            "payoutAlert",
            "Payout Remittances & Bank Transfers",
            "تحويلات الأرباح والمستحقات",
            "Disbursement confirmation and SARIE transaction ID",
            "إشعار إيداع الأرباح ورقم الحوالة البنكية عبر سريع",
            <DollarSign size={18} className="text-amber-500" />
          )}

          {renderToggle(
            "reviewAlert",
            "Guest Reviews & Ratings",
            "تقييمات الضيوف والآراء",
            "Instant notice when a guest rates your property",
            "تنبيه فوري فور تقييم الضيف لإقامته لديك",
            <Sparkles size={18} className="text-amber-500" />
          )}

          {renderToggle(
            "pricingReminderAlert",
            "Pricing & Calendar Recommendations",
            "توصيات الأسعار والمواسم",
            "Seasonal demand tips and high-traffic weekends",
            "نصائح تسعير للمواسم والعطلات الأسبوعية الأكثر طلباً",
            <Calendar size={18} className="text-slate-600" />
          )}

          {renderToggle(
            "marketingAlert",
            "QafNest News & Platform Updates",
            "أخبار وتحديثات منصة قاف نست",
            "New features, host community events and promotions",
            "الميزات الجديدة والفعاليات والبرامج الترويجية للمضيفين",
            <Sparkles size={18} className="text-violet-600" />
          )}
        </div>

        {/* 3. Action Footer */}
        <div className="mt-8 flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-violet-950/20 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("Saving Preferences...", "جارٍ الحفظ...")}</span>
              </>
            ) : (
              <span>{t("Save Notification Preferences", "حفظ تفضيلات الإشعارات")}</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}


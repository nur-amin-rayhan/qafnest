"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Inbox,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { cmsPath } from "@/lib/cmsUrl";
import type {
  ContactFormSettings,
  ContactInquiryRecord,
  ContactInquiryStatus,
  GmailSmtpRuntimeStatus,
} from "@qafnest/shared/contactInquiriesStore";

interface CmsContactTabProps {
  t: (en: string, ar: string) => string;
}

export function CmsContactTab({ t }: CmsContactTabProps) {
  const [settings, setSettings] = useState<ContactFormSettings | null>(null);
  const [smtp, setSmtp] = useState<GmailSmtpRuntimeStatus | null>(null);
  const [inquiries, setInquiries] = useState<ContactInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ContactInquiryStatus>("all");

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(cmsPath("/api/cms/contact"), { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load contact settings");
      setSettings(data.settings);
      setSmtp(data.smtp);
      setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
    } catch (err: unknown) {
      showToast("err", err instanceof Error ? err.message : "Error loading CMS Contact inbox");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch(cmsPath("/api/cms/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_settings",
          ...settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed saving Gmail settings");
      setSettings(data.settings);
      setSmtp(data.smtp);
      showToast(
        "ok",
        t(
          `Contact Us destination updated to ${data.settings.recipientEmail}.`,
          `تم تحديث بريد استقبال نموذج التواصل إلى ${data.settings.recipientEmail}.`
        )
      );
    } catch (err: unknown) {
      showToast("err", err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendTest = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch(cmsPath("/api/cms/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_test_email",
          targetEmail: settings?.recipientEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send test email");
      }
      showToast(
        "ok",
        t(
          `Test email delivered cleanly to ${data.recipient}!`,
          `تم إرسال البريد التجريبي بنجاح إلى ${data.recipient}!`
        )
      );
    } catch (err: unknown) {
      showToast("err", err instanceof Error ? err.message : "Gmail SMTP test failed");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: ContactInquiryStatus) => {
    try {
      const res = await fetch(cmsPath("/api/cms/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_inquiry", id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed updating inquiry status");
      setInquiries((prev) => prev.map((item) => (item.id === id ? data.inquiry : item)));
    } catch (err: unknown) {
      showToast("err", err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      const res = await fetch(cmsPath("/api/cms/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_inquiry", id }),
      });
      if (!res.ok) throw new Error("Failed deleting inquiry");
      setInquiries((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      showToast("err", err instanceof Error ? err.message : "Delete failed");
    }
  };

  const filteredInquiries =
    statusFilter === "all"
      ? inquiries
      : inquiries.filter((item) => item.status === statusFilter);

  if (loading || !settings) {
    return (
      <div className="p-8 rounded-2xl border border-white/10 bg-[#0D111A] text-center text-xs text-gray-400">
        {t("Loading Contact Form & Gmail integration...", "جاري تحميل إعدادات نموذج التواصل وبريد Gmail...")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-400" />
            <span>{t("Contact Us Form & Gmail Integration", "نموذج تواصل معنا والربط مع Gmail")}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(
              "Configure Nodemailer Gmail delivery, review incoming guest/host inquiries, and manage ticket statuses.",
              "تهيئة الإرسال عبر Nodemailer Gmail، مراجعة رسائل الزوار والمضيفين، وإدارة حالة التذاكر."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("Refresh", "تحديث")}</span>
        </button>
      </div>

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
            toast.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Grid: Gmail Configuration + SMTP Runtime Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSaveSettings}
          className="rounded-2xl border border-white/10 bg-[#0D111A] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {t("Recipient Gmail Configuration", "إعدادات بريد الاستقبال (Gmail)")}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
              Nodemailer
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              {t("Destination Gmail Address (Receives Contact Us Form)", "بريد الاستقبال الرسمي لرسائل التواصل")}
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={settings.recipientEmail}
              onChange={(e) =>
                setSettings({ ...settings, recipientEmail: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                {t("Email Subject Prefix", "بادئة عنوان الرسالة")}
              </label>
              <input
                type="text"
                dir="ltr"
                value={settings.subjectPrefix}
                onChange={(e) =>
                  setSettings({ ...settings, subjectPrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                {t("Response SLA (Hours)", "زمن الاستجابة المستهدف (ساعات)")}
              </label>
              <input
                type="number"
                min={1}
                max={72}
                value={settings.responseSlaHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    responseSlaHours: Number(e.target.value) || 2,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailForwardingEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailForwardingEnabled: e.target.checked,
                  })
                }
                className="rounded border-white/20 bg-black/60"
              />
              <span>
                {t(
                  "Forward every Contact Us submission via Gmail SMTP immediately",
                  "تحويل جميع رسائل نموذج التواصل فوراً إلى بريد Gmail"
                )}
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoReplyEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, autoReplyEnabled: e.target.checked })
                }
                className="rounded border-white/20 bg-black/60"
              />
              <span>
                {t(
                  "Send automatic ticket confirmation reply when customer provides an email",
                  "إرسال تأكيد آلي للعميل عند إدخاله البريد الإلكتروني"
                )}
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={testingEmail || !smtp?.configured}
              onClick={handleSendTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-teal-400" />
              <span>{testingEmail ? t("Sending...", "جاري الاختبار...") : t("Send Test Email", "إرسال رسالة تجريبية")}</span>
            </button>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? t("Saving...", "جاري الحفظ...") : t("Save Gmail Settings", "حفظ إعدادات Gmail")}
            </button>
          </div>
        </form>

        {/* SMTP Runtime Status & Setup Guide */}
        <div className="rounded-2xl border border-white/10 bg-[#0D111A] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>{t("Server Gmail SMTP Status", "حالة خادم إرسال Gmail SMTP")}</span>
            </h3>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                smtp?.configured
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {smtp?.configured
                ? t("SMTP Connected", "متصل وجاهز للإرسال")
                : t("Pending App Password Env", "بانتظار مفتاح App Password")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[10px] text-gray-500">SMTP Host</div>
              <div className="font-mono text-gray-200 mt-0.5" dir="ltr">
                {smtp?.smtpHost || "smtp.gmail.com"}:{smtp?.smtpPort || 465}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[10px] text-gray-500">Sender Account</div>
              <div className="font-mono text-gray-200 mt-0.5 truncate" dir="ltr">
                {smtp?.smtpUserMasked || t("Not set in .env", "غير مضبوط")}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2 text-[11px] text-gray-300 leading-relaxed">
            <div className="font-bold text-teal-300">
              {t("How to authorize Gmail (qafnest@gmail.com):", "خطوات تفعيل الإرسال من qafnest@gmail.com:")}
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>
                {t(
                  "Sign in to qafnest@gmail.com -> Google Account -> Security -> Enable 2-Step Verification.",
                  "سجّل الدخول إلى qafnest@gmail.com ثم افتح حساب Google -> الأمان -> تفعيل التحقق بخطوتين."
                )}
              </li>
              <li>
                {t(
                  "Create a Google App Password (16-character code) named 'QafNest Contact'.",
                  "أنشئ كلمة مرور تطبيقات (App Password) مكونة من 16 حرفاً باسم QafNest Contact."
                )}
              </li>
              <li>
                {t(
                  "Set GMAIL_USER=qafnest@gmail.com and GMAIL_APP_PASSWORD in your environment (.env.local / VPS .env).",
                  "أضف GMAIL_USER=qafnest@gmail.com و GMAIL_APP_PASSWORD في ملف البيئة على السيرفر."
                )}
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Inquiries Inbox */}
      <div className="rounded-2xl border border-white/10 bg-[#0D111A] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">
              {t(`Submitted Inquiries (${inquiries.length})`, `صندوق رسائل تواصل معنا (${inquiries.length})`)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            {(["all", "new", "in_progress", "resolved"] as const).map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setStatusFilter(statusKey)}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  statusFilter === statusKey
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {statusKey === "all"
                  ? t("All", "الكل")
                  : statusKey === "new"
                  ? t("New", "جديد")
                  : statusKey === "in_progress"
                  ? t("In Progress", "قيد المتابعة")
                  : t("Resolved", "تم الحل")}
              </button>
            ))}
          </div>
        </div>

        {filteredInquiries.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-500">
            {t(
              "No Contact Us inquiries match this filter yet. Every submission is permanently stored here even if Gmail SMTP is offline.",
              "لا توجد رسائل مطابقة حالياً. يتم حفظ جميع الرسائل هنا تلقائياً."
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.map((inq) => (
              <div
                key={inq.id}
                className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-teal-300">#{inq.ticketNumber}</span>
                    <span className="font-bold text-white">{inq.name}</span>
                    <span className="text-gray-400 font-mono" dir="ltr">{inq.phone}</span>
                    {inq.email && (
                      <span className="text-gray-400" dir="ltr">· {inq.email}</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300">
                      {inq.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        inq.deliveryStatus === "sent"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : inq.deliveryStatus === "failed"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {inq.deliveryStatus === "sent"
                        ? `Gmail -> ${inq.recipientEmail}`
                        : inq.deliveryStatus === "failed"
                        ? t("SMTP Failed (Saved in CMS)", "فشل الإرسال (محفوظ بالنظام)")
                        : t("Saved in CMS (SMTP Pending)", "محفوظ بانتظار SMTP")}
                    </span>

                    <select
                      value={inq.status}
                      onChange={(e) =>
                        handleUpdateInquiryStatus(inq.id, e.target.value as ContactInquiryStatus)
                      }
                      className="rounded-lg bg-[#0D111A] border border-white/15 px-2 py-1 text-[11px] text-white"
                    >
                      <option value="new">{t("New", "جديد")}</option>
                      <option value="in_progress">{t("In Progress", "قيد المتابعة")}</option>
                      <option value="resolved">{t("Resolved", "تم الحل")}</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteInquiry(inq.id)}
                      title={t("Delete inquiry", "حذف الرسالة")}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {inq.message}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inq.createdAt).toLocaleString()} · {inq.source}
                  </span>
                  {inq.deliveryError && (
                    <span className="text-amber-400/90">{inq.deliveryError}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

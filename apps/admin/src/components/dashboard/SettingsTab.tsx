"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Unlock,
  RefreshCw,
  Gift,
  Smartphone,
  Globe,
  RotateCcw,
} from "lucide-react";
import type { SignupSecurityStoreDoc } from "@qafnest/shared/signupSecurityStore";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminPath } from "@/lib/adminUrl";
export function SettingsTab() {
  const { t, dir } = useAdminAuth();
  const [copied, setCopied] = useState(false);
  const [secData, setSecData] = useState<SignupSecurityStoreDoc | null>(null);
  const [secLoading, setSecLoading] = useState(true);
  const [secBusy, setSecBusy] = useState(false);
  const [ipInput, setIpInput] = useState("");
  const [ipReason, setIpReason] = useState("");
  const [secToast, setSecToast] = useState<string | null>(null);
  const currencyLabel = t("SAR", "ر.س");

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText("https://api.qafnest.com/v1");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSecurity = useCallback(async () => {
    setSecLoading(true);
    try {
      const res = await fetch(adminPath(`/api/admin/security/signups?t=${Date.now()}`), {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setSecData({
          policy: data.policy,
          registrations: data.registrations || [],
          blockedIps: data.blockedIps || [],
          blockedDevices: data.blockedDevices || [],
          alerts: data.alerts || [],
        });
      }
    } catch {
      // Ignore transient error
    } finally {
      setSecLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSecurity();
  }, [loadSecurity]);

  const runSecurityAction = async (payload: Record<string, unknown>) => {
    setSecBusy(true);
    setSecToast(null);
    try {
      const res = await fetch(adminPath("/api/admin/security/signups"), {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecData({
          policy: data.policy,
          registrations: data.registrations || [],
          blockedIps: data.blockedIps || [],
          blockedDevices: data.blockedDevices || [],
          alerts: data.alerts || [],
        });
        setSecToast(data.message || t("Security settings updated.", "تم تحديث إعدادات الأمان."));
        setTimeout(() => setSecToast(null), 4000);
      }
    } finally {
      setSecBusy(false);
    }
  };

  const handleManualBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return;
    await runSecurityAction({
      action: "block_ip",
      ip: ipInput.trim(),
      reason:
        ipReason.trim() ||
        t(
          "Suspected multi-account welcome bonus abuse",
          "اشتباه في إساءة استخدام مكافأة الترحيب عبر حسابات متعددة"
        ),
    });
    setIpInput("");
  };

  return (
    <div dir={dir} className="flex flex-col gap-space-lg max-w-5xl">
      {/* Header */}
      <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-sm text-[11px] text-primary uppercase font-bold tracking-wider">
              {t("System Configuration", "إعدادات النظام")}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-status-emerald/15 text-status-emerald font-bold text-[10px]">
              {t("Production Ready", "جاهز للإنتاج")}
            </span>
          </div>
          <h1 className="font-display-md text-2xl font-black text-on-surface">
            {t("Platform Settings, Welcome Bonus & IP Fraud Guard", "إعدادات المنصة ومكافأة الترحيب وحماية الـ IP")}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            {t(
              "Centralized settings, single-account-per-device/IP enforcement, and IP block management.",
              "الإعدادات المركزية، وتطبيق سياسة حساب واحد لكل جهاز وعنوان IP، وإدارة الحظر الأمني."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-9 px-3.5 rounded-xl bg-surface-container-low border border-surface-container text-xs font-bold text-on-surface flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-status-emerald animate-pulse"></span>
            <span>{t("Version v1.0.0", "الإصدار v1.0.0")}</span>
          </span>
        </div>
      </div>

      {/* Grid: 2 Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        {/* Card 1: System Status & Deployment */}
        <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/60">
              <span className="font-title-sm text-sm font-bold text-on-surface">
                {t("Deployment & Status", "حالة النظام والنشر")}
              </span>
              <span className="material-symbols-outlined text-primary text-[20px]">
                deployed_code
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <span className="text-on-surface-variant font-medium">{t("Platform Release:", "إصدار المنصة:")}</span>
                <span className="font-mono font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                  v1.0.0
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <span className="text-on-surface-variant font-medium">{t("Operating Mode:", "وضع التشغيل:")}</span>
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-status-emerald"></span>
                  {t("Centralized Mode (Kingdom-wide)", "الوضع المركزي (على مستوى المملكة)")}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <span className="text-on-surface-variant font-medium">{t("Cluster Health:", "حالة الخوادم:")}</span>
                <span className="font-bold text-status-emerald flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  {t("All Nodes Healthy", "جميع العقد تعمل بكفاءة")}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="w-full h-10 px-4 rounded-xl border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>
              {copied
                ? t("API Endpoint Copied!", "تم نسخ رابط الـ API!")
                : t("Copy Centralized API Endpoint", "نسخ رابط الـ API المركزي")}
            </span>
          </button>
        </div>

        {/* Card 2: Active Integrations & Gateway */}
        <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/60">
              <span className="font-title-sm text-sm font-bold text-on-surface">
                {t("Gateways & Compliance", "بوابات الدفع والامتثال")}
              </span>
              <span className="material-symbols-outlined text-primary text-[20px]">
                security
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">{t("MyFatoorah Gateway", "بوابة ماي فاتورة للدفع")}</span>
                  <span className="text-[10px] text-outline">Apple Pay, Mada, Visa, Tabby</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-emerald/15 text-status-emerald">
                  {t("Live & Active", "مفعّلة ومباشرة")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">{t("Supabase PostgreSQL", "قاعدة بيانات Supabase")}</span>
                  <span className="text-[10px] text-outline">
                    {t("Row-Level Security & Realtime", "حماية مستوى الصفوف والمزامنة الفورية")}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-emerald/15 text-status-emerald">
                  {t("Connected", "متصلة")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">{t("Ministry of Tourism (MOT)", "وزارة السياحة السعودية")}</span>
                  <span className="text-[10px] text-outline">
                    {t("License Verification Engine", "محرك التحقق من التراخيص")}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-emerald/15 text-status-emerald">
                  {t("Certified", "معتمد")}
                </span>
              </div>
            </div>
          </div>

          <div className="h-10 px-4 rounded-xl bg-surface-container-low text-outline text-xs flex items-center justify-between">
            <span>{t("Compliance Mode:", "وضع الامتثال:")}</span>
            <span className="font-mono font-semibold text-on-surface">
              {t("Real-time Enforcement", "تطبيق فوري مباشر")}
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Guest Signup Security, 50 SAR Welcome Bonus & IP Blocker */}
      <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 border border-rose-200 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-on-surface">
                {t(
                  "Guest Signup Anti-Abuse Security & 50 SAR Welcome Bonus Guard",
                  "حماية التسجيل ومكافأة الترحيب (50 ر.س) ومكافحة التلاعب"
                )}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t(
                  "Enforces 1 guest account + 50 SAR platform-borne welcome gift per device & IP. Automatically detects & blocks multi-account signups.",
                  "يفرض حساباً واحداً + 50 ر.س مكافأة ترحيب لكل جهاز وعنوان IP، ويكتشف ويحظر التسجيل المتكرر تلقائياً."
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadSecurity()}
            disabled={secLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface cursor-pointer self-start shrink-0"
          >
            <RefreshCw size={13} className={secLoading ? "animate-spin text-primary" : ""} />
            <span>{t("Refresh Logs", "تحديث السجلات")}</span>
          </button>
        </div>

        {secToast && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-status-emerald flex items-center gap-2">
            <ShieldCheck size={15} />
            <span>{secToast}</span>
          </div>
        )}

        {secData && (
          <>
            {/* Policy Toggles & Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <label className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <span className="font-bold text-on-surface block">
                    {t("1 Account Per Device", "حساب واحد لكل جهاز")}
                  </span>
                  <span className="text-[10px] text-outline">
                    {t("Browser fingerprint + ID", "بصمة المتصفح ومعرّف الجهاز")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={secData.policy.enforceSingleAccountPerDevice}
                  disabled={secBusy}
                  onChange={(e) =>
                    void runSecurityAction({
                      action: "update_policy",
                      policy: { enforceSingleAccountPerDevice: e.target.checked },
                    })
                  }
                  className="h-4 w-4 accent-primary shrink-0"
                />
              </label>

              <label className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <span className="font-bold text-on-surface block">
                    {t("1 Account Per IP", "حساب واحد لكل IP")}
                  </span>
                  <span className="text-[10px] text-outline">
                    {t("Unique network enforcement", "تقييد عنوان الشبكة الفريد")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={secData.policy.enforceSingleAccountPerIp}
                  disabled={secBusy}
                  onChange={(e) =>
                    void runSecurityAction({
                      action: "update_policy",
                      policy: { enforceSingleAccountPerIp: e.target.checked },
                    })
                  }
                  className="h-4 w-4 accent-primary shrink-0"
                />
              </label>

              <label className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <span className="font-bold text-on-surface block">
                    {t("Auto-Block Repeat IPs", "حظر تلقائي للـ IP المتكرر")}
                  </span>
                  <span className="text-[10px] text-outline">
                    {t("Ban on duplicate attempt", "حظر عند محاولة التكرار")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={secData.policy.autoBlockRepeatIps}
                  disabled={secBusy}
                  onChange={(e) =>
                    void runSecurityAction({
                      action: "update_policy",
                      policy: { autoBlockRepeatIps: e.target.checked },
                    })
                  }
                  className="h-4 w-4 accent-primary shrink-0"
                />
              </label>

              <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-violet-900 flex items-center gap-1">
                    <Gift size={13} /> {t("Welcome Bonus", "مكافأة الترحيب")}
                  </span>
                  <span className="text-[11px] font-mono font-black text-primary">
                    {secData.policy.welcomeBonusAmountSar} {currencyLabel} ({secData.registrations.length}{" "}
                    {t("granted", "ممنوحة")})
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={secData.policy.welcomeBonusEnabled}
                  disabled={secBusy}
                  onChange={(e) =>
                    void runSecurityAction({
                      action: "update_policy",
                      policy: { welcomeBonusEnabled: e.target.checked },
                    })
                  }
                  className="h-4 w-4 accent-primary shrink-0"
                />
              </div>
            </div>

            {/* Manual IP Block Form */}
            <form onSubmit={(e) => void handleManualBlockIp(e)} className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
              <input
                type="text"
                data-testid="manual-block-ip-input"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder={t(
                  "Enter IPv4 / IPv6 address to block (e.g. 203.0.113.45)",
                  "أدخل عنوان IPv4 / IPv6 لحظره (مثال: 203.0.113.45)"
                )}
                dir="ltr"
                className="md:col-span-4 rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 font-mono text-xs text-on-surface outline-none focus:border-primary"
              />
              <input
                type="text"
                value={ipReason}
                onChange={(e) => setIpReason(e.target.value)}
                placeholder={t(
                  "Reason for blocking IP (e.g. Multi-account abuse)",
                  "سبب حظر عنوان الـ IP (مثال: تكرار الحسابات)"
                )}
                className="md:col-span-5 rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-xs text-on-surface outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={secBusy || !ipInput.trim()}
                data-testid="manual-block-ip-btn"
                className="md:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 transition cursor-pointer disabled:opacity-50"
              >
                <Ban size={14} />
                <span>{t("Block IP Address", "حظر عنوان الـ IP")}</span>
              </button>
            </form>

            {/* Blocked IPs & Security Alerts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Blocked IPs List */}
              <div className="rounded-xl border border-surface-container p-4 space-y-3 bg-surface-container-low/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface flex items-center gap-1.5">
                    <Globe size={14} className="text-rose-600" />
                    {t(`Blocked IPs (${secData.blockedIps.length})`, `عناوين الـ IP المحظورة (${secData.blockedIps.length})`)}
                  </span>
                </div>
                {secData.blockedIps.length === 0 ? (
                  <p className="text-[11px] text-outline py-2">
                    {t("No blocked IP addresses right now.", "لا توجد عناوين IP محظورة حالياً.")}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {secData.blockedIps.map((b) => (
                      <div key={b.value} className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-rose-700 block" dir="ltr">{b.value}</span>
                          <span className="text-[10px] text-on-surface-variant block truncate">{b.reason}</span>
                        </div>
                        <button
                          type="button"
                          disabled={secBusy}
                          onClick={() => void runSecurityAction({ action: "clear_ip_lock", ip: b.value })}
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-status-emerald font-bold px-2.5 py-1 text-[11px] cursor-pointer"
                        >
                          <Unlock size={11} />
                          <span>{t("Unblock", "إلغاء الحظر")}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Duplicate Signup Fraud Alerts */}
              <div className="rounded-xl border border-surface-container p-4 space-y-3 bg-surface-container-low/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface flex items-center gap-1.5">
                    <Smartphone size={14} className="text-amber-600" />
                    {t(
                      `Flagged Duplicate Account Attempts (${secData.alerts.length})`,
                      `محاولات تكرار الحسابات المرصودة (${secData.alerts.length})`
                    )}
                  </span>
                </div>
                {secData.alerts.length === 0 ? (
                  <p className="text-[11px] text-outline py-2">
                    {t("No multi-account abuse attempts detected yet.", "لم يتم رصد أي محاولات تعدد حسابات حتى الآن.")}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {secData.alerts.slice(0, 15).map((a) => (
                      <div key={a.id} className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-on-surface" dir="ltr">{a.ip}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {a.actionTaken.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant">{a.reason}</p>
                        <span className="text-[10px] font-mono text-outline block" dir="ltr">
                          {t("Device:", "الجهاز:")} {a.deviceId}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Approved Welcome Bonus Registrations */}
            {secData.registrations.length > 0 && (
              <div className="rounded-xl border border-surface-container p-4 space-y-2 bg-surface-container-low/30 text-xs">
                <span className="font-bold text-on-surface block">
                  {t(
                    `Verified Device & IP Welcome Bonus Registry (${secData.registrations.length})`,
                    `سجل الأجهزة وعناوين الـ IP المستفيدة من مكافأة الترحيب (${secData.registrations.length})`
                  )}
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {secData.registrations.slice(0, 15).map((r) => (
                    <div key={r.id} className="p-2 rounded-lg bg-surface-container-lowest border border-surface-container flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="font-bold text-on-surface">{r.email || r.phone || r.userId}</span>
                        <span className="text-outline ms-2 font-mono" dir="ltr">
                          IP: {r.ip} • {t("Device:", "الجهاز:")} {r.deviceId.slice(0, 16)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-status-emerald">
                          +{r.welcomeBonusAmount} {currencyLabel}
                        </span>
                        <button
                          type="button"
                          disabled={secBusy}
                          onClick={() => void runSecurityAction({ action: "clear_ip_lock", ip: r.ip })}
                          className="inline-flex items-center gap-1 rounded border border-surface-container-high px-2 py-0.5 text-[10px] text-on-surface-variant hover:text-primary cursor-pointer"
                          title={t("Reset IP Lock", "إعادة ضبط قيد الـ IP")}
                        >
                          <RotateCcw size={10} /> {t("Reset IP", "فك قيد الـ IP")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

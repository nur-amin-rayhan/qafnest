"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
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

// Module-level cache for instant settings rendering
let cachedSecData: SignupSecurityStoreDoc | null = null;

export function SettingsTab() {
  const { t, dir } = useAdminAuth();
  const [copied, setCopied] = useState(false);
  const [secData, setSecData] = useState<SignupSecurityStoreDoc | null>(() => cachedSecData);
  const [secLoading, setSecLoading] = useState(!cachedSecData);
  const [secBusy, setSecBusy] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{
    checked: boolean;
    apiReachable: boolean;
    zatcaEnv: string;
    zatcaConfigured: boolean;
    paymentConfigured: boolean;
  }>({
    checked: false,
    apiReachable: false,
    zatcaEnv: "sandbox",
    zatcaConfigured: false,
    paymentConfigured: false,
  });
  const [ipInput, setIpInput] = useState("");
  const [ipReason, setIpReason] = useState("");
  const [welcomeAmountDraft, setWelcomeAmountDraft] = useState<string>(
    () => (cachedSecData?.policy?.welcomeBonusAmountSar !== undefined ? String(cachedSecData.policy.welcomeBonusAmountSar) : "50")
  );
  const [secToast, setSecToast] = useState<string | null>(null);
  const currencyLabel = t("SAR", "ر.س");

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText("https://api.qafnest.com/v1");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSecurity = useCallback(async () => {
    const isSilent = Boolean(cachedSecData !== null);
    if (!isSilent) {
      setSecLoading(true);
    }
    try {
      const [secRes, zatcaRes, metricsRes] = await Promise.all([
        fetch(adminPath(`/api/admin/security/signups?t=${Date.now()}`), { cache: "no-store" }),
        fetch(adminPath("/api/admin/zatca"), { cache: "no-store" }).catch(() => null),
        fetch(adminPath("/api/admin/metrics"), { cache: "no-store" }).catch(() => null),
      ]);

      const zatcaJson = zatcaRes && zatcaRes.ok ? await zatcaRes.json().catch(() => null) : null;
      const metricsOk = Boolean(metricsRes && metricsRes.ok);
      setSystemHealth({
        checked: true,
        apiReachable: metricsOk && secRes.ok,
        zatcaEnv: String(zatcaJson?.config?.environment || "sandbox"),
        zatcaConfigured: Boolean(zatcaJson?.config?.hasBinarySecurityToken || zatcaJson?.config?.vatNumber),
        paymentConfigured: metricsOk,
      });

      if (secRes.ok) {
        const data = await secRes.json();
        const payload: SignupSecurityStoreDoc = {
          policy: data.policy,
          registrations: data.registrations || [],
          blockedIps: data.blockedIps || [],
          blockedDevices: data.blockedDevices || [],
          alerts: data.alerts || [],
        };
        cachedSecData = payload;
        setSecData(payload);
        if (data.policy?.welcomeBonusAmountSar !== undefined) {
          setWelcomeAmountDraft(String(data.policy.welcomeBonusAmountSar));
        }
      }
    } catch {
      setSystemHealth((prev) => ({ ...prev, checked: true, apiReachable: false }));
    } finally {
      if (!isSilent) {
        setSecLoading(false);
      }
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
        if (data.policy?.welcomeBonusAmountSar !== undefined) {
          setWelcomeAmountDraft(String(data.policy.welcomeBonusAmountSar));
        }
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
    <div dir={dir} className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#4F2396] dark:text-purple-300 uppercase tracking-wider">
              {t("System Configuration", "إعدادات النظام")}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-medium text-[10px]">
              {t("Production Ready", "جاهز للإنتاج")}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t("Platform Settings, Welcome Bonus & IP Fraud Guard", "إعدادات المنصة ومكافأة الترحيب وحماية الـ IP")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Centralized settings, single-account-per-device/IP enforcement, and IP block management.",
              "الإعدادات المركزية، وتطبيق سياسة حساب واحد لكل جهاز وعنوان IP، وإدارة الحظر الأمني."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-8 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t("Version v1.0.0", "الإصدار v1.0.0")}</span>
          </span>
        </div>
      </div>

      {/* Grid: 2 Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: System Status & Deployment */}
        <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t("Deployment & Status", "حالة النظام والنشر")}
              </span>
              <Globe size={16} className="text-[#4F2396] dark:text-purple-300" />
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{t("Platform Release:", "إصدار المنصة:")}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  v1.0.0
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{t("Operating Mode:", "وضع التشغيل:")}</span>
                <span className="font-medium text-[#4F2396] dark:text-purple-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {t("Centralized Mode (Kingdom-wide)", "الوضع المركزي (على مستوى المملكة)")}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{t("Backend Health:", "حالة الخادم والواجهة:")}</span>
                <span
                  className={`font-medium flex items-center gap-1 ${
                    !systemHealth.checked
                      ? "text-slate-500 dark:text-slate-400"
                      : systemHealth.apiReachable
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <ShieldCheck size={14} />
                  {!systemHealth.checked
                    ? t("Checking...", "جارٍ الفحص...")
                    : systemHealth.apiReachable
                    ? t("Operational", "يعمل بكفاءة")
                    : t("Degraded", "يحتاج مراجعة")}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="w-full h-8 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <span>
              {copied
                ? t("API Endpoint Copied!", "تم نسخ رابط الـ API!")
                : t("Copy Centralized API Endpoint", "نسخ رابط الـ API المركزي")}
            </span>
          </button>
        </div>

        {/* Card 2: Active Integrations & Gateway */}
        <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t("Gateways & Compliance", "بوابات الدفع والامتثال")}
              </span>
              <Shield size={16} className="text-[#4F2396] dark:text-purple-300" />
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{t("ZATCA Phase 2", "الفوترة الإلكترونية ZATCA")}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {t(`Environment: ${systemHealth.zatcaEnv}`, `البيئة: ${systemHealth.zatcaEnv}`)}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    systemHealth.zatcaConfigured
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                      : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
                  }`}
                >
                  {systemHealth.zatcaConfigured
                    ? t("Configured", "مضبوطة")
                    : t("Check Config", "تحقق من الإعداد")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{t("Supabase PostgreSQL", "قاعدة بيانات Supabase")}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {t("Row-Level Security & Server APIs", "حماية مستوى الصفوف وواجهات الخادم")}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    !systemHealth.checked
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                      : systemHealth.apiReachable
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                      : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                  }`}
                >
                  {!systemHealth.checked
                    ? t("Checking...", "فحص...")
                    : systemHealth.apiReachable
                    ? t("Connected", "متصلة")
                    : t("Offline", "غير متصلة")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{t("Ministry of Tourism (MOT)", "وزارة السياحة السعودية")}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {t("Format Validation & Admin Review", "التحقق من الصيغة والمراجعة اليدوية")}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {t("Manual Review", "مراجعة إدارية")}
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs flex items-center justify-between">
            <span>{t("Compliance Mode:", "وضع الامتثال:")}</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
              {t("Real-time Enforcement", "تطبيق فوري مباشر")}
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Guest Signup Security, 50 SAR Welcome Bonus & IP Blocker */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t(
                  `Guest Signup Anti-Abuse Security & ${secData?.policy.welcomeBonusAmountSar ?? 50} SAR Welcome Bonus Guard`,
                  `حماية التسجيل ومكافأة الترحيب (${secData?.policy.welcomeBonusAmountSar ?? 50} ر.س) ومكافحة التلاعب`
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  `Enforces 1 guest account + ${secData?.policy.welcomeBonusAmountSar ?? 50} SAR platform-borne welcome gift per device & IP. Automatically detects & blocks multi-account signups.`,
                  `يفرض حساباً واحداً + ${secData?.policy.welcomeBonusAmountSar ?? 50} ر.س مكافأة ترحيب لكل جهاز وعنوان IP، ويكتشف ويحظر التسجيل المتكرر تلقائياً.`
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadSecurity()}
            disabled={secLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 h-8 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer self-start shrink-0 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={secLoading ? "animate-spin text-[#4F2396] dark:text-purple-300" : ""} />
            <span>{t("Refresh Logs", "تحديث السجلات")}</span>
          </button>
        </div>

        {secToast && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck size={15} />
            <span>{secToast}</span>
          </div>
        )}

        {secData && (
          <>
            {/* Policy Toggles & Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
              <label className="p-3 rounded-xl bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100 block">
                    {t("1 Account Per Device", "حساب واحد لكل جهاز")}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
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
                  className="h-4 w-4 accent-[#4F2396] shrink-0 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100 block">
                    {t("1 Account Per IP", "حساب واحد لكل IP")}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
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
                  className="h-4 w-4 accent-[#4F2396] shrink-0 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100 block">
                    {t("Auto-Block Repeat IPs", "حظر تلقائي للـ IP المتكرر")}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
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
                  className="h-4 w-4 accent-[#4F2396] shrink-0 cursor-pointer"
                />
              </label>

              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-[#4F2396] dark:text-purple-300 flex items-center gap-1">
                      <Gift size={13} /> {t("Welcome Bonus", "مكافأة الترحيب")}
                    </span>
                    <span className="text-[10px] font-medium text-purple-700 dark:text-purple-400">
                      {secData.registrations.length} {t("granted", "ممنوحة")}
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
                    className="h-4 w-4 accent-[#4F2396] shrink-0 cursor-pointer"
                    title={t("Enable or disable welcome bonus", "تفعيل أو تعطيل مكافأة الترحيب")}
                  />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = Math.max(0, Math.round(Number(welcomeAmountDraft || 0) * 100) / 100);
                    void runSecurityAction({
                      action: "update_policy",
                      policy: { welcomeBonusAmountSar: parsed },
                    });
                  }}
                  className="flex items-center gap-1.5"
                >
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      step="1"
                      value={welcomeAmountDraft}
                      disabled={secBusy || !secData.policy.welcomeBonusEnabled}
                      onChange={(e) => setWelcomeAmountDraft(e.target.value)}
                      className="w-full h-8 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-2.5 pe-10 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396] disabled:opacity-50"
                      aria-label={t("Welcome Bonus Amount (SAR)", "قيمة مكافأة الترحيب (ر.س)")}
                    />
                    <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-purple-500 pointer-events-none">
                      {currencyLabel}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={secBusy || !secData.policy.welcomeBonusEnabled}
                    className="h-8 px-2.5 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white text-[11px] font-medium transition disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                  >
                    {t("Save", "حفظ")}
                  </button>
                </form>
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
                className="md:col-span-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
              />
              <input
                type="text"
                value={ipReason}
                onChange={(e) => setIpReason(e.target.value)}
                placeholder={t(
                  "Reason for blocking IP (e.g. Multi-account abuse)",
                  "سبب حظر عنوان الـ IP (مثال: تكرار الحسابات)"
                )}
                className="md:col-span-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
              />
              <button
                type="submit"
                disabled={secBusy || !ipInput.trim()}
                data-testid="manual-block-ip-btn"
                className="md:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Ban size={14} />
                <span>{t("Block IP Address", "حظر عنوان الـ IP")}</span>
              </button>
            </form>

            {/* Blocked IPs & Security Alerts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Blocked IPs List */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Globe size={14} className="text-rose-600" />
                    {t(`Blocked IPs (${secData.blockedIps.length})`, `عناوين الـ IP المحظورة (${secData.blockedIps.length})`)}
                  </span>
                </div>
                {secData.blockedIps.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 py-2">
                    {t("No blocked IP addresses right now.", "لا توجد عناوين IP محظورة حالياً.")}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {secData.blockedIps.map((b) => (
                      <div key={b.value} className="p-2.5 rounded-lg bg-white dark:bg-[#0E0D16] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 block" dir="ltr">{b.value}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{b.reason}</span>
                        </div>
                        <button
                          type="button"
                          disabled={secBusy}
                          onClick={() => void runSecurityAction({ action: "clear_ip_lock", ip: b.value })}
                          className="shrink-0 inline-flex items-center gap-1 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium px-2.5 py-1 text-[11px] cursor-pointer"
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
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-amber-600" />
                    {t(
                      `Flagged Duplicate Account Attempts (${secData.alerts.length})`,
                      `محاولات تكرار الحسابات المرصودة (${secData.alerts.length})`
                    )}
                  </span>
                </div>
                {secData.alerts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 py-2">
                    {t("No multi-account abuse attempts detected yet.", "لم يتم رصد أي محاولات تعدد حسابات حتى الآن.")}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {secData.alerts.slice(0, 15).map((a) => (
                      <div key={a.id} className="p-2.5 rounded-lg bg-white dark:bg-[#0E0D16] border border-slate-200/80 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-medium text-slate-900 dark:text-slate-100" dir="ltr">{a.ip}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                            {a.actionTaken.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{a.reason}</p>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block" dir="ltr">
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
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-2 bg-slate-50/30 dark:bg-slate-900/30 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  {t(
                    `Verified Device & IP Welcome Bonus Registry (${secData.registrations.length})`,
                    `سجل الأجهزة وعناوين الـ IP المستفيدة من مكافأة الترحيب (${secData.registrations.length})`
                  )}
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {secData.registrations.slice(0, 15).map((r) => (
                    <div key={r.id} className="p-2 rounded-lg bg-white dark:bg-[#0E0D16] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{r.email || r.phone || r.userId}</span>
                        <span className="text-slate-400 dark:text-slate-500 ms-2 font-mono" dir="ltr">
                          IP: {r.ip} • {t("Device:", "الجهاز:")} {r.deviceId.slice(0, 16)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          +{r.welcomeBonusAmount} {currencyLabel}
                        </span>
                        <button
                          type="button"
                          disabled={secBusy}
                          onClick={() => void runSecurityAction({ action: "clear_ip_lock", ip: r.ip })}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400 hover:text-[#4F2396] cursor-pointer"
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

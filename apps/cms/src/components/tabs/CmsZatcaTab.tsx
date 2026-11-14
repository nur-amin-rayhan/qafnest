"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Key,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Activity,
  Hash,
  ShieldCheck,
  Server,
  RefreshCw,
  QrCode,
  Check,
} from "lucide-react";
import type { ZatcaConfig, ZatcaEnvironment } from "@qafnest/shared";

import { cmsPath } from "@/lib/cmsUrl";
interface CmsZatcaTabProps {
  t: (en: string, ar: string) => string;
}

export function CmsZatcaTab({ t }: CmsZatcaTabProps) {
  const [config, setConfig] = useState<ZatcaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [sendingTestInvoice, setSendingTestInvoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [environment, setEnvironment] = useState<ZatcaEnvironment>("sandbox");
  const [portalUrl, setPortalUrl] = useState("");
  const [sellerNameAr, setSellerNameAr] = useState("");
  const [sellerNameEn, setSellerNameEn] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [csidToken, setCsidToken] = useState("");
  const [csidSecret, setCsidSecret] = useState("");
  const [egsSerialNumber, setEgsSerialNumber] = useState("");
  const [autoReport, setAutoReport] = useState(true);

  // Live test & audit log state
  const [onboarding, setOnboarding] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<{
    type: "handshake" | "invoice" | "onboard";
    success: boolean;
    data: any;
    timestamp: string;
  } | null>(null);

  const fetchConfig = () => {
    setLoading(true);
    fetch(cmsPath("/api/admin/zatca"))
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          const cfg = data.config as ZatcaConfig;
          setConfig(cfg);
          setEnvironment(cfg.environment || "sandbox");
          setPortalUrl(cfg.portalUrl || "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal");
          setSellerNameAr(cfg.sellerNameAr || "شركة منصة قاف نست للضيافة ذ.م.م");
          setSellerNameEn(cfg.sellerNameEn || "QafNest Hospitality Platform LLC");
          setVatNumber(cfg.vatNumber || "310123456700003");
          setCrNumber(cfg.crNumber || "1010648921");
          setLicenseNumber(cfg.licenseNumber || "73102999");
          setOtp(cfg.otp || "123345");
          setCsidToken(cfg.csidToken || "");
          setCsidSecret(cfg.csidSecret || "");
          setEgsSerialNumber(cfg.egsSerialNumber || "QAFNEST-EGS-RIYADH-01");
          setAutoReport(cfg.autoReport ?? true);
        }
        if (Array.isArray(data?.recentInvoices)) {
          setRecentInvoices(data.recentInvoices);
        }
      })
      .catch((err) => {
        console.error("Failed to load ZATCA config:", err);
        setErrorMsg("Failed to connect to local configuration store.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleEnvironmentChange = (env: ZatcaEnvironment) => {
    setEnvironment(env);
    if (env === "sandbox") {
      setPortalUrl("https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal");
    } else if (env === "simulation") {
      setPortalUrl("https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation");
    } else {
      setPortalUrl("https://gw-fatoora.zatca.gov.sa/e-invoicing/core");
    }
  };

  const handleOnboardCsid = async () => {
    setOnboarding(true);
    setErrorMsg(null);
    try {
      const res = await fetch(cmsPath("/api/admin/zatca"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "onboard_csid",
          configOverride: {
            environment,
            portalUrl: portalUrl.trim(),
            otp: otp.trim() || "123345",
            vatNumber: vatNumber.trim(),
            sellerNameEn: sellerNameEn.trim(),
            sellerNameAr: sellerNameAr.trim(),
            egsSerialNumber: egsSerialNumber.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to onboard CSID with ZATCA API");
      }
      setTestResult({
        type: "onboard",
        success: true,
        data,
        timestamp: new Date().toLocaleTimeString(),
      });
      fetchConfig();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "CSID onboarding failed");
    } finally {
      setOnboarding(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      const payload: Partial<ZatcaConfig> = {
        environment,
        portalUrl: portalUrl.trim(),
        sellerNameAr: sellerNameAr.trim(),
        sellerNameEn: sellerNameEn.trim(),
        vatNumber: vatNumber.trim(),
        crNumber: crNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        otp: otp.trim(),
        csidToken: csidToken.trim(),
        csidSecret: csidSecret.trim(),
        egsSerialNumber: egsSerialNumber.trim(),
        autoReport,
      };

      const res = await fetch(cmsPath("/api/admin/zatca"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_config", config: payload }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to save configuration");
      }

      setConfig(data.config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving ZATCA settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestHandshake = async () => {
    setTestingHandshake(true);
    setErrorMsg(null);
    try {
      const res = await fetch(cmsPath("/api/admin/zatca"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_handshake",
          configOverride: {
            environment,
            portalUrl: portalUrl.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data?.handshake) {
        setTestResult({
          type: "handshake",
          success: data.handshake.connected,
          data: data.handshake,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Handshake probe failed");
    } finally {
      setTestingHandshake(false);
    }
  };

  const handleSendTestInvoice = async () => {
    setSendingTestInvoice(true);
    setErrorMsg(null);
    try {
      const res = await fetch(cmsPath("/api/admin/zatca"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report_test_invoice",
        }),
      });
      const data = await res.json();
      if (data?.result) {
        setTestResult({
          type: "invoice",
          success: data.result.clearanceStatus === "REPORTED",
          data: data.result,
          timestamp: new Date().toLocaleTimeString(),
        });
        // Refresh local counter state
        fetchConfig();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Test invoice transmission failed");
    } finally {
      setSendingTestInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin text-teal-400 mr-2" />
        <span>{t("Loading ZATCA Phase 2 E-Invoicing configuration...", "جاري تحميل إعدادات الفوترة الإلكترونية...")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0A101D] to-purple-950/30 border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>{t("Saudi ZATCA Fatoorah Phase 2", "هيئة الزكاة والضريبة والجمارك - المرحلة الثانية")}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            {t("ZATCA E-Invoicing & API Synchronization", "إدارة وتكامل بوابات الفوترة الإلكترونية (زاتكا)")}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            {t(
              "Configure ZATCA Phase 2 test and production API credentials, synchronize CSID keys, test gateway connectivity, and manage real-time automated tax invoice reporting.",
              "ضبط واختبار مفاتيح الربط مع بوابة زاتكا التجريبية (Sandbox) والإنتاجية، وتحديث شهادات التشفير CSID، وإرسال الفواتير الضريبية المبسطة."
            )}
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t("Phase 2 Compliant", "متوافق مع المرحلة الثانية")}</span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t("ZATCA API settings saved and synchronized across all ecosystem apps!", "تم حفظ ومزامنة إعدادات زاتكا بنجاح عبر النظام كامل!")}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Device & Compliance Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 font-bold">
            <span>{t("EGS Device Serial", "الرقم التسلسلي للجهاز")}</span>
            <Server className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="font-mono font-bold text-white text-xs truncate">{egsSerialNumber}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 font-bold">
            <span>{t("Current ICV Counter", "عداد الفواتير التراكمي (ICV)")}</span>
            <Hash className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="font-mono font-black text-lg text-purple-300">{config?.currentIcv ?? 0}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 font-bold">
            <span>{t("Total Reported Invoices", "إجمالي الفواتير المرسلة")}</span>
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="font-mono font-black text-lg text-emerald-400">{config?.totalReportedCount ?? 0}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 font-bold">
            <span>{t("ZATCA Environment", "بيئة البوابة النشطة")}</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="font-bold text-amber-300 capitalize">{environment} Portal</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Environment Selection */}
        <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-400" />
            <span>{t("1. Target Gateway Environment", "١. بيئة بوابة الربط")}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Developer Portal (Sandbox) */}
            <div
              onClick={() => handleEnvironmentChange("sandbox")}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                environment === "sandbox"
                  ? "bg-teal-500/10 border-teal-500/50 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-xs text-white">
                  {t("Developer Portal (Test API)", "بوابة المطورين (Sandbox)")}
                </span>
                {environment === "sandbox" && <Check className="w-4 h-4 text-teal-400" />}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {t(
                  "Official ZATCA sandbox for compliance testing and API verification before going live.",
                  "البيئة التجريبية الرسمية لاختبار التحقق من صحة الفواتير ورموز الاستجابة السريعة."
                )}
              </p>
            </div>

            {/* Simulation Sandbox */}
            <div
              onClick={() => handleEnvironmentChange("simulation")}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                environment === "simulation"
                  ? "bg-teal-500/10 border-teal-500/50 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-xs text-white">
                  {t("Simulation Sandbox", "بيئة المحاكاة (Simulation)")}
                </span>
                {environment === "simulation" && <Check className="w-4 h-4 text-teal-400" />}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {t(
                  "Pre-production simulation gateway mimicking live production endpoints and response payloads.",
                  "بيئة محاكاة تطابق بيئة الإنتاج الفعلية لاختبار شهادات CSID المعتمدة."
                )}
              </p>
            </div>

            {/* Production Core */}
            <div
              onClick={() => handleEnvironmentChange("production")}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                environment === "production"
                  ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-xs text-white">
                  {t("Live Production Core", "الإنتاج الفعلي (Live Production)")}
                </span>
                {environment === "production" && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {t(
                  "Real-world production reporting to Saudi Zakat, Tax and Customs Authority.",
                  "البوابة الإنتاجية الفعلية لإرسال الفواتير الضريبية الحقيقية لهيئة الزكاة والضريبة."
                )}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              {t("Gateway Endpoint URL", "رابط البوابة الإلكترونية")}
            </label>
            <input
              type="text"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-hidden focus:border-teal-500"
              placeholder="https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal"
            />
          </div>
        </div>

        {/* Section 2: API Credentials & Authentication */}
        <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>{t("2. ZATCA API Credentials & CSID Keys", "٢. مفاتيح الاعتماد وشهادات التشفير (CSID)")}</span>
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                csidToken && csidSecret
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  csidToken && csidSecret ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                }`}
              />
              <span>
                {csidToken && csidSecret
                  ? t("Live CSID Active", "شهادة CSID مفعلة")
                  : t("Needs CSID Onboarding", "يتطلب إصدار شهادة CSID")}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("Portal OTP (One-Time Password)", "رمز التحقق OTP الخاص بالبوابة")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500"
                  placeholder="123345"
                />
                <button
                  type="button"
                  onClick={handleOnboardCsid}
                  disabled={onboarding}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {onboarding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>{t("Onboard CSID", "تفعيل الشهادة")}</span>
                </button>
              </div>
              <span className="text-[11px] text-gray-500 mt-1 block">
                {t("Use OTP 123345 for ZATCA Developer Portal Sandbox, or portal OTP for Simulation/Prod.", "استخدم الرمز 123345 للبيئة التجريبية، أو رمز بوابة فاتورة لبيئة الإنتاج.")}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("EGS Solution Serial Number", "الرقم التسلسلي لوحدة الحل (EGS)")}
              </label>
              <input
                type="text"
                value={egsSerialNumber}
                onChange={(e) => setEgsSerialNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500"
                placeholder="QAFNEST-EGS-RIYADH-01"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("Compliance CSID Token / Binary Security Token", "شهادة أو رمز CSID (Binary Security Token)")}
              </label>
              <input
                type="password"
                value={csidToken}
                onChange={(e) => setCsidToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500"
                placeholder="QAFNEST_ZATCA_SANDBOX_CSID_TOKEN_2026"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("CSID Private Key / API Secret", "المفتاح الخاص بالشهادة (Secret Key)")}
              </label>
              <input
                type="password"
                value={csidSecret}
                onChange={(e) => setCsidSecret(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500"
                placeholder="••••••••••••••••••••••••"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">
                {t("Automated Real-Time Reporting", "الإرسال التلقائي الفوري للفواتير")}
              </span>
              <p className="text-[11px] text-gray-400">
                {t(
                  "Automatically submit B2C simplified tax invoices to ZATCA API whenever a guest completes a booking.",
                  "إرسال الفواتير المبسطة فورياً إلى زاتكا عند تأكيد أي حجز مدفوع من الضيف."
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoReport(!autoReport)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                autoReport ? "bg-teal-500 justify-end" : "bg-gray-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>

        {/* Section 3: Official Saudi Organization & Tax Registration */}
        <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>{t("3. Organization Legal & Tax Registration", "٣. البيانات الضريبية والتجارية الرسمية")}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("Legal Entity Name (Arabic)", "اسم المنشأة القانوني (بالعربي)")}
              </label>
              <input
                type="text"
                value={sellerNameAr}
                onChange={(e) => setSellerNameAr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-hidden focus:border-teal-500"
                placeholder="شركة منصة قاف نست للضيافة ذ.م.م"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("Legal Entity Name (English)", "اسم المنشأة القانوني (بالإنجليزي)")}
              </label>
              <input
                type="text"
                value={sellerNameEn}
                onChange={(e) => setSellerNameEn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-hidden focus:border-teal-500"
                placeholder="QafNest Hospitality Platform LLC"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("VAT Registration Number (15 digits)", "الرقم الضريبي (١٥ رقماً)")}
              </label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500"
                placeholder="310123456700003"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("Commercial Registration (CR) Number (10 digits)", "رقم السجل التجاري (١٠ أرقام)")}
              </label>
              <input
                type="text"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500"
                placeholder="1010648921"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("Ministry of Tourism License", "ترخيص وزارة السياحة")}
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500"
                placeholder="73102999"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("National Standard VAT Rate", "نسبة ضريبة القيمة المضافة")}
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-gray-300 font-bold font-mono">
                15% (Standard Saudi Rate)
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Interactive Test Triggers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Test Handshake Button */}
            <button
              type="button"
              onClick={handleTestHandshake}
              disabled={testingHandshake}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {testingHandshake ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 text-purple-400" />
              )}
              <span>{t("Test ZATCA API Handshake", "اختبار الاتصال ببوابة زاتكا")}</span>
            </button>

            {/* Send Test Invoice Button */}
            <button
              type="button"
              onClick={handleSendTestInvoice}
              disabled={sendingTestInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {sendingTestInvoice ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-emerald-400" />
              )}
              <span>{t("Send Test Invoice to ZATCA", "إرسال فاتورة تجريبية للبوابة")}</span>
            </button>
          </div>

          {/* Save Configuration Button */}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-black shadow-lg shadow-teal-500/20 transition cursor-pointer disabled:opacity-50 ml-auto"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{t("Save & Synchronize Config", "حفظ ومزامنة الإعدادات")}</span>
          </button>
        </div>
      </form>

      {/* Live Interactive Test Response Inspector */}
      {testResult && (
        <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span
                className={`w-2 h-2 rounded-full ${testResult.success ? "bg-emerald-400" : "bg-rose-400"}`}
              />
              <span className="text-white">
                {testResult.type === "handshake"
                  ? t("ZATCA Gateway Handshake Result", "نتيجة اختبار الاتصال بالبوابة")
                  : testResult.type === "onboard"
                  ? t("ZATCA Compliance CSID Issued", "تم إصدار وتفعيل شهادة CSID بنجاح")
                  : t("Test Invoice Clearance & Verification", "نتيجة اعتماد الفاتورة التجريبية")}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">{testResult.timestamp}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 font-mono text-[11px] text-gray-300 overflow-x-auto space-y-1">
            {testResult.type === "onboard" && (
              <>
                <div>
                  <span className="text-gray-500">Request ID:</span>{" "}
                  <span className="text-white font-bold">{testResult.data.requestID}</span>
                </div>
                <div>
                  <span className="text-gray-500">Disposition:</span>{" "}
                  <span className="text-emerald-400 font-bold">{testResult.data.dispositionMessage}</span>
                </div>
                <div>
                  <span className="text-gray-500">Portal URL:</span> {testResult.data.portalUrl}
                </div>
                <div className="text-emerald-300 font-sans mt-2">
                  {t(
                    "ECDSA secp256k1 Private Key, X.509 Binary Security Token, and API Secret have been stored and synchronized across all portals.",
                    "تم حفظ المفتاح الخاص وشهادة التشفير CSID ومزامنتها عبر جميع البوابات."
                  )}
                </div>
              </>
            )}

            {testResult.type === "handshake" && (
              <>
                <div>
                  <span className="text-gray-500">Gateway URL:</span> {testResult.data.gatewayUrl}
                </div>
                <div>
                  <span className="text-gray-500">HTTP Status:</span>{" "}
                  <span className="text-emerald-400 font-bold">{testResult.data.httpStatus}</span>
                </div>
                <div>
                  <span className="text-gray-500">CSID Authenticated:</span>{" "}
                  <span className={testResult.data.authenticated ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {testResult.data.authenticated ? "YES" : "NO"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Roundtrip Latency:</span> {testResult.data.latencyMs}ms
                </div>
                <div>
                  <span className="text-gray-500">Server:</span> {testResult.data.server}
                </div>
                <div className="text-emerald-300 font-sans mt-2">{testResult.data.message}</div>
              </>
            )}

            {testResult.type === "invoice" && (
              <>
                <div>
                  <span className="text-gray-500">Invoice Number:</span>{" "}
                  <span className="text-white font-bold">{testResult.data.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Gateway Endpoint:</span>{" "}
                  <span className="text-gray-300">{testResult.data.gateway?.gatewayEndpoint}</span>
                </div>
                <div>
                  <span className="text-gray-500">HTTP Status:</span>{" "}
                  <span className={testResult.data.gateway?.httpStatus === 200 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {testResult.data.gateway?.httpStatus}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Clearance Status:</span>{" "}
                  <span className={testResult.data.clearanceStatus === "REPORTED" || testResult.data.clearanceStatus === "CLEARED" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {testResult.data.clearanceStatus}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Invoice Hash (SHA-256):</span>{" "}
                  <span className="text-purple-300 break-all">{testResult.data.invoiceHash}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                  <span className="text-xs font-bold text-white font-sans block mb-1">
                    {t("ZATCA API Validation Results:", "نتائج فحص بوابة زاتكا:")}
                  </span>
                  {testResult.data.validationResults?.infoMessages?.map((msg: any, i: number) => (
                    <div key={`i-${i}`} className="text-emerald-400 flex items-center gap-1.5 font-sans">
                      <Check className="w-3 h-3 shrink-0" />
                      <span>[{msg.code}] {msg.message}</span>
                    </div>
                  ))}
                  {testResult.data.validationResults?.warningMessages?.map((msg: any, i: number) => (
                    <div key={`w-${i}`} className="text-amber-300 flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>[{msg.code}] {msg.message}</span>
                    </div>
                  ))}
                  {testResult.data.validationResults?.errorMessages?.map((msg: any, i: number) => (
                    <div key={`e-${i}`} className="text-rose-400 flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>[{msg.code}] {msg.message}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent ZATCA API Transmissions Audit Ledger */}
      <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>{t("Recent ZATCA API Invoice Transmissions", "سجل الفواتير المرسلة إلى بوابة زاتكا")}</span>
          </h3>
          <button
            type="button"
            onClick={fetchConfig}
            className="text-[11px] font-bold text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{t("Refresh", "تحديث")}</span>
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <p className="text-xs text-gray-500">
            {t(
              "No invoices transmitted yet in this audit ledger. Complete a booking/top-up or click 'Send Test Invoice to ZATCA' above.",
              "لا توجد فواتير مسجلة حتى الآن. قم بإتمام حجز أو إرسال فاتورة تجريبية."
            )}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-2 pr-3">{t("Invoice", "الفاتورة")}</th>
                  <th className="py-2 pr-3">{t("ICV", "ICV")}</th>
                  <th className="py-2 pr-3">{t("Total (SAR)", "الإجمالي")}</th>
                  <th className="py-2 pr-3">{t("HTTP", "الحالة")}</th>
                  <th className="py-2 pr-3">{t("ZATCA Status", "اعتماد زاتكا")}</th>
                  <th className="py-2">{t("Timestamp", "الوقت")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {recentInvoices.slice(0, 10).map((inv) => (
                  <tr key={inv.uuid} className="hover:bg-white/5">
                    <td className="py-2.5 pr-3 text-white font-bold">{inv.invoiceNumber}</td>
                    <td className="py-2.5 pr-3 text-purple-300">#{inv.icv}</td>
                    <td className="py-2.5 pr-3 text-gray-200">{Number(inv.totalWithVat).toFixed(2)} SAR</td>
                    <td className="py-2.5 pr-3">
                      <span className={inv.httpStatus === 200 ? "text-emerald-400" : "text-rose-400"}>
                        {inv.httpStatus}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.clearanceStatus === "REPORTED" || inv.clearanceStatus === "CLEARED"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        {inv.clearanceStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-400">
                      {inv.reportedAt ? new Date(inv.reportedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

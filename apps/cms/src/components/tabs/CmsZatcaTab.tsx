"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  FileCheck2,
  Hash,
  Key,
  RefreshCw,
  Save,
  Send,
  Server,
  ShieldCheck,
} from "lucide-react";
import type { ZatcaConfig, ZatcaEnvironment } from "@qafnest/shared";
import { cmsPath } from "@/lib/cmsUrl";
import {
  ZatcaRecentLedger,
  ZatcaTestInspector,
  type ZatcaTestResultState,
} from "./zatca/ZatcaTestInspectorAndLedger";

const ENV_CARDS: Array<{
  id: ZatcaEnvironment;
  portalUrl: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  activeClass: string;
  checkClass: string;
}> = [
  {
    id: "sandbox",
    portalUrl: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
    titleEn: "Developer Portal (Test API)",
    titleAr: "بوابة المطورين (Sandbox)",
    descEn: "Official ZATCA sandbox for compliance testing and API verification before going live.",
    descAr: "البيئة التجريبية الرسمية لاختبار التحقق من صحة الفواتير ورموز الاستجابة السريعة.",
    activeClass: "bg-teal-500/10 border-teal-500/50 text-white",
    checkClass: "text-teal-400",
  },
  {
    id: "simulation",
    portalUrl: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
    titleEn: "Simulation Sandbox",
    titleAr: "بيئة المحاكاة (Simulation)",
    descEn: "Pre-production simulation gateway mimicking live production endpoints and response payloads.",
    descAr: "بيئة محاكاة تطابق بيئة الإنتاج الفعلية لاختبار شهادات CSID المعتمدة.",
    activeClass: "bg-teal-500/10 border-teal-500/50 text-white",
    checkClass: "text-teal-400",
  },
  {
    id: "production",
    portalUrl: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
    titleEn: "Live Production Core",
    titleAr: "الإنتاج الفعلي (Live Production)",
    descEn: "Real-world production reporting to Saudi Zakat, Tax and Customs Authority.",
    descAr: "البوابة الإنتاجية الفعلية لإرسال الفواتير الضريبية الحقيقية لهيئة الزكاة والضريبة.",
    activeClass: "bg-emerald-500/10 border-emerald-500/50 text-white",
    checkClass: "text-emerald-400",
  },
];

export function CmsZatcaTab({ t }: { t: (en: string, ar: string) => string }) {
  const [config, setConfig] = useState<ZatcaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [sendingTestInvoice, setSendingTestInvoice] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<ZatcaTestResultState | null>(null);

  const fetchConfig = () => {
    setLoading(true);
    fetch(cmsPath("/api/admin/zatca"))
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          const cfg = data.config as ZatcaConfig;
          setConfig(cfg);
          setEnvironment(cfg.environment || "sandbox");
          setPortalUrl(cfg.portalUrl || ENV_CARDS[0].portalUrl);
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
        if (Array.isArray(data?.recentInvoices)) setRecentInvoices(data.recentInvoices);
      })
      .catch(() => setErrorMsg("Failed to connect to local configuration store."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleEnvironmentChange = (env: ZatcaEnvironment) => {
    setEnvironment(env);
    setPortalUrl(ENV_CARDS.find((c) => c.id === env)?.portalUrl || ENV_CARDS[0].portalUrl);
  };

  const postZatcaAction = async (payload: Record<string, unknown>) => {
    const res = await fetch(cmsPath("/api/admin/zatca"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, data: await res.json() };
  };

  const handleOnboardCsid = async () => {
    setOnboarding(true);
    setErrorMsg(null);
    try {
      const { ok, data } = await postZatcaAction({
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
      });
      if (!ok || !data.success) throw new Error(data?.error || "Failed to onboard CSID with ZATCA API");
      setTestResult({ type: "onboard", success: true, data, timestamp: new Date().toLocaleTimeString() });
      fetchConfig();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "CSID onboarding failed");
    } finally {
      setOnboarding(false);
    }
  };

  const handleUpgradeProductionCsid = async () => {
    setOnboarding(true);
    setErrorMsg(null);
    try {
      const { ok, data } = await postZatcaAction({ action: "upgrade_production_csid" });
      if (!ok || !data.success) throw new Error(data?.error || "Failed to upgrade to Production CSID");
      setTestResult({ type: "onboard", success: true, data, timestamp: new Date().toLocaleTimeString() });
      fetchConfig();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Production CSID upgrade failed");
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
      const { ok, data } = await postZatcaAction({
        action: "save_config",
        config: {
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
        },
      });
      if (!ok || !data.success) throw new Error(data?.error || "Failed to save configuration");
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
      const { data } = await postZatcaAction({
        action: "test_handshake",
        configOverride: { environment, portalUrl: portalUrl.trim() },
      });
      if (data?.handshake) {
        setTestResult({ type: "handshake", success: data.handshake.connected, data: data.handshake, timestamp: new Date().toLocaleTimeString() });
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
      const { data } = await postZatcaAction({ action: "report_test_invoice" });
      if (data?.result) {
        const st = String(data.result.clearanceStatus || "").toUpperCase();
        setTestResult({
          type: "invoice",
          success: st === "REPORTED" || st === "CLEARED",
          data: data.result,
          timestamp: new Date().toLocaleTimeString(),
        });
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
            {t("Configure ZATCA Phase 2 test and production API credentials, synchronize CSID keys, test gateway connectivity, and manage real-time automated tax invoice reporting.", "ضبط واختبار مفاتيح الربط مع بوابة زاتكا التجريبية (Sandbox) والإنتاجية، وتحديث شهادات التشفير CSID، وإرسال الفواتير الضريبية المبسطة.")}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t("Phase 2 Compliant", "متوافق مع المرحلة الثانية")}</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t("ZATCA API settings saved and synchronized across all ecosystem apps!", "تم حفظ ومزامنة إعدادات زاتكا بنجاح عبر النظام كامل!")}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

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
        <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-400" />
            <span>{t("1. Target Gateway Environment", "١. بيئة بوابة الربط")}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ENV_CARDS.map((card) => (
              <div
                key={card.id}
                onClick={() => handleEnvironmentChange(card.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  environment === card.id ? card.activeClass : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs text-white">{t(card.titleEn, card.titleAr)}</span>
                  {environment === card.id && <Check className={`w-4 h-4 ${card.checkClass}`} />}
                </div>
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{t(card.descEn, card.descAr)}</p>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">{t("Gateway Endpoint URL", "رابط البوابة الإلكترونية")}</label>
            <input
              type="text"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>{t("2. ZATCA API Credentials & CSID Keys", "٢. مفاتيح الاعتماد وشهادات التشفير (CSID)")}</span>
            </h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${csidToken && csidSecret ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${csidToken && csidSecret ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
              <span>{csidToken && csidSecret ? t("Live CSID Active", "شهادة CSID مفعلة") : t("Needs CSID Onboarding", "يتطلب إصدار شهادة CSID")}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">{t("Portal OTP (One-Time Password)", "رمز التحقق OTP الخاص بالبوابة")}</label>
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
                {csidToken && csidSecret && (
                  <button
                    type="button"
                    onClick={handleUpgradeProductionCsid}
                    disabled={onboarding}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    title={t("Upgrade Compliance CSID to Production CSID", "ترقية شهادة الامتثال إلى شهادة الإنتاج")}
                  >
                    <span>{t("Production CSID", "ترقية للإنتاج")}</span>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">{t("EGS Solution Serial Number", "الرقم التسلسلي لوحدة الحل (EGS)")}</label>
              <input type="text" value={egsSerialNumber} onChange={(e) => setEgsSerialNumber(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("Compliance CSID Token / Binary Security Token", "شهادة أو رمز CSID (Binary Security Token)")}
                {otp === "__CONFIGURED__" || csidSecret === "__CONFIGURED__" ? (
                  <span className="ml-2 text-[10px] text-emerald-400 font-bold">({t("Secret stored", "محفوظ")})</span>
                ) : null}
              </label>
              <input type="password" value={csidToken} onChange={(e) => setCsidToken(e.target.value)} placeholder={csidToken ? "Saved — enter new to replace" : ""} className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">
                {t("CSID Private Key / API Secret", "المفتاح الخاص بالشهادة (Secret Key)")}
                {csidSecret === "__CONFIGURED__" && (
                  <span className="ml-2 text-[10px] text-emerald-400 font-bold">({t("Stored securely", "محفوظ بأمان")})</span>
                )}
              </label>
              <input type="password" value={csidSecret} onChange={(e) => setCsidSecret(e.target.value)} placeholder={csidSecret === "__CONFIGURED__" ? "Saved — leave unchanged to preserve" : ""} className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-white focus:outline-hidden focus:border-teal-500" />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">{t("Automated Real-Time Reporting", "الإرسال التلقائي الفوري للفواتير")}</span>
              <p className="text-[11px] text-gray-400">{t("Automatically submit B2C simplified tax invoices to ZATCA API whenever a guest completes a booking.", "إرسال الفواتير المبسطة فورياً إلى زاتكا عند تأكيد أي حجز مدفوع من الضيف.")}</p>
            </div>
            <button
              type="button"
              onClick={() => setAutoReport(!autoReport)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${autoReport ? "bg-teal-500 justify-end" : "bg-gray-700 justify-start"}`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>{t("3. Organization Legal & Tax Registration", "٣. البيانات الضريبية والتجارية الرسمية")}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { labelEn: "Legal Entity Name (Arabic)", labelAr: "اسم المنشأة القانوني (بالعربي)", value: sellerNameAr, onChange: setSellerNameAr, mono: false },
              { labelEn: "Legal Entity Name (English)", labelAr: "اسم المنشأة القانوني (بالإنجليزي)", value: sellerNameEn, onChange: setSellerNameEn, mono: false },
              { labelEn: "VAT Registration Number (15 digits)", labelAr: "الرقم الضريبي (١٥ رقماً)", value: vatNumber, onChange: setVatNumber, mono: true },
              { labelEn: "Commercial Registration (CR) Number (10 digits)", labelAr: "رقم السجل التجاري (١٠ أرقام)", value: crNumber, onChange: setCrNumber, mono: true },
              { labelEn: "Ministry of Tourism License", labelAr: "ترخيص وزارة السياحة", value: licenseNumber, onChange: setLicenseNumber, mono: true },
            ].map((field) => (
              <div key={field.labelEn}>
                <label className="block font-semibold text-gray-300 mb-1.5">{t(field.labelEn, field.labelAr)}</label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-hidden focus:border-teal-500 ${field.mono ? "font-mono" : ""}`}
                />
              </div>
            ))}
            <div>
              <label className="block font-semibold text-gray-300 mb-1.5">{t("National Standard VAT Rate", "نسبة ضريبة القيمة المضافة")}</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-gray-300 font-bold font-mono">
                15% (Standard Saudi Rate)
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestHandshake}
              disabled={testingHandshake}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {testingHandshake ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4 text-purple-400" />}
              <span>{t("Test ZATCA API Handshake", "اختبار الاتصال ببوابة زاتكا")}</span>
            </button>
            <button
              type="button"
              onClick={handleSendTestInvoice}
              disabled={sendingTestInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {sendingTestInvoice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-emerald-400" />}
              <span>{t("Send Test Invoice to ZATCA", "إرسال فاتورة تجريبية للبوابة")}</span>
            </button>
          </div>
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

      {testResult && <ZatcaTestInspector testResult={testResult} t={t} />}
      <ZatcaRecentLedger recentInvoices={recentInvoices} onRefresh={fetchConfig} t={t} />
    </div>
  );
}

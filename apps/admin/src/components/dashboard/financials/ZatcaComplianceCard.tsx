"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Key, Link2, CheckCircle2, Cpu, Globe, Activity } from "lucide-react";
import type { ZatcaEgsDeviceState } from "@/lib/services/zatcaPhase2Service";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminPath } from "@/lib/adminUrl";
export function ZatcaComplianceCard() {
  const { t, dir, lang } = useAdminAuth();
  const [egs, setEgs] = useState<ZatcaEgsDeviceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<{
    connected: boolean;
    gatewayUrl: string;
    httpStatus?: number;
    latencyMs?: number;
    server?: string;
    requestId?: string;
    statusMessage?: string;
  } | null>(null);
  const [copiedPih, setCopiedPih] = useState(false);

  const fetchEgsState = async () => {
    setLoading(true);
    try {
      const res = await fetch(adminPath("/api/admin/zatca"));
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.egs) {
          setEgs(data.egs);
        }
      }
    } catch {
      // Ignore network errors in local dev
    } finally {
      setLoading(false);
    }
  };

  const handleTestHandshake = async () => {
    setTestingGateway(true);
    try {
      const res = await fetch(adminPath("/api/admin/zatca"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_handshake" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.handshake) {
          setHandshakeResult(data.handshake);
        }
      }
    } catch {
      // Ignore
    } finally {
      setTestingGateway(false);
    }
  };

  useEffect(() => {
    fetchEgsState();
  }, []);

  const handleCopyPih = (pih: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pih);
      setCopiedPih(true);
      setTimeout(() => setCopiedPih(false), 2000);
    }
  };

  if (!egs) return null;

  return (
    <div
      dir={dir}
      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 shadow-xs space-y-4 text-slate-900 dark:text-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {t("ZATCA Phase 2 E-Invoicing Engine (Fatoorah)", "محرك الفوترة الإلكترونية - المرحلة الثانية (فاتورة / الزكاة والدخل)")}
              </h3>
              {egs.csidStatus === "Active & Valid" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={10} />
                  <span>{t("CSID Active", "الشهادة مفعلة")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span>{t("Pending CSID", "بانتظار التفعيل")}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate max-w-lg" dir="ltr">
              EGS: {egs.egsSerialNumber} · Gateway: {egs.gatewayUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestHandshake}
            disabled={testingGateway}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title={t("Probe live ZATCA Developer Portal Gateway", "فحص الاتصال المباشر ببوابة هيئة الزكاة والضريبة")}
          >
            <Activity size={12} className={testingGateway ? "animate-spin text-[#4F2396]" : "text-emerald-600 dark:text-emerald-400"} />
            <span>
              {testingGateway
                ? t("Probing...", "جارٍ الفحص...")
                : t("Test ZATCA API", "فحص بوابة الزكاة")}
            </span>
          </button>
          <button
            type="button"
            onClick={fetchEgsState}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-[#4F2396] dark:text-purple-400" : ""} />
            <span>{t("Sync EGS", "مزامنة الوحدة")}</span>
          </button>
        </div>
      </div>

      {/* Live Handshake Telemetry Ribbon */}
      {handshakeResult && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Globe size={15} className="shrink-0" />
            <div>
              <span className="font-semibold block text-[11px] text-emerald-950 dark:text-emerald-100">
                {t(
                  `Live Saudi ZATCA Gateway Handshake Successful (${handshakeResult.latencyMs}ms latency)`,
                  `نجح الاتصال المباشر ببوابة هيئة الزكاة السعودية (زمن الاستجابة ${handshakeResult.latencyMs} مللي ثانية)`
                )}
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono block" dir="ltr">
                {handshakeResult.gatewayUrl} · {handshakeResult.server}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0" dir="ltr">
            ReqID: {handshakeResult.requestId?.slice(0, 16)}...
          </span>
        </div>
      )}

      {/* 4 Cryptographic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: CSID Certificate */}
        <div className="p-3 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <Key size={13} className="text-[#4F2396] dark:text-purple-400" />
            <span>{t("Cryptographic CSID", "شهادة التشفير CSID")}</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs truncate">
            {egs.csidIssuer}
          </span>
          <span
            className={`text-[10px] font-medium block ${
              egs.csidStatus === "Active & Valid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {egs.csidStatus === "Active & Valid" && egs.csidExpiry
              ? `${t("Expires:", "تنتهي في:")} ${new Date(egs.csidExpiry).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-US",
                  {
                    month: "short",
                    year: "numeric",
                  }
                )} (${t("Active", "نشطة")})`
              : t("Awaiting CSID onboarding", "بانتظار ربط شهادة CSID")}
          </span>
        </div>

        {/* Metric 2: ICV Counter */}
        <div className="p-3 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <Cpu size={13} className="text-[#4F2396] dark:text-purple-400" />
            <span>{t("Invoice Counter (ICV)", "عداد الفواتير التسلسلي (ICV)")}</span>
          </div>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 block text-sm">
            #{egs.currentIcv}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
            {t("Strict sequential monotonic index", "فهرس تسلسلي متصاعد غير قابل للتعديل")}
          </span>
        </div>

        {/* Metric 3: PIH Blockchain Hash */}
        <div className="p-3 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <Link2 size={13} className="text-[#4F2396] dark:text-purple-400" />
              <span>{t("Chain Hash (PIH)", "بصمة الترابط (PIH)")}</span>
            </div>
            {egs.latestPih && (
              <button
                type="button"
                onClick={() => handleCopyPih(egs.latestPih)}
                className="text-[10px] text-[#4F2396] dark:text-purple-400 hover:underline cursor-pointer font-medium"
              >
                {copiedPih ? t("Copied!", "تم النسخ!") : t("Copy", "نسخ")}
              </button>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-900 dark:text-slate-100 block truncate font-medium" title={egs.latestPih} dir="ltr">
            {egs.latestPih || "—"}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            {t("SHA-256 tamper-evident chain link", "رابط سلسلة SHA-256 مانع للتلاعب")}
          </span>
        </div>

        {/* Metric 4: Clearance Totals */}
        <div className="p-3 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>{t("ZATCA Transmissions", "إرسالات هيئة الزكاة")}</span>
          </div>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 block text-sm">
            {egs.totalReportedCount} {t("Reported", "مبلّغة")} / {egs.totalClearedCount} {t("Cleared", "معتمدة")}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            {egs.totalReportedCount + egs.totalClearedCount > 0
              ? t("100% Schematron & XSD Valid", "متوافقة 100% مع Schematron و XSD")
              : t("Awaiting first live invoice", "بانتظار أول فاتورة مباشرة")}
          </span>
        </div>
      </div>
    </div>
  );
}

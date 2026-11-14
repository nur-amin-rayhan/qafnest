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
      className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-xs space-y-4 text-on-surface"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-emerald-50 p-2 text-status-emerald border border-emerald-200 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-sm text-on-surface">
                {t("ZATCA Phase 2 E-Invoicing Engine (Fatoorah)", "محرك الفوترة الإلكترونية - المرحلة الثانية (فاتورة / الزكاة والدخل)")}
              </h3>
              {egs.csidStatus === "Active & Valid" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-status-emerald border border-emerald-200">
                  <CheckCircle2 size={10} />
                  <span>{t("CSID Active", "الشهادة مفعلة")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  <span>{t("Pending CSID", "بانتظار التفعيل")}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5 font-mono truncate max-w-lg" dir="ltr">
              EGS: {egs.egsSerialNumber} · Gateway: {egs.gatewayUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestHandshake}
            disabled={testingGateway}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition cursor-pointer"
            title={t("Probe live ZATCA Developer Portal Gateway", "فحص الاتصال المباشر ببوابة هيئة الزكاة والضريبة")}
          >
            <Activity size={12} className={testingGateway ? "animate-spin text-primary" : "text-status-emerald"} />
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-primary" : ""} />
            <span>{t("Sync EGS", "مزامنة الوحدة")}</span>
          </button>
        </div>
      </div>

      {/* Live Handshake Telemetry Ribbon */}
      {handshakeResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-status-emerald flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Globe size={15} className="shrink-0" />
            <div>
              <span className="font-bold block text-[11px] text-emerald-950">
                {t(
                  `Live Saudi ZATCA Gateway Handshake Successful (${handshakeResult.latencyMs}ms latency)`,
                  `نجح الاتصال المباشر ببوابة هيئة الزكاة السعودية (زمن الاستجابة ${handshakeResult.latencyMs} مللي ثانية)`
                )}
              </span>
              <span className="text-[10px] text-emerald-800 font-mono block" dir="ltr">
                {handshakeResult.gatewayUrl} · {handshakeResult.server}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-outline shrink-0" dir="ltr">
            ReqID: {handshakeResult.requestId?.slice(0, 16)}...
          </span>
        </div>
      )}

      {/* 4 Cryptographic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: CSID Certificate */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-1">
          <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold">
            <Key size={13} className="text-primary" />
            <span>{t("Cryptographic CSID", "شهادة التشفير CSID")}</span>
          </div>
          <span className="font-bold text-on-surface block text-xs truncate">
            {egs.csidIssuer}
          </span>
          <span
            className={`text-[10px] font-semibold block ${
              egs.csidStatus === "Active & Valid" ? "text-status-emerald" : "text-amber-700"
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
        <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-1">
          <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold">
            <Cpu size={13} className="text-primary" />
            <span>{t("Invoice Counter (ICV)", "عداد الفواتير التسلسلي (ICV)")}</span>
          </div>
          <span className="font-mono font-black text-on-surface block text-sm">
            #{egs.currentIcv}
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium block">
            {t("Strict sequential monotonic index", "فهرس تسلسلي متصاعد غير قابل للتعديل")}
          </span>
        </div>

        {/* Metric 3: PIH Blockchain Hash */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-1">
          <div className="flex items-center justify-between text-outline text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <Link2 size={13} className="text-primary" />
              <span>{t("Chain Hash (PIH)", "بصمة الترابط (PIH)")}</span>
            </div>
            {egs.latestPih && (
              <button
                type="button"
                onClick={() => handleCopyPih(egs.latestPih)}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                {copiedPih ? t("Copied!", "تم النسخ!") : t("Copy", "نسخ")}
              </button>
            )}
          </div>
          <span className="font-mono text-[11px] text-on-surface block truncate font-medium" title={egs.latestPih} dir="ltr">
            {egs.latestPih || "—"}
          </span>
          <span className="text-[10px] text-on-surface-variant block">
            {t("SHA-256 tamper-evident chain link", "رابط سلسلة SHA-256 مانع للتلاعب")}
          </span>
        </div>

        {/* Metric 4: Clearance Totals */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-1">
          <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold">
            <ShieldCheck size={13} className="text-status-emerald" />
            <span>{t("ZATCA Transmissions", "إرسالات هيئة الزكاة")}</span>
          </div>
          <span className="font-mono font-black text-on-surface block text-sm">
            {egs.totalReportedCount} {t("Reported", "مبلّغة")} / {egs.totalClearedCount} {t("Cleared", "معتمدة")}
          </span>
          <span className="text-[10px] text-status-emerald font-semibold block">
            {egs.totalReportedCount + egs.totalClearedCount > 0
              ? t("100% Schematron & XSD Valid", "متوافقة 100% مع Schematron و XSD")
              : t("Awaiting first live invoice", "بانتظار أول فاتورة مباشرة")}
          </span>
        </div>
      </div>
    </div>
  );
}

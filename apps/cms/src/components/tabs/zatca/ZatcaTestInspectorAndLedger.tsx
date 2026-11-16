"use client";

import React from "react";
import { AlertCircle, Check, FileCheck2, RefreshCw } from "lucide-react";

export interface ZatcaTestResultState {
  type: "handshake" | "invoice" | "onboard";
  success: boolean;
  data: any;
  timestamp: string;
}

export function ZatcaTestInspector({
  testResult,
  t,
}: {
  testResult: ZatcaTestResultState;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className={`w-2 h-2 rounded-full ${testResult.success ? "bg-emerald-400" : "bg-rose-400"}`} />
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
  );
}

export function ZatcaRecentLedger({
  recentInvoices,
  onRefresh,
  t,
}: {
  recentInvoices: any[];
  onRefresh: () => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-[#090C13] border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          <span>{t("Recent ZATCA API Invoice Transmissions", "سجل الفواتير المرسلة إلى بوابة زاتكا")}</span>
        </h3>
        <button
          type="button"
          onClick={onRefresh}
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
  );
}

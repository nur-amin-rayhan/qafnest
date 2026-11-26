"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Percent,
  CheckCircle2,
  ShieldCheck,
  Calculator,
  Sparkles,
  Save,
  RefreshCw,
  Gift,
  Coins,
  AlertCircle,
} from "lucide-react";
import type { PlatformFeeConfig, CategoryFeeOverride, GuestFeeMode } from "@qafnest/shared/platformFee";
import { calculateBookingSettlement } from "@qafnest/shared/platformFee";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminPath } from "@/lib/adminUrl";
export function PlatformFeeConfigCard() {
  const { t, dir, lang } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<PlatformFeeConfig | null>(null);

  // Guest Service Fee (Percentage OR Manual Fixed SAR amount)
  const [guestFeeMode, setGuestFeeMode] = useState<GuestFeeMode>("percentage");
  const [guestFeePercent, setGuestFeePercent] = useState<number>(13);
  const [guestFixedAmountSar, setGuestFixedAmountSar] = useState<number>(25);

  // Host Commission (% deducted from listing amount)
  const [hostCommissionPercent, setHostCommissionPercent] = useState<number>(20);
  const [vatRatePercent, setVatRatePercent] = useState<number>(15);
  const [introRate, setIntroRate] = useState<number>(10);
  const [enableIntro, setEnableIntro] = useState<boolean>(false);
  const [enableCategory, setEnableCategory] = useState<boolean>(false);
  const [categoryOverrides, setCategoryOverrides] = useState<CategoryFeeOverride[]>([]);

  // Welcome Bonus Policy
  const [welcomeBonusEnabled, setWelcomeBonusEnabled] = useState<boolean>(true);
  const [welcomeBonusAmountSar, setWelcomeBonusAmountSar] = useState<number>(50);

  // 4-Party Accounting Simulator
  const [simListing, setSimListing] = useState<number>(100);
  const [simPromo, setSimPromo] = useState<number>(0);
  const [simApplyWelcomeBonus, setSimApplyWelcomeBonus] = useState<boolean>(false);

  const applyConfigToState = useCallback((cfg: PlatformFeeConfig) => {
    setConfig(cfg);
    setGuestFeeMode(cfg.guestFeeMode === "fixed_amount" ? "fixed_amount" : "percentage");
    setGuestFeePercent(cfg.guestServiceFeePercent ?? 13);
    setGuestFixedAmountSar(cfg.guestFixedFeeAmountSar ?? 0);
    setHostCommissionPercent(cfg.baseCommissionPercent ?? 20);
    setVatRatePercent(cfg.vatRatePercent ?? 15);
    setIntroRate(cfg.newHostIntroRatePercent ?? 10);
    setEnableIntro(Boolean(cfg.enableIntroRate));
    setEnableCategory(Boolean(cfg.enableCategoryOverrides));
    setCategoryOverrides(cfg.categoryOverrides || []);
    setWelcomeBonusEnabled(cfg.welcomeBonusEnabled !== false);
    setWelcomeBonusAmountSar(cfg.welcomeBonusAmountSar ?? 50);
  }, []);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(adminPath(`/api/admin/financials/fees?t=${Date.now()}`), {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          applyConfigToState(data.config);
        }
      } else {
        setErrorMsg(t("Unable to load saved fee configuration from server.", "تعذر تحميل إعدادات الرسوم المحفوظة من الخادم."));
      }
    } catch {
      setErrorMsg(t("Network error while loading platform fee rules.", "خطأ في الشبكة أثناء تحميل قواعد رسوم المنصة."));
    } finally {
      setLoading(false);
    }
  }, [applyConfigToState, t]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    try {
      const cleanGuestPercent = Math.max(0, Number(guestFeePercent) || 0);
      const cleanFixedSar = Math.max(0, Number(guestFixedAmountSar) || 0);
      const cleanHostComm = Math.max(0, Math.min(80, Number(hostCommissionPercent) || 0));
      const cleanVatPercent = Math.max(0, Math.min(100, Number(vatRatePercent) || 0));
      const cleanWelcomeSar = Math.max(0, Number(welcomeBonusAmountSar) || 0);

      const res = await fetch(adminPath("/api/admin/financials/fees"), {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestFeeMode,
          guestServiceFeePercent: cleanGuestPercent,
          guestFixedFeeAmountSar: cleanFixedSar,
          baseCommissionPercent: cleanHostComm,
          vatRatePercent: cleanVatPercent,
          syncGuestServiceFee: false,
          newHostIntroRatePercent: Number(introRate) || 0,
          enableIntroRate: enableIntro,
          enableCategoryOverrides: enableCategory,
          categoryOverrides,
          welcomeBonusEnabled,
          welcomeBonusAmountSar: cleanWelcomeSar,
        }),
      });

      const data = await res.json();
      if (res.ok && data.config) {
        applyConfigToState(data.config);
        setSaveSuccess(true);

        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("qafnest_platform_fee_sync");
          channel.postMessage({
            type: "PLATFORM_FEE_UPDATED",
            guestFeeMode: data.config.guestFeeMode,
            fixedFeeAmountSar: data.config.guestFixedFeeAmountSar,
            serviceFeeRate: (data.config.guestServiceFeePercent ?? 13) / 100,
            vatRatePercent: data.config.vatRatePercent ?? cleanVatPercent,
            baseCommissionPercent: data.config.baseCommissionPercent,
          });
          channel.close();
        }
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        setErrorMsg(data.message || t("Failed to save fee configuration.", "فشل حفظ إعدادات الرسوم."));
      }
    } catch {
      setErrorMsg(t("Network error while saving fee rules.", "خطأ في الشبكة أثناء حفظ قواعد الرسوم."));
    } finally {
      setSaving(false);
    }
  };

  // Live 4-party accounting simulator
  const simListingClean = Math.max(0, Number(simListing) || 0);
  const simPromoClean = Math.max(0, Math.min(simListingClean, Number(simPromo) || 0));
  const simGuestServiceFee =
    guestFeeMode === "fixed_amount"
      ? Math.max(0, Number(guestFixedAmountSar) || 0)
      : Math.round(simListingClean * ((Math.max(0, Number(guestFeePercent) || 0) / 100)) * 100) /
        100;
  const vatPercent = vatRatePercent;
  const preVatTotal = Math.max(0, simListingClean - simPromoClean) + simGuestServiceFee;
  const simVatSar = Math.round(preVatTotal * (vatPercent / 100) * 100) / 100;

  const settlement = calculateBookingSettlement({
    listingAmountSar: simListingClean,
    guestServiceFeeSar: simGuestServiceFee,
    vatAmountSar: simVatSar,
    promoDiscountSar: simPromoClean,
    welcomeBonusUsedSar: simApplyWelcomeBonus && welcomeBonusEnabled ? welcomeBonusAmountSar : 0,
    hostCommissionPercent,
    vatRatePercent: vatPercent,
  });

  const currencyLabel = t("SAR", "ر.س");

  if (loading && !config) {
    return (
      <div
        dir={dir}
        className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-6 text-xs text-slate-400 dark:text-slate-500 animate-pulse"
      >
        {t("Loading persistent platform fee & accounting rules...", "جارٍ تحميل قواعد رسوم المنصة والتسويات المالية...")}
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 sm:p-6 shadow-xs space-y-6 text-slate-900 dark:text-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/60 p-2.5 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
            <Percent size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                {t(
                  "Dynamic Guest Fees, Host Commission & ZATCA Settlement Rules",
                  "قواعد رسوم الضيف الديناميكية وعمولة المضيف والتسوية الضريبية"
                )}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={11} />
                {t("Guest:", "الضيف:")}{" "}
                {guestFeeMode === "fixed_amount" ? `${guestFixedAmountSar} ${currencyLabel}` : `${guestFeePercent}%`} •{" "}
                {t("Host:", "المضيف:")} {hostCommissionPercent}% •{" "}
                {t("ZATCA VAT:", "ضريبة زاتكا:")} {vatRatePercent}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t(
                "Configure Guest Checkout Service Fee (% or custom fixed SAR) independently from Host Commission (%). Persists across reloads & logins.",
                "تحديد رسوم خدمة الضيف (كنسبة مئوية أو مبلغ ثابت بالريال) بشكل مستقل عن عمولة المضيف (%). يتم حفظ التعديلات بشكل دائم."
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchConfig()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-[#4F2396]" : ""} />
          <span>{t("Reload Saved", "إعادة تحميل المحفوظ")}</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Main Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Independent Guest Fee + Host Commission + Welcome Bonus */}
        <div className="space-y-4">
          {/* 1. Guest Service Fee Card */}
          <div className="p-4 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-[#4F2396] dark:text-purple-400" />
                <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {t("Guest Checkout Service Fee", "رسوم خدمة الضيف عند الدفع")}
                </label>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  data-testid="guest-fee-mode-percentage"
                  onClick={() => setGuestFeeMode("percentage")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    guestFeeMode === "percentage"
                      ? "bg-[#4F2396] text-white font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {t("Percentage (%)", "نسبة مئوية (%)")}
                </button>
                <button
                  type="button"
                  data-testid="guest-fee-mode-fixed"
                  onClick={() => setGuestFeeMode("fixed_amount")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    guestFeeMode === "fixed_amount"
                      ? "bg-[#4F2396] text-white font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {t("Manual Amount (SAR)", "مبلغ ثابت (ر.س)")}
                </button>
              </div>
            </div>

            {guestFeeMode === "percentage" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      data-testid="guest-fee-percent-input"
                      value={guestFeePercent}
                      onChange={(e) => setGuestFeePercent(Math.max(0, Number(e.target.value)))}
                      className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 pe-7 text-lg font-mono font-semibold text-[#4F2396] dark:text-purple-300 text-center outline-none focus:ring-1 focus:ring-[#4F2396]"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="0.5"
                    value={Math.min(40, guestFeePercent)}
                    onChange={(e) => setGuestFeePercent(Number(e.target.value))}
                    className="flex-1 accent-[#4F2396] cursor-pointer"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium me-1">{t("Presets:", "قيم جاهزة:")}</span>
                  {[8, 10, 12, 13, 15, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGuestFeePercent(rate)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition cursor-pointer ${
                        guestFeePercent === rate
                          ? "bg-[#4F2396] text-white border-[#4F2396]"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    data-testid="guest-fee-fixed-input"
                    value={guestFixedAmountSar}
                    onChange={(e) => setGuestFixedAmountSar(Math.max(0, Number(e.target.value)))}
                    placeholder={t("Enter any SAR amount", "أدخل المبلغ بالريال")}
                    className="w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-lg font-mono font-semibold text-[#4F2396] dark:text-purple-300 text-center outline-none focus:ring-1 focus:ring-[#4F2396]"
                  />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t("SAR flat fee per booking (unrestricted)", "ر.س رسوم ثابتة لكل حجز (بدون حد أقصى)")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium me-1">{t("Quick SAR:", "قيم سريعة:")}</span>
                  {[15, 25, 35, 50, 75, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGuestFixedAmountSar(amt)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition cursor-pointer ${
                        guestFixedAmountSar === amt
                          ? "bg-[#4F2396] text-white border-[#4F2396]"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {amt} {currencyLabel}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t(
                `Added cleanly to Guest Checkout & included in taxable subtotal before ${vatPercent}% VAT. Exact amount displays on Guest pages without % labels.`,
                `تُضاف لصفحة دفع الضيف وتدخل ضمن المجموع الخاضع لضريبة ${vatPercent}%. يظهر المبلغ النهائي للضيف بدقة ووضوح.`
              )}
            </p>
          </div>

          {/* 2. Host Commission Rate (%) */}
          <div className="p-4 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
              {t(
                "Host Platform Commission Rate (% deducted from Listing Price at Settlement)",
                "نسبة عمولة المنصة من المضيف (تُخصم من قيمة العقار عند التسوية)"
              )}
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="80"
                  step="0.5"
                  data-testid="host-commission-percent-input"
                  value={hostCommissionPercent}
                  onChange={(e) => setHostCommissionPercent(Math.max(0, Number(e.target.value)))}
                  className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 pe-7 text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-center outline-none focus:ring-1 focus:ring-[#4F2396]"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value={Math.min(40, hostCommissionPercent)}
                onChange={(e) => setHostCommissionPercent(Number(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium me-1">{t("Host Presets:", "نسب المضيف:")}</span>
              {[10, 15, 20, 25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setHostCommissionPercent(rate)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition cursor-pointer ${
                    hostCommissionPercent === rate
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t(
                "Calculated strictly on the host's original listing price (never on ZATCA VAT). Promo code discounts are deducted after this commission.",
                "تُحتسب حصرياً على السعر الأصلي للعقار (وليس على ضريبة الزكاة). يتم خصم أكواد الخصم الترويجية بعد احتساب العمولة."
              )}
            </p>
          </div>

          {/* 3. ZATCA E-Invoicing VAT Rate (%) */}
          <div className="p-4 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400" />
                <span>
                  {t(
                    "ZATCA E-Invoicing VAT Rate (% 100% Gov Remittance)",
                    "نسبة ضريبة القيمة المضافة - زاتكا (% توريد حكومي 100%)"
                  )}
                </span>
              </label>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {t("ZATCA Phase 2", "المرحلة ٢ - زاتكا")}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  data-testid="zatca-vat-percent-input"
                  value={vatRatePercent}
                  onChange={(e) => setVatRatePercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 pe-7 text-lg font-mono font-semibold text-amber-600 dark:text-amber-400 text-center outline-none focus:ring-1 focus:ring-[#4F2396]"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={Math.min(30, vatRatePercent)}
                onChange={(e) => setVatRatePercent(Number(e.target.value))}
                className="flex-1 accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium me-1">
                {t("VAT Presets:", "نسب الضريبة:")}
              </span>
              {[0, 5, 10, 15, 20].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setVatRatePercent(rate)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition cursor-pointer ${
                    vatRatePercent === rate
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t(
                "Standard Saudi VAT mandated by ZATCA (default 15%). Charged on the pre-VAT subtotal and remitted 100% to the tax authority.",
                "ضريبة القيمة المضافة المعتمدة من هيئة الزكاة والضريبة والجمارك (الافتراضي 15%). تُحتسب على المجموع وتورّد بالكامل للهيئة."
              )}
            </p>
          </div>

          {/* 3. New Sign-Up Welcome Bonus & Intro Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Gift size={15} className="text-[#4F2396] dark:text-purple-400" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {t("Sign-Up Welcome Bonus", "رصيد الترحيب للتسجيل الجديد")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={welcomeBonusEnabled}
                  onChange={(e) => setWelcomeBonusEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={welcomeBonusAmountSar}
                  onChange={(e) => setWelcomeBonusAmountSar(Math.max(0, Number(e.target.value)))}
                  disabled={!welcomeBonusEnabled}
                  className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs font-mono font-semibold text-center text-slate-900 dark:text-slate-100 outline-none disabled:opacity-50"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {t("SAR (Platform-Borne)", "ر.س (تتحملها المنصة)")}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={15} className="text-amber-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {t("New Host Intro Rate", "نسبة افتتاحية للمضيف الجديد")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableIntro}
                  onChange={(e) => setEnableIntro(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#4F2396] cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={introRate}
                  onChange={(e) => setIntroRate(Number(e.target.value))}
                  disabled={!enableIntro}
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs font-mono font-semibold text-center text-slate-900 dark:text-slate-100 outline-none disabled:opacity-50"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("% (First 90 days)", "% (أول 90 يوماً)")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 4-Party Accounting & Settlement Simulator */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <Calculator size={16} className="text-[#4F2396] dark:text-purple-400" />
              <span>{t("4-Party Live Settlement Simulator", "محاكي التسوية المالية الرباعية المباشر")}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              {t("SAMA & ZATCA Audited", "مدقق وفق ساما والزكاة")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                {t("Host Listing Price (SAR):", "سعر العقار الأساسي (ر.س):")}
              </span>
              <input
                type="number"
                step="10"
                value={simListing}
                onChange={(e) => setSimListing(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                {t("Promo Code Discount (SAR):", "خصم الكود الترويجي (ر.س):")}
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={simPromo}
                onChange={(e) => setSimPromo(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[11px] font-semibold text-[#4F2396] dark:text-purple-300 cursor-pointer">
            <input
              type="checkbox"
              checked={simApplyWelcomeBonus}
              onChange={(e) => setSimApplyWelcomeBonus(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[#4F2396]"
            />
            <span>
              {t(
                `Simulate Guest using ${welcomeBonusAmountSar} SAR Welcome Bonus Wallet Credit (Platform-Borne)`,
                `محاكاة استخدام الضيف رصيد الترحيب البالغ ${welcomeBonusAmountSar} ر.س (تتحمله المنصة)`
              )}
            </span>
          </label>

          <div className="rounded-xl bg-white dark:bg-[#0E0D16] p-3.5 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
            <div className="flex justify-between pt-1">
              <span className="text-slate-600 dark:text-slate-400">{t("1. Host Listing Stay:", "1. قيمة إقامة العقار:")}</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {currencyLabel} {settlement.listingAmountSar.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600 dark:text-slate-400">
                + {t("Guest Service Fee", "رسوم خدمة الضيف")} (
                {guestFeeMode === "fixed_amount" ? t("Fixed", "ثابت") : `${guestFeePercent}%`}):
              </span>
              <span className="font-mono font-semibold text-[#4F2396] dark:text-purple-300">
                + {currencyLabel} {settlement.guestServiceFeeSar.toFixed(2)}
              </span>
            </div>
            {settlement.promoDiscountSar > 0 && (
              <div className="flex justify-between pt-1 text-amber-600 dark:text-amber-400">
                <span>- {t("Promo Code Applied by Guest:", "خصم الكود الترويجي:")}</span>
                <span className="font-mono font-semibold">
                  - {currencyLabel} {settlement.promoDiscountSar.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-400">
              <span>
                + {vatPercent}% {t("ZATCA VAT (100% Gov Remittance):", "ضريبة القيمة المضافة (توريد للزكاة 100%):")}
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                + {currencyLabel} {settlement.governmentVatRemittanceSar.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 font-bold text-slate-900 dark:text-slate-100">
              <span>{t("Guest Invoice Total:", "إجمالي فاتورة الضيف:")}</span>
              <span className="font-mono">
                {currencyLabel} {settlement.guestTotalCollectedSar.toFixed(2)}
              </span>
            </div>
            {settlement.welcomeBonusUsedSar > 0 && (
              <div className="flex justify-between pt-1 text-purple-600 dark:text-purple-400 font-semibold">
                <span>{t("Wallet Welcome Bonus Paid by Platform:", "مكافأة الترحيب المغطاة من المنصة:")}</span>
                <span className="font-mono">
                  - {currencyLabel} {settlement.welcomeBonusUsedSar.toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-2 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20 -mx-3.5 px-3.5 pb-2 mt-1 rounded-b-lg">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>
                  {t(
                    `Host Commission (${hostCommissionPercent}% of ${settlement.listingAmountSar.toFixed(0)} SAR):`,
                    `عمولة المنصة من المضيف (${hostCommissionPercent}% من ${settlement.listingAmountSar.toFixed(0)} ر.س):`
                  )}
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                  - {currencyLabel} {settlement.hostCommissionAmountSar.toFixed(2)}
                </span>
              </div>
              {settlement.promoDeductionFromHostSar > 0 && (
                <div className="flex justify-between text-[11px] text-amber-600 dark:text-amber-400">
                  <span>{t("Promo Deduction from Host (After Commission):", "خصم ترويجي من المضيف (بعد العمولة):")}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                    - {currencyLabel} {settlement.promoDeductionFromHostSar.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-1">
                <span>{t("Net Host SARIE Payout:", "صافي مستحق المضيف (حوالة سريع):")}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {currencyLabel} {settlement.hostNetPayoutSar.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-2 text-xs font-bold text-[#4F2396] dark:text-purple-300">
              <span>
                {t(
                  "Net Platform Revenue (Guest Fee + Host Comm - Welcome Bonus):",
                  "صافي إيراد المنصة (رسوم الضيف + عمولة المضيف - الترحيب):"
                )}
              </span>
              <span className="font-mono">
                {currencyLabel} {settlement.platformNetRevenueSar.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Save & Audit Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {config
              ? t(
                  `Last modified by ${config.lastUpdatedBy} on ${new Date(config.lastUpdatedAt).toLocaleString()}`,
                  `آخر تعديل بواسطة ${config.lastUpdatedBy} في ${new Date(config.lastUpdatedAt).toLocaleString(
                    lang === "ar" ? "ar-SA" : "en-US"
                  )}`
                )
              : t("Using server defaults", "استخدام الإعدادات الافتراضية للخادم")}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {saveSuccess && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-150">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t("Saved & Applied Live!", "تم الحفظ والتطبيق فوراً!")}</span>
            </div>
          )}

          <button
            type="button"
            data-testid="save-platform-fee-btn"
            disabled={saving}
            onClick={() => void handleSave()}
            className={`inline-flex items-center justify-center gap-2 rounded-lg min-w-[240px] h-9 px-5 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs disabled:opacity-75 ${
              saveSuccess
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-[#4F2396] hover:bg-[#3D1A78] text-white"
            }`}
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin shrink-0" />
                <span>{t("Saving Rules...", "جارٍ حفظ القواعد...")}</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{t("Rules Saved Successfully!", "تم حفظ القواعد بنجاح!")}</span>
              </>
            ) : (
              <>
                <Save size={14} className="shrink-0" />
                <span>{t("Save All Fee & Commission Rules", "حفظ جميع قواعد الرسوم والعمولات")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Bottom Toast Notification */}
      {saveSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 end-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 shadow-2xl text-xs font-semibold border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">
              {t("Fee Rules Saved Permanently!", "تم حفظ قواعد الرسوم بنجاح!")}
            </p>
            <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-0.5">
              {t("Guest Fee:", "رسوم الضيف:")}{" "}
              {guestFeeMode === "fixed_amount" ? `${guestFixedAmountSar} SAR (Fixed)` : `${guestFeePercent}%`} •{" "}
              {t("Host Commission:", "عمولة المضيف:")} {hostCommissionPercent}% •{" "}
              {t("ZATCA VAT:", "ضريبة زاتكا:")} {vatRatePercent}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

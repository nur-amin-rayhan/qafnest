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
            vatRatePercent: data.config.vatRatePercent ?? 15,
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
  const vatPercent = config?.vatRatePercent ?? 15;
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
        className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 text-xs text-outline animate-pulse"
      >
        {t("Loading persistent platform fee & accounting rules...", "جارٍ تحميل قواعد رسوم المنصة والتسويات المالية...")}
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-6 text-on-surface"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-2.5 text-primary border border-violet-200 shrink-0">
            <Percent size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-base text-on-surface">
                {t(
                  "Dynamic Guest Fees, Host Commission & ZATCA Settlement Rules",
                  "قواعد رسوم الضيف الديناميكية وعمولة المضيف والتسوية الضريبية"
                )}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-status-emerald border border-emerald-200">
                <CheckCircle2 size={11} />
                {t("Guest:", "الضيف:")}{" "}
                {guestFeeMode === "fixed_amount" ? `${guestFixedAmountSar} ${currencyLabel}` : `${guestFeePercent}%`} •{" "}
                {t("Host:", "المضيف:")} {hostCommissionPercent}%
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
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
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-primary" : ""} />
          <span>{t("Reload Saved", "إعادة تحميل المحفوظ")}</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-status-emerald flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="font-bold">
            {t(
              `Fee rules saved permanently to disk! Guest Service Fee: ${
                guestFeeMode === "fixed_amount" ? `${guestFixedAmountSar} SAR (Fixed)` : `${guestFeePercent}%`
              }, Host Commission: ${hostCommissionPercent}%.`,
              `تم حفظ قواعد الرسوم بشكل دائم! رسوم خدمة الضيف: ${
                guestFeeMode === "fixed_amount" ? `${guestFixedAmountSar} ر.س (ثابت)` : `${guestFeePercent}%`
              }، وعمولة المضيف: ${hostCommissionPercent}%.`
            )}
          </span>
        </div>
      )}

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
          <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-primary" />
                <label className="text-xs font-bold text-on-surface">
                  {t("Guest Checkout Service Fee", "رسوم خدمة الضيف عند الدفع")}
                </label>
              </div>
              <div className="inline-flex rounded-xl border border-surface-container-high bg-surface-container-lowest p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  data-testid="guest-fee-mode-percentage"
                  onClick={() => setGuestFeeMode("percentage")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    guestFeeMode === "percentage"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("Percentage (%)", "نسبة مئوية (%)")}
                </button>
                <button
                  type="button"
                  data-testid="guest-fee-mode-fixed"
                  onClick={() => setGuestFeeMode("fixed_amount")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    guestFeeMode === "fixed_amount"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
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
                      className="w-28 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2.5 pe-7 text-lg font-mono font-black text-primary text-center outline-none focus:border-primary"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="0.5"
                    value={Math.min(40, guestFeePercent)}
                    onChange={(e) => setGuestFeePercent(Number(e.target.value))}
                    className="flex-1 accent-primary cursor-pointer"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-outline font-bold me-1">{t("Presets:", "قيم جاهزة:")}</span>
                  {[8, 10, 12, 13, 15, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGuestFeePercent(rate)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                        guestFeePercent === rate
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-surface-container"
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
                    className="w-40 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2.5 text-lg font-mono font-black text-primary text-center outline-none focus:border-primary"
                  />
                  <span className="text-xs font-bold text-on-surface-variant">
                    {t("SAR flat fee per booking (unrestricted)", "ر.س رسوم ثابتة لكل حجز (بدون حد أقصى)")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-outline font-bold me-1">{t("Quick SAR:", "قيم سريعة:")}</span>
                  {[15, 25, 35, 50, 75, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGuestFixedAmountSar(amt)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                        guestFixedAmountSar === amt
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-surface-container"
                      }`}
                    >
                      {amt} {currencyLabel}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="text-[11px] text-on-surface-variant">
              {t(
                `Added cleanly to Guest Checkout & included in taxable subtotal before ${vatPercent}% VAT. Exact amount displays on Guest pages without % labels.`,
                `تُضاف لصفحة دفع الضيف وتدخل ضمن المجموع الخاضع لضريبة ${vatPercent}%. يظهر المبلغ النهائي للضيف بدقة ووضوح.`
              )}
            </p>
          </div>

          {/* 2. Host Commission Rate (%) */}
          <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
            <label className="text-xs font-bold text-on-surface block">
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
                  className="w-28 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2.5 pe-7 text-lg font-mono font-black text-emerald-700 text-center outline-none focus:border-primary"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">%</span>
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
              <span className="text-[11px] text-outline font-bold me-1">{t("Host Presets:", "نسب المضيف:")}</span>
              {[10, 15, 20, 25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setHostCommissionPercent(rate)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                    hostCommissionPercent === rate
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-surface-container"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant">
              {t(
                "Calculated strictly on the host's original listing price (never on ZATCA VAT). Promo code discounts are deducted after this commission.",
                "تُحتسب حصرياً على السعر الأصلي للعقار (وليس على ضريبة الزكاة). يتم خصم أكواد الخصم الترويجية بعد احتساب العمولة."
              )}
            </p>
          </div>

          {/* 3. New Sign-Up Welcome Bonus & Intro Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-container space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Gift size={15} className="text-violet-600" />
                  <span className="text-xs font-bold text-on-surface">
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
                  className="w-24 rounded-xl border border-surface-container-high bg-surface-container-lowest p-1.5 text-xs font-mono font-bold text-center text-on-surface outline-none disabled:opacity-50"
                />
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {t("SAR (Platform-Borne)", "ر.س (تتحملها المنصة)")}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-container space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={15} className="text-amber-500" />
                  <span className="text-xs font-bold text-on-surface">
                    {t("New Host Intro Rate", "نسبة افتتاحية للمضيف الجديد")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableIntro}
                  onChange={(e) => setEnableIntro(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
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
                  className="w-20 rounded-xl border border-surface-container-high bg-surface-container-lowest p-1.5 text-xs font-mono font-bold text-center text-on-surface outline-none disabled:opacity-50"
                />
                <span className="text-[11px] text-on-surface-variant">
                  {t("% (First 90 days)", "% (أول 90 يوماً)")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 4-Party Accounting & Settlement Simulator */}
        <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
          <div className="flex items-center justify-between border-b border-surface-container pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
              <Calculator size={16} className="text-primary" />
              <span>{t("4-Party Live Settlement Simulator", "محاكي التسوية المالية الرباعية المباشر")}</span>
            </div>
            <span className="text-[10px] font-mono text-outline">
              {t("SAMA & ZATCA Audited", "مدقق وفق ساما والزكاة")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-outline font-bold block mb-1">
                {t("Host Listing Price (SAR):", "سعر العقار الأساسي (ر.س):")}
              </span>
              <input
                type="number"
                step="10"
                value={simListing}
                onChange={(e) => setSimListing(Number(e.target.value))}
                className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-2 text-xs font-mono font-bold text-on-surface outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-outline font-bold block mb-1">
                {t("Promo Code Discount (SAR):", "خصم الكود الترويجي (ر.س):")}
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={simPromo}
                onChange={(e) => setSimPromo(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-2 text-xs font-mono font-bold text-on-surface outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[11px] font-bold text-violet-700 cursor-pointer">
            <input
              type="checkbox"
              checked={simApplyWelcomeBonus}
              onChange={(e) => setSimApplyWelcomeBonus(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-violet-600"
            />
            <span>
              {t(
                `Simulate Guest using ${welcomeBonusAmountSar} SAR Welcome Bonus Wallet Credit (Platform-Borne)`,
                `محاكاة استخدام الضيف رصيد الترحيب البالغ ${welcomeBonusAmountSar} ر.س (تتحمله المنصة)`
              )}
            </span>
          </label>

          <div className="rounded-xl bg-surface-container-lowest p-3 border border-surface-container space-y-1.5 text-xs divide-y divide-surface-container">
            <div className="flex justify-between pt-1">
              <span className="text-on-surface-variant">{t("1. Host Listing Stay:", "1. قيمة إقامة العقار:")}</span>
              <span className="font-mono font-bold">
                {currencyLabel} {settlement.listingAmountSar.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-on-surface-variant">
                + {t("Guest Service Fee", "رسوم خدمة الضيف")} (
                {guestFeeMode === "fixed_amount" ? t("Fixed", "ثابت") : `${guestFeePercent}%`}):
              </span>
              <span className="font-mono font-bold text-primary">
                + {currencyLabel} {settlement.guestServiceFeeSar.toFixed(2)}
              </span>
            </div>
            {settlement.promoDiscountSar > 0 && (
              <div className="flex justify-between pt-1 text-amber-700">
                <span>- {t("Promo Code Applied by Guest:", "خصم الكود الترويجي:")}</span>
                <span className="font-mono font-bold">
                  - {currencyLabel} {settlement.promoDiscountSar.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-slate-600">
              <span>
                + {vatPercent}% {t("ZATCA VAT (100% Gov Remittance):", "ضريبة القيمة المضافة (توريد للزكاة 100%):")}
              </span>
              <span className="font-mono font-bold">
                + {currencyLabel} {settlement.governmentVatRemittanceSar.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 font-extrabold text-on-surface">
              <span>{t("Guest Invoice Total:", "إجمالي فاتورة الضيف:")}</span>
              <span className="font-mono">
                {currencyLabel} {settlement.guestTotalCollectedSar.toFixed(2)}
              </span>
            </div>
            {settlement.welcomeBonusUsedSar > 0 && (
              <div className="flex justify-between pt-1 text-violet-700 font-semibold">
                <span>{t("Wallet Welcome Bonus Paid by Platform:", "مكافأة الترحيب المغطاة من المنصة:")}</span>
                <span className="font-mono">
                  - {currencyLabel} {settlement.welcomeBonusUsedSar.toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-2 space-y-1 bg-emerald-50/40 -mx-3 px-3 pb-2 mt-1">
              <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>
                  {t(
                    `Host Commission (${hostCommissionPercent}% of ${settlement.listingAmountSar.toFixed(0)} SAR):`,
                    `عمولة المنصة من المضيف (${hostCommissionPercent}% من ${settlement.listingAmountSar.toFixed(0)} ر.س):`
                  )}
                </span>
                <span className="font-mono text-red-600">
                  - {currencyLabel} {settlement.hostCommissionAmountSar.toFixed(2)}
                </span>
              </div>
              {settlement.promoDeductionFromHostSar > 0 && (
                <div className="flex justify-between text-[11px] text-amber-700">
                  <span>{t("Promo Deduction from Host (After Commission):", "خصم ترويجي من المضيف (بعد العمولة):")}</span>
                  <span className="font-mono text-red-600">
                    - {currencyLabel} {settlement.promoDeductionFromHostSar.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-on-surface pt-1">
                <span>{t("Net Host SARIE Payout:", "صافي مستحق المضيف (حوالة سريع):")}</span>
                <span className="font-mono text-status-emerald">
                  {currencyLabel} {settlement.hostNetPayoutSar.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-2 text-xs font-extrabold text-violet-800">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-surface-container">
        <div className="flex items-center gap-1.5 text-[11px] text-outline">
          <ShieldCheck size={14} className="text-status-emerald shrink-0" />
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
        <button
          type="button"
          data-testid="save-platform-fee-btn"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary hover:opacity-90 px-6 py-2.5 text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save size={14} />
          <span>
            {saving
              ? t("Saving Rules...", "جارٍ حفظ القواعد...")
              : t("Save All Fee & Commission Rules", "حفظ جميع قواعد الرسوم والعمولات")}
          </span>
        </button>
      </div>
    </div>
  );
}

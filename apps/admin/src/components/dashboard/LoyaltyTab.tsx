"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Wallet,
  Sparkles,
  CreditCard,
  Banknote,
  Edit2,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { LoyaltySettings, LoyaltyOffer } from "@/lib/services/adminLoyaltyService";

import { adminPath } from "@/lib/adminUrl";
interface LoyaltyTabProps {
  triggerToast: (msg: string) => void;
}

interface CachedLoyaltyState {
  settings: LoyaltySettings;
  offers: LoyaltyOffer[];
  stats: {
    totalWallets: number;
    totalBalance: number;
    totalPoints: number;
    totalCards: number;
  };
}

let cachedLoyaltyData: CachedLoyaltyState | null = null;

export default function LoyaltyTab({ triggerToast }: LoyaltyTabProps) {
  const { dir, t } = useAdminAuth();

  const [loading, setLoading] = useState(!cachedLoyaltyData);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState<LoyaltySettings>(
    () =>
      cachedLoyaltyData?.settings || {
        loyaltyEnabled: true,
        standardEarnRate: 1,
        walletPaymentMultiplier: 1.5,
        redemptionRatePoints: 100,
        redemptionRateSAR: 10,
      }
  );
  const [offers, setOffers] = useState<LoyaltyOffer[]>(() => cachedLoyaltyData?.offers || []);
  const [stats, setStats] = useState(
    () =>
      cachedLoyaltyData?.stats || {
        totalWallets: 0,
        totalBalance: 0,
        totalPoints: 0,
        totalCards: 0,
      }
  );

  // Modal for new/edit offer
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<LoyaltyOffer> | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);

  const fetchLoyaltyData = useCallback(async () => {
    try {
      if (!cachedLoyaltyData) setLoading(true);
      const res = await fetch(adminPath("/api/admin/loyalty"));
      if (res.ok) {
        const data = await res.json();
        const nextSettings = data.settings || settings;
        const nextOffers = Array.isArray(data.offers) ? data.offers : offers;
        const nextStats = data.stats || stats;
        cachedLoyaltyData = {
          settings: nextSettings,
          offers: nextOffers,
          stats: nextStats,
        };
        if (data.settings) setSettings(data.settings);
        if (Array.isArray(data.offers)) setOffers(data.offers);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      triggerToast(t("Failed to load loyalty configuration", "تعذر تحميل إعدادات برنامج الولاء"));
    } finally {
      setLoading(false);
    }
  }, [triggerToast, t, settings, offers, stats]);

  useEffect(() => {
    void fetchLoyaltyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch(adminPath("/api/admin/loyalty"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          settings,
        }),
      });

      if (res.ok) {
        triggerToast(t("Loyalty settings updated successfully", "تم حفظ إعدادات برنامج الولاء بنجاح"));
      } else {
        triggerToast(t("Failed to save settings", "فشل حفظ الإعدادات"));
      }
    } catch {
      triggerToast(t("Error saving settings", "حدث خطأ أثناء حفظ الإعدادات"));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleOffer = async (offerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(adminPath("/api/admin/loyalty"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_offer",
          offerId,
          isActive: !currentStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.offers)) setOffers(data.offers);
        triggerToast(
          !currentStatus
            ? t("Campaign activated", "تم تفعيل الحملة")
            : t("Campaign deactivated", "تم إيقاف الحملة")
        );
      }
    } catch {
      triggerToast(t("Error toggling campaign", "حدث خطأ أثناء تغيير حالة الحملة"));
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer?.titleEn || !editingOffer?.titleAr) {
      triggerToast(t("Campaign titles are required", "عنوان الحملة مطلوب باللغتين"));
      return;
    }

    try {
      setSavingOffer(true);
      const res = await fetch(adminPath("/api/admin/loyalty"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_offer",
          offer: editingOffer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.offers)) setOffers(data.offers);
        setModalOpen(false);
        setEditingOffer(null);
        triggerToast(t("Campaign saved successfully", "تم حفظ الحملة الترويجية بنجاح"));
      }
    } catch {
      triggerToast(t("Error saving campaign", "حدث خطأ أثناء حفظ الحملة"));
    } finally {
      setSavingOffer(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm(t("Are you sure you want to delete this campaign?", "هل أنت متأكد من حذف هذه الحملة؟"))) {
      return;
    }
    try {
      const res = await fetch(adminPath("/api/admin/loyalty"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_offer",
          offerId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.offers)) setOffers(data.offers);
        triggerToast(t("Campaign removed", "تم حذف الحملة"));
      }
    } catch {
      triggerToast(t("Error deleting campaign", "حدث خطأ أثناء حذف الحملة"));
    }
  };

  return (
    <div dir={dir} className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#4F2396] dark:text-purple-300 uppercase tracking-wider">
              {t("Guest Rewards & Retention", "مكافآت الضيوف والولاء")}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-semibold text-xs border ${
                settings.loyaltyEnabled
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
              }`}
            >
              {settings.loyaltyEnabled
                ? t("Loyalty System Active", "نظام الولاء مفعل")
                : t("Loyalty Paused", "نظام الولاء معلق")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("Loyalty Points & Wallet Campaigns", "نقاط الولاء وحملات المحفظة الرقمية")}
            </h1>
            <button
              type="button"
              onClick={() => void fetchLoyaltyData()}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
              title={t("Refresh Loyalty Data", "تحديث بيانات الولاء")}
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[#4F2396]" : ""} />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Configure point earn rates, wallet payment multipliers, cash redemption ratios, and promotional campaigns.",
              "التحكم في معدل كسب النقاط، مضاعفات الدفع عبر المحفظة، استبدال النقاط بالريال، والحملات الترويجية."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingOffer({
                id: `offer-${Date.now()}`,
                titleEn: "",
                titleAr: "",
                descriptionEn: "",
                descriptionAr: "",
                multiplier: 2,
                badgeEn: "2X Points",
                badgeAr: "ضعف النقاط",
                validUntil: "2026-12-31T23:59:59Z",
                isActive: true,
              });
              setModalOpen(true);
            }}
            className="h-9 px-4 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={16} strokeWidth={2} />
            <span>{t("New Campaign Offer", "إضافة حملة ترويجية")}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">{t("Active Wallets", "محافظ نشطة")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[#4F2396] dark:text-purple-300">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">{stats.totalWallets}</div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t("Registered guest wallets", "محافظ الضيوف المسجلة")}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">{t("Points in Circulation", "النقاط المتداولة")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">{stats.totalPoints.toLocaleString()} Pts</div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t("Earned & ready to redeem", "مكتسبة وجاهزة للاستبدال")}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">{t("Wallet Balance", "رصيد المحافظ")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Banknote size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">{stats.totalBalance.toFixed(2)} SAR</div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t("Direct booking credits", "رصيد حجز متاح")}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">{t("Saved Cards on File", "بطاقات محفوظة")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">{stats.totalCards} Cards</div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t("One-click checkout enabled", "دفع فوري مفعل")}
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t("Loyalty Program Configuration", "إعدادات برنامج المكافآت")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t(
                "Adjust how points are awarded for bookings, wallet payments, and cash redemption.",
                "حدد نسب منح النقاط ومضاعفة مكافآت الدفع بالمحفظة واستبدالها برصيد نقدي."
              )}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.loyaltyEnabled}
              onChange={(e) => setSettings({ ...settings, loyaltyEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F2396]"></div>
            <span className="ms-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              {settings.loyaltyEnabled ? t("Program Enabled", "البرنامج مفعّل") : t("Program Disabled", "البرنامج معطّل")}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Setting 1: Standard Earn Rate */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t("Standard Earn Rate", "معدل الكسب الأساسي")}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{t("Pts / 1 SAR", "نقطة / 1 ر.س")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={settings.standardEarnRate}
                onChange={(e) => setSettings({ ...settings, standardEarnRate: parseFloat(e.target.value) || 1 })}
                className="w-full h-10 px-3 pe-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396] font-mono tabular-nums"
              />
              <span className="absolute end-3 top-2.5 text-xs font-medium text-slate-400 dark:text-slate-500">{t("Pts/SAR", "نقطة/ر.س")}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Guest earns 1 Point per 1 SAR spent on regular checkout.", "يحصل الضيف على نقطة واحدة لكل ريال يُنفق.")}
            </p>
          </div>

          {/* Setting 2: Wallet Bonus Multiplier */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t("Wallet Multiplier", "مضاعف الدفع بالمحفظة")}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t("1.5X Default", "1.5× افتراضياً")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={settings.walletPaymentMultiplier}
                onChange={(e) => setSettings({ ...settings, walletPaymentMultiplier: parseFloat(e.target.value) || 1.5 })}
                className="w-full h-10 px-3 pe-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396] font-mono tabular-nums"
              />
              <span className="absolute end-3 top-2.5 text-xs font-medium text-slate-400 dark:text-slate-500">X</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Bonus multiplier applied when paying with digital wallet.", "مضاعف يمنح نقاطاً أكثر عند الدفع من رصيد المحفظة.")}
            </p>
          </div>

          {/* Setting 3: Redemption Points */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t("Redemption Points", "نقاط الاستبدال")}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{t("Points", "نقاط")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="10"
                min="50"
                max="1000"
                value={settings.redemptionRatePoints}
                onChange={(e) => setSettings({ ...settings, redemptionRatePoints: parseInt(e.target.value, 10) || 100 })}
                className="w-full h-10 px-3 pe-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396] font-mono tabular-nums"
              />
              <span className="absolute end-3 top-2.5 text-xs font-medium text-slate-400 dark:text-slate-500">{t("Pts", "نقطة")}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Number of points required per conversion tier.", "عدد النقاط المطلوب لكل فئة استبدال.")}
            </p>
          </div>

          {/* Setting 4: Redemption Cash Value */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t("Redemption Value", "قيمة الاستبدال")}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{t("SAR", "ر.س")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={settings.redemptionRateSAR}
                onChange={(e) => setSettings({ ...settings, redemptionRateSAR: parseFloat(e.target.value) || 10 })}
                className="w-full h-10 px-3 pe-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396] font-mono tabular-nums"
              />
              <span className="absolute end-3 top-2.5 text-xs font-medium text-slate-400 dark:text-slate-500">SAR</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                `Conversion ratio: ${settings.redemptionRatePoints} Pts = ${settings.redemptionRateSAR} SAR balance.`,
                `معادلة الاستبدال: ${settings.redemptionRatePoints} نقطة = ${settings.redemptionRateSAR} ريال.`
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingSettings}
            className="h-8 px-4 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {savingSettings && <RefreshCw size={13} className="animate-spin" />}
            <span>{t("Save Loyalty Settings", "حفظ إعدادات الولاء")}</span>
          </button>
        </div>
      </form>

      {/* Campaigns & Promotional Multipliers List */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t("Active Promotional Campaigns", "الحملات الترويجية ومكافآت الحجز")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t(
                "Promotional cards displayed to guests during reservation checkout and inside their wallet.",
                "العروض الترويجية التي تظهر للضيوف أثناء الدفع وفي صفحة المحفظة."
              )}
            </p>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs text-slate-400 dark:text-slate-500">
            {t("No promotional loyalty campaigns configured yet.", "لا توجد حملات ولاء ترويجية مضافة حالياً.")}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                offer.isActive
                  ? "bg-white dark:bg-[#0E0D16] border-purple-200/80 dark:border-purple-800/50 shadow-xs"
                  : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 font-semibold text-xs border border-purple-200/60 dark:border-purple-800/50">
                    {dir === "rtl" ? offer.badgeAr : offer.badgeEn}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offer.isActive}
                      onChange={() => handleToggleOffer(offer.id, offer.isActive)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#4F2396]"></div>
                  </label>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {dir === "rtl" ? offer.titleAr : offer.titleEn}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {dir === "rtl" ? offer.descriptionAr : offer.descriptionEn}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{t("Multiplier:", "المضاعف:")} <strong className="text-slate-800 dark:text-slate-200 font-mono">{offer.multiplier}X</strong></span>
                  {offer.bonusPoints ? <span>{t("Bonus:", "المكافأة:")} <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{offer.bonusPoints} {t("Pts", "نقطة")}</strong></span> : null}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  {offer.validUntil.slice(0, 10)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOffer(offer);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300 transition cursor-pointer"
                    title={t("Edit", "تعديل")}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                    title={t("Delete", "حذف")}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Modal for Edit / Add Campaign */}
      {modalOpen && editingOffer && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0E0D16] w-full max-w-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingOffer.id ? t("Edit Promotional Offer", "تعديل الحملة الترويجية") : t("New Promotional Offer", "إضافة عرض ترويجي")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingOffer(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t("Title (English)", "العنوان بالإنجليزية")}</label>
                  <input
                    required
                    value={editingOffer.titleEn || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, titleEn: e.target.value })}
                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t("Title (Arabic)", "العنوان بالعربية")}</label>
                  <input
                    required
                    value={editingOffer.titleAr || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, titleAr: e.target.value })}
                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t("Description (English)", "الوصف بالإنجليزية")}</label>
                  <textarea
                    rows={2}
                    value={editingOffer.descriptionEn || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, descriptionEn: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t("Description (Arabic)", "الوصف بالعربية")}</label>
                  <textarea
                    rows={2}
                    value={editingOffer.descriptionAr || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, descriptionAr: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t("Multiplier", "المضاعف")}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={editingOffer.multiplier || 1}
                    onChange={(e) => setEditingOffer({ ...editingOffer, multiplier: parseFloat(e.target.value) || 1 })}
                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t("Bonus Points", "نقاط إضافية")}</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={editingOffer.bonusPoints || 0}
                    onChange={(e) => setEditingOffer({ ...editingOffer, bonusPoints: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{t("Badge (EN)", "الشارة")}</label>
                  <input
                    value={editingOffer.badgeEn || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, badgeEn: e.target.value })}
                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F2396]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingOffer(null);
                  }}
                  className="h-8 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  {t("Cancel", "إلغاء")}
                </button>
                <button
                  type="submit"
                  disabled={savingOffer}
                  className="h-8 px-4 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white text-xs font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {savingOffer ? t("Saving...", "جارٍ الحفظ...") : t("Save Campaign", "حفظ الحملة")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

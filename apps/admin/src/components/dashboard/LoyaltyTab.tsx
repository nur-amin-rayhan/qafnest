"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { LoyaltySettings, LoyaltyOffer } from "@/lib/services/adminLoyaltyService";

import { adminPath } from "@/lib/adminUrl";
interface LoyaltyTabProps {
  triggerToast: (msg: string) => void;
}

export default function LoyaltyTab({ triggerToast }: LoyaltyTabProps) {
  const { dir, t } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState<LoyaltySettings>({
    loyaltyEnabled: true,
    standardEarnRate: 1,
    walletPaymentMultiplier: 1.5,
    redemptionRatePoints: 100,
    redemptionRateSAR: 10,
  });
  const [offers, setOffers] = useState<LoyaltyOffer[]>([]);
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalBalance: 0,
    totalPoints: 0,
    totalCards: 0,
  });

  // Modal for new/edit offer
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<LoyaltyOffer> | null>(null);

  const fetchLoyaltyData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(adminPath("/api/admin/loyalty"));
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (Array.isArray(data.offers)) setOffers(data.offers);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      triggerToast(t("Failed to load loyalty configuration", "تعذر تحميل إعدادات برنامج الولاء"));
    } finally {
      setLoading(false);
    }
  }, [triggerToast, t]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div dir={dir} className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-sm text-[11px] text-primary uppercase font-bold tracking-wider">
              {t("Guest Rewards & Retention", "مكافآت الضيوف والولاء")}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                settings.loyaltyEnabled
                  ? "bg-status-emerald/15 text-status-emerald"
                  : "bg-status-amber/15 text-status-amber"
              }`}
            >
              {settings.loyaltyEnabled
                ? t("Loyalty System Active", "نظام الولاء مفعل")
                : t("Loyalty Paused", "نظام الولاء معلق")}
            </span>
          </div>
          <h1 className="font-display-md text-2xl font-black text-on-surface">
            {t("Loyalty Points & Wallet Campaigns", "نقاط الولاء وحملات المحفظة الرقمية")}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
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
            className="h-10 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-2 hover:bg-primary/90 transition shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>{t("New Campaign Offer", "إضافة حملة ترويجية")}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-outline mb-1">
            <span className="text-xs font-semibold">{t("Active Wallets", "محافظ نشطة")}</span>
            <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span>
          </div>
          <div className="text-xl font-black text-on-surface">{stats.totalWallets}</div>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {t("Registered guest wallets", "محافظ الضيوف المسجلة")}
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-outline mb-1">
            <span className="text-xs font-semibold">{t("Points in Circulation", "النقاط المتداولة")}</span>
            <span className="material-symbols-outlined text-[18px] text-amber-500">stars</span>
          </div>
          <div className="text-xl font-black text-on-surface">{stats.totalPoints.toLocaleString()} Pts</div>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {t("Earned & ready to redeem", "مكتسبة وجاهزة للاستبدال")}
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-outline mb-1">
            <span className="text-xs font-semibold">{t("Wallet Balance", "رصيد المحافظ")}</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">payments</span>
          </div>
          <div className="text-xl font-black text-on-surface">{stats.totalBalance.toFixed(2)} SAR</div>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {t("Direct booking credits", "رصيد حجز متاح")}
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-outline mb-1">
            <span className="text-xs font-semibold">{t("Saved Cards on File", "بطاقات محفوظة")}</span>
            <span className="material-symbols-outlined text-[18px] text-violet-600">credit_card</span>
          </div>
          <div className="text-xl font-black text-on-surface">{stats.totalCards} Cards</div>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {t("One-click checkout enabled", "دفع فوري مفعل")}
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div>
            <h2 className="font-title-md text-base font-bold text-on-surface">
              {t("Loyalty Program Configuration", "إعدادات برنامج المكافآت")}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
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
            <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ms-3 text-xs font-bold text-on-surface">
              {settings.loyaltyEnabled ? t("Program Enabled", "البرنامج مفعّل") : t("Program Disabled", "البرنامج معطّل")}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Setting 1: Standard Earn Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>{t("Standard Earn Rate", "معدل الكسب الأساسي")}</span>
              <span className="text-[10px] text-outline font-normal">{t("Pts / 1 SAR", "نقطة / 1 ر.س")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={settings.standardEarnRate}
                onChange={(e) => setSettings({ ...settings, standardEarnRate: parseFloat(e.target.value) || 1 })}
                className="w-full h-10 px-3.5 pe-14 rounded-xl bg-surface-container-low border border-surface-container text-xs font-bold text-on-surface outline-none focus:border-primary"
              />
              <span className="absolute end-3 top-2.5 text-xs font-semibold text-outline">{t("Pts/SAR", "نقطة/ر.س")}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              {t("Guest earns 1 Point per 1 SAR spent on regular checkout.", "يحصل الضيف على نقطة واحدة لكل ريال يُنفق.")}
            </p>
          </div>

          {/* Setting 2: Wallet Bonus Multiplier */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>{t("Wallet Multiplier", "مضاعف الدفع بالمحفظة")}</span>
              <span className="text-[10px] text-status-emerald font-bold">{t("1.5X Default", "1.5× افتراضياً")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={settings.walletPaymentMultiplier}
                onChange={(e) => setSettings({ ...settings, walletPaymentMultiplier: parseFloat(e.target.value) || 1.5 })}
                className="w-full h-10 px-3.5 pe-10 rounded-xl bg-surface-container-low border border-surface-container text-xs font-bold text-on-surface outline-none focus:border-primary"
              />
              <span className="absolute end-3 top-2.5 text-xs font-semibold text-outline">X</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              {t("Bonus multiplier applied when paying with digital wallet.", "مضاعف يمنح نقاطاً أكثر عند الدفع من رصيد المحفظة.")}
            </p>
          </div>

          {/* Setting 3: Redemption Points */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>{t("Redemption Points", "نقاط الاستبدال")}</span>
              <span className="text-[10px] text-outline font-normal">{t("Points", "نقاط")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="10"
                min="50"
                max="1000"
                value={settings.redemptionRatePoints}
                onChange={(e) => setSettings({ ...settings, redemptionRatePoints: parseInt(e.target.value, 10) || 100 })}
                className="w-full h-10 px-3.5 pe-12 rounded-xl bg-surface-container-low border border-surface-container text-xs font-bold text-on-surface outline-none focus:border-primary"
              />
              <span className="absolute end-3 top-2.5 text-xs font-semibold text-outline">{t("Pts", "نقطة")}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              {t("Number of points required per conversion tier.", "عدد النقاط المطلوب لكل فئة استبدال.")}
            </p>
          </div>

          {/* Setting 4: Redemption Cash Value */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>{t("Redemption Value", "قيمة الاستبدال")}</span>
              <span className="text-[10px] text-outline font-normal">{t("SAR", "ر.س")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={settings.redemptionRateSAR}
                onChange={(e) => setSettings({ ...settings, redemptionRateSAR: parseFloat(e.target.value) || 10 })}
                className="w-full h-10 px-3.5 pe-12 rounded-xl bg-surface-container-low border border-surface-container text-xs font-bold text-on-surface outline-none focus:border-primary"
              />
              <span className="absolute end-3 top-2.5 text-xs font-semibold text-outline">SAR</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
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
            className="h-10 px-5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-2 hover:bg-primary/90 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {savingSettings && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
            <span>{t("Save Loyalty Settings", "حفظ إعدادات الولاء")}</span>
          </button>
        </div>
      </form>

      {/* Campaigns & Promotional Multipliers List */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-title-md text-base font-bold text-on-surface">
              {t("Active Promotional Campaigns", "الحملات الترويجية ومكافآت الحجز")}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t(
                "Promotional cards displayed to guests during reservation checkout and inside their wallet.",
                "العروض الترويجية التي تظهر للضيوف أثناء الدفع وفي صفحة المحفظة."
              )}
            </p>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-surface-container bg-surface-container-low/40 text-xs text-outline">
            {t("No promotional loyalty campaigns configured yet.", "لا توجد حملات ولاء ترويجية مضافة حالياً.")}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                offer.isActive
                  ? "bg-surface-container-low/70 border-primary/20 shadow-xs"
                  : "bg-surface-container-lowest border-surface-container opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                    {dir === "rtl" ? offer.badgeAr : offer.badgeEn}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offer.isActive}
                      onChange={() => handleToggleOffer(offer.id, offer.isActive)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <h3 className="text-xs font-bold text-on-surface">
                  {dir === "rtl" ? offer.titleAr : offer.titleEn}
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                  {dir === "rtl" ? offer.descriptionAr : offer.descriptionEn}
                </p>

                <div className="mt-3 flex items-center gap-3 text-[10px] text-outline font-semibold">
                  <span>{t("Multiplier:", "المضاعف:")} {offer.multiplier}X</span>
                  {offer.bonusPoints ? <span>{t("Bonus:", "المكافأة:")} +{offer.bonusPoints} {t("Pts", "نقطة")}</span> : null}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
                <span className="text-[10px] text-outline">
                  {offer.validUntil.slice(0, 10)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOffer(offer);
                      setModalOpen(true);
                    }}
                    className="p-1 rounded text-outline hover:text-primary transition cursor-pointer"
                    title={t("Edit", "تعديل")}
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-1 rounded text-outline hover:text-error transition cursor-pointer"
                    title={t("Delete", "حذف")}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl border border-surface-container p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <h3 className="font-title-md text-base font-bold text-on-surface">
                {editingOffer.id ? t("Edit Promotional Offer", "تعديل الحملة الترويجية") : t("New Promotional Offer", "إضافة عرض ترويجي")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingOffer(null);
                }}
                className="text-outline hover:text-on-surface transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">{t("Title (English)", "العنوان بالإنجليزية")}</label>
                  <input
                    required
                    value={editingOffer.titleEn || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, titleEn: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">{t("Title (Arabic)", "العنوان بالعربية")}</label>
                  <input
                    required
                    value={editingOffer.titleAr || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, titleAr: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">{t("Description (English)", "الوصف بالإنجليزية")}</label>
                  <textarea
                    rows={2}
                    value={editingOffer.descriptionEn || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, descriptionEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">{t("Description (Arabic)", "الوصف بالعربية")}</label>
                  <textarea
                    rows={2}
                    value={editingOffer.descriptionAr || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, descriptionAr: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">{t("Multiplier", "المضاعف")}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={editingOffer.multiplier || 1}
                    onChange={(e) => setEditingOffer({ ...editingOffer, multiplier: parseFloat(e.target.value) || 1 })}
                    className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">{t("Bonus Points", "نقاط إضافية")}</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={editingOffer.bonusPoints || 0}
                    onChange={(e) => setEditingOffer({ ...editingOffer, bonusPoints: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">{t("Badge (EN)", "الشارة")}</label>
                  <input
                    value={editingOffer.badgeEn || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, badgeEn: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingOffer(null);
                  }}
                  className="h-9 px-4 rounded-xl border border-surface-container text-xs font-semibold text-outline hover:bg-surface-container-low cursor-pointer"
                >
                  {t("Cancel", "إلغاء")}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 cursor-pointer"
                >
                  {t("Save Campaign", "حفظ الحملة")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

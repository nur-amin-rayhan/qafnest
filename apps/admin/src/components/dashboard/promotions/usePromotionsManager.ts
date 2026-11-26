"use client";

import { useState, useEffect, useMemo } from "react";
import type { AdminCoupon } from "../PromotionsTab";
import { useCouponModalForm } from "./useCouponModalForm";

import { adminPath } from "@/lib/adminUrl";

// Module-level in-memory cache for instant promotions rendering
let cachedCoupons: AdminCoupon[] | null = null;
let cachedPromotionsEnabled = true;

export function updateCachedCoupons(newCoupons: AdminCoupon[]) {
  cachedCoupons = newCoupons;
}

interface UsePromotionsManagerOptions {
  triggerToast: (msg: string) => void;
  t: (en: string, ar: string) => string;
}

export function usePromotionsManager({ triggerToast, t }: UsePromotionsManagerOptions) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>(() => cachedCoupons || []);
  const [promotionsEnabled, setPromotionsEnabled] = useState(() => cachedPromotionsEnabled);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const modalForm = useCouponModalForm({ setCoupons, triggerToast, t });

  // Load live coupons on mount
  useEffect(() => {
    async function fetchCoupons() {
      const isSilent = Boolean(cachedCoupons !== null);
      if (!isSilent) {
        setLoading(true);
      }
      try {
        const res = await fetch(adminPath("/api/admin/coupons"));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.coupons)) {
            setCoupons(data.coupons);
            cachedCoupons = data.coupons;
          }
          if (typeof data.promotionsEnabled === "boolean") {
            setPromotionsEnabled(data.promotionsEnabled);
            cachedPromotionsEnabled = data.promotionsEnabled;
          }
        }
      } catch {
        // Fallback to defaults
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    }
    fetchCoupons();
  }, []);

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
      if (filterStatus === "active" && (!c.is_active || isExpired)) return false;
      if (filterStatus === "paused" && (c.is_active || isExpired)) return false;
      if (filterStatus === "expired" && !isExpired) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(q);
        const descMatch =
          (c.description_en || "").toLowerCase().includes(q) ||
          (c.description_ar || "").toLowerCase().includes(q);
        if (!codeMatch && !descMatch) return false;
      }

      return true;
    });
  }, [coupons, filterStatus, searchQuery]);

  // Aggregate stats
  const totalActive = coupons.filter((c) => c.is_active).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
  const totalEstSavings = coupons.reduce(
    (sum, c) => sum + (c.used_count || 0) * (c.type === "fixed" ? c.value : 120),
    0
  );

  // Toggle Global Promo System
  const handleToggleGlobalSystem = async () => {
    const newState = !promotionsEnabled;
    setPromotionsEnabled(newState);
    try {
      await fetch(adminPath("/api/admin/coupons/toggle"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "global", enabled: newState }),
      });
      triggerToast(
        newState
          ? t("Promotion engine activated platform-wide.", "تم تفعيل نظام العروض والخصومات بالكامل.")
          : t("Promotion engine paused platform-wide.", "تم إيقاف نظام العروض مؤقتاً في المنصة.")
      );
    } catch {
      triggerToast(t("Saved system state locally.", "تم حفظ الحالة محلياً."));
    }
  };

  // Toggle Single Coupon Status
  const handleToggleCouponStatus = async (coupon: AdminCoupon) => {
    const updatedStatus = !coupon.is_active;
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: updatedStatus } : c))
    );

    try {
      await fetch(adminPath("/api/admin/coupons/toggle"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "coupon", couponId: coupon.id, enabled: updatedStatus }),
      });
      triggerToast(
        updatedStatus
          ? t(`Coupon ${coupon.code} activated.`, `تم تفعيل كود الخصم ${coupon.code}.`)
          : t(`Coupon ${coupon.code} paused.`, `تم إيقاف كود الخصم ${coupon.code}.`)
      );
    } catch {
      triggerToast(t("Updated coupon state locally.", "تم تحديث حالة الكود محلياً."));
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (c: AdminCoupon) => {
    if (
      !confirm(
        t(
          `Are you sure you want to delete promo code ${c.code}?`,
          `هل أنت متأكد من رغبتك في حذف الكود ${c.code}؟`
        )
      )
    ) {
      return;
    }

    setCoupons((prev) => prev.filter((item) => item.id !== c.id));
    try {
      await fetch(adminPath(`/api/admin/coupons?id=${encodeURIComponent(c.id)}`), { method: "DELETE" });
      triggerToast(t(`Coupon ${c.code} deleted.`, `تم حذف الكود ${c.code}.`));
    } catch {
      triggerToast(t("Deleted coupon locally.", "تم حذف الكود محلياً."));
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      triggerToast(t(`Code ${code} copied to clipboard!`, `تم نسخ الكود ${code} إلى الحافظة!`));
    }
  };

  return {
    coupons,
    promotionsEnabled,
    loading,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredCoupons,
    totalActive,
    totalRedemptions,
    totalEstSavings,
    ...modalForm,
    handleToggleGlobalSystem,
    handleToggleCouponStatus,
    handleDeleteCoupon,
    handleCopyCode,
  };
}

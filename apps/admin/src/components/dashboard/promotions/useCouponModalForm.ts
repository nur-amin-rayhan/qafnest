"use client";

import { useState } from "react";
import type { AdminCoupon } from "../PromotionsTab";
import { updateCachedCoupons } from "./usePromotionsManager";

import { adminPath } from "@/lib/adminUrl";
interface UseCouponModalFormOptions {
  setCoupons: React.Dispatch<React.SetStateAction<AdminCoupon[]>>;
  triggerToast: (msg: string) => void;
  t: (en: string, ar: string) => string;
}

export function useCouponModalForm({
  setCoupons,
  triggerToast,
  t,
}: UseCouponModalFormOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState("10");
  const [formMinSpend, setFormMinSpend] = useState("200");
  const [formMaxDiscount, setFormMaxDiscount] = useState("300");
  const [formMinNights, setFormMinNights] = useState("1");
  const [formUsageLimit, setFormUsageLimit] = useState("500");
  const [formDescEn, setFormDescEn] = useState("");
  const [formDescAr, setFormDescAr] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("2026-12-31");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormType("percentage");
    setFormValue("10");
    setFormMinSpend("200");
    setFormMaxDiscount("300");
    setFormMinNights("1");
    setFormUsageLimit("500");
    setFormDescEn("");
    setFormDescAr("");
    setFormExpiresAt("2026-12-31");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: AdminCoupon) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormType(c.type);
    setFormValue(String(c.value));
    setFormMinSpend(String(c.min_spend || "0"));
    setFormMaxDiscount(c.max_discount ? String(c.max_discount) : "");
    setFormMinNights(String(c.min_nights || "1"));
    setFormUsageLimit(c.usage_limit ? String(c.usage_limit) : "");
    setFormDescEn(c.description_en || "");
    setFormDescAr(c.description_ar || "");
    setFormExpiresAt(c.expires_at ? c.expires_at.slice(0, 10) : "2026-12-31");
    setFormIsActive(c.is_active);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) return;

    setIsSaving(true);
    const payload = {
      id: editingCoupon?.id,
      code: cleanCode,
      type: formType,
      value: Number(formValue),
      minSpend: Number(formMinSpend) || 0,
      maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
      minNights: Number(formMinNights) || 1,
      usageLimit: formUsageLimit ? Number(formUsageLimit) : undefined,
      descriptionEn:
        formDescEn.trim() ||
        `${formValue}${formType === "percentage" ? "%" : " SAR"} promo discount`,
      descriptionAr:
        formDescAr.trim() ||
        `خصم ترويجي بقيمة ${formValue} ${formType === "percentage" ? "%" : "ر.س"}`,
      expiresAt: `${formExpiresAt}T20:59:59Z`,
      isActive: formIsActive,
    };

    try {
      const endpoint = adminPath("/api/admin/coupons");
      const method = editingCoupon ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const saved: AdminCoupon = data.coupon;
        if (editingCoupon) {
          setCoupons((prev) => {
            const next = prev.map((c) => (c.id === editingCoupon.id ? { ...c, ...saved } : c));
            updateCachedCoupons(next);
            return next;
          });
          triggerToast(
            t(`Coupon ${cleanCode} updated successfully.`, `تم تحديث كود ${cleanCode} بنجاح.`)
          );
        } else {
          setCoupons((prev) => {
            const next = [saved, ...prev];
            updateCachedCoupons(next);
            return next;
          });
          triggerToast(
            t(`Coupon ${cleanCode} created successfully.`, `تم إنشاء كود ${cleanCode} بنجاح.`)
          );
        }
        setIsModalOpen(false);
      } else {
        triggerToast(t("Failed to save coupon to server.", "تعذر حفظ الكود في السيرفر."));
      }
    } catch {
      // Local fallback
      if (editingCoupon) {
        setCoupons((prev) => {
          const next = prev.map((c) =>
            c.id === editingCoupon.id
              ? {
                  ...c,
                  code: cleanCode,
                  type: formType,
                  value: Number(formValue),
                  min_spend: Number(formMinSpend) || 0,
                  max_discount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
                  min_nights: Number(formMinNights) || 1,
                  usage_limit: formUsageLimit ? Number(formUsageLimit) : undefined,
                  description_en: formDescEn.trim() || c.description_en,
                  description_ar: formDescAr.trim() || c.description_ar,
                  expires_at: `${formExpiresAt}T20:59:59Z`,
                  is_active: formIsActive,
                  updated_at: new Date().toISOString(),
                }
              : c
          );
          updateCachedCoupons(next);
          return next;
        });
        triggerToast(t("Coupon updated locally.", "تم تحديث الكود محلياً."));
      } else {
        const newC: AdminCoupon = {
          id: `coup-${Date.now()}`,
          code: cleanCode,
          type: formType,
          value: Number(formValue),
          min_spend: Number(formMinSpend) || 0,
          max_discount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
          min_nights: Number(formMinNights) || 1,
          usage_limit: formUsageLimit ? Number(formUsageLimit) : undefined,
          used_count: 0,
          is_active: formIsActive,
          description_en:
            formDescEn || `${formValue}${formType === "percentage" ? "%" : " SAR"} discount`,
          description_ar:
            formDescAr || `خصم ${formValue} ${formType === "percentage" ? "%" : "ر.س"}`,
          expires_at: `${formExpiresAt}T20:59:59Z`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCoupons((prev) => [newC, ...prev]);
        triggerToast(t("Coupon created locally.", "تم إنشاء الكود محلياً."));
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    editingCoupon,
    formCode,
    setFormCode,
    formType,
    setFormType,
    formValue,
    setFormValue,
    formMinSpend,
    setFormMinSpend,
    formMaxDiscount,
    setFormMaxDiscount,
    formMinNights,
    setFormMinNights,
    formUsageLimit,
    setFormUsageLimit,
    formDescEn,
    setFormDescEn,
    formDescAr,
    setFormDescAr,
    formExpiresAt,
    setFormExpiresAt,
    formIsActive,
    setFormIsActive,
    isSaving,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveCoupon,
  };
}


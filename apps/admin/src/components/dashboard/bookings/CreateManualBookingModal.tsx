"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  X,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  Copy,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { PropertyItem } from "../types";

import { adminPath } from "@/lib/adminUrl";
interface QuotePricing {
  listingAmountSar: number;
  calculatedListingSar: number;
  guestServiceFeePercent: number;
  guestServiceFeeSar: number;
  vatRatePercent: number;
  vatAmountSar: number;
  guestTotalSar: number;
  hostCommissionPercent: number;
  hostNetPayoutSar: number;
}

interface CreatedBookingSummary {
  booking_reference: string;
  guest_name: string;
  guest_phone: string;
  property_title: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  payment_status: string;
  smart_lock_pin?: string | null;
}

interface CreateManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyItem[];
  onBookingCreated: () => Promise<void> | void;
  triggerToast: (msg: string) => void;
  t: (en: string, ar: string) => string;
}

function getDefaultIsoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function CreateManualBookingModal({
  isOpen,
  onClose,
  properties,
  onBookingCreated,
  triggerToast,
  t: propT,
}: CreateManualBookingModalProps) {
  const { dir, t: authT } = useAdminAuth();
  const t = propT || authT;
  const approvedProps = useMemo(
    () => properties.filter((p) => p.is_approved || p.status === "approved"),
    [properties]
  );

  const [propSearch, setPropSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const [checkIn, setCheckIn] = useState<string>(() => getDefaultIsoDate(1));
  const [checkOut, setCheckOut] = useState<string>(() => getDefaultIsoDate(2));
  const [staySlot, setStaySlot] = useState<"overnight" | "12h">("overnight");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [overrideListingPrice, setOverrideListingPrice] = useState<string>("");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("+966");
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentMode, setPaymentMode] = useState<"pending_sadad" | "confirmed_paid">("pending_sadad");

  const [checkingSlot, setCheckingSlot] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState<boolean | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [nightsCount, setNightsCount] = useState<number>(1);
  const [quote, setQuote] = useState<QuotePricing | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<CreatedBookingSummary | null>(null);

  useEffect(() => {
    if (isOpen && !selectedPropertyId && approvedProps.length > 0) {
      setSelectedPropertyId(approvedProps[0].id);
    }
  }, [isOpen, selectedPropertyId, approvedProps]);

  const cities = useMemo(() => {
    const s = new Set<string>();
    for (const p of approvedProps) {
      const c = (p.city_name || p.city || "").trim();
      if (c) s.add(c);
    }
    return Array.from(s).sort();
  }, [approvedProps]);

  const filteredProperties = useMemo(() => {
    return approvedProps.filter((p) => {
      if (cityFilter !== "all") {
        const c = (p.city_name || p.city || "").trim();
        if (c !== cityFilter) return false;
      }
      if (propSearch.trim()) {
        const q = propSearch.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.city_name || p.city || "").toLowerCase().includes(q) ||
          (p.district || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [approvedProps, cityFilter, propSearch]);

  const selectedProp = useMemo(
    () => approvedProps.find((p) => p.id === selectedPropertyId) || null,
    [approvedProps, selectedPropertyId]
  );

  useEffect(() => {
    if (!isOpen || !selectedPropertyId || !checkIn) return;
    const effectiveCheckOut = staySlot === "12h" ? checkIn : checkOut;
    if (!effectiveCheckOut || effectiveCheckOut < checkIn) {
      setSlotAvailable(false);
      setConflictMessage("Check-out must be on or after check-in.");
      setQuote(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSlot(true);
      setConflictMessage(null);
      try {
        const params = new URLSearchParams({
          propertyId: selectedPropertyId,
          checkIn,
          checkOut: effectiveCheckOut,
          checkinTime: staySlot === "12h" ? "00:00" : "15:00",
          checkoutTime: "12:00",
        });
        if (overrideListingPrice && Number(overrideListingPrice) > 0) {
          params.set("overrideListingPrice", overrideListingPrice.trim());
        }
        const res = await fetch(adminPath(`/api/admin/bookings?${params.toString()}`), { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSlotAvailable(false);
          setConflictMessage(data.message || "Invalid stay dates.");
          setQuote(null);
        } else {
          setSlotAvailable(Boolean(data.available));
          setNightsCount(Number(data.nights) || 1);
          setQuote(data.pricing || null);
          if (!data.available) {
            setConflictMessage(
              data.conflictingRef
                ? `Conflict with booking #${data.conflictingRef}`
                : data.blockedDateConflict
                ? `Host blocked date (${data.blockedDateConflict})`
                : "Selected dates unavailable."
            );
          }
        }
      } catch {
        if (!cancelled) {
          setConflictMessage("Could not verify availability.");
        }
      } finally {
        if (!cancelled) setCheckingSlot(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, selectedPropertyId, checkIn, checkOut, staySlot, overrideListingPrice]);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setCreatedBooking(null);
    setSubmitError(null);
    setGuestName("");
    setGuestPhone("+966");
    setGuestEmail("");
    setOverrideListingPrice("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedPropertyId) {
      setSubmitError(t("Please select a property.", "يرجى اختيار العقار."));
      return;
    }
    if (!guestName.trim() || guestPhone.replace(/\D/g, "").length < 8) {
      setSubmitError(t("Enter customer full name and a valid phone number.", "يرجى إدخال اسم العميل ورقم جوال صحيح."));
      return;
    }

    setSubmitting(true);
    try {
      const effectiveCheckOut = staySlot === "12h" ? checkIn : checkOut;
      const res = await fetch(adminPath("/api/admin/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim() || undefined,
          checkIn,
          checkOut: effectiveCheckOut,
          checkinTime: staySlot === "12h" ? "00:00" : "15:00",
          checkoutTime: "12:00",
          guestsCount,
          paymentMode,
          overrideListingPrice:
            overrideListingPrice && Number(overrideListingPrice) > 0
              ? Number(overrideListingPrice)
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || t("Could not create helpline booking.", "تعذر إنشاء الحجز الهاتفي."));
        return;
      }

      setCreatedBooking(data.booking);
      triggerToast(data.message || t("Helpline booking created.", "تم إنشاء الحجز الهاتفي."));
      await onBookingCreated();
    } catch {
      setSubmitError(t("Network error creating helpline booking.", "خطأ في الشبكة أثناء إنشاء الحجز."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyBookingDetails = () => {
    if (!createdBooking || typeof navigator === "undefined") return;
    const msg = [
      `${t("QafNest Booking Ref:", "مرجع قاف نست:")} ${createdBooking.booking_reference}`,
      `${t("Property:", "العقار:")} ${createdBooking.property_title}`,
      `${t("Stay:", "الإقامة:")} ${createdBooking.check_in} -> ${createdBooking.check_out}`,
      `${t("Total Due:", "المبلغ الإجمالي:")} ${Number(createdBooking.total_price).toFixed(2)} ${t("SAR", "ر.س")}`,
      createdBooking.status === "pending"
        ? t("Status: Pending SADAD Payment", "الحالة: بانتظار دفع سداد")
        : `${t("Status: Confirmed (PIN:", "الحالة: مؤكد (رمز القفل:")} ${createdBooking.smart_lock_pin || t("Assigned", "تم التعيين")})`,
    ].join("\n");
    navigator.clipboard.writeText(msg);
    triggerToast(t("Booking summary copied for customer.", "تم نسخ ملخص الحجز للعميل."));
  };

  return (
    <div dir={dir} className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-2xl p-6 sm:p-7 space-y-5 text-on-surface">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-surface-container pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <PhoneCall size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-on-surface">
                {t("Create Helpline / Phone Booking", "إنشاء حجز يدوي عبر الهاتف")}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t(
                  "Search available units, lock dates while on the call, and hold awaiting SADAD payment or confirm immediately.",
                  "ابحث عن الوحدات المتاحة واحجز التواريخ فوراً للعميل مع تعليق الدفع عبر سداد أو التأكيد المباشر."
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl text-outline hover:bg-surface-container cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {createdBooking ? (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-base">
                <CheckCircle2 size={20} className="text-status-emerald" />
                <span>
                  {createdBooking.status === "pending"
                    ? t("Room Held — Ready for SADAD Payment", "تم حجز الوحدة مؤقتاً — بانتظار الدفع عبر سداد")
                    : t("Booking Confirmed & Locked", "تم تأكيد الحجز وإصدار التصريح")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="rounded-xl bg-white p-3 border border-emerald-100">
                  <span className="text-[10px] text-outline uppercase font-bold block">{t("Booking Ref", "رقم المرجع")}</span>
                  <span className="font-mono font-black text-sm text-primary">
                    {createdBooking.booking_reference}
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-emerald-100">
                  <span className="text-[10px] text-outline uppercase font-bold block">{t("Total Payable", "المبلغ المستحق")}</span>
                  <span className="font-mono font-black text-sm text-on-surface">
                    {Number(createdBooking.total_price).toFixed(2)} {t("SAR", "ر.س")}
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-emerald-100">
                  <span className="text-[10px] text-outline uppercase font-bold block">{t("Stay Dates", "تواريخ الإقامة")}</span>
                  <span className="font-semibold text-on-surface block" dir="ltr">
                    {createdBooking.check_in} → {createdBooking.check_out}
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-emerald-100">
                  <span className="text-[10px] text-outline uppercase font-bold block">{t("State", "الحالة")}</span>
                  <span className="font-bold text-amber-700 uppercase">
                    {createdBooking.status === "pending"
                      ? t("Pending SADAD", "بانتظار سداد")
                      : t("Confirmed", "مؤكد")}
                  </span>
                </div>
              </div>

              <p className="text-xs text-emerald-900">
                {t("Customer:", "الضيف:")} <strong>{createdBooking.guest_name}</strong> ({createdBooking.guest_phone}) · {t("Property:", "العقار:")}{" "}
                <strong>{createdBooking.property_title}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyBookingDetails}
                className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-4 py-2 text-xs font-bold cursor-pointer"
              >
                <Copy size={14} /> <span>{t("Copy Summary for Caller", "نسخ ملخص الحجز للمتصل")}</span>
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container text-on-primary px-5 py-2 text-xs font-bold cursor-pointer"
              >
                {t("Done", "تم")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Step 1: Quick Property Finder */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                  {t("1. Select Property / Unit", "١. اختر العقار / الوحدة")}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-surface-container-high bg-surface-container-low px-2.5 py-1.5 gap-1.5 focus-within:border-primary">
                    <Search size={13} className="text-outline shrink-0" />
                    <input
                      type="text"
                      value={propSearch}
                      onChange={(e) => setPropSearch(e.target.value)}
                      placeholder={t("Search city or unit...", "ابحث بالمدينة أو العقار...")}
                      className="bg-transparent text-xs outline-none w-36 sm:w-44"
                    />
                  </div>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="rounded-xl border border-surface-container-high bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="all">{t("All Cities", "كل المدن")}</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-0.5">
                {filteredProperties.map((p) => {
                  const active = p.id === selectedPropertyId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-testid={`manual-booking-prop-${p.id}`}
                      onClick={() => setSelectedPropertyId(p.id)}
                      className={`text-start rounded-xl border p-2.5 transition cursor-pointer ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-surface-container-high bg-surface-container-low hover:bg-surface-container"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-on-surface truncate">{p.title}</span>
                        <span className="font-mono text-[11px] font-bold text-primary shrink-0">
                          {Number(p.base_price || 0)} {t("SAR", "ر.س")}
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant block truncate mt-0.5">
                        {p.city_name || p.city || t("KSA", "السعودية")} · {p.category || t("Unit", "وحدة")}
                      </span>
                    </button>
                  );
                })}
                {filteredProperties.length === 0 && (
                  <div className="col-span-full py-4 text-center text-xs text-outline">
                    {t("No approved properties match filter.", "لا توجد وحدات معتمدة مطابقة للبحث.")}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Stay Dates, Slot & Price Quote */}
            <div className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  {t("2. Stay Window & Live Quote", "٢. فترة الإقامة والتسعيرة المباشرة")} {selectedProp ? `(${selectedProp.title})` : ""}
                </span>
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setStaySlot("overnight");
                      if (checkOut <= checkIn) setCheckOut(getDefaultIsoDate(2));
                    }}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      staySlot === "overnight" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant"
                    }`}
                  >
                    {t("Overnight Stay", "إقامة ليلية")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaySlot("12h");
                      setCheckOut(checkIn);
                    }}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      staySlot === "12h" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant"
                    }`}
                  >
                    {t("12h Same-Day (12am–12pm)", "فترة نهارية ١٢ ساعة")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1">{t("Check-In Date", "تاريخ الوصول")}</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (staySlot === "12h") setCheckOut(e.target.value);
                    }}
                    required
                    className="w-full rounded-xl border border-surface-container-high bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1">{t("Check-Out Date", "تاريخ المغادرة")}</label>
                  <input
                    type="date"
                    value={staySlot === "12h" ? checkIn : checkOut}
                    disabled={staySlot === "12h"}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="w-full rounded-xl border border-surface-container-high bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1 flex items-center gap-1">
                    <Users size={11} /> {t("Guests", "الضيوف")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-surface-container-high bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1">
                    {t("Deal Price Override (SAR)", "تعديل سعر الإقامة (ر.س)")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={overrideListingPrice}
                    onChange={(e) => setOverrideListingPrice(e.target.value)}
                    placeholder={quote ? String(quote.calculatedListingSar) : t("Auto rate", "سعر تلقائي")}
                    className="w-full rounded-xl border border-surface-container-high bg-white px-2.5 py-1.5 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Availability + Live Quote Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-container text-xs">
                <div className="flex items-center gap-2">
                  {checkingSlot ? (
                    <span className="text-outline font-semibold">{t("Checking live room availability...", "جاري التحقق من التوفر...")}</span>
                  ) : slotAvailable === true ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-bold">
                      <CheckCircle2 size={13} /> {t(`Slot Available (${nightsCount} ${nightsCount === 1 ? "night" : "nights"})`, `الفترة متاحة (${nightsCount} ليالي)`)}
                    </span>
                  ) : slotAvailable === false ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 font-bold">
                      <AlertTriangle size={13} /> {conflictMessage || t("Dates Unavailable", "التواريخ غير متاحة")}
                    </span>
                  ) : null}
                </div>

                {quote && (
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                    <span>{t("Stay:", "الإقامة:")} {quote.listingAmountSar.toFixed(2)}</span>
                    <span>
                      {t(`Fee (${quote.guestServiceFeePercent}%):`, `الرسوم (${quote.guestServiceFeePercent}%):`)} {quote.guestServiceFeeSar.toFixed(2)}
                    </span>
                    <span>
                      {t(`VAT (${quote.vatRatePercent}%):`, `الضريبة (${quote.vatRatePercent}%):`)} {quote.vatAmountSar.toFixed(2)}
                    </span>
                    <span className="font-black text-sm text-primary">
                      {t("Guest Total:", "الإجمالي:")} {quote.guestTotalSar.toFixed(2)} {t("SAR", "ر.س")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Caller Details & Booking Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-outline block mb-1">
                  {t("Customer Full Name *", "اسم العميل الكامل *")}
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t("e.g. Tariq Al-Qahtani", "مثال: طارق القحطاني")}
                  data-testid="manual-booking-guest-name"
                  className="w-full rounded-xl border border-surface-container-high bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-outline block mb-1">
                  {t("Saudi Mobile Number *", "رقم الجوال السعودي *")}
                </label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+9665XXXXXXXX"
                  dir="ltr"
                  data-testid="manual-booking-guest-phone"
                  className="w-full rounded-xl border border-surface-container-high bg-white px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-outline block mb-1">
                  {t("Customer Email (Optional)", "البريد الإلكتروني (اختياري)")}
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="guest@example.com"
                  dir="ltr"
                  className="w-full rounded-xl border border-surface-container-high bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMode("pending_sadad")}
                data-testid="manual-booking-mode-sadad"
                className={`rounded-2xl border p-3.5 text-start transition cursor-pointer ${
                  paymentMode === "pending_sadad"
                    ? "border-amber-400 bg-amber-50/70 ring-1 ring-amber-400"
                    : "border-surface-container-high bg-surface-container-low hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <Clock size={15} className="text-amber-600" />
                  <span>{t("Hold Room — Awaiting SADAD Payment", "حجز مؤقت — بانتظار الدفع عبر سداد")}</span>
                </div>
                <p className="text-[11px] text-amber-800/80 mt-1">
                  {t(
                    "Locks room on calendar as Pending SADAD and creates QAF reference to issue bill in payment step.",
                    "يغلق التقويم مؤقتاً بحالة بانتظار سداد وينشئ مرجع QAF لإصدار الفاتورة."
                  )}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("confirmed_paid")}
                data-testid="manual-booking-mode-confirmed"
                className={`rounded-2xl border p-3.5 text-start transition cursor-pointer ${
                  paymentMode === "confirmed_paid"
                    ? "border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-500"
                    : "border-surface-container-high bg-surface-container-low hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2 font-black text-emerald-900">
                  <ShieldCheck size={15} className="text-status-emerald" />
                  <span>{t("Confirm Immediately (Paid)", "تأكيد فوري (تم التحصيل)")}</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 mt-1">
                  {t(
                    "Marks stay Confirmed and credits Host & Platform financials now.",
                    "يعتمد الحجز فوراً ويرصد المستحقات في السجل المالي."
                  )}
                </p>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                {t("Cancel", "إلغاء")}
              </button>
              <button
                type="submit"
                disabled={submitting || slotAvailable === false}
                data-testid="manual-booking-submit-btn"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-black shadow hover:bg-primary transition cursor-pointer disabled:opacity-50"
              >
                <PhoneCall size={14} />
                <span>
                  {submitting
                    ? t("Creating Booking...", "جاري إنشاء الحجز...")
                    : paymentMode === "pending_sadad"
                    ? t("Hold Booking (Pending SADAD)", "تعليق الحجز (بانتظار سداد)")
                    : t("Create Confirmed Booking", "إنشاء حجز مؤكد")}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

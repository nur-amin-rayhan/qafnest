"use client";

import React, { useState } from "react";
import {
  X,
  KeyRound,
  CheckCircle2,
  Copy,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
  MapPin,
  Check,
  Lock,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import {
  buildBookingWhatsAppLocationUrl,
  buildLocationCopyText,
  formatPropertyAddressLine,
  resolvePropertyGoogleMapsUrl,
} from "@qafnest/shared";
import type { HostBookingItem } from "./types";

interface BookingDetailModalProps {
  booking: HostBookingItem | null;
  copiedPinId: string | null;
  actionLoadingId: string | null;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onClose: () => void;
  onCopyPin: (pin: string, id: string) => void;
  onSetManualPin?: (bookingId: string, pin: string) => void;
}

export function BookingDetailModal({
  booking,
  copiedPinId,
  actionLoadingId,
  lang,
  t,
  onClose,
  onCopyPin,
  onSetManualPin,
}: BookingDetailModalProps) {
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualPinInput, setManualPinInput] = useState("");
  const [manualPinError, setManualPinError] = useState<string | null>(null);
  const [copiedLocationMode, setCopiedLocationMode] = useState<"full" | "link" | null>(null);

  if (!booking) return null;

  const locationFields = {
    title: booking.propertyTitle,
    titleAr: booking.propertyTitleAr,
    city: booking.propertyCity,
    state: booking.propertyState,
    stateAr: booking.propertyStateAr,
    district: booking.propertyDistrict,
    districtAr: booking.propertyDistrictAr,
    street: booking.propertyStreet,
    streetAr: booking.propertyStreetAr,
    address: booking.propertyAddress,
    addressAr: booking.propertyAddressAr,
    postalCode: booking.propertyPostalCode,
    lat: booking.propertyLat,
    lng: booking.propertyLng,
    googleMapsUrl: booking.propertyGoogleMapsUrl,
  };

  const mapsUrl = resolvePropertyGoogleMapsUrl(locationFields);
  const formattedAddress = formatPropertyAddressLine(locationFields, lang);
  const copyLocationText = buildLocationCopyText(
    { ...locationFields, bookingRef: booking.booking_reference },
    lang
  );
  const waLink = buildBookingWhatsAppLocationUrl(
    {
      ...locationFields,
      recipientPhone: booking.guestPhone,
      guestName: booking.guestName,
      bookingRef: booking.booking_reference,
      smartLockPin: booking.smart_lock_pin,
    },
    lang
  );

  const handleCopyLocationFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(copyLocationText);
    setCopiedLocationMode("full");
    setTimeout(() => setCopiedLocationMode(null), 2200);
  };

  const handleCopyGoogleLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mapsUrl);
    setCopiedLocationMode("link");
    setTimeout(() => setCopiedLocationMode(null), 2200);
  };

  const handleSaveManualPin = () => {
    setManualPinError(null);
    const trimmed = manualPinInput.trim();
    if (!/^\d{4,12}$/.test(trimmed)) {
      setManualPinError(t("PIN must be at least 4 digits.", "يجب أن يتكون الرمز من 4 أرقام على الأقل."));
      return;
    }
    if (onSetManualPin) {
      onSetManualPin(booking.id, trimmed);
      setIsManualMode(false);
      setManualPinInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-[#4F2396] bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                {booking.booking_reference}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {booking.check_in} → {booking.check_out} ({booking.total_nights} {t("nights", "ليالٍ")})
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-1">
              {lang === "ar" ? booking.propertyTitleAr : booking.propertyTitle}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Smart Lock Section */}
        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#4F2396]">
              <KeyRound size={15} className="text-[#FF9750]" />
              <span>{t("Smart Lock Keyless Access", "الدخول الذاتي بالقفل الذكي")}</span>
            </div>
            {booking.status === "cancelled" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <Lock size={12} />
                <span>{t("PIN Generation Disabled", "إصدار الرمز معطل")}</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualMode(!isManualMode)}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-[#4F2396] hover:underline transition cursor-pointer"
                >
                  <Lock size={12} />
                  <span>
                    {isManualMode
                      ? t("Cancel", "إلغاء")
                      : booking.smart_lock_pin
                      ? t("Edit Manual PIN", "تعديل الرمز يدوياً")
                      : t("Set Manual PIN", "تعيين الرمز يدوياً")}
                  </span>
                </button>
              </div>
            )}
          </div>

          {isManualMode ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={8}
                  dir="ltr"
                  placeholder={t("Enter 4-8 digits", "أدخل من 4 إلى 8 أرقام")}
                  value={manualPinInput}
                  onChange={(e) => {
                    setManualPinInput(e.target.value.replace(/\D/g, ""));
                    setManualPinError(null);
                  }}
                  className="flex-1 rounded-xl border border-violet-300 bg-white px-3 py-1.5 font-mono text-base font-extrabold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                />
                <button
                  type="button"
                  onClick={handleSaveManualPin}
                  disabled={actionLoadingId === booking.id || manualPinInput.length < 4}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#4F2396] text-white px-3.5 py-1.5 text-xs font-black shadow-xs hover:bg-[#3d1a75] disabled:opacity-50 transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>{t("Save", "حفظ")}</span>
                </button>
              </div>
              {manualPinError && <p className="text-[11px] font-bold text-rose-600">{manualPinError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-2xl font-black tracking-widest text-[#4F2396] bg-white px-4 py-1.5 rounded-xl border border-violet-200">
                {booking.smart_lock_pin || "----"}
              </span>
              {booking.smart_lock_pin && (
                <button
                  type="button"
                  onClick={() => onCopyPin(booking.smart_lock_pin!, booking.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] text-white px-3.5 py-2 text-xs font-black shadow-xs hover:bg-[#3d1a75] cursor-pointer"
                >
                  {copiedPinId === booking.id ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  <span>{copiedPinId === booking.id ? t("Copied!", "تم النسخ!") : t("Copy Code", "نسخ الرمز")}</span>
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] font-semibold text-slate-500">
            {t("Activates 3:00 PM on check-in day, expires 12:00 PM on checkout.", "ينشط الرمز يوم الوصول الساعة 3:00 عصراً وينتهي 12:00 ظهراً يوم المغادرة.")}
          </p>
        </div>

        {/* Auto-populated Verified Guest Information */}
        <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-400">{t("Guest Information", "بيانات الضيف")}</h4>
            {booking.isGuestVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                <ShieldCheck size={12} className="text-emerald-700" />
                <span>{t("Verified Guest", "ضيف موثق")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-black">
                <span>{t("Registered", "مسجل")}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">{t("Guest Name", "اسم الضيف")}</span>
            <span className="font-black text-slate-900">{booking.guestName}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">{t("Phone Number", "رقم الجوال")}</span>
            <span className="font-mono text-slate-900" dir="ltr">{booking.guestPhone || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1">
              <Users size={13} className="text-slate-400" />
              <span>{t("Guest Count", "عدد الضيوف")}</span>
            </span>
            <span className="font-black text-slate-900">{booking.guests_count} {t("Persons", "أفراد")}</span>
          </div>

          {/* Direct Call Guest */}
          {booking.guestPhone && (
            <div className="pt-2">
              <a
                href={`tel:${booking.guestPhone}`}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-2.5 text-xs font-black shadow-xs transition cursor-pointer"
              >
                <Phone size={14} className="text-[#4F2396]" />
                <span>{t("Call Guest", "اتصال هاتفي بالضيف")}</span>
              </a>
            </div>
          )}
        </div>

        {/* Property Location & One-Click Sharing Actions */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <MapPin size={14} className="text-[#4F2396] shrink-0" />
              <span>{t("Property Location & Google Maps", "موقع العقار وخرائط جوجل")}</span>
            </h4>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-black text-[#4F2396] hover:bg-violet-50 transition"
            >
              <ExternalLink size={11} />
              <span>{t("Open Map", "فتح الخريطة")}</span>
            </a>
          </div>

          <p className="text-xs font-bold text-slate-700 leading-relaxed">{formattedAddress}</p>
          <p className="font-mono text-[11px] text-slate-500 truncate" dir="ltr">
            {mapsUrl}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyLocationFull}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-2.5 px-3 text-xs font-black shadow-xs transition cursor-pointer"
            >
              {copiedLocationMode === "full" ? (
                <CheckCircle2 size={13} className="text-emerald-600" />
              ) : (
                <Copy size={13} className="text-[#4F2396]" />
              )}
              <span>
                {copiedLocationMode === "full"
                  ? t("Copied!", "تم النسخ!")
                  : t("Copy Location", "نسخ الموقع")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyGoogleLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-2.5 px-3 text-xs font-black shadow-xs transition cursor-pointer"
            >
              {copiedLocationMode === "link" ? (
                <CheckCircle2 size={13} className="text-emerald-600" />
              ) : (
                <LinkIcon size={13} className="text-[#4F2396]" />
              )}
              <span>
                {copiedLocationMode === "link"
                  ? t("Link Copied!", "تم نسخ الرابط!")
                  : t("Copy Google Link", "نسخ رابط جوجل")}
              </span>
            </button>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-black shadow-xs transition cursor-pointer"
            >
              <MessageCircle size={13} />
              <span>{t("WhatsApp Location", "إرسال بالواتساب")}</span>
            </a>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs font-bold">
          <div className="flex items-center justify-between text-slate-600">
            <span>{booking.total_nights} {t("Nights stay", "ليالٍ إقامة")}</span>
            <span>{Number(booking.listingGross ?? booking.total_price ?? 0).toFixed(2)} {t("SAR", "ر.س")}</span>
          </div>
          {booking.commissionAmount !== undefined && (
            <div className="flex items-center justify-between text-rose-600">
              <span>
                {t(
                  `QafNest Service Fee (${booking.commissionRatePercent ?? 20}%)`,
                  `عمولة قاف نست (${booking.commissionRatePercent ?? 20}%)`
                )}
              </span>
              <span>- {(booking.commissionAmount || 0).toFixed(2)} {t("SAR", "ر.س")}</span>
            </div>
          )}
          {(booking.promoDiscountAmount || 0) > 0 && (
            <div className="flex items-center justify-between text-rose-600">
              <span>{t("Promo Code Discount", "خصم كود الترويج")}</span>
              <span>- {(booking.promoDiscountAmount || 0).toFixed(2)} {t("SAR", "ر.س")}</span>
            </div>
          )}
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-sm font-black text-slate-900">
            <span>{t("Net Host Payout", "صافي ربح المضيف")}</span>
            <span>{(booking.netPayout ?? Number(booking.listingGross ?? booking.total_price ?? 0)).toFixed(2)} {t("SAR", "ر.س")}</span>
          </div>
        </div>

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-black transition cursor-pointer"
        >
          {t("Close Window", "إغلاق النافذة")}
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Building2, Mail, MapPin, MessageCircle, Phone, ShieldCheck, User } from "lucide-react";
import type { SelectedBookingDetail } from "../types";

function formatWhatsappHref(rawPhone?: string): string | null {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits || digits.length < 7) return null;
  const normalized = digits.startsWith("05") ? `966${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

function ContactPhoneRow({
  phone,
  emptyLabel,
  t,
}: {
  phone?: string | null;
  emptyLabel: string;
  t: (en: string, ar: string) => string;
}) {
  const wa = formatWhatsappHref(phone || undefined);
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
      <div className="flex items-center gap-2 min-w-0">
        <Phone className="w-3.5 h-3.5 text-outline shrink-0" />
        <span className="font-mono font-bold text-on-surface truncate" dir="ltr">
          {phone || emptyLabel}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 print:hidden">
        {phone && phone !== "—" && (
          <a
            href={`tel:${phone}`}
            className="px-2 py-1 rounded-lg bg-surface-container-lowest border border-surface-container text-[11px] font-bold text-on-surface hover:bg-surface-container"
          >
            {t("Call", "اتصال")}
          </a>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
          >
            <MessageCircle className="w-3 h-3" />
            <span>{t("WhatsApp", "واتساب")}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function MaskedIdentityRow({ labelText, value }: { labelText: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="text-outline">{labelText}</span>
      </div>
      <span className="font-mono font-bold text-on-surface" dir="ltr">
        {value}
      </span>
    </div>
  );
}

export function BookingPartyCards({
  selectedBooking,
  formattedGuests,
  t,
}: {
  selectedBooking: SelectedBookingDetail;
  formattedGuests: string;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="lg:col-span-5 min-w-0 space-y-5">
      <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h3 className="font-title-sm text-sm font-black text-on-surface">
              {t("Guest Information (Payer)", "بيانات الضيف (دافع الحجز)")}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                selectedBooking.guestVerified
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-surface-container text-outline border-surface-container-high"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {selectedBooking.guestVerified ? t("Verified", "موثق") : t("Registered", "مسجل")}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              {formattedGuests}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm shrink-0">
            {(selectedBooking.guestName || "G")
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-base text-on-surface truncate">
              {selectedBooking.guestName || t("Verified Guest", "ضيف موثق")}
            </p>
            <p className="font-mono text-xs text-outline truncate">
              {t("Ref:", "المرجع:")} #{selectedBooking.id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 text-xs pt-1">
          <ContactPhoneRow phone={selectedBooking.phone} emptyLabel={t("No phone recorded", "لا يوجد رقم مسجل")} t={t} />
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
              <span className="text-on-surface font-medium truncate" dir="ltr">
                {selectedBooking.guestEmail || t("No email recorded", "لا يوجد بريد إلكتروني")}
              </span>
            </div>
          </div>
          {(selectedBooking.guestCity || selectedBooking.guestAddress) && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-low">
              <MapPin className="w-3.5 h-3.5 text-outline shrink-0 mt-0.5" />
              <span className="text-on-surface font-medium break-words">
                {[selectedBooking.guestCity, selectedBooking.guestAddress].filter(Boolean).join(" — ")}
              </span>
            </div>
          )}
          {selectedBooking.guestIdMasked && (
            <MaskedIdentityRow labelText={t("National ID / Iqama:", "الهوية / الإقامة:")} value={selectedBooking.guestIdMasked} />
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-title-sm text-sm font-black text-on-surface">
              {t("Host & Property Partner", "بيانات المضيف والعقار")}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                selectedBooking.hostVerified
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-surface-container text-outline border-surface-container-high"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {selectedBooking.hostVerified ? t("Verified Host", "مضيف موثق") : t("Partner Account", "حساب شريك")}
            </span>
            {selectedBooking.propertyLicense && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                MOT #{selectedBooking.propertyLicense}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-outline uppercase font-bold block">{t("Property Name & Location", "اسم العقار والموقع")}</span>
          <p className="font-bold text-base text-on-surface">{selectedBooking.propertyTitle}</p>
          <p className="text-xs text-on-surface-variant">{selectedBooking.accommodations}</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 text-xs pt-2 border-t border-surface-container">
          <div className="flex items-center justify-between gap-2">
            <span className="text-outline">{t("Host Account Name:", "اسم حساب المضيف:")}</span>
            <span className="font-bold text-on-surface text-end">
              {selectedBooking.hostName || t("Unassigned / Platform Managed", "غير محدد")}
            </span>
          </div>
          {selectedBooking.hostBusinessName && selectedBooking.hostBusinessName !== selectedBooking.hostName && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-outline">{t("Business / Entity:", "اسم المنشأة:")}</span>
              <span className="font-bold text-on-surface text-end">{selectedBooking.hostBusinessName}</span>
            </div>
          )}
          {(selectedBooking.hostCity || selectedBooking.hostAddress) && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-low">
              <MapPin className="w-3.5 h-3.5 text-outline shrink-0 mt-0.5" />
              <span className="text-on-surface font-medium break-words">
                {[selectedBooking.hostCity, selectedBooking.hostAddress].filter(Boolean).join(" — ")}
              </span>
            </div>
          )}
          {selectedBooking.hostIdMasked && (
            <MaskedIdentityRow labelText={t("Host ID / CR:", "هوية المضيف / السجل:")} value={selectedBooking.hostIdMasked} />
          )}
          <ContactPhoneRow phone={selectedBooking.hostPhone} emptyLabel={t("No host phone recorded", "لا يوجد جوال للمضيف")} t={t} />
          {selectedBooking.hostEmail && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
                <span className="text-on-surface font-medium truncate" dir="ltr">
                  {selectedBooking.hostEmail}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

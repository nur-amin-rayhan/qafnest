"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  TWELVE_HOUR_CHECKIN_TIME,
  ECOSYSTEM_URLS,
  addDaysToIsoDate,
  getRiyadhNowInfo,
  matchesPropertySearchQuery,
} from "@qafnest/shared";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { adminPath } from "@/lib/adminUrl";
import { HelplineDateCalendar } from "./helpline/HelplineDateCalendar";
import { HelplinePropertyDirectory } from "./helpline/HelplinePropertyDirectory";
import { HelplineVerificationGate } from "./helpline/HelplineVerificationGate";
import {
  HelplineConfirmationCard,
  HelplineQueueTable,
} from "./helpline/HelplineConfirmationAndQueue";
import type {
  AvailabilitySnapshot,
  CreatedConfirmation,
  HelplineUserSearchResult,
  HelplineVerificationSession,
  SlotQuote,
} from "./helpline/helplineTypes";
import type { BookingItem, PropertyItem, SelectedBookingDetail } from "./types";

interface HelplineBookingTabProps {
  properties: PropertyItem[];
  bookings: BookingItem[];
  onRefresh: () => Promise<void> | void;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
  onSelectProperty?: (prop: PropertyItem) => void;
  triggerToast: (msg: string) => void;
}

export function HelplineBookingTab({
  properties,
  bookings,
  onRefresh,
  setSelectedBooking,
  onSelectProperty,
  triggerToast,
}: HelplineBookingTabProps) {
  const { dir, lang, t } = useAdminAuth();

  const todayIso = useMemo(() => getRiyadhNowInfo().dateIso, []);
  const defaultCheckIn = useMemo(() => addDaysToIsoDate(todayIso, 1), [todayIso]);
  const defaultCheckOut = useMemo(() => addDaysToIsoDate(todayIso, 2), [todayIso]);

  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [listingScope, setListingScope] = useState<"all" | "approved">("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [stayMode, setStayMode] = useState<"overnight" | "twelve_hour">("overnight");
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [availabilitySnap, setAvailabilitySnap] = useState<AvailabilitySnapshot | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const [overridePrice, setOverridePrice] = useState("");
  const [quote, setQuote] = useState<SlotQuote | null>(null);
  const [checkingQuote, setCheckingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [paymentMode, setPaymentMode] = useState<"pending_sadad" | "confirmed_paid">("pending_sadad");
  const [sadadBillNumber, setSadadBillNumber] = useState("");

  const [callerType, setCallerType] = useState<"new_caller" | "existing_user">("new_caller");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<HelplineUserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const [verificationSession, setVerificationSession] = useState<HelplineVerificationSession | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<"code" | "link">("code");
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [initiatingVerification, setInitiatingVerification] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [nationalIdInput, setNationalIdInput] = useState("");
  const [verifyingId, setVerifyingId] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<CreatedConfirmation | null>(null);
  const [queueBusyId, setQueueBusyId] = useState<string | null>(null);

  const cities = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      const c = p.city_name || p.city;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const q = searchTerm.trim();
    return properties.filter((p) => {
      if (listingScope === "approved" && !(p.status === "approved" || p.is_approved)) return false;
      const pCity = p.city_name || p.city || "";
      if (cityFilter !== "all" && pCity !== cityFilter) return false;
      return !q || matchesPropertySearchQuery(p, q);
    });
  }, [properties, listingScope, cityFilter, searchTerm]);

  useEffect(() => {
    if (!selectedPropertyId && filteredProperties.length > 0) {
      const preferred =
        filteredProperties.find((p) => p.status === "approved" || p.is_approved) || filteredProperties[0];
      setSelectedPropertyId(preferred.id);
    }
  }, [filteredProperties, selectedPropertyId]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || null,
    [properties, selectedPropertyId]
  );

  const loadPropertyCalendar = useCallback(async (propId: string) => {
    if (!propId) return;
    setLoadingAvail(true);
    try {
      const res = await fetch(adminPath(`/api/admin/properties/${encodeURIComponent(propId)}/availability`), {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setAvailabilitySnap({
        bookedDates: Array.isArray(data.bookedDates) ? data.bookedDates : [],
        checkoutDates: Array.isArray(data.checkoutDates) ? data.checkoutDates : [],
        blockedDates: Array.isArray(data.blockedDates) ? data.blockedDates : [],
        timeSlotBookings: Array.isArray(data.timeSlotBookings) ? data.timeSlotBookings : [],
        priceOverrides: data.priceOverrides || {},
        slotConfig: data.slotConfig,
        weekdayPrice: data.weekdayPrice,
        weekendPrice: data.weekendPrice,
        basePrice: data.basePrice,
      });
    } catch {} finally {
      setLoadingAvail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPropertyId) void loadPropertyCalendar(selectedPropertyId);
  }, [selectedPropertyId, loadPropertyCalendar]);

  const effectiveCheckinTime = stayMode === "twelve_hour" ? TWELVE_HOUR_CHECKIN_TIME : DEFAULT_CHECKIN_TIME;
  const effectiveCheckoutTime = DEFAULT_CHECKOUT_TIME;

  useEffect(() => {
    if (!selectedPropertyId || !checkIn || !checkOut) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingQuote(true);
      setQuoteError(null);
      try {
        const params = new URLSearchParams({
          propertyId: selectedPropertyId,
          checkIn,
          checkOut,
          checkinTime: effectiveCheckinTime,
          checkoutTime: effectiveCheckoutTime,
        });
        if (overridePrice && Number(overridePrice) > 0) params.set("overrideListingPrice", overridePrice);
        const res = await fetch(adminPath(`/api/admin/bookings?${params.toString()}`), { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setQuote(null);
          setQuoteError(data.message || "Could not verify slot availability.");
        } else {
          setQuote(data as SlotQuote);
        }
      } catch {
        if (!cancelled) setQuoteError("Network error while checking live availability.");
      } finally {
        if (!cancelled) setCheckingQuote(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedPropertyId, checkIn, checkOut, effectiveCheckinTime, effectiveCheckoutTime, overridePrice]);

  const handleStayModeChange = (mode: "overnight" | "twelve_hour") => {
    setStayMode(mode);
    if (mode === "twelve_hour") setCheckOut(checkIn);
    else if (!checkOut || checkOut <= checkIn) setCheckOut(addDaysToIsoDate(checkIn, 1));
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearchTerm(query);
    setSearchingUsers(true);
    setUserSearchError(null);
    try {
      const res = await fetch(adminPath(`/api/admin/helpline/verify?search=${encodeURIComponent(query.trim())}`));
      const data = await res.json();
      if (!res.ok) {
        setUserSearchResults([]);
        setUserSearchError(data.error || "Could not search registered guests.");
        return;
      }
      setUserSearchResults(Array.isArray(data.users) ? data.users : []);
    } catch {
      setUserSearchError("Network error while searching registered guests.");
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleInitiateVerification = async (method: "code" | "link") => {
    if (!guestPhone.trim()) {
      setVerificationNotice(t("Please enter the Saudi mobile number first.", "يرجى إدخال رقم الجوال أولاً."));
      return;
    }
    setInitiatingVerification(true);
    setVerificationNotice(null);
    try {
      const res = await fetch(adminPath("/api/admin/helpline/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_session",
          phoneNumber: guestPhone.trim(),
          guestName: guestName.trim() || undefined,
          guestEmail: guestEmail.trim() || undefined,
          guestId: selectedGuestId || undefined,
          isExistingUser: callerType === "existing_user",
          method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerificationNotice(data.error || "Failed to initiate verification");
        return;
      }
      setVerificationSession(data.session);
      setVerificationLink(data.verificationLink || null);
      setVerificationMethod(method);
      setVerificationNotice(data.message || "Verification session started.");
      if (data.session.devOtpCode) setOtpInput(data.session.devOtpCode);
    } catch {
      setVerificationNotice("Network error initiating verification.");
    } finally {
      setInitiatingVerification(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationSession || !otpInput.trim()) return;
    setVerifyingOtp(true);
    setVerificationNotice(null);
    try {
      const res = await fetch(adminPath("/api/admin/helpline/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", token: verificationSession.token, code: otpInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerificationNotice(data.error || "Invalid OTP code.");
        return;
      }
      setVerificationSession(data.session);
      setVerificationNotice(t("Phone OTP verified successfully!", "تم التحقق من رمز الجوال بنجاح!"));
    } catch {
      setVerificationNotice("Network error verifying OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleVerifyId = async () => {
    if (!verificationSession || !nationalIdInput.trim()) return;
    setVerifyingId(true);
    setVerificationNotice(null);
    try {
      const res = await fetch(adminPath("/api/admin/helpline/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_identity",
          token: verificationSession.token,
          nationalId: nationalIdInput.trim(),
          fullName: guestName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerificationNotice(data.error || "Identity verification failed.");
        return;
      }
      setVerificationSession(data.session);
      setVerificationNotice(t("National ID / Iqama verified with Yakeen!", "تم توثيق الهوية عبر يقين بنجاح!"));
    } catch {
      setVerificationNotice("Network error verifying identity.");
    } finally {
      setVerifyingId(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!verificationSession) return;
    try {
      const res = await fetch(adminPath(`/api/admin/helpline/verify?token=${encodeURIComponent(verificationSession.token)}`));
      const data = await res.json();
      if (res.ok && data.session) {
        setVerificationSession(data.session);
        if (data.session.completed) setVerificationNotice(t("Verification completed by caller!", "أتم العميل التحقق بنجاح!"));
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedPropertyId) return setSubmitError(t("Please select a property from the left directory.", "يرجى اختيار العقار من القائمة."));
    if (!guestName.trim() || !guestPhone.trim()) return setSubmitError(t("Caller full name and Saudi phone number are required.", "اسم العميل ورقم الجوال مطلوبان."));
    if (!verificationSession?.completed) {
      return setSubmitError(
        t(
          "Zero-Bypass Policy: Mobile Phone OTP and Nafath/Yakeen ID verification are strictly required before booking.",
          "سياسة الأمان الصارمة: التحقق من جوال العميل والهوية الوطنية عبر نفاذ/يقين إلزامي قبل تأكيد الحجز."
        )
      );
    }

    setSubmitting(true);
    try {
      const res = await fetch(adminPath("/api/admin/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim(),
          checkIn,
          checkOut,
          checkinTime: effectiveCheckinTime,
          checkoutTime: effectiveCheckoutTime,
          guestsCount,
          paymentMode,
          sadadBillNumber: sadadBillNumber.trim() || undefined,
          overrideListingPrice: overridePrice && Number(overridePrice) > 0 ? Number(overridePrice) : undefined,
          verificationToken: verificationSession.token,
          guestId: selectedGuestId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.booking) {
        setSubmitError(data.message || "Failed to create helpline booking.");
        return;
      }

      const b = data.booking;
      setConfirmation({
        bookingReference: b.booking_reference,
        propertyTitle: b.property_title || selectedProperty?.title || "Property",
        guestName: b.guest_name || guestName,
        guestPhone: b.guest_phone || guestPhone,
        guestEmail: b.guest_email || guestEmail.trim() || null,
        checkIn: b.check_in || checkIn,
        checkOut: b.check_out || checkOut,
        guestTotalSar: b.pricing?.guestTotalSar ?? Number(b.total_price || 0),
        status: b.status,
        paymentMode,
        smartLockPin: b.smart_lock_pin || null,
        sadadBillNumber: b.sadadBillNumber || null,
        autoCreatedGuest: Boolean(data.autoCreatedGuest),
      });
      triggerToast(data.message || `Booking #${b.booking_reference} created.`);
      await Promise.all([onRefresh(), loadPropertyCalendar(selectedPropertyId)]);
    } catch {
      setSubmitError("Network error submitting helpline booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const helplineBookings = useMemo(
    () => bookings.filter((b) => String(b.auth_subject || "").includes("|") || String(b.auth_subject || "").includes("SADAD_HOLD")),
    [bookings]
  );

  const handleQueueAction = async (booking: BookingItem, action: "confirm_payment" | "cancel") => {
    setQueueBusyId(booking.id);
    try {
      const res = await fetch(adminPath("/api/admin/bookings"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.message || "Failed to update booking.");
        return;
      }
      triggerToast(data.message || "Booking updated.");
      await Promise.all([onRefresh(), selectedPropertyId ? loadPropertyCalendar(selectedPropertyId) : Promise.resolve()]);
    } catch {
      triggerToast("Network error updating booking.");
    } finally {
      setQueueBusyId(null);
    }
  };

  const handleCopyConfirmation = async () => {
    if (!confirmation) return;
    const summary = [
      `QafNest Helpline Reservation`,
      `Reference: #${confirmation.bookingReference}`,
      `Property: ${confirmation.propertyTitle}`,
      `Guest: ${confirmation.guestName} (${confirmation.guestPhone})`,
      `Dates: ${confirmation.checkIn} -> ${confirmation.checkOut}`,
      `Total: SAR ${confirmation.guestTotalSar.toFixed(2)}`,
      confirmation.sadadBillNumber ? `SADAD Bill: ${confirmation.sadadBillNumber}` : null,
      confirmation.smartLockPin ? `Access PIN: ${confirmation.smartLockPin}` : "Status: Pending SADAD Payment",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      triggerToast(t("Booking summary copied to clipboard!", "تم نسخ ملخص الحجز!"));
    } catch {
      triggerToast(t("Copy ready above.", "يرجى نسخ الملخص يدوياً."));
    }
  };

  const guestSiteUrl = selectedProperty ? `${ECOSYSTEM_URLS.guest}/properties/${selectedProperty.slug || selectedProperty.id}` : null;

  return (
    <div dir={dir} data-testid="helpline-booking-section" className="flex flex-col w-full gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest rounded-2xl border border-surface-container p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>{t("Operations Hub", "مركز العمليات")}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">{t("Helpline Phone Booking Desk", "مكتب الحجز الهاتفي والدعم")}</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-status-emerald/15 text-status-emerald flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">support_agent</span>
            </span>
            <span>{t("Helpline & Manual Booking Workspace", "قسم الحجز الهاتفي وإدارة المكالمات")}</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t("Full access to all platform listings, live product-style availability calendar, custom deal pricing, and instant Pending SADAD room locks.", "وصول كامل لجميع العقارات، تقويم التوفر التفاعلي مثل صفحة الضيف، تسعير مخصص، وحجز الغرف بانتظار سداد.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs">
            <span className="text-outline font-semibold">{t("Catalog Access:", "العقارات:")}</span>{" "}
            <strong className="text-on-surface font-black">{properties.length}</strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <span className="font-semibold">{t("Pending SADAD:", "بانتظار سداد:")}</span>{" "}
            <strong className="font-black">
              {helplineBookings.filter((b) => b.status === "pending" && String(b.auth_subject || "").includes("SADAD_HOLD")).length}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <HelplinePropertyDirectory
          filteredProperties={filteredProperties}
          selectedProperty={selectedProperty}
          selectedPropertyId={selectedPropertyId}
          onSelectPropertyId={(id) => {
            setSelectedPropertyId(id);
            setConfirmation(null);
          }}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          cities={cities}
          listingScope={listingScope}
          setListingScope={setListingScope}
          onSelectProperty={onSelectProperty}
          guestSiteUrl={guestSiteUrl}
          t={t}
        />

        <div className="xl:col-span-7 flex flex-col gap-5">
          {confirmation ? (
            <HelplineConfirmationCard
              confirmation={confirmation}
              onReset={() => {
                setConfirmation(null);
                setGuestName("");
                setGuestPhone("");
                setGuestEmail("");
                setSelectedGuestId(null);
                setVerificationSession(null);
                setVerificationLink(null);
                setVerificationNotice(null);
                setOtpInput("");
                setNationalIdInput("");
                setOverridePrice("");
                setSadadBillNumber("");
              }}
              onCopy={handleCopyConfirmation}
              t={t}
            />
          ) : (
            <>
              <HelplineDateCalendar
                lang={lang}
                t={t}
                basePrice={availabilitySnap?.basePrice || Number(selectedProperty?.base_price || 0)}
                weekdayPrice={availabilitySnap?.weekdayPrice || selectedProperty?.weekday_price}
                weekendPrice={availabilitySnap?.weekendPrice || selectedProperty?.weekend_price}
                checkIn={checkIn}
                checkOut={checkOut}
                stayMode={stayMode}
                onStayModeChange={handleStayModeChange}
                onChangeDates={(newIn, newOut) => {
                  setCheckIn(newIn);
                  setCheckOut(newOut);
                }}
                bookedDates={availabilitySnap?.bookedDates || []}
                checkoutDates={availabilitySnap?.checkoutDates || []}
                blockedDates={availabilitySnap?.blockedDates || []}
                timeSlotBookings={availabilitySnap?.timeSlotBookings || []}
                priceOverrides={availabilitySnap?.priceOverrides || {}}
                slotConfig={availabilitySnap?.slotConfig}
                loadingAvailability={loadingAvail}
              />

              <form onSubmit={handleSubmit} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-outline">
                      {t("Live Slot Verification", "فحص التوفر الفوري")}
                    </span>
                    {checkingQuote ? (
                      <div className="p-3 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        <span>{t("Checking dates & calculating quote...", "جاري فحص التواريخ وحساب السعر...")}</span>
                      </div>
                    ) : quoteError ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">{quoteError}</div>
                    ) : quote ? (
                      <div
                        data-testid="helpline-availability-banner"
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                          quote.available ? "bg-status-emerald/10 border-status-emerald/30 text-status-emerald" : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{quote.available ? "event_available" : "event_busy"}</span>
                        <span>
                          {quote.available
                            ? `${t("Slot Available", "الفترة متاحة")} (${quote.nights} ${t(quote.nights === 1 ? "night" : "nights", "ليلة")})`
                            : quote.conflictingRef
                            ? `${t("Conflict with booking", "تعارض مع حجز")} #${quote.conflictingRef}`
                            : `${t("Blocked on", "مغلق بتاريخ")} ${quote.blockedDateConflict}`}
                        </span>
                      </div>
                    ) : null}

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        {t("Negotiated Stay Subtotal Override (SAR, optional)", "سعر الاتفاق المخصص (ر.س، اختياري)")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={overridePrice}
                        onChange={(e) => setOverridePrice(e.target.value)}
                        placeholder={t("Leave blank for standard rate", "اتركه فارغاً للسعر الافتراضي")}
                        className="w-full h-10 px-3 rounded-xl border border-surface-container bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-container bg-surface-container-low p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{t("Base / Deal Stay", "سعر الإقامة")}</span>
                      <span className="font-bold text-on-surface">SAR {quote ? quote.pricing.listingAmountSar.toFixed(2) : "—"}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{t("Platform Service Fee", "رسوم الخدمة")} ({quote ? quote.pricing.guestServiceFeePercent : 12}%)</span>
                      <span className="font-bold text-on-surface">SAR {quote ? quote.pricing.guestServiceFeeSar.toFixed(2) : "—"}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{t("ZATCA VAT", "ضريبة القيمة المضافة")} ({quote ? quote.pricing.vatRatePercent : 15}%)</span>
                      <span className="font-bold text-on-surface">SAR {quote ? quote.pricing.vatAmountSar.toFixed(2) : "—"}</span>
                    </div>
                    <div className="pt-2 border-t border-surface-container flex justify-between items-center text-sm font-black text-primary">
                      <span>{t("Guest Total Payable", "الإجمالي المطلوب من الضيف")}</span>
                      <span data-testid="helpline-guest-total">SAR {quote ? quote.pricing.guestTotalSar.toFixed(2) : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-container space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">person_add</span>
                      <span>{t("Saudi Caller & Verification Details", "بيانات المتصل والتوثيق الأمني")}</span>
                    </h3>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-surface-container text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setCallerType("new_caller");
                          setSelectedGuestId(null);
                          setUserSearchTerm("");
                          setUserSearchResults([]);
                          setUserSearchError(null);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          callerType === "new_caller" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {t("New Caller", "متصل جديد")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCallerType("existing_user");
                          void handleSearchUsers(userSearchTerm);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          callerType === "existing_user" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {t("Existing Registered User", "عميل مسجل")}
                      </button>
                    </div>
                  </div>

                  {callerType === "existing_user" && (
                    <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block font-bold text-on-surface">
                          {t("Search Active Registered Guest (Name, Phone, or Email)", "ابحث عن عميل مسجل (الاسم، الجوال، أو البريد)")}
                        </label>
                        {selectedGuestId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGuestId(null);
                              setUserSearchTerm("");
                              void handleSearchUsers("");
                            }}
                            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            {t("Clear selection", "إلغاء التحديد")}
                          </button>
                        )}
                      </div>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={userSearchTerm}
                            onChange={(e) => void handleSearchUsers(e.target.value)}
                            placeholder={t("Type guest name, phone (05 / +966), or email...", "اكتب اسم العميل، جواله (05 / +966)، أو بريده...")}
                            className="w-full h-9 px-3 rounded-lg border border-surface-container bg-white text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          {searchingUsers && (
                            <span className="absolute end-3 top-2.5 material-symbols-outlined text-[16px] animate-spin text-primary">sync</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleSearchUsers(userSearchTerm)}
                          className="h-9 px-3 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition cursor-pointer shrink-0"
                        >
                          {t("Search", "بحث")}
                        </button>
                      </div>
                      {userSearchError && <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{userSearchError}</div>}
                      {userSearchResults.length > 0 && (
                        <div className="max-h-44 overflow-y-auto divide-y divide-surface-container-low bg-white rounded-lg border border-surface-container">
                          {userSearchResults.map((u) => (
                            <div
                              key={u.id}
                              onClick={() => {
                                if (u.isSuspended) return setVerificationNotice(t("Cannot select suspended account.", "الحساب موقوف ولا يمكن الحجز له."));
                                setSelectedGuestId(u.id);
                                setGuestName(u.name);
                                setGuestPhone(u.phone || "");
                                setGuestEmail(u.email || "");
                                if (u.nationalId && !nationalIdInput) setNationalIdInput(u.nationalId);
                                setUserSearchResults([]);
                                setUserSearchTerm(`${u.name}${u.phone ? ` (${u.phone})` : ""}`);
                              }}
                              className={`p-2.5 flex items-center justify-between gap-2 transition cursor-pointer ${
                                u.isSuspended ? "bg-rose-50/50 opacity-60 cursor-not-allowed" : "hover:bg-primary/5"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-on-surface">{u.name}</span>
                                  {u.verified && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                      {t("Verified", "موثق")}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-outline font-mono truncate">{[u.phone, u.email].filter(Boolean).join(" · ") || u.id.slice(0, 8)}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${u.isSuspended ? "bg-rose-100 text-rose-800" : "bg-status-emerald/15 text-status-emerald"}`}>
                                {u.isSuspended ? t("Suspended", "موقوف") : t("Select", "اختيار")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">{t("Customer Full Name *", "اسم العميل الكامل *")}</label>
                      <input
                        type="text"
                        required
                        data-testid="helpline-guest-name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder={t("e.g. Abdullah Al-Harbi", "مثال: عبدالله الحربي")}
                        className="w-full h-10 px-3 rounded-xl border border-surface-container bg-white text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">{t("Saudi Mobile Number *", "رقم الجوال *")}</label>
                      <input
                        type="tel"
                        required
                        data-testid="helpline-guest-phone"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        className="w-full h-10 px-3 rounded-xl border border-surface-container bg-white text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">{t("Guests & Email (For Auto-Account)", "عدد الضيوف والبريد (لإنشاء الحساب)")}</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 h-10 px-2 rounded-xl border border-surface-container bg-white text-sm text-center font-bold text-on-surface"
                          aria-label="Guests count"
                        />
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="guest@email.com"
                          className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-surface-container bg-white text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>

                  <HelplineVerificationGate
                    guestPhone={guestPhone}
                    verificationSession={verificationSession}
                    verificationMethod={verificationMethod}
                    setVerificationMethod={setVerificationMethod}
                    verificationLink={verificationLink}
                    initiatingVerification={initiatingVerification}
                    otpInput={otpInput}
                    setOtpInput={setOtpInput}
                    verifyingOtp={verifyingOtp}
                    nationalIdInput={nationalIdInput}
                    setNationalIdInput={setNationalIdInput}
                    verifyingId={verifyingId}
                    verificationNotice={verificationNotice}
                    onInitiateVerification={handleInitiateVerification}
                    onVerifyOtp={handleVerifyOtp}
                    onVerifyId={handleVerifyId}
                    onRefreshVerification={handleRefreshVerification}
                    t={t}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    data-testid="helpline-mode-hold"
                    onClick={() => setPaymentMode("pending_sadad")}
                    className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
                      paymentMode === "pending_sadad" ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/30" : "border-surface-container bg-surface-container-low hover:border-amber-300"
                    }`}
                  >
                    <div className="text-xs font-black text-amber-900">{t("Hold Room — Awaiting SADAD Payment", "حجز مبدئي — بانتظار سداد")}</div>
                    <div className="text-[11px] text-amber-800/90 mt-0.5">
                      {t("Locks dates immediately on Admin & Guest calendars until SADAD payment arrives.", "يغلق التواريخ فوراً حتى يتم تأكيد دفع سداد.")}
                    </div>
                  </button>
                  <button
                    type="button"
                    data-testid="helpline-mode-paid"
                    onClick={() => setPaymentMode("confirmed_paid")}
                    className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
                      paymentMode === "confirmed_paid" ? "border-status-emerald bg-status-emerald/10 ring-2 ring-status-emerald/30" : "border-surface-container bg-surface-container-low hover:border-status-emerald/40"
                    }`}
                  >
                    <div className="text-xs font-black text-status-emerald">{t("Confirm Immediately (Paid Now)", "تأكيد فوري (مدفوع الآن)")}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      {t("Marks reservation Confirmed immediately and posts host payout ledger.", "يعتمد الحجز فوراً ويضيف المستحقات للمضيف.")}
                    </div>
                  </button>
                </div>

                {paymentMode === "pending_sadad" && (
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">{t("SADAD Bill / Reference Note (Optional — Phase 2 auto-fills)", "رقم فاتورة سداد (اختياري)")}</label>
                    <input
                      type="text"
                      value={sadadBillNumber}
                      onChange={(e) => setSadadBillNumber(e.target.value)}
                      placeholder={t("Leave blank or enter internal SADAD ref", "اختياري")}
                      className="w-full h-10 px-3 rounded-xl border border-surface-container bg-white text-sm font-mono text-on-surface"
                    />
                  </div>
                )}

                {submitError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">{submitError}</div>}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    data-testid="helpline-submit-btn"
                    disabled={submitting || !quote?.available || !verificationSession?.completed}
                    className="h-11 px-6 rounded-xl bg-status-emerald text-white text-sm font-black shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {submitting ? "sync" : !verificationSession?.completed ? "gpp_maybe" : paymentMode === "confirmed_paid" ? "verified" : "lock_clock"}
                    </span>
                    <span>
                      {submitting
                        ? t("Creating Booking...", "جاري إنشاء الحجز...")
                        : !verificationSession?.completed
                        ? t("Verify Caller Identity First (Zero Bypass)", "توثيق هوية المتصل أولاً (إلزامي)")
                        : paymentMode === "confirmed_paid"
                        ? t("Confirm & Lock Room Now", "تأكيد الحجز وإصدار الدخول")
                        : t("Hold Booking (Pending SADAD)", "تثبيت الحجز المبدئي (بانتظار سداد)")}
                    </span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <HelplineQueueTable
        helplineBookings={helplineBookings}
        queueBusyId={queueBusyId}
        onQueueAction={handleQueueAction}
        setSelectedBooking={setSelectedBooking}
        t={t}
      />
    </div>
  );
}

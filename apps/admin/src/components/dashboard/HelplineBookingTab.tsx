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
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Clock,
  Headphones,
} from "lucide-react";
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
      const devOtp = data?.devOtpCode || data?.session?.devOtpCode;
      if (devOtp) setOtpInput(devOtp);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>{t("Operations Hub", "مركز العمليات")}</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="text-[#4F2396] dark:text-purple-300 font-semibold">{t("Helpline Phone Booking Desk", "مكتب الحجز الهاتفي والدعم")}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <Headphones size={20} />
            </span>
            <span>{t("Helpline & Manual Booking Workspace", "قسم الحجز الهاتفي وإدارة المكالمات")}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {t("Full access to all platform listings, live product-style availability calendar, custom deal pricing, and instant Pending SADAD room locks.", "وصول كامل لجميع العقارات، تقويم التوفر التفاعلي مثل صفحة الضيف، تسعير مخصص، وحجز الغرف بانتظار سداد.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{t("Catalog Access:", "العقارات:")}</span>{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">{properties.length}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-medium">{t("Pending SADAD:", "بانتظار سداد:")}</span>{" "}
            <strong className="font-bold">
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

              <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 sm:p-5 shadow-xs space-y-5 text-slate-900 dark:text-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("Live Slot Verification", "فحص التوفر الفوري")}
                    </span>
                    {checkingQuote ? (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-800">
                        <RefreshCw size={14} className="animate-spin text-[#4F2396] dark:text-purple-400" />
                        <span>{t("Checking dates & calculating quote...", "جاري فحص التواريخ وحساب السعر...")}</span>
                      </div>
                    ) : quoteError ? (
                      <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-xs font-medium text-rose-700 dark:text-rose-300">{quoteError}</div>
                    ) : quote ? (
                      <div
                        data-testid="helpline-availability-banner"
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                          quote.available
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {quote.available ? (
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
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
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t("Negotiated Stay Subtotal Override (SAR, optional)", "سعر الاتفاق المخصص (ر.س، اختياري)")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={overridePrice}
                        onChange={(e) => setOverridePrice(e.target.value)}
                        placeholder={t("Leave blank for standard rate", "اتركه فارغاً للسعر الافتراضي")}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 p-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>{t("Base / Deal Stay", "سعر الإقامة")}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">SAR {quote ? quote.pricing.listingAmountSar.toFixed(2) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("Platform Service Fee", "رسوم الخدمة")} ({quote ? quote.pricing.guestServiceFeePercent : 12}%)</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">SAR {quote ? quote.pricing.guestServiceFeeSar.toFixed(2) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("ZATCA VAT", "ضريبة القيمة المضافة")} ({quote ? quote.pricing.vatRatePercent : 15}%)</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">SAR {quote ? quote.pricing.vatAmountSar.toFixed(2) : "—"}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-sm font-bold text-[#4F2396] dark:text-purple-300">
                      <span>{t("Guest Total Payable", "الإجمالي المطلوب من الضيف")}</span>
                      <span data-testid="helpline-guest-total">SAR {quote ? quote.pricing.guestTotalSar.toFixed(2) : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <UserPlus size={16} className="text-[#4F2396] dark:text-purple-400" />
                      <span>{t("Saudi Caller & Verification Details", "بيانات المتصل والتوثيق الأمني")}</span>
                    </h3>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setCallerType("new_caller");
                          setSelectedGuestId(null);
                          setUserSearchTerm("");
                          setUserSearchResults([]);
                          setUserSearchError(null);
                        }}
                        className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                          callerType === "new_caller"
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
                        className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                          callerType === "existing_user"
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        {t("Existing Registered User", "عميل مسجل")}
                      </button>
                    </div>
                  </div>

                  {callerType === "existing_user" && (
                    <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block font-semibold text-slate-900 dark:text-slate-100">
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
                            className="text-[11px] font-semibold text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
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
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
                          />
                          {searchingUsers && (
                            <span className="absolute end-3 top-2.5">
                              <RefreshCw size={14} className="animate-spin text-[#4F2396] dark:text-purple-400" />
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleSearchUsers(userSearchTerm)}
                          className="h-9 px-3 rounded-lg bg-[#4F2396] text-white font-semibold text-xs hover:bg-[#3D1A78] transition cursor-pointer shrink-0 shadow-xs"
                        >
                          {t("Search", "بحث")}
                        </button>
                      </div>
                      {userSearchError && <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">{userSearchError}</div>}
                      {userSearchResults.length > 0 && (
                        <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
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
                                u.isSuspended ? "bg-rose-50/50 dark:bg-rose-950/20 opacity-60 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</span>
                                  {u.verified && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-semibold">
                                      {t("Verified", "موثق")}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{[u.phone, u.email].filter(Boolean).join(" · ") || u.id.slice(0, 8)}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${u.isSuspended ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"}`}>
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
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("Customer Full Name *", "اسم العميل الكامل *")}</label>
                      <input
                        type="text"
                        required
                        data-testid="helpline-guest-name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder={t("e.g. Abdullah Al-Harbi", "مثال: عبدالله الحربي")}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("Saudi Mobile Number *", "رقم الجوال *")}</label>
                      <input
                        type="tel"
                        required
                        data-testid="helpline-guest-phone"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("Guests & Email (For Auto-Account)", "عدد الضيوف والبريد (لإنشاء الحساب)")}</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 h-10 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-center font-semibold text-slate-900 dark:text-slate-100"
                          aria-label="Guests count"
                        />
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="guest@email.com"
                          className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
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
                      paymentMode === "pending_sadad"
                        ? "border-amber-400 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-400/50 text-amber-900 dark:text-amber-200"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 hover:border-amber-400 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">{t("Hold Room — Awaiting SADAD Payment", "حجز مبدئي — بانتظار سداد")}</div>
                    <div className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                      {t("Locks dates immediately on Admin & Guest calendars until SADAD payment arrives.", "يغلق التواريخ فوراً حتى يتم تأكيد دفع سداد.")}
                    </div>
                  </button>
                  <button
                    type="button"
                    data-testid="helpline-mode-paid"
                    onClick={() => setPaymentMode("confirmed_paid")}
                    className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
                      paymentMode === "confirmed_paid"
                        ? "border-emerald-500 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-500/50 text-emerald-900 dark:text-emerald-200"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 hover:border-emerald-500 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t("Confirm Immediately (Paid Now)", "تأكيد فوري (مدفوع الآن)")}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("Marks reservation Confirmed immediately and posts host payout ledger.", "يعتمد الحجز فوراً ويضيف المستحقات للمضيف.")}
                    </div>
                  </button>
                </div>

                {paymentMode === "pending_sadad" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("SADAD Bill / Reference Note (Optional — Phase 2 auto-fills)", "رقم فاتورة سداد (اختياري)")}</label>
                    <input
                      type="text"
                      value={sadadBillNumber}
                      onChange={(e) => setSadadBillNumber(e.target.value)}
                      placeholder={t("Leave blank or enter internal SADAD ref", "اختياري")}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
                    />
                  </div>
                )}

                {submitError && <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">{submitError}</div>}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    data-testid="helpline-submit-btn"
                    disabled={submitting || !quote?.available || !verificationSession?.completed}
                    className="h-11 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
                  >
                    {submitting ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : !verificationSession?.completed ? (
                      <ShieldCheck size={16} />
                    ) : paymentMode === "confirmed_paid" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
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

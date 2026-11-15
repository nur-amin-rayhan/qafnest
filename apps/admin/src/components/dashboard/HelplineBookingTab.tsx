"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  TWELVE_HOUR_CHECKIN_TIME,
  ECOSYSTEM_URLS,
  addDaysToIsoDate,
  getNumericUnitCode,
  getRiyadhNowInfo,
  matchesPropertySearchQuery,
  type PropertyBookingSlotConfig,
  type TimeSlotBooking,
} from "@qafnest/shared";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { HelplineDateCalendar } from "./helpline/HelplineDateCalendar";
import {
  buildSelectedBookingDetail,
  type BookingItem,
  type PropertyItem,
  type SelectedBookingDetail,
} from "./types";

import { adminPath } from "@/lib/adminUrl";
interface HelplineBookingTabProps {
  properties: PropertyItem[];
  bookings: BookingItem[];
  onRefresh: () => Promise<void> | void;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
  onSelectProperty?: (prop: PropertyItem) => void;
  triggerToast: (msg: string) => void;
}

interface AvailabilitySnapshot {
  bookedDates: string[];
  checkoutDates: string[];
  blockedDates: string[];
  timeSlotBookings: TimeSlotBooking[];
  priceOverrides: Record<string, number>;
  slotConfig?: PropertyBookingSlotConfig;
  weekdayPrice?: number;
  weekendPrice?: number;
  basePrice?: number;
}

interface SlotQuote {
  available: boolean;
  conflictingRef: string | null;
  blockedDateConflict: string | null;
  nights: number;
  pricing: {
    listingAmountSar: number;
    guestServiceFeePercent: number;
    guestServiceFeeSar: number;
    vatRatePercent: number;
    vatAmountSar: number;
    guestTotalSar: number;
    hostNetPayoutSar: number;
  };
}

interface CreatedConfirmation {
  bookingReference: string;
  propertyTitle: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  checkIn: string;
  checkOut: string;
  guestTotalSar: number;
  status: string;
  paymentMode: "pending_sadad" | "confirmed_paid";
  smartLockPin?: string | null;
  sadadBillNumber?: string | null;
  autoCreatedGuest?: boolean;
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

  // Property directory filters
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [listingScope, setListingScope] = useState<"all" | "approved">("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  // Calendar & booking state
  const [stayMode, setStayMode] = useState<"overnight" | "twelve_hour">("overnight");
  const [checkIn, setCheckIn] = useState<string>(defaultCheckIn);
  const [checkOut, setCheckOut] = useState<string>(defaultCheckOut);
  const [availabilitySnap, setAvailabilitySnap] = useState<AvailabilitySnapshot | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const [overridePrice, setOverridePrice] = useState<string>("");
  const [quote, setQuote] = useState<SlotQuote | null>(null);
  const [checkingQuote, setCheckingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Caller details
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [paymentMode, setPaymentMode] = useState<"pending_sadad" | "confirmed_paid">("pending_sadad");
  const [sadadBillNumber, setSadadBillNumber] = useState("");

  // Existing User vs New Caller Selector
  const [callerType, setCallerType] = useState<"new_caller" | "existing_user">("new_caller");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<
    Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      nationalId?: string;
      city?: string;
      verified?: boolean;
      isActive: boolean;
      isSuspended: boolean;
      status: string;
    }>
  >([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  // Mandatory Identity & Phone OTP Verification Gate
  const [verificationSession, setVerificationSession] = useState<{
    token: string;
    phoneNumber: string;
    guestName?: string;
    nationalId?: string;
    idType?: string;
    otpVerified: boolean;
    identityVerified: boolean;
    completed: boolean;
    devOtpCode?: string;
    verificationMethod: string;
  } | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<"code" | "link">("code");
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [initiatingVerification, setInitiatingVerification] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [nationalIdInput, setNationalIdInput] = useState("");
  const [verifyingId, setVerifyingId] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
      if (listingScope === "approved" && !(p.status === "approved" || p.is_approved)) {
        return false;
      }
      const pCity = p.city_name || p.city || "";
      if (cityFilter !== "all" && pCity !== cityFilter) return false;
      if (!q) return true;
      return matchesPropertySearchQuery(p, q);
    });
  }, [properties, listingScope, cityFilter, searchTerm]);

  // Select first property automatically on initial load
  useEffect(() => {
    if (!selectedPropertyId && filteredProperties.length > 0) {
      const preferred =
        filteredProperties.find((p) => p.status === "approved" || p.is_approved) ||
        filteredProperties[0];
      setSelectedPropertyId(preferred.id);
    }
  }, [filteredProperties, selectedPropertyId]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || null,
    [properties, selectedPropertyId]
  );

  // Fetch per-property product-page calendar availability
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
    } catch {
      // ignore transient network errors
    } finally {
      setLoadingAvail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadPropertyCalendar(selectedPropertyId);
    }
  }, [selectedPropertyId, loadPropertyCalendar]);

  const effectiveCheckinTime =
    stayMode === "twelve_hour" ? TWELVE_HOUR_CHECKIN_TIME : DEFAULT_CHECKIN_TIME;
  const effectiveCheckoutTime = DEFAULT_CHECKOUT_TIME;

  // Fetch exact slot quote whenever property, dates, stayMode, or custom rate changes
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
        if (overridePrice && Number(overridePrice) > 0) {
          params.set("overrideListingPrice", overridePrice);
        }
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
  }, [
    selectedPropertyId,
    checkIn,
    checkOut,
    effectiveCheckinTime,
    effectiveCheckoutTime,
    overridePrice,
  ]);

  const handleStayModeChange = (mode: "overnight" | "twelve_hour") => {
    setStayMode(mode);
    if (mode === "twelve_hour") {
      setCheckOut(checkIn);
    } else if (!checkOut || checkOut <= checkIn) {
      setCheckOut(addDaysToIsoDate(checkIn, 1));
    }
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
      if (data.session.devOtpCode) {
        setOtpInput(data.session.devOtpCode);
      }
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
        body: JSON.stringify({
          action: "verify_otp",
          token: verificationSession.token,
          code: otpInput.trim(),
        }),
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
        if (data.session.completed) {
          setVerificationNotice(t("Verification completed by caller!", "أتم العميل التحقق بنجاح!"));
        }
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedPropertyId) {
      setSubmitError(t("Please select a property from the left directory.", "يرجى اختيار العقار من القائمة."));
      return;
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      setSubmitError(t("Caller full name and Saudi phone number are required.", "اسم العميل ورقم الجوال مطلوبان."));
      return;
    }

    if (!verificationSession || !verificationSession.completed) {
      setSubmitError(
        t(
          "Zero-Bypass Policy: Mobile Phone OTP and Nafath/Yakeen ID verification are strictly required before booking.",
          "سياسة الأمان الصارمة: التحقق من جوال العميل والهوية الوطنية عبر نفاذ/يقين إلزامي قبل تأكيد الحجز."
        )
      );
      return;
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
          overrideListingPrice:
            overridePrice && Number(overridePrice) > 0 ? Number(overridePrice) : undefined,
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
    () =>
      bookings.filter(
        (b) =>
          String(b.auth_subject || "").includes("|") ||
          String(b.auth_subject || "").includes("SADAD_HOLD")
      ),
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
      await Promise.all([
        onRefresh(),
        selectedPropertyId ? loadPropertyCalendar(selectedPropertyId) : Promise.resolve(),
      ]);
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

  const guestSiteUrl = selectedProperty
    ? `${ECOSYSTEM_URLS.guest}/properties/${selectedProperty.slug || selectedProperty.id}`
    : null;

  return (
    <div dir={dir} data-testid="helpline-booking-section" className="flex flex-col w-full gap-6">
      {/* Section Header */}
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
            {t(
              "Full access to all platform listings, live product-style availability calendar, custom deal pricing, and instant Pending SADAD room locks.",
              "وصول كامل لجميع العقارات، تقويم التوفر التفاعلي مثل صفحة الضيف، تسعير مخصص، وحجز الغرف بانتظار سداد."
            )}
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
              {
                helplineBookings.filter(
                  (b) =>
                    b.status === "pending" && String(b.auth_subject || "").includes("SADAD_HOLD")
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {/* Main Dedicated 2-Column Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FULL PROPERTY DIRECTORY & SELECTED UNIT SPECS */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">villa</span>
                <span>{t("All Listings Catalog", "كافة العقارات المتاحة للحجز")}</span>
              </h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {filteredProperties.length} {t("units", "عقار")}
              </span>
            </div>

            {/* Search & Scope Controls */}
            <div className="space-y-2.5">
              <div className="relative">
                <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                  search
                </span>
                <input
                  type="text"
                  data-testid="helpline-property-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t(
                    "Search Unit # (e.g. 201001), listing name, city, district, host or phone...",
                    "ابحث برقم الوحدة (مثل 201001)، اسم العقار، المدينة، الحي، المضيف..."
                  )}
                  className="w-full h-10 ps-9 pe-3 rounded-xl border border-surface-container bg-surface-container-low text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter by city"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-surface-container bg-surface-container-low text-xs font-bold text-on-surface"
                >
                  <option value="all">{t("All Cities", "كل المدن")}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="inline-flex rounded-xl bg-surface-container-low p-0.5 border border-surface-container">
                  <button
                    type="button"
                    onClick={() => setListingScope("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      listingScope === "all"
                        ? "bg-white text-primary shadow-2xs"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {t("All Listings", "الكل")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingScope("approved")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      listingScope === "approved"
                        ? "bg-white text-primary shadow-2xs"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {t("Live Approved", "المعتمد فقط")}
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable High-Readability Property Cards */}
            <div className="space-y-2.5 max-h-[470px] overflow-y-auto pe-1">
              {filteredProperties.length === 0 ? (
                <div className="p-8 text-center text-sm text-outline bg-surface-container-low rounded-xl">
                  {t("No listings match your current search filter.", "لا توجد عقارات مطابقة للبحث.")}
                </div>
              ) : (
                filteredProperties.map((prop) => {
                  const isSelected = prop.id === selectedPropertyId;
                  const isApproved = prop.status === "approved" || prop.is_approved;
                  const img = Array.isArray(prop.images) && prop.images[0] ? prop.images[0] : null;
                  return (
                    <button
                      key={prop.id}
                      type="button"
                      data-testid={`helpline-prop-${prop.id}`}
                      onClick={() => {
                        setSelectedPropertyId(prop.id);
                        setConfirmation(null);
                      }}
                      className={`w-full text-start p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                          : "border-surface-container bg-white hover:border-primary/40 hover:bg-surface-container-low/50"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-surface-container shrink-0 overflow-hidden flex items-center justify-center">
                        {img ? (
                          <img src={img} alt={prop.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-outline text-[24px]">
                            home_work
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-black text-on-surface leading-snug truncate">
                            {prop.title}
                          </h3>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isApproved
                                ? "bg-status-emerald/15 text-status-emerald"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isApproved ? t("Live", "معتمد") : String(prop.status || "Pending")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant mt-0.5">
                          <p className="truncate">
                            {prop.city_name || prop.city || "Riyadh"}
                            {prop.district ? ` · ${prop.district}` : ""}
                          </p>
                          <span className="shrink-0 font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-surface-container text-primary">
                            #{getNumericUnitCode(prop.id)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-black text-primary">
                            SAR {Number(prop.base_price || 0).toFixed(0)}
                            <span className="text-[11px] font-normal text-outline"> /night</span>
                          </span>
                          <span className="text-[11px] text-on-surface-variant truncate max-w-[160px]">
                            {prop.host_name ? `${t("Host:", "المضيف:")} ${prop.host_name}` : prop.category || "Chalet"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Property Detailed Inspector Card */}
          {selectedProperty && (
            <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {t("Selected Listing Details", "تفاصيل العقار المختار")}
                    </span>
                    <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {t("Unit", "وحدة")} #{getNumericUnitCode(selectedProperty.id)}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-on-surface mt-0.5">
                    {selectedProperty.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {selectedProperty.city_name || selectedProperty.city}
                    {selectedProperty.district ? ` · ${selectedProperty.district}` : ""} ·{" "}
                    {selectedProperty.category_name || selectedProperty.category || "Property"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onSelectProperty && (
                    <button
                      type="button"
                      onClick={() => onSelectProperty(selectedProperty)}
                      className="px-2.5 py-1.5 rounded-lg border border-surface-container bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface cursor-pointer"
                    >
                      {t("Full Specs", "عرض التفاصيل")}
                    </button>
                  )}
                  {guestSiteUrl && (
                    <a
                      href={guestSiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg border border-primary/25 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary"
                    >
                      {t("Guest Page", "صفحة الضيف")}
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-container-low">
                  <div className="text-[11px] text-outline">{t("Base Night", "السعر الأساسي")}</div>
                  <div className="font-black text-on-surface mt-0.5">
                    SAR {Number(selectedProperty.base_price || 0).toFixed(0)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-low">
                  <div className="text-[11px] text-outline">{t("Weekend Rate", "نهاية الأسبوع")}</div>
                  <div className="font-black text-on-surface mt-0.5">
                    SAR {Number(selectedProperty.weekend_price || selectedProperty.base_price || 0).toFixed(0)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-low">
                  <div className="text-[11px] text-outline">{t("Rooms / Area", "الغرف / المساحة")}</div>
                  <div className="font-bold text-on-surface mt-0.5">
                    {selectedProperty.bedrooms_count ?? "—"} BD · {selectedProperty.area_sqm ?? "—"} m²
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-low">
                  <div className="text-[11px] text-outline">{t("Host Contact", "تواصل المضيف")}</div>
                  <div className="font-bold text-on-surface mt-0.5 truncate" title={selectedProperty.host_phone || ""}>
                    {selectedProperty.host_name || "QafNest Host"}
                  </div>
                </div>
              </div>

              {selectedProperty.host_phone && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/15 text-xs">
                  <span className="text-on-surface-variant font-semibold">
                    {t("Host Phone:", "جوال المضيف:")}
                  </span>
                  <span className="font-mono font-bold text-primary">{selectedProperty.host_phone}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRODUCT-STYLE CALENDAR + LIVE QUOTE + CALLER BOOKING FORM */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {confirmation ? (
            <div
              data-testid="helpline-confirmation-card"
              className="rounded-2xl border-2 border-status-emerald/40 bg-surface-container-lowest p-6 shadow-sm space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-status-emerald/15 text-status-emerald flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">check_circle</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-status-emerald">
                      {confirmation.paymentMode === "confirmed_paid"
                        ? t("Confirmed & Paid", "مؤكد ومدفوع")
                        : t("Room Held — Ready for SADAD Payment", "تم حجز الغرفة — بانتظار السداد")}
                    </span>
                    <h2 className="text-xl font-black text-on-surface mt-0.5">
                      #{confirmation.bookingReference} · {confirmation.propertyTitle}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
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
                  className="px-3.5 py-2 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface cursor-pointer"
                >
                  {t("+ New Phone Booking", "+ حجز جديد")}
                </button>
              </div>

              {confirmation.autoCreatedGuest && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                  <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0">
                    person_check
                  </span>
                  <div>
                    <p className="font-black">
                      {t(
                        "New Verified Guest Account Automatically Created",
                        "تم إنشاء حساب عميل موثق جديد تلقائياً"
                      )}
                    </p>
                    <p className="mt-0.5 text-emerald-800">
                      {t(
                        "Whenever this caller logs in on the Guest Portal with their phone number, their saved profile and reservation history will restore automatically.",
                        "عند تسجيل دخول العميل مستقبلاً برقم جواله في بوابة الضيوف، ستظهر بياناته وسجل حجوزاته تلقائياً."
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="text-xs text-outline">{t("Caller", "الضيف")}</div>
                  <div className="font-bold text-on-surface mt-0.5">{confirmation.guestName}</div>
                  <div className="text-xs font-mono text-on-surface-variant">{confirmation.guestPhone}</div>
                  {confirmation.guestEmail && (
                    <div className="text-[11px] text-outline truncate">{confirmation.guestEmail}</div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="text-xs text-outline">{t("Dates Locked", "التواريخ المحجوزة")}</div>
                  <div className="font-bold text-on-surface mt-0.5 font-mono">
                    {confirmation.checkIn} → {confirmation.checkOut}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <div className="text-xs text-primary font-bold">{t("Total Payable", "الإجمالي")}</div>
                  <div className="text-lg font-black text-primary mt-0.5">
                    SAR {confirmation.guestTotalSar.toFixed(2)}
                  </div>
                </div>
              </div>

              {confirmation.smartLockPin && (
                <div className="p-3.5 rounded-xl bg-status-emerald/10 border border-status-emerald/25 flex items-center justify-between text-sm">
                  <span className="font-bold text-status-emerald">
                    {t("Smart Lock PIN Issued:", "رمز القفل الذكي:")}
                  </span>
                  <span className="font-mono text-lg font-black text-status-emerald tracking-widest">
                    {confirmation.smartLockPin}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyConfirmation}
                  className="h-10 px-4 rounded-xl bg-primary-container text-on-primary text-xs font-bold hover:bg-primary transition cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{t("Copy WhatsApp / SMS Summary", "نسخ ملخص الحجز")}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product-Page Style Calendar */}
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

              {/* Live Availability Status & Deal Pricing + Caller Form */}
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-5"
              >
                {/* Live Slot Status & Agreed Rate Row */}
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
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                        {quoteError}
                      </div>
                    ) : quote ? (
                      <div
                        data-testid="helpline-availability-banner"
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                          quote.available
                            ? "bg-status-emerald/10 border-status-emerald/30 text-status-emerald"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {quote.available ? "event_available" : "event_busy"}
                        </span>
                        <span>
                          {quote.available
                            ? `${t("Slot Available", "الفترة متاحة")} (${quote.nights} ${t(
                                quote.nights === 1 ? "night" : "nights",
                                "ليلة"
                              )})`
                            : quote.conflictingRef
                            ? `${t("Conflict with booking", "تعارض مع حجز")} #${quote.conflictingRef}`
                            : `${t("Blocked on", "مغلق بتاريخ")} ${quote.blockedDateConflict}`}
                        </span>
                      </div>
                    ) : null}

                    {/* Optional Custom Deal Subtotal */}
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

                  {/* Pricing Breakdown Card */}
                  <div className="rounded-xl border border-surface-container bg-surface-container-low p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{t("Base / Deal Stay", "سعر الإقامة")}</span>
                      <span className="font-bold text-on-surface">
                        SAR {quote ? quote.pricing.listingAmountSar.toFixed(2) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>
                        {t("Platform Service Fee", "رسوم الخدمة")} (
                        {quote ? quote.pricing.guestServiceFeePercent : 12}%)
                      </span>
                      <span className="font-bold text-on-surface">
                        SAR {quote ? quote.pricing.guestServiceFeeSar.toFixed(2) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>
                        {t("ZATCA VAT", "ضريبة القيمة المضافة")} ({quote ? quote.pricing.vatRatePercent : 15}%)
                      </span>
                      <span className="font-bold text-on-surface">
                        SAR {quote ? quote.pricing.vatAmountSar.toFixed(2) : "—"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-surface-container flex justify-between items-center text-sm font-black text-primary">
                      <span>{t("Guest Total Payable", "الإجمالي المطلوب من الضيف")}</span>
                      <span data-testid="helpline-guest-total">
                        SAR {quote ? quote.pricing.guestTotalSar.toFixed(2) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Caller Details Grid with Existing User Lookup & Mandatory Identity Verification */}
                <div className="pt-3 border-t border-surface-container space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">person_add</span>
                      <span>{t("Saudi Caller & Verification Details", "بيانات المتصل والتوثيق الأمني")}</span>
                    </h3>

                    {/* Mode Selector: New Caller vs Existing Active Guest */}
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
                          callerType === "new_caller"
                            ? "bg-white text-primary shadow-xs"
                            : "text-on-surface-variant hover:text-on-surface"
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
                          callerType === "existing_user"
                            ? "bg-white text-primary shadow-xs"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {t("Existing Registered User", "عميل مسجل")}
                      </button>
                    </div>
                  </div>

                  {/* Existing User Search Panel */}
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
                            <span className="absolute end-3 top-2.5 material-symbols-outlined text-[16px] animate-spin text-primary">
                              sync
                            </span>
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

                      {userSearchError && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                          {userSearchError}
                        </div>
                      )}

                      {userSearchResults.length > 0 ? (
                        <div className="max-h-44 overflow-y-auto divide-y divide-surface-container-low bg-white rounded-lg border border-surface-container">
                          {userSearchResults.map((u) => (
                            <div
                              key={u.id}
                              onClick={() => {
                                if (u.isSuspended) {
                                  setVerificationNotice(t("Cannot select suspended account.", "الحساب موقوف ولا يمكن الحجز له."));
                                  return;
                                }
                                setSelectedGuestId(u.id);
                                setGuestName(u.name);
                                setGuestPhone(u.phone || "");
                                setGuestEmail(u.email || "");
                                if (u.nationalId && !nationalIdInput) {
                                  setNationalIdInput(u.nationalId);
                                }
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
                                  {u.city && (
                                    <span className="text-[10.5px] text-outline">· {u.city}</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-outline font-mono truncate">
                                  {[u.phone, u.email].filter(Boolean).join(" · ") || u.id.slice(0, 8)}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  u.isSuspended
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-status-emerald/15 text-status-emerald"
                                }`}
                              >
                                {u.isSuspended ? t("Suspended", "موقوف") : t("Select", "اختيار")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !searchingUsers &&
                        !selectedGuestId &&
                        !userSearchError && (
                          <div className="p-2.5 rounded-lg bg-white/80 border border-surface-container text-[11px] text-outline">
                            {userSearchTerm.trim()
                              ? t(
                                  `No registered guest matched "${userSearchTerm.trim()}". Try partial digits or switch to New Caller.`,
                                  `لم يتم العثور على عميل مسجل يطابق "${userSearchTerm.trim()}". جرّب آخر أرقام الجوال أو اختر متصل جديد.`
                                )
                              : t(
                                  "No registered guests loaded yet.",
                                  "لا توجد حسابات مسجلة محملة حالياً."
                                )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        {t("Customer Full Name *", "اسم العميل الكامل *")}
                      </label>
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
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        {t("Saudi Mobile Number *", "رقم الجوال *")}
                      </label>
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
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        {t("Guests & Email (For Auto-Account)", "عدد الضيوف والبريد (لإنشاء الحساب)")}
                      </label>
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

                  {/* MANDATORY IDENTITY & PHONE VERIFICATION GATE (ZERO-BYPASS) */}
                  <div
                    data-testid="helpline-verification-gate"
                    className={`rounded-2xl border p-4 space-y-3.5 transition-all ${
                      verificationSession?.completed
                        ? "border-status-emerald/40 bg-status-emerald/5"
                        : "border-amber-300 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`material-symbols-outlined text-[20px] ${
                            verificationSession?.completed ? "text-status-emerald" : "text-amber-600"
                          }`}
                        >
                          {verificationSession?.completed ? "verified_user" : "shield_lock"}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-on-surface">
                            {t("Zero-Bypass Identity & Mobile OTP Gate", "بوابة التوثيق الإلزامية (نفاذ + يقين + رمز الجوال)")}
                          </h4>
                          <p className="text-[11px] text-outline">
                            {t(
                              "Saudi regulation strictly requires caller phone OTP & National ID / Iqama verification before room hold.",
                              "اشتراطات المنصة تتطلب توثيق جوال العميل ورقم الهوية/الإقامة رسمياً قبل الحجز."
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          verificationSession?.completed
                            ? "bg-status-emerald text-white"
                            : verificationSession?.otpVerified
                            ? "bg-blue-600 text-white"
                            : "bg-amber-200 text-amber-900"
                        }`}
                      >
                        {verificationSession?.completed
                          ? "Fully Verified"
                          : verificationSession?.otpVerified
                          ? "Phone Verified (ID Pending)"
                          : "Verification Required"}
                      </span>
                    </div>

                    {verificationNotice && (
                      <div className="p-2.5 rounded-xl bg-white border border-surface-container text-xs font-semibold text-on-surface flex items-center justify-between">
                        <span>{verificationNotice}</span>
                      </div>
                    )}

                    {!verificationSession?.completed ? (
                      <div className="space-y-3 pt-1">
                        {/* Method Selector Tabs */}
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setVerificationMethod("code")}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-bold border transition cursor-pointer ${
                              verificationMethod === "code"
                                ? "bg-white border-primary text-primary shadow-2xs"
                                : "bg-surface-container-low border-surface-container text-on-surface-variant"
                            }`}
                          >
                            {t("Method A: Verification Code (Desk OTP)", "الطريقة 1: رمز التحقق المباشر (OTP)")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setVerificationMethod("link")}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-bold border transition cursor-pointer ${
                              verificationMethod === "link"
                                ? "bg-white border-primary text-primary shadow-2xs"
                                : "bg-surface-container-low border-surface-container text-on-surface-variant"
                            }`}
                          >
                            {t("Method B: Verification Link (Caller Self-Service)", "الطريقة 2: رابط توثيق للعميل")}
                          </button>
                        </div>

                        {!verificationSession ? (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={initiatingVerification || !guestPhone.trim()}
                              onClick={() => handleInitiateVerification(verificationMethod)}
                              className="h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {initiatingVerification ? "sync" : "send"}
                              </span>
                              <span>
                                {verificationMethod === "code"
                                  ? t("Send 6-Digit OTP Code", "إرسال رمز التحقق للعميل")
                                  : t("Generate Verification Link", "توليد رابط التوثيق للعميل")}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-surface-container">
                            {/* If Method B (Link) */}
                            {verificationMethod === "link" && verificationLink && (
                              <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-on-surface">
                                  {t("Guest Portal Verification URL:", "رابط بوابة توثيق العميل:")}
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={verificationLink}
                                    className="flex-1 h-8 px-2 rounded-lg border border-surface-container bg-surface-container-low text-[11px] font-mono select-all"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(verificationLink);
                                      setCopiedLink(true);
                                      setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                    className="px-3 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface"
                                  >
                                    {copiedLink ? t("Copied!", "تم النسخ!") : t("Copy", "نسخ")}
                                  </button>
                                  <a
                                    href={verificationLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center"
                                  >
                                    {t("Open", "فتح")}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={handleRefreshVerification}
                                    className="px-3 h-8 rounded-lg bg-status-emerald/15 text-status-emerald hover:bg-status-emerald/25 text-xs font-bold"
                                  >
                                    {t("Check Status", "فحص الحالة")}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Step 1: Mobile Phone OTP if Method A */}
                            {!verificationSession.otpVerified && verificationMethod === "code" && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <label className="block text-[11px] font-bold text-on-surface mb-0.5">
                                    {t("Enter 6-Digit Code received by caller:", "أدخل رمز التحقق المكون من 6 أرقام:")}
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={6}
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value)}
                                    placeholder="123456"
                                    className="w-full h-8 px-2 rounded-lg border border-surface-container text-xs font-mono text-center tracking-widest"
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={verifyingOtp || !otpInput.trim()}
                                  onClick={handleVerifyOtp}
                                  className="h-8 px-3 mt-4 rounded-lg bg-status-emerald text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                >
                                  {verifyingOtp ? "Verifying..." : "Confirm OTP"}
                                </button>
                              </div>
                            )}

                            {/* Step 2: National ID / Iqama Verification */}
                            {!verificationSession.identityVerified && (
                              <div className="flex items-center gap-2 pt-2 border-t border-surface-container-low">
                                <div className="flex-1">
                                  <label className="block text-[11px] font-bold text-on-surface mb-0.5">
                                    {t("Saudi National ID / Resident Iqama (10 digits):", "رقم الهوية الوطنية أو الإقامة (10 أرقام):")}
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={10}
                                    value={nationalIdInput}
                                    onChange={(e) => setNationalIdInput(e.target.value)}
                                    placeholder="1XXXXXXXXX or 2XXXXXXXXX"
                                    className="w-full h-8 px-2 rounded-lg border border-surface-container text-xs font-mono"
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={verifyingId || !nationalIdInput.trim()}
                                  onClick={handleVerifyId}
                                  className="h-8 px-3 mt-4 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                                >
                                  {verifyingId ? "Checking..." : "Verify with Yakeen"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-status-emerald/30 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 text-status-emerald font-bold">
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span>
                            {t("Caller Verified via Yakeen Registry", "تم توثيق هوية العميل وجواله رسمياً عبر يقين")}
                          </span>
                        </div>
                        <span className="font-mono text-outline text-[11px]">
                          ID: {verificationSession.nationalId || "VERIFIED"} · {verificationSession.phoneNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Mode & Submit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    data-testid="helpline-mode-hold"
                    onClick={() => setPaymentMode("pending_sadad")}
                    className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
                      paymentMode === "pending_sadad"
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/30"
                        : "border-surface-container bg-surface-container-low hover:border-amber-300"
                    }`}
                  >
                    <div className="text-xs font-black text-amber-900">
                      {t("Hold Room — Awaiting SADAD Payment", "حجز مبدئي — بانتظار سداد")}
                    </div>
                    <div className="text-[11px] text-amber-800/90 mt-0.5">
                      {t(
                        "Locks dates immediately on Admin & Guest calendars until SADAD payment arrives.",
                        "يغلق التواريخ فوراً حتى يتم تأكيد دفع سداد."
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="helpline-mode-paid"
                    onClick={() => setPaymentMode("confirmed_paid")}
                    className={`p-3.5 rounded-xl border text-start transition cursor-pointer ${
                      paymentMode === "confirmed_paid"
                        ? "border-status-emerald bg-status-emerald/10 ring-2 ring-status-emerald/30"
                        : "border-surface-container bg-surface-container-low hover:border-status-emerald/40"
                    }`}
                  >
                    <div className="text-xs font-black text-status-emerald">
                      {t("Confirm Immediately (Paid Now)", "تأكيد فوري (مدفوع الآن)")}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      {t(
                        "Marks reservation Confirmed immediately and posts host payout ledger.",
                        "يعتمد الحجز فوراً ويضيف المستحقات للمضيف."
                      )}
                    </div>
                  </button>
                </div>

                {paymentMode === "pending_sadad" && (
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      {t("SADAD Bill / Reference Note (Optional — Phase 2 auto-fills)", "رقم فاتورة سداد (اختياري)")}
                    </label>
                    <input
                      type="text"
                      value={sadadBillNumber}
                      onChange={(e) => setSadadBillNumber(e.target.value)}
                      placeholder={t("Leave blank or enter internal SADAD ref", "اختياري")}
                      className="w-full h-10 px-3 rounded-xl border border-surface-container bg-white text-sm font-mono text-on-surface"
                    />
                  </div>
                )}

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                    {submitError}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    data-testid="helpline-submit-btn"
                    disabled={submitting || !quote?.available || !verificationSession?.completed}
                    className="h-11 px-6 rounded-xl bg-status-emerald text-white text-sm font-black shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {submitting
                        ? "sync"
                        : !verificationSession?.completed
                        ? "gpp_maybe"
                        : paymentMode === "confirmed_paid"
                        ? "verified"
                        : "lock_clock"}
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

      {/* BOTTOM DEDICATED QUEUE: RECENT HELPLINE RESERVATIONS & PENDING SADAD HOLDS */}
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-600">receipt_long</span>
              <span>{t("Helpline & Pending SADAD Queue", "سجل حجوزات الهاتف وبانتظار سداد")}</span>
            </h2>
            <p className="text-xs text-on-surface-variant">
              {t(
                "Track callers awaiting SADAD transfer or recently confirmed helpline stays.",
                "متابعة الحجوزات الهاتفية بانتظار السداد أو المؤكدة."
              )}
            </p>
          </div>
          <span className="text-xs font-bold text-outline">
            {helplineBookings.length} {t("helpline bookings", "حجز هاتفي")}
          </span>
        </div>

        {helplineBookings.length === 0 ? (
          <div className="p-6 text-center text-sm text-outline bg-surface-container-low rounded-xl">
            {t(
              "No phone/helpline bookings created yet. Select any listing and dates above to create your first hold.",
              "لا توجد حجوزات هاتفية بعد. اختر العقار والتواريخ أعلاه للبدء."
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-start border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-container text-xs uppercase text-outline font-bold">
                  <th className="py-2.5 px-3 text-start">{t("Ref", "المرجع")}</th>
                  <th className="py-2.5 px-3 text-start">{t("Caller", "العميل")}</th>
                  <th className="py-2.5 px-3 text-start">{t("Property", "العقار")}</th>
                  <th className="py-2.5 px-3 text-start">{t("Dates", "التواريخ")}</th>
                  <th className="py-2.5 px-3 text-start">{t("Total", "الإجمالي")}</th>
                  <th className="py-2.5 px-3 text-start">{t("Status", "الحالة")}</th>
                  <th className="py-2.5 px-3 text-end">{t("Quick Actions", "إجراءات سريعة")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {helplineBookings.slice(0, 20).map((b) => {
                  const isHold =
                    b.status === "pending" && String(b.auth_subject || "").includes("SADAD_HOLD");
                  const isCancelled = b.status === "cancelled";
                  return (
                    <tr key={b.id} className="hover:bg-surface-container-low/50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-xs text-primary">
                        #{b.booking_reference || b.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-on-surface text-xs">{b.guest_name || "Phone Guest"}</div>
                        <div className="text-[11px] font-mono text-outline">{b.guest_phone || "—"}</div>
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold text-on-surface max-w-[200px] truncate">
                        {b.property_title || "Property"}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">
                        {b.check_in} → {b.check_out}
                      </td>
                      <td className="py-3 px-3 font-black text-xs text-on-surface">
                        SAR {Number(b.total_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isHold
                              ? "bg-amber-100 text-amber-800"
                              : isCancelled
                              ? "bg-rose-100 text-rose-700"
                              : "bg-status-emerald/15 text-status-emerald"
                          }`}
                        >
                          {isHold ? "PENDING SADAD" : b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          {isHold && (
                            <>
                              <button
                                type="button"
                                disabled={queueBusyId === b.id}
                                onClick={() => handleQueueAction(b, "confirm_payment")}
                                className="px-2.5 py-1 rounded-lg bg-status-emerald text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
                              >
                                {t("Confirm Paid", "تأكيد الدفع")}
                              </button>
                              <button
                                type="button"
                                disabled={queueBusyId === b.id}
                                onClick={() => handleQueueAction(b, "cancel")}
                                className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-[11px] font-bold hover:bg-rose-200 cursor-pointer disabled:opacity-50"
                              >
                                {t("Cancel Hold", "إلغاء")}
                              </button>
                            </>
                          )}
                          {(b.status === "confirmed" || b.status === "completed") && (
                            <button
                              type="button"
                              disabled={queueBusyId === b.id}
                              onClick={() => handleQueueAction(b, "cancel")}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold hover:bg-rose-100 cursor-pointer disabled:opacity-50"
                            >
                              {t("Cancel & Refund", "إلغاء واسترداد")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBooking({
                                ...buildSelectedBookingDetail(b, t),
                                id: `#${b.booking_reference || b.id.slice(0, 8)}`,
                                status: isHold ? "pending_sadad" : b.status,
                                payoutStatus:
                                  b.status === "confirmed" || b.status === "completed"
                                    ? "Paid & Settled"
                                    : isHold
                                    ? "Awaiting SADAD Payment"
                                    : b.payment_status,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg border border-surface-container bg-surface-container-low text-on-surface text-[11px] font-bold hover:bg-surface-container cursor-pointer"
                          >
                            {t("Details", "التفاصيل")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

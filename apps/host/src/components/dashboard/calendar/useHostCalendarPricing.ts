"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  createDefaultPropertySlotConfig,
  getCalendarDaySlotSummary,
  getEffectiveNightlyRateForDate,
  getRiyadhNowInfo,
  type CalendarDaySlotSummary,
  type DateSlotOverride,
  type GranularWeeklyPricing,
  type PropertyBookingSlotConfig,
  type TimeSlotBooking,
} from "@qafnest/shared";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { HostPropertySummary } from "../HostOverviewHub";

export const DEFAULT_DAYS = {
  sunday: "",
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
};

export function useHostCalendarPricing(
  properties: HostPropertySummary[],
  lang: "ar" | "en",
  t: (en: string, ar: string) => string,
  userId?: string
) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties[0]?.id || ""
  );

  // Automatically keep selectedPropertyId in sync when properties list arrives or updates
  useEffect(() => {
    if (properties.length > 0) {
      setSelectedPropertyId((current) => {
        if (!current || !properties.some((p) => p.id === current)) {
          return properties[0].id;
        }
        return current;
      });
    }
  }, [properties]);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [checkoutDates, setCheckoutDates] = useState<string[]>([]);
  const [timeSlotBookings, setTimeSlotBookings] = useState<TimeSlotBooking[]>([]);
  const [masterBasePrice, setMasterBasePrice] = useState("");
  const [customDayPricing, setCustomDayPricing] = useState<Record<string, string>>(DEFAULT_DAYS);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [slotConfig, setSlotConfig] = useState<PropertyBookingSlotConfig>(() =>
    createDefaultPropertySlotConfig(properties[0]?.id || "")
  );

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [modalDateIso, setModalDateIso] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentDate.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "long",
      year: "numeric",
    });
    return { year, month, firstDayIndex, daysInMonth, monthName };
  }, [currentDate, lang]);

  const formatDayIso = useCallback((year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }, []);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    try {
      if (isFirebaseConfigured()) {
        const fbUser = getFirebaseAuth().currentUser;
        if (fbUser) {
          const token = await fbUser.getIdToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {}

    const devId =
      userId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("qafnest-dev-host-id") || "00000000-0000-0000-0000-000000000002"
        : "00000000-0000-0000-0000-000000000002");
    headers["x-dev-host-id"] = devId;
    return headers;
  }, [userId]);

  const loadAvailability = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    setSaveError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/host/properties/${selectedPropertyId}/availability`, {
        headers: authHeaders,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBookedDates(data.bookedDates || []);
          setCheckoutDates(data.checkoutDates || []);
          setTimeSlotBookings(data.timeSlotBookings || []);
          setBlockedDates(data.blockedDates || []);
          setPriceOverrides(data.priceOverrides || {});
          if (data.slotConfig) {
            setSlotConfig(data.slotConfig);
          } else {
            setSlotConfig(createDefaultPropertySlotConfig(selectedPropertyId));
          }
          if (data.basePrice) setMasterBasePrice(String(data.basePrice));
          else if (data.weekdayPrice) setMasterBasePrice(String(data.weekdayPrice));

          if (data.customDayPricing && typeof data.customDayPricing === "object") {
            const parsed: Record<string, string> = { ...DEFAULT_DAYS };
            for (const key of Object.keys(DEFAULT_DAYS)) {
              const val = data.customDayPricing[key];
              if (typeof val === "number" && val > 0) {
                parsed[key] = String(val);
              }
            }
            setCustomDayPricing(parsed);
          } else {
            setCustomDayPricing(DEFAULT_DAYS);
          }
        }
      }
    } catch (err) {
      console.warn("Notice: Could not load property availability from API:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, getAuthHeaders]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const numericWeeklyPricing = useMemo<GranularWeeklyPricing>(() => {
    const numWeekly: GranularWeeklyPricing = {};
    for (const [k, v] of Object.entries(customDayPricing)) {
      const n = Number(v);
      (numWeekly as Record<string, number | null>)[k] = v && n > 0 ? n : null;
    }
    return numWeekly;
  }, [customDayPricing]);

  const slotSummaryByDate = useMemo<Record<string, CalendarDaySlotSummary>>(() => {
    const map: Record<string, CalendarDaySlotSummary> = {};
    const riyadhNow = getRiyadhNowInfo();
    const baseNum = Number(masterBasePrice) || 0;

    for (let day = 1; day <= monthData.daysInMonth; day++) {
      const iso = formatDayIso(monthData.year, monthData.month, day);
      const eff = getEffectiveNightlyRateForDate(iso, {
        masterBasePrice: baseNum,
        weeklyPricing: numericWeeklyPricing,
        dateOverrides: priceOverrides,
      });
      map[iso] = getCalendarDaySlotSummary({
        dateIso: iso,
        existingBookings: timeSlotBookings,
        slotConfig,
        hostBlockedDates: blockedDates,
        riyadhNow,
        effectiveStandardPrice: eff.rate,
      });
    }
    return map;
  }, [
    monthData,
    formatDayIso,
    timeSlotBookings,
    slotConfig,
    blockedDates,
    masterBasePrice,
    numericWeeklyPricing,
    priceOverrides,
  ]);

  const persistAvailabilityUpdates = useCallback(
    async (bodyPayload: Record<string, unknown>) => {
      if (!selectedPropertyId) return { success: false };
      setSaveError(null);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/host/properties/${selectedPropertyId}/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg =
          lang === "ar"
            ? data.messageAr || data.message || "فشل حفظ التغييرات"
            : data.message || "Failed to save changes";
        setSaveError(msg);
        return { success: false, message: msg };
      }
      if (data.slotConfig) {
        setSlotConfig(data.slotConfig);
      }
      return { success: true };
    },
    [selectedPropertyId, lang, getAuthHeaders]
  );

  const toggleDayBlocked = (dayIso: string) => {
    const summary = slotSummaryByDate[dayIso];
    if (summary && (summary.morningStatus === "booked" || summary.eveningStatus === "booked")) {
      setSaveError(
        t(
          `Cannot block ${dayIso}: an active guest booking already holds a time slot on this date.`,
          `لا يمكن إغلاق ${dayIso}: يوجد حجز ضيف مؤكد في أحد الفترات الزمنية لهذا اليوم.`
        )
      );
      return;
    }
    setBlockedDates((prev) =>
      prev.includes(dayIso) ? prev.filter((d) => d !== dayIso) : [...prev, dayIso]
    );
  };

  const handleTogglePropertySlotFormat = (
    formatId: "standard_4pm_12pm" | "twelve_hour_12am_12pm",
    enabled: boolean
  ) => {
    setSlotConfig((prev) => ({
      ...prev,
      enableStandard4pmTo12pm:
        formatId === "standard_4pm_12pm" ? enabled : prev.enableStandard4pmTo12pm,
      enableTwelveHour12amTo12pm:
        formatId === "twelve_hour_12am_12pm" ? enabled : prev.enableTwelveHour12amTo12pm,
    }));
  };

  const handleChangePropertyTwelveHourPrice = (val: string) => {
    const num = Number(val);
    setSlotConfig((prev) => ({
      ...prev,
      twelveHourPrice: val.trim() !== "" && !isNaN(num) && num > 0 ? num : null,
    }));
  };

  const handleSaveDateSlotOverride = async (dateIso: string, override: DateSlotOverride | null) => {
    const res = await persistAvailabilityUpdates({
      slotConfigUpdates: {
        dateSlotOverrides: {
          [dateIso]: override,
        },
      },
    });
    if (res.success) {
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } else {
      throw new Error(res.message || "Slot update conflict");
    }
  };

  const handlePrevMonth = () => setCurrentDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1));
  const handleOpenDateModal = (iso: string) => { setModalDateIso(iso); setIsModalOpen(true); };
  const handleCloseDateModal = () => { setIsModalOpen(false); setModalDateIso(null); };

  const handleSavePricing = async () => {
    if (!selectedPropertyId) return;
    setIsSaving(true);
    setSaveError(null);
    setSavedNotice(false);

    try {
      const numBase = Number(masterBasePrice) || 0;
      const weeklyObj: GranularWeeklyPricing = {};
      for (const [k, v] of Object.entries(customDayPricing)) {
        const dayNum = Number(v);
        (weeklyObj as Record<string, number | null>)[k] = v && !isNaN(dayNum) && dayNum > 0 ? dayNum : null;
      }

      const res = await persistAvailabilityUpdates({
        blockedDates,
        basePrice: numBase,
        weekdayPrice: numBase,
        customDayPricing: weeklyObj,
        priceOverrides,
        slotConfigUpdates: {
          enableStandard4pmTo12pm: slotConfig.enableStandard4pmTo12pm,
          enableTwelveHour12amTo12pm: slotConfig.enableTwelveHour12amTo12pm,
          twelveHourPrice: slotConfig.twelveHourPrice,
          dateSlotOverrides: slotConfig.dateSlotOverrides,
        },
      });

      if (!res.success) {
        throw new Error(res.message || t("Failed to save changes", "فشل حفظ التغييرات"));
      }

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : t("Failed to save pricing changes", "حدث خطأ أثناء حفظ الأسعار"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDateOverride = async (dateIso: string, price: number | null) => {
    if (!selectedPropertyId) return;
    const nextOverrides = { ...priceOverrides };
    if (price === null || price <= 0) {
      delete nextOverrides[dateIso];
    } else {
      nextOverrides[dateIso] = price;
    }
    setPriceOverrides(nextOverrides);

    try {
      await persistAvailabilityUpdates({ priceOverrides: { [dateIso]: price } });
    } catch (err) {
      console.warn("Could not save date override:", err);
    }
  };

  const activeModalEffective = useMemo(() => {
    if (!modalDateIso) return { rate: Number(masterBasePrice) || 0, source: "base_rate" as const };
    return getEffectiveNightlyRateForDate(modalDateIso, {
      masterBasePrice: Number(masterBasePrice) || 0,
      weeklyPricing: numericWeeklyPricing,
      dateOverrides: priceOverrides,
    });
  }, [modalDateIso, masterBasePrice, numericWeeklyPricing, priceOverrides]);

  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPropertyId) || properties[0] || null;
  }, [properties, selectedPropertyId]);

  return {
    selectedPropertyId,
    setSelectedPropertyId,
    selectedProperty,
    monthData,
    loading,
    isSaving,
    savedNotice,
    saveError,
    blockedDates,
    bookedDates,
    checkoutDates,
    timeSlotBookings,
    slotConfig,
    slotSummaryByDate,
    masterBasePrice,
    setMasterBasePrice,
    customDayPricing,
    setCustomDayPricing,
    priceOverrides,
    modalDateIso,
    isModalOpen,
    formatDayIso,
    toggleDayBlocked,
    handleTogglePropertySlotFormat,
    handleChangePropertyTwelveHourPrice,
    handleSaveDateSlotOverride,
    handlePrevMonth,
    handleNextMonth,
    handleOpenDateModal,
    handleCloseDateModal,
    handleSavePricing,
    handleSaveDateOverride,
    activeModalEffective,
    refreshAvailability: loadAvailability,
  };
}

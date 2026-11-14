"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDefaultPropertySlotConfig,
  getCalendarDaySlotSummary,
  getEffectiveNightlyRateForDate,
  getRiyadhNowInfo,
  isFormatEnabledOnDate,
  type CalendarDaySlotSummary,
  type DateSlotOverride,
  type PropertyBookingSlotConfig,
  type TimeSlotBooking,
} from "@qafnest/shared";
import type { PropertyItem } from "../types";

import { adminPath } from "@/lib/adminUrl";
interface AdminCalendarControlPanelProps {
  properties: PropertyItem[];
  triggerToast: (msg: string) => void;
  lang?: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function AdminCalendarControlPanel({
  properties,
  triggerToast,
  lang = "en",
  t,
}: AdminCalendarControlPanelProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || "");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [timeSlotBookings, setTimeSlotBookings] = useState<TimeSlotBooking[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [basePrice, setBasePrice] = useState<number>(500);
  const [customDayPricing, setCustomDayPricing] = useState<Record<string, number | null>>({});
  const [slotConfig, setSlotConfig] = useState<PropertyBookingSlotConfig>(() =>
    createDefaultPropertySlotConfig(properties[0]?.id || "")
  );

  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [dateTwelveHourInput, setDateTwelveHourInput] = useState<string>("");
  const [dateStandardPriceInput, setDateStandardPriceInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const loadAvailability = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(adminPath(`/api/admin/properties/${encodeURIComponent(selectedPropertyId)}/availability`),
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setBookedDates(data.bookedDates || []);
        setBlockedDates(data.blockedDates || []);
        setTimeSlotBookings(data.timeSlotBookings || []);
        setPriceOverrides(data.priceOverrides || {});
        const matchedProp = properties.find((p) => p.id === selectedPropertyId);
        setBasePrice(Number(data.basePrice || matchedProp?.base_price || 500));
        setCustomDayPricing(data.customDayPricing || {});
        setSlotConfig(
          data.slotConfig || createDefaultPropertySlotConfig(selectedPropertyId, matchedProp?.slug)
        );
      }
    } catch (err) {
      console.warn("Admin calendar fetch warning:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, properties]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const title = currentMonth.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "long",
      year: "numeric",
    });
    return { year, month, firstDayIndex, daysInMonth, title };
  }, [currentMonth, lang]);

  const riyadhToday = useMemo(() => getRiyadhNowInfo().dateIso, []);

  const formatIso = useCallback((y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }, []);

  const slotSummaryByDate = useMemo<Record<string, CalendarDaySlotSummary>>(() => {
    const map: Record<string, CalendarDaySlotSummary> = {};
    const riyadhNow = getRiyadhNowInfo();
    for (let d = 1; d <= monthData.daysInMonth; d++) {
      const iso = formatIso(monthData.year, monthData.month, d);
      const eff = getEffectiveNightlyRateForDate(iso, {
        masterBasePrice: basePrice,
        weeklyPricing: customDayPricing,
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
  }, [monthData, formatIso, timeSlotBookings, slotConfig, blockedDates, basePrice, customDayPricing, priceOverrides]);

  useEffect(() => {
    if (!selectedDateIso) return;
    const ov = slotConfig.dateSlotOverrides?.[selectedDateIso];
    setDateTwelveHourInput(ov?.twelveHourPrice ? String(ov.twelveHourPrice) : "");
    setDateStandardPriceInput(
      priceOverrides[selectedDateIso] ? String(priceOverrides[selectedDateIso]) : ""
    );
  }, [selectedDateIso, slotConfig, priceOverrides]);

  const persistAdminUpdate = async (payload: Record<string, unknown>, successMsg: string) => {
    if (!selectedPropertyId) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(adminPath(`/api/admin/properties/${encodeURIComponent(selectedPropertyId)}/availability`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg =
          lang === "ar"
            ? data.messageAr || data.message || "Update rejected"
            : data.message || "Update rejected";
        setErrorMsg(msg);
        return;
      }
      if (data.slotConfig) setSlotConfig(data.slotConfig);
      await loadAvailability();
      triggerToast(successMsg);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save calendar controls");
    } finally {
      setSaving(false);
    }
  };

  const selectedSummary = selectedDateIso ? slotSummaryByDate[selectedDateIso] : null;
  const isSelectedBlocked = selectedDateIso ? blockedDates.includes(selectedDateIso) : false;
  const selectedStandardEnabled = selectedDateIso
    ? isFormatEnabledOnDate(slotConfig, "standard_4pm_12pm", selectedDateIso, blockedDates)
    : true;
  const selectedTwelveHourEnabled = selectedDateIso
    ? isFormatEnabledOnDate(slotConfig, "twelve_hour_12am_12pm", selectedDateIso, blockedDates)
    : false;

  const weekdayLabels =
    lang === "ar"
      ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      {/* Property Selector & Top Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-4 border border-surface-container/60 shadow-xs">
        <div>
          <h2 className="font-title-sm text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
            {t("Admin Slot Calendar & Availability Control", "تقويم الإتاحة والتحكم بفترات الحجز")}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t(
              "Inspect booked & open hours per date (split view), toggle 4 PM–12 PM / 12 AM–12 PM formats, and protect active stays from overwrites.",
              "استعرض الساعات المحجوزة والمتاحة يومياً بنظام الانقسام، وتحكم بتفعيل فترات 4م–12م و12ص–12م دون تعارض."
            )}
          </p>
        </div>

        <select
          value={selectedPropertyId}
          onChange={(e) => {
            setSelectedPropertyId(e.target.value);
            setSelectedDateIso(null);
          }}
          className="h-10 rounded-xl border border-surface-container bg-surface px-3.5 text-xs font-bold text-on-surface outline-none focus:border-primary cursor-pointer min-w-[260px]"
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.city_name || p.city})
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-bold text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        {/* Left: Split-Slot Monthly Calendar Grid */}
        <div className="rounded-xl bg-surface-container-lowest p-4 sm:p-6 border border-surface-container/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container/60 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-on-surface">{monthData.title}</h3>
              {loading && (
                <span className="text-[11px] font-bold text-primary animate-pulse">
                  {t("Syncing...", "جاري التحديث...")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
                }
                className="h-8 w-8 rounded-lg border border-surface-container hover:bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
                }
                className="h-8 w-8 rounded-lg border border-surface-container hover:bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              {t("Open 4 PM+", "متاح 4م+")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-[#4F2396] to-emerald-500" />
              {t("Split Day (Out 12 PM · Open 4 PM+)", "منقسم (مغادرة 12م · متاح 4م)")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#4F2396]" />
              {t("Full Booked", "محجوز بالكامل")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
              {t("Closed", "مغلق")}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-outline pb-1">
            {weekdayLabels.map((lbl) => (
              <div key={lbl}>{lbl}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: monthData.firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 rounded-xl bg-surface-container-low/40" />
            ))}
            {Array.from({ length: monthData.daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const iso = formatIso(monthData.year, monthData.month, day);
              const summary = slotSummaryByDate[iso];
              const overall = summary?.overallStatus;
              const isSelected = selectedDateIso === iso;
              const isPast = iso < riyadhToday || Boolean(summary?.isPast);
              const isSplitCheckout = overall === "split_checkout_open";
              const isSplitCheckin = overall === "split_checkin_open";
              const isFullBooked =
                overall === "booked_full" ||
                overall === "checkout_only_closed" ||
                (!summary && bookedDates.includes(iso));
              const isClosed = overall === "closed";

              const { rate } = getEffectiveNightlyRateForDate(iso, {
                masterBasePrice: basePrice,
                weeklyPricing: customDayPricing,
                dateOverrides: priceOverrides,
              });

              const tooltip = isPast
                ? (lang === "ar" ? "تاريخ سابق (مغلق)" : "Past date (Closed)")
                : summary
                ? [
                    ...summary.occupiedWindows.map((w) => (lang === "ar" ? w.labelAr : w.labelEn)),
                    ...summary.openWindows.map((w) => (lang === "ar" ? w.labelAr : w.labelEn)),
                  ].join("\n")
                : iso;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  title={tooltip}
                  onClick={isPast ? undefined : () => setSelectedDateIso(iso)}
                  className={`h-20 rounded-xl p-1.5 flex flex-col justify-between text-start transition overflow-hidden border ${
                    isPast
                      ? "bg-slate-100/60 text-slate-300 border-slate-200/50 opacity-40 cursor-not-allowed select-none"
                      : isSelected
                      ? "ring-2 ring-primary border-primary cursor-pointer"
                      : isFullBooked
                      ? "bg-[#4F2396] text-white border-[#4F2396] cursor-pointer"
                      : isClosed
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-pointer"
                      : isSplitCheckout
                      ? "bg-gradient-to-b from-violet-100 via-white to-emerald-50 border-violet-300 cursor-pointer"
                      : isSplitCheckin
                      ? "bg-gradient-to-b from-cyan-50 via-white to-violet-100 border-cyan-300 cursor-pointer"
                      : "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-black leading-none ${isPast ? "text-slate-400 line-through" : ""}`}>
                      {day}
                    </span>
                    {isPast && (
                      <span className="text-[8px] font-bold text-slate-400">
                        {t("Passed", "منقضي")}
                      </span>
                    )}
                  </div>
                  {isPast ? (
                    <span className="text-[9px] font-bold text-slate-400 truncate">{t("Closed", "مغلق")}</span>
                  ) : isSplitCheckout ? (
                    <div className="w-full space-y-0.5 text-[8px] font-bold">
                      <div className="rounded bg-[#4F2396] text-white px-1 py-0.5 truncate">
                        {t("Out 12PM", "خروج 12م")}
                      </div>
                      <div className="rounded bg-emerald-600 text-white px-1 py-0.5 truncate">
                        {t("4PM+ Open", "4م+ متاح")}
                      </div>
                    </div>
                  ) : isSplitCheckin ? (
                    <div className="w-full space-y-0.5 text-[8px] font-bold">
                      <div className="rounded bg-cyan-600 text-white px-1 py-0.5 truncate">
                        {t("12AM-12PM", "12ص-12م")}
                      </div>
                      <div className="rounded bg-[#4F2396] text-white px-1 py-0.5 truncate">
                        {t("4PM+ Full", "4م+ محجوز")}
                      </div>
                    </div>
                  ) : isFullBooked ? (
                    <span className="text-[9px] font-bold truncate">{t("Booked", "محجوز")}</span>
                  ) : isClosed ? (
                    <span className="text-[9px] font-bold truncate">{t("Closed", "مغلق")}</span>
                  ) : (
                    <div className="w-full space-y-0.5">
                      {summary?.morningStatus === "available" && (
                        <div className="text-[8px] font-bold text-cyan-800 bg-cyan-100 rounded px-1 truncate">
                          12h Open
                        </div>
                      )}
                      <div className="text-[10px] font-black truncate">{rate} SAR</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Property Global Toggles + Selected Date Control Drawer */}
        <div className="space-y-4">
          {/* Property Global Timing Format Toggles */}
          <div className="rounded-xl bg-surface-container-lowest p-4 border border-surface-container/60 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
              {t("Property Timing Formats", "أنماط أوقات الحجز للعقار")}
            </h3>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-surface-container cursor-pointer">
              <div>
                <div className="text-xs font-bold text-on-surface">4:00 PM → 12:00 PM</div>
                <div className="text-[10px] text-on-surface-variant">
                  {t("Default overnight check-in/out", "النمط الافتراضي")}
                </div>
              </div>
              <input
                type="checkbox"
                disabled={saving}
                checked={slotConfig.enableStandard4pmTo12pm}
                onChange={(e) =>
                  void persistAdminUpdate(
                    { slotConfigUpdates: { enableStandard4pmTo12pm: e.target.checked } },
                    t("Updated 4 PM – 12 PM format state", "تم تحديث فترة 4 م – 12 م")
                  )
                }
                className="h-4 w-4 accent-[#4F2396] cursor-pointer"
              />
            </label>

            <div className="p-2.5 rounded-xl bg-surface border border-surface-container space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-on-surface">12:00 AM → 12:00 PM (12h)</div>
                  <div className="text-[10px] text-on-surface-variant">
                    {t("Enable optional 12-hour midnight slot", "تفعيل فترة 12 ساعة (منتصف الليل – الظهر)")}
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={slotConfig.enableTwelveHour12amTo12pm}
                  onChange={(e) =>
                    void persistAdminUpdate(
                      { slotConfigUpdates: { enableTwelveHour12amTo12pm: e.target.checked } },
                      t("Updated 12-hour 12 AM – 12 PM slot toggle", "تم تحديث خيار 12 ساعة")
                    )
                  }
                  className="h-4 w-4 accent-[#4F2396] cursor-pointer"
                />
              </label>

              {slotConfig.enableTwelveHour12amTo12pm && (
                <div className="pt-2 border-t border-surface-container/60 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder={String(basePrice || 450)}
                    value={slotConfig.twelveHourPrice ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSlotConfig((prev) => ({
                        ...prev,
                        twelveHourPrice: e.target.value && val > 0 ? val : null,
                      }));
                    }}
                    className="w-full rounded-lg border border-surface-container bg-surface-container-lowest px-2.5 py-1.5 text-xs font-bold"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void persistAdminUpdate(
                        { slotConfigUpdates: { twelveHourPrice: slotConfig.twelveHourPrice } },
                        t("12-hour slot rate saved", "تم حفظ سعر فترة 12 ساعة")
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer shrink-0"
                  >
                    {t("Save", "حفظ")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Selected Date Inspector */}
          <div className="rounded-xl bg-surface-container-lowest p-4 border border-surface-container/60 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">event_note</span>
              {selectedDateIso
                ? t(`Date Details (${selectedDateIso})`, `تفاصيل التاريخ (${selectedDateIso})`)
                : t("Select a date on the calendar", "اختر يوماً من التقويم")}
            </h3>

            {!selectedDateIso ? (
              <p className="text-xs text-on-surface-variant">
                {t(
                  "Click any day cell to view exact occupied/free hours, toggle slots, or close/open dates.",
                  "انقر على أي تاريخ لعرض الساعات المحجوزة والمتاحة وتعديل الإغلاق أو الفترات."
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateIso < riyadhToday && (
                  <div className="rounded-lg bg-slate-100 border border-slate-300 p-2.5 text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>
                      {t(
                        "This date has passed and is closed. Past dates cannot be modified.",
                        "هذا التاريخ منقضي ومغلق بالفعل ولا يمكن تعديله."
                      )}
                    </span>
                  </div>
                )}
                {selectedSummary?.occupiedWindows.map((win, i) => (
                  <div key={`ad-occ-${i}`} className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 text-xs font-bold text-[#4F2396] flex items-center justify-between">
                    <span>● {lang === "ar" ? win.labelAr : win.labelEn}</span>
                    {win.bookingRef && <span className="font-mono text-[10px]">{win.bookingRef}</span>}
                  </div>
                ))}
                {selectedSummary?.openWindows.map((win, i) => (
                  <div key={`ad-open-${i}`} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <span>○ {lang === "ar" ? win.labelAr : win.labelEn}</span>
                    {win.price ? <span>{win.price} SAR</span> : null}
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={saving || selectedDateIso < riyadhToday || selectedSummary?.eveningStatus === "booked"}
                    onClick={() =>
                      void persistAdminUpdate(
                        {
                          slotConfigUpdates: {
                            dateSlotOverrides: {
                              [selectedDateIso]: { standardEnabled: !selectedStandardEnabled },
                            } satisfies Record<string, DateSlotOverride>,
                          },
                        },
                        t("Updated 4 PM slot for date", "تم تحديث فترة 4 مساءً للتاريخ")
                      )
                    }
                    className={`rounded-lg px-2.5 py-2 text-[11px] font-bold border cursor-pointer disabled:opacity-50 ${
                      selectedStandardEnabled
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    4 PM–12 PM: {selectedStandardEnabled ? "ON" : "OFF"}
                  </button>

                  <button
                    type="button"
                    disabled={saving || selectedDateIso < riyadhToday || selectedSummary?.morningStatus === "booked"}
                    onClick={() =>
                      void persistAdminUpdate(
                        {
                          slotConfigUpdates: {
                            dateSlotOverrides: {
                              [selectedDateIso]: { twelveHourEnabled: !selectedTwelveHourEnabled },
                            } satisfies Record<string, DateSlotOverride>,
                          },
                        },
                        t("Updated 12 AM–12 PM (12h) slot for date", "تم تحديث فترة 12 ساعة للتاريخ")
                      )
                    }
                    className={`rounded-lg px-2.5 py-2 text-[11px] font-bold border cursor-pointer disabled:opacity-50 ${
                      selectedTwelveHourEnabled
                        ? "bg-cyan-50 border-cyan-300 text-cyan-800"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    12h (12AM–12PM): {selectedTwelveHourEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Per-date Price Overrides */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                      {t("Date 4PM Rate (SAR)", "سعر اليوم 4م (ر.س)")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={saving || selectedDateIso < riyadhToday}
                      placeholder={String(basePrice)}
                      value={dateStandardPriceInput}
                      onChange={(e) => setDateStandardPriceInput(e.target.value)}
                      className="w-full rounded-lg border border-surface-container px-2.5 py-1.5 text-xs font-bold disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                      {t("Date 12h Rate (SAR)", "سعر 12س لليوم (ر.س)")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={saving || selectedDateIso < riyadhToday}
                      placeholder={String(slotConfig.twelveHourPrice || basePrice)}
                      value={dateTwelveHourInput}
                      onChange={(e) => setDateTwelveHourInput(e.target.value)}
                      className="w-full rounded-lg border border-surface-container px-2.5 py-1.5 text-xs font-bold disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || selectedDateIso < riyadhToday}
                    onClick={() => {
                      const stdP = Number(dateStandardPriceInput);
                      const twP = Number(dateTwelveHourInput);
                      void persistAdminUpdate(
                        {
                          ...(dateStandardPriceInput.trim() && stdP > 0
                            ? { priceOverrides: { [selectedDateIso]: stdP } }
                            : {}),
                          slotConfigUpdates: {
                            dateSlotOverrides: {
                              [selectedDateIso]: {
                                twelveHourPrice: dateTwelveHourInput.trim() && twP > 0 ? twP : null,
                              },
                            },
                          },
                        },
                        t("Date slot rates updated", "تم تحديث أسعار الفترات لليوم")
                      );
                    }}
                    className="flex-1 rounded-xl bg-primary text-on-primary py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {t("Save Date Rates", "حفظ أسعار اليوم")}
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      selectedDateIso < riyadhToday ||
                      selectedSummary?.morningStatus === "booked" ||
                      selectedSummary?.eveningStatus === "booked"
                    }
                    onClick={() => {
                      const nextBlocked = isSelectedBlocked
                        ? blockedDates.filter((d) => d !== selectedDateIso)
                        : [...blockedDates, selectedDateIso];
                      void persistAdminUpdate(
                        { blockedDates: nextBlocked },
                        isSelectedBlocked
                          ? t("Date re-opened", "تمت إعادة فتح اليوم")
                          : t("Date closed", "تم إغلاق اليوم")
                      );
                    }}
                    className="rounded-xl border border-surface-container px-3 py-2 text-xs font-bold hover:bg-surface-container cursor-pointer disabled:opacity-40"
                  >
                    {isSelectedBlocked ? t("Open Day", "فتح اليوم") : t("Close Day", "إغلاق اليوم")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

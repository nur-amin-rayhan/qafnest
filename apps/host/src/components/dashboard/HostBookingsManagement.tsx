"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useHostAuth } from "@/context/HostAuthContext";
import { getHostRequestHeaders } from "@/lib/hostPropertyActions";
import {
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { BookingDetailModal } from "./bookings/BookingDetailModal";
import { BookingFilterToolbar } from "./bookings/BookingFilterToolbar";
import { BookingCardItem } from "./bookings/BookingCardItem";
import type { HostBookingItem, BookingTabKey, BookingCounts } from "./bookings/types";

// Re-export type for external components
export type { HostBookingItem };

interface HostBookingsManagementProps {
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  isRealtimeConnected?: boolean;
}

export default function HostBookingsManagement({
  lang,
  t,
  isRealtimeConnected = true,
}: HostBookingsManagementProps) {
  const [bookings, setBookings] = useState<HostBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<BookingTabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");

  // Selected Booking for Modal
  const [selectedBooking, setSelectedBooking] = useState<HostBookingItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { user } = useHostAuth();

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    setError(null);
    try {
      const headers = await getHostRequestHeaders(user?.id);
      const res = await fetch("/api/host/bookings", {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Failed to load bookings");
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching bookings");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (typeof window === "undefined" || bookings.length === 0) return;
    const targetBookingId = new URLSearchParams(window.location.search).get("bookingId");
    if (targetBookingId && selectedBooking?.id !== targetBookingId) {
      const match = bookings.find(
        (b) => b.id === targetBookingId || b.booking_reference === targetBookingId
      );
      if (match) {
        setSelectedBooking(match);
      }
    }
  }, [bookings, selectedBooking?.id]);

  // Unique properties for dropdown filter
  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bookings) {
      if (b.property_id && !map.has(b.property_id)) {
        map.set(b.property_id, lang === "ar" ? b.propertyTitleAr : b.propertyTitle);
      }
    }
    return Array.from(map.entries());
  }, [bookings, lang]);

  // Status counts for badge tabs
  const counts = useMemo<BookingCounts>(() => {
    let upcoming = 0, today = 0, pending = 0, past = 0;
    for (const b of bookings) {
      if (b.status === "pending") pending++;
      else if (b.stayStatus === "today" || b.stayStatus === "in_house") today++;
      else if (b.stayStatus === "upcoming") upcoming++;
      else if (b.stayStatus === "past") past++;
    }
    return { all: bookings.length, upcoming, today, pending, past };
  }, [bookings]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeTab === "upcoming" && b.stayStatus !== "upcoming") return false;
      if (activeTab === "today" && b.stayStatus !== "today" && b.stayStatus !== "in_house") return false;
      if (activeTab === "pending" && b.status !== "pending") return false;
      if (activeTab === "past" && b.stayStatus !== "past") return false;
      if (selectedPropertyId !== "all" && b.property_id !== selectedPropertyId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ref = (b.booking_reference || "").toLowerCase();
        const guest = (b.guestName || "").toLowerCase();
        const phone = (b.guestPhone || "").toLowerCase();
        const title = (lang === "ar" ? b.propertyTitleAr : b.propertyTitle).toLowerCase();
        if (!ref.includes(q) && !guest.includes(q) && !phone.includes(q) && !title.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeTab, selectedPropertyId, searchQuery, lang]);

  // Unified action dispatcher
  const patchBooking = async (bookingId: string, payload: Record<string, unknown>, successMsg: string) => {
    setActionLoadingId(bookingId);
    setActionSuccessMsg(null);
    try {
      const authHeaders = await getHostRequestHeaders(user?.id);
      const res = await fetch(`/api/host/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      const updated = data.booking;
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...updated } : b)));
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setActionSuccessMsg(successMsg);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating booking");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSetManualPin = (id: string, pin: string) => {
    const b = bookings.find((item) => item.id === id);
    if (b?.status === "cancelled") {
      setActionSuccessMsg(t("PIN configuration is disabled for cancelled reservations.", "إصدار رمز القفل معطل للحجوزات الملغية."));
      return;
    }
    patchBooking(id, { pin }, t(`Smart Lock PIN updated to (${pin})!`, `تم تحديث رمز القفل إلى (${pin})!`));
  };
  const handleUpdateStatus = (id: string, status: "confirmed" | "cancelled") =>
    patchBooking(id, { status }, status === "confirmed" ? t("Booking confirmed successfully!", "تم تأكيد الحجز بنجاح!") : t("Booking cancelled.", "تم إلغاء الحجز."));

  // Copy PIN
  const handleCopyPin = (pin: string, id: string) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-7 space-y-6">
      {/* Top Header & Realtime Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {t("Booking Management", "إدارة الحجوزات")}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-black transition-colors ${
                isRealtimeConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isRealtimeConnected ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                }`}
              />
              <span>
                {isRealtimeConnected
                  ? t("Live Sync Active", "متصل ومحدث فورياً")
                  : t("Connecting...", "جارٍ الاتصال...")}
              </span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            {t(
              "Review guest reservations, assign smart lock PINs, and coordinate check-in and checkout in real time.",
              "متابعة سجل حجوزات الضيوف، إرسال رموز القفل الذكي، وإدارة الوصول والمغادرة بصورة فورية."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchBookings();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-[#4F2396]" : "text-slate-400"} />
          <span>{t("Refresh", "تحديث")}</span>
        </button>
      </div>

      {/* Action Toast Alert */}
      {actionSuccessMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setActionSuccessMsg(null)} className="cursor-pointer">
            <X size={14} className="text-emerald-600 hover:text-emerald-900" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <BookingFilterToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        propertyOptions={propertyOptions}
        filteredCount={filteredBookings.length}
        lang={lang}
        t={t}
      />

      {/* Bookings List Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <LoaderCircle size={36} className="mx-auto mb-3 animate-spin text-[#4F2396]" />
          <p className="text-sm font-extrabold text-slate-600">{t("Loading live bookings...", "جارٍ تحميل سجل الحجوزات...")}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => { setLoading(true); void fetchBookings(); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4F2396] px-4 py-2 text-xs font-bold text-white hover:bg-[#3D1A75] cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>{t("Retry", "إعادة المحاولة")}</span>
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3">
          <CalendarDays size={42} className="mx-auto text-slate-300" />
          <p className="text-base font-black text-slate-700">
            {t("No bookings match your filter criteria", "لا توجد حجوزات مطابقة لمعايير البحث")}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {t(
              "When guests make confirmed stays or send booking requests, they will appear here instantly.",
              "عند قيام الضيوف بحجز وحداتك المعروضة، ستظهر جميع بياناتهم ورموز القفل الذكي هنا مباشرة."
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((item) => (
            <BookingCardItem
              key={item.id}
              item={item}
              actionLoadingId={actionLoadingId}
              copiedPinId={copiedPinId}
              lang={lang}
              t={t}
              onSelectBooking={setSelectedBooking}
              onCopyPin={handleCopyPin}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        copiedPinId={copiedPinId}
        actionLoadingId={actionLoadingId}
        lang={lang}
        t={t}
        onClose={() => {
          setSelectedBooking(null);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("bookingId")) {
              url.searchParams.delete("bookingId");
              window.history.replaceState(null, "", `${url.pathname}${url.search}`);
            }
          }
        }}
        onCopyPin={handleCopyPin}
        onSetManualPin={handleSetManualPin}
      />
    </div>
  );
}

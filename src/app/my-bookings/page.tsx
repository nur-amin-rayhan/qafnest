"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, KeyRound, LoaderCircle, MessageSquareText, Printer, RefreshCw } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import { createFirebaseReviewDataClient } from "@/lib/reviews/client";

type Booking = {
  id: string;
  check_in: string;
  check_out: string;
  total_nights: number;
  guests_count: number;
  total_price: number;
  status: string;
  payment_status: string;
  smart_lock_pin: string | null;
  created_at: string;
  property: { id: string; title: string; city_name: string | null; images: string[] | null } | null;
};

function getSaudiDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export default function MyBookingsPage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { language } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const label = (en: string, ar: string) => language === "ar" ? ar : en;
  const todayInSaudiArabia = getSaudiDate();

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      let remoteBookings: Booking[] = [];
      try {
        const isFirebaseUser = user.app_metadata?.provider === "firebase_phone";
        const queryClient = isFirebaseUser ? await createFirebaseReviewDataClient() : supabase;
        if (queryClient) {
          let query = queryClient
            .from("bookings")
            .select("id, check_in, check_out, total_nights, guests_count, total_price, status, payment_status, smart_lock_pin, created_at, property:properties(id, title, city_name, images)")
            .order("created_at", { ascending: false });
          query = isFirebaseUser ? query.eq("auth_subject", user.id) : query.eq("guest_id", user.id);
          const { data, error: queryError } = await query;
          if (!queryError && data) {
            remoteBookings = data as unknown as Booking[];
          }
        }
      } catch (err) {
        console.warn("Notice: Remote bookings query fallback:", err);
      }

      // Merge with locally stored confirmed bookings for instant voucher access
      let localBookings: Booking[] = [];
      try {
        const raw = window.localStorage.getItem("qafnest_guest_bookings");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localBookings = parsed.map((item: Record<string, unknown>) => {
              const prop = item.property as Record<string, unknown> | undefined;
              return {
                id: String(item.bookingId || item.bookingRef),
                check_in: String(item.checkIn || ""),
                check_out: String(item.checkOut || ""),
                total_nights: Number(item.nights || 1),
                guests_count: Number(item.guests || 2),
                total_price: Number(item.amount || 0),
                status: "confirmed",
                payment_status: "success",
                smart_lock_pin: item.smartLockPin ? String(item.smartLockPin) : null,
                created_at: new Date().toISOString(),
                property: prop ? {
                  id: String(prop.id || ""),
                  title: String(prop.title || "Luxury Stay"),
                  city_name: typeof prop.city_name === "string" ? prop.city_name : null,
                  images: Array.isArray(prop.images) ? (prop.images as string[]) : null,
                } : null,
              };
            });
          }
        }
      } catch {}

      const seen = new Set<string>();
      const combined: Booking[] = [];
      for (const b of [...remoteBookings, ...localBookings]) {
        const key = b.id || `${b.property?.id}-${b.check_in}-${b.check_out}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(b);
        }
      }

      setBookings(combined);
    } catch (loadError) {
      setBookings([]);
      setError(loadError instanceof Error ? loadError.message : "Booking records are unavailable.");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!authLoading) void loadBookings();
  }, [authLoading, loadBookings]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-32 dark:bg-[#08070D] sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                {label("QafNest account", "حساب قف نست")}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">
                {label("My bookings", "حجوزاتي")}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {label(
                  "Your reservations, payment status and access details.",
                  "قائمة حجوزاتك وحالة الدفع وتفاصيل الدخول الذكي."
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
              >
                <Printer className="h-4 w-4" />
                {label("Print voucher", "طباعة القسيمة")}
              </button>
              <button
                onClick={() => void loadBookings()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
              >
                <RefreshCw className="h-4 w-4" />
                {label("Refresh", "تحديث")}
              </button>
            </div>
          </div>

          {!authLoading && !user && bookings.length === 0 ? (
            <section className="mt-8 rounded-3xl border border-violet-100 bg-white p-8 text-center dark:border-white/10 dark:bg-[#12101a]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {label("Sign in to see your bookings", "سجل الدخول لعرض حجوزاتك")}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {label(
                  "Use the phone number you entered during checkout.",
                  "استخدم رقم الجوال المسجل به أثناء الحجز."
                )}
              </p>
              <button
                onClick={() => openAuthModal("signin")}
                className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 transition"
              >
                {label("Sign in", "تسجيل الدخول")}
              </button>
            </section>
          ) : loading ? (
            <div className="mt-10 flex items-center justify-center gap-3 py-20 text-sm text-gray-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              {label("Loading bookings…", "جاري تحميل الحجوزات...")}
            </div>
          ) : error ? (
            <section role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {label("Unable to load bookings:", "تعذر تحميل الحجوزات:")} {error}
            </section>
          ) : bookings.length === 0 ? (
            <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center dark:border-white/10 dark:bg-[#12101a]">
              <CalendarDays className="mx-auto h-9 w-9 text-violet-600 dark:text-violet-300" />
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                {label("No reservations yet", "لا توجد حجوزات حتى الآن")}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {label(
                  "Your confirmed and upcoming stays will appear here.",
                  "ستظهر حجوزاتك المؤكدة والقادمة ورموز القفل الذكي هنا."
                )}
              </p>
              <Link
                href="/search"
                className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 transition"
              >
                {label("Explore stays", "استكشف العقارات")}
              </Link>
            </section>
          ) : (
            <div className="mt-8 space-y-4">
              {bookings.map((booking) => {
                const title = booking.property?.title || "QafNest stay";
                const canShowPin = booking.status === "confirmed" && booking.payment_status === "success" && Boolean(booking.smart_lock_pin);
                const canReview = booking.status === "completed" && booking.payment_status === "success" && booking.check_out <= todayInSaudiArabia && Boolean(booking.property?.id);
                return (
                  <article key={booking.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#12101a]">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-white/10 sm:p-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {label("Reservation", "رقم الحجز")} {booking.id.slice(0, 10).toUpperCase()}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{title}</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {booking.property?.city_name || (language === "ar" ? "المملكة العربية السعودية" : "Saudi Arabia")}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${booking.status === "confirmed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"}`}>
                        {booking.status === "confirmed" ? label("Confirmed", "مؤكد") : booking.status}
                      </span>
                    </div>
                    <div className="grid gap-4 p-5 sm:grid-cols-4 sm:p-6">
                      <div>
                        <span className="block text-xs text-gray-500">{label("Check-in", "تسجيل الوصول")}</span>
                        <strong className="mt-1 block text-sm">{booking.check_in}</strong>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">{label("Check-out", "تسجيل المغادرة")}</span>
                        <strong className="mt-1 block text-sm">{booking.check_out}</strong>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">{label("Guests · Nights", "الضيوف · الليالي")}</span>
                        <strong className="mt-1 block text-sm">
                          {booking.guests_count} {label("guests", "ضيوف")} · {booking.total_nights} {label("nights", "ليالٍ")}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">{label("Total Paid", "المبلغ المدفوع")}</span>
                        <strong className="mt-1 block text-sm text-violet-600 dark:text-violet-400">
                          {Number(booking.total_price).toLocaleString()} SAR
                        </strong>
                      </div>
                    </div>
                    {canShowPin && (
                      <div className="flex items-center gap-3 border-t border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-400/20 dark:bg-emerald-400/5 sm:px-6">
                        <KeyRound className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                            {label("Smart lock PIN (Keyless Self Check-in)", "رمز القفل الذكي (الدخول الذاتي)")}
                          </p>
                          <p className="font-mono text-xl font-bold tracking-[0.25em] text-emerald-950 dark:text-white">
                            {booking.smart_lock_pin}
                          </p>
                        </div>
                      </div>
                    )}
                    {booking.status === "confirmed" && booking.payment_status === "success" && !booking.smart_lock_pin && (
                      <p className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
                        {label("Your host will provide the access code before check-in.", "سيقوم المضيف بتزويدك برمز الدخول قبل وقت تسجيل الوصول.")}
                      </p>
                    )}
                    {canReview && booking.property?.id && (
                      <div className="border-t border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6">
                        <Link
                          href={`/property/${encodeURIComponent(booking.property.id)}?tab=reviews&review_booking=${encodeURIComponent(booking.id)}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-900"
                        >
                          <MessageSquareText className="h-4 w-4" />
                          {label("Write a verified review", "اكتب تقييماً موثقاً")}
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}

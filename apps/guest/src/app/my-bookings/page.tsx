"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, LoaderCircle, Printer, RefreshCw } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useMyBookings } from "./hooks/useMyBookings";
import BookingCardItem from "./components/BookingCardItem";

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
  const router = useRouter();
  const { user, session, loading: authLoading, openAuthModal } = useAuth();
  const { language } = useApp();
  const { bookings, loading, error, loadBookings } = useMyBookings(user, session, authLoading);

  const label = (en: string, ar: string) => (language === "ar" ? ar : en);
  const todayInSaudiArabia = getSaudiDate();

  useEffect(() => {
    if (!authLoading && !user) {
      if (typeof window !== "undefined" && window.sessionStorage.getItem("qafnest_is_logging_out") === "1") {
        router.replace("/");
        return;
      }
      router.replace("/?auth=required");
      openAuthModal("signin");
    }
  }, [authLoading, user, router, openAuthModal]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#08070D]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-violet-600" />
          <span>{label("Loading your account…", "جارٍ التحقق من الحساب…")}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#08070D]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-violet-600" />
          <span>{label("Redirecting to home…", "جارٍ التحويل إلى الرئيسية…")}</span>
        </div>
      </div>
    );
  }

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
            <section
              role="alert"
              className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
            >
              {label("Unable to load bookings:", "تعذر تحميل الحجوزات:")} {error}
            </section>
          ) : bookings.length === 0 ? (
            <section className="mt-8 rounded-3xl border border-violet-200/85 bg-white p-10 text-center shadow-[0_12px_35px_rgba(109,40,217,0.06)] dark:border-violet-500/20 dark:bg-[#12101a]">
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
                className="mt-5 inline-flex rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 transition"
              >
                {label("Explore stays", "استكشف العقارات")}
              </Link>
            </section>
          ) : (
            <div className="mt-8 space-y-4">
              {bookings.map((booking) => (
                <BookingCardItem
                  key={booking.id}
                  booking={booking}
                  todayInSaudiArabia={todayInSaudiArabia}
                  language={language}
                  label={label}
                  onRefresh={loadBookings}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}

"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import SearchPropertyCard from "@/components/search/SearchPropertyCard";
import BookingModal from "@/components/modals/BookingModal";
import AuthModal from "@/components/modals/AuthModal";
import HostModal from "@/components/modals/HostModal";
import SearchModal from "@/components/modals/SearchModal";
import { useApp } from "@/context/AppContext";
import { useProperties } from "@/hooks/useProperties";

export default function WishlistPage() {
  const { wishlist, language } = useApp();
  const { properties, loading } = useProperties();

  const label = (en: string, ar: string) => (language === "ar" ? ar : en);

  const savedProperties = useMemo(() => {
    return properties.filter((p) => wishlist.includes(p.id));
  }, [properties, wishlist]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#08070D] dark:text-gray-100 flex flex-col justify-between">
      <div>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
                <Heart className="w-3.5 h-3.5 fill-violet-600 text-violet-600 dark:fill-violet-400 dark:text-violet-400" />
                {label("Saved stays", "العقارات المحفوظة")}
              </span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              {label("My Wishlist", "قائمة المفضلة")}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {label(
                "Keep track of private chalets, luxury villas and desert camps you love.",
                "احتفظ بالشاليهات والفلل والمخيمات الخاصة التي نالت إعجابك للرجوع إليها في أي وقت."
              )}
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : savedProperties.length === 0 ? (
            <div className="my-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 p-12 text-center dark:border-white/10 dark:bg-[#12101a]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                <Heart className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                {label("Your wishlist is empty", "قائمة المفضلة فارغة")}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {label(
                  "Tap the heart icon on any chalet or villa to save your favorite getaways here.",
                  "انقر على أيقونة القلب على أي شاليه أو فيلا لحفظها في هذه الصفحة وتسهيل الحجز لاحقاً."
                )}
              </p>
              <Link
                href="/search"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-violet-800 transition active:scale-95"
              >
                <span>{label("Explore all stays", "استكشف العقارات")}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {label(
                  `Showing ${savedProperties.length} saved stay${savedProperties.length > 1 ? "s" : ""}`,
                  `عرض ${savedProperties.length} عقار محفوظ`
                )}
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {savedProperties.map((property) => (
                  <SearchPropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
      <BookingModal />
      <AuthModal />
      <HostModal />
      <SearchModal />
    </div>
  );
}

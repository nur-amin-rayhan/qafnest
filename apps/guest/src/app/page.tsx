"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import SmoothScroll from "@/components/common/SmoothScroll";
import ScrollProgress from "@/components/common/ScrollProgress";
import BackToTop from "@/components/common/BackToTop";
import Navbar from "@/components/common/Navbar";
import Hero from "@/components/home/Hero";
import RecentlyViewedSection from "@/components/home/RecentlyViewedSection";
import Destinations from "@/components/home/Destinations";
import PropertyListingSections from "@/components/home/PropertyListingSections";
import Footer from "@/components/common/Footer";
import { useAuth } from "@/context/AuthContext";

// Lazy load non-critical modals to reduce initial JavaScript payload on mobile
const BookingModal = dynamic(() => import("@/components/modals/BookingModal"), { ssr: false });
const AppModal = dynamic(() => import("@/components/modals/AppModal"), { ssr: false });
const AuthModal = dynamic(() => import("@/components/modals/AuthModal"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/modals/SearchModal"), { ssr: false });

function AuthRequiredHandler() {
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggingOut = window.sessionStorage.getItem("qafnest_is_logging_out") === "1";
      if (isLoggingOut) {
        window.sessionStorage.removeItem("qafnest_is_logging_out");
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("auth");
          url.searchParams.delete("returnUrl");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        } catch {}
        return;
      }
    }

    if (searchParams.get("auth") === "required") {
      openAuthModal("signin");
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        url.searchParams.delete("returnUrl");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      } catch {}
    }
  }, [searchParams, openAuthModal]);

  return null;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthRequiredHandler />
      </Suspense>

      {/* Lenis Smooth Inertia Momentum Scroll */}
      <SmoothScroll />

      {/* Top Precision Scroll Progress Bar */}
      <ScrollProgress />

      {/* Sticky Glass Navbar & Promo Banner */}
      <Navbar />

      <main className="relative z-10">
        {/* Hero Section & Multi-Search Bar */}
        <Hero />

        {/* Dynamic Recently Viewed Section */}
        <RecentlyViewedSection />

        {/* A Place to Stay Wherever You Go - Circular Destinations */}
        <Destinations />

        {/* Gathern-style Horizontal Property Sections up to Footer */}
        <PropertyListingSections />
      </main>

      {/* Floating Back to Top Button */}
      <BackToTop />

      {/* Luxury Footer */}
      <Footer />

      {/* Modals */}
      <BookingModal />
      <AppModal />
      <AuthModal />
      <SearchModal />
    </>
  );
}

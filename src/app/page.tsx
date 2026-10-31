"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "@/components/common/SmoothScroll";
import ScrollProgress from "@/components/common/ScrollProgress";
import BackToTop from "@/components/common/BackToTop";
import Navbar from "@/components/common/Navbar";
import Hero from "@/components/home/Hero";
import Destinations from "@/components/home/Destinations";
import PropertyListingSections from "@/components/home/PropertyListingSections";
import Footer from "@/components/common/Footer";

// Lazy load non-critical modals to reduce initial JavaScript payload on mobile
const BookingModal = dynamic(() => import("@/components/modals/BookingModal"), { ssr: false });
const HostModal = dynamic(() => import("@/components/modals/HostModal"), { ssr: false });
const AppModal = dynamic(() => import("@/components/modals/AppModal"), { ssr: false });
const AuthModal = dynamic(() => import("@/components/modals/AuthModal"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/modals/SearchModal"), { ssr: false });

export default function Home() {
  return (
    <>
      {/* Lenis Smooth Inertia Momentum Scroll */}
      <SmoothScroll />

      {/* Top Precision Scroll Progress Bar */}
      <ScrollProgress />

      {/* Sticky Glass Navbar & Promo Banner */}
      <Navbar />

      <main className="relative z-10">
        {/* Hero Section & Multi-Search Bar */}
        <Hero />

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
      <HostModal />
      <AppModal />
      <AuthModal />
      <SearchModal />
    </>
  );
}

"use client";

import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import SmoothScroll from "@/components/common/SmoothScroll";
import ScrollProgress from "@/components/common/ScrollProgress";
import BackToTop from "@/components/common/BackToTop";
import Navbar from "@/components/common/Navbar";
import Hero from "@/components/home/Hero";
import Destinations from "@/components/home/Destinations";
import PropertyListingSections from "@/components/home/PropertyListingSections";
import Footer from "@/components/common/Footer";
import BookingModal from "@/components/modals/BookingModal";
import HostModal from "@/components/modals/HostModal";
import AppModal from "@/components/modals/AppModal";
import AuthModal from "@/components/modals/AuthModal";
import SearchModal from "@/components/modals/SearchModal";

export default function Home() {
  return (
    <AuthProvider>
      <AppProvider>
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
      </AppProvider>
    </AuthProvider>
  );
}

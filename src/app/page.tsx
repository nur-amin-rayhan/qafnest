"use client";

import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import SmoothScroll from "@/components/common/SmoothScroll";
import ScrollProgress from "@/components/common/ScrollProgress";
import BackToTop from "@/components/common/BackToTop";
import Navbar from "@/components/common/Navbar";
import Hero from "@/components/home/Hero";
import Destinations from "@/components/home/Destinations";
import CategoryPills from "@/components/home/CategoryPills";
import PropertiesGrid from "@/components/home/PropertiesGrid";
import LastMinuteDeals from "@/components/home/LastMinuteDeals";
import LifestyleCollections from "@/components/home/LifestyleCollections";
import Guarantee from "@/components/home/Guarantee";
import HostPortal from "@/components/home/HostPortal";
import Amenities from "@/components/home/Amenities";
import Reviews from "@/components/home/Reviews";
import AppDownload from "@/components/home/AppDownload";
import TravelStories from "@/components/home/TravelStories";
import FaqAccordion from "@/components/home/FaqAccordion";
import SafePayments from "@/components/home/SafePayments";
import Footer from "@/components/common/Footer";
import BookingModal from "@/components/modals/BookingModal";
import HostModal from "@/components/modals/HostModal";
import AppModal from "@/components/modals/AppModal";
import AuthModal from "@/components/modals/AuthModal";

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

          {/* Explore by Destination */}
          <Destinations />

          {/* Category Pills Bar */}
          <CategoryPills />

          {/* Featured Properties Grid */}
          <PropertiesGrid />

          {/* Last-Minute Deals & Weekend Getaways */}
          <LastMinuteDeals />

          {/* Book Your Second Home - Curated Collections */}
          <LifestyleCollections />

          {/* What Can We Do For You? (The QafNest Guarantee) */}
          <Guarantee />

          {/* Host Portal & Earnings Calculator */}
          <HostPortal />

          {/* Resort Amenities & Experiences */}
          <Amenities />

          {/* Voices of Our Guests */}
          <Reviews />

          {/* Download QafNest Mobile App & Smart Digital Lock */}
          <AppDownload />

          {/* Discover Saudi Arabia Travel Stories */}
          <TravelStories />

          {/* Frequently Asked Questions Accordion */}
          <FaqAccordion />

          {/* Certified Safe Payment Methods */}
          <SafePayments />
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
      </AppProvider>
    </AuthProvider>
  );
}

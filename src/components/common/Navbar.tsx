"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  X,
  MapPin,
  Home,
  Flame,
  Smartphone,
  HelpCircle,
  Key,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import { useApp, Currency } from "@/context/AppContext";

export default function Navbar() {
  const {
    currency,
    setCurrency,
    promoBannerVisible,
    dismissPromoBanner,
    isDarkTheme,
    toggleTheme,
    openHostModal,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Top Promo Announcement Banner */}
      {promoBannerVisible && (
        <div
          id="promo-banner"
          className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-violet-950/95 via-purple-900/95 to-violet-950/95 backdrop-blur-md border-b border-violet-500/20 py-2 px-4 text-xs font-medium text-white shadow-lg transition-all duration-300"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
                <Sparkles className="w-3 h-3 text-fuchsia-300" /> Weekend Flash
              </span>
              <span className="text-white/90 text-xs sm:text-sm truncate">
                Save up to <strong>40% OFF</strong> this weekend on licensed chalets & private villas across Saudi Arabia. Use promo code{" "}
                <span className="font-mono font-bold text-fuchsia-300 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  QAF15
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => copyCode("QAF15")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied! ✓" : "Copy Code"}</span>
              </button>
              <button
                onClick={dismissPromoBanner}
                aria-label="Dismiss banner"
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Glass Navbar with Entrance Animation */}
      <motion.header
        id="navbar"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          promoBannerVisible ? "top-9" : "top-0"
        } ${scrolled ? "py-2" : "py-3"}`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="glass-strong rounded-full px-6 py-3 flex items-center justify-between shadow-luxe border border-violet-400/15">
            {/* Brand Monogram & Logo */}
            <Link href="#top" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-700 via-violet-500 to-fuchsia-400 p-[1px] shadow-[0_0_18px_rgba(168,85,247,0.4)]">
                <div className="h-full w-full rounded-full bg-ink flex items-center justify-center font-display font-bold text-lg text-white">
                  Q
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold tracking-tight text-fg flex items-center gap-1">
                  QAF<span className="text-gradient">NEST</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-violet-300 font-semibold -mt-1">
                  STAYS & HOSPITALITY
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
              <Link
                href="#destinations"
                className="text-muted/80 hover:text-fg transition-colors flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-violet-400" /> Destinations
              </Link>
              <Link
                href="#properties"
                className="text-muted/80 hover:text-fg transition-colors flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5 text-violet-400" /> Chalets & Villas
              </Link>
              <Link
                href="#deals"
                className="text-fuchsia-300 hover:text-white transition-colors flex items-center gap-1 font-semibold"
              >
                <Flame className="w-3.5 h-3.5 text-fuchsia-400" /> Flash Deals
              </Link>
              <Link
                href="#collections"
                className="text-muted/80 hover:text-fg transition-colors"
              >
                Second Home
              </Link>
              <Link
                href="#app"
                className="text-muted/80 hover:text-fg transition-colors flex items-center gap-1"
              >
                <Smartphone className="w-3.5 h-3.5 text-violet-400" /> App
              </Link>
              <Link
                href="#faq"
                className="text-muted/80 hover:text-fg transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-violet-400" /> FAQ
              </Link>
              <button
                onClick={openHostModal}
                className="text-violet-300 hover:text-white transition-colors flex items-center gap-1 font-semibold"
              >
                <Key className="w-3.5 h-3.5 text-fuchsia-400" /> Host with Us
              </button>
            </nav>

            {/* Right Controls: Currency, Theme & Hamburger */}
            <div className="flex items-center gap-2.5">
              {/* Currency Picker */}
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="glass rounded-full text-xs font-semibold px-3 py-1.5 text-muted focus:outline-none focus:ring-1 focus:ring-violet-400 cursor-pointer"
                >
                  <option value="SAR" className="bg-gray-900 text-white">
                    SAR (﷼)
                  </option>
                  <option value="USD" className="bg-gray-900 text-white">
                    USD ($)
                  </option>
                  <option value="AED" className="bg-gray-900 text-white">
                    AED (د.إ)
                  </option>
                  <option value="EUR" className="bg-gray-900 text-white">
                    EUR (€)
                  </option>
                </select>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="glass h-9 w-9 rounded-full flex items-center justify-center text-muted hover:text-fg transition-colors"
              >
                {isDarkTheme ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-violet-400" />
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden glass h-9 w-9 rounded-full flex items-center justify-center text-muted hover:text-fg"
                aria-label="Open Mobile Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden max-w-7xl mx-auto px-5 sm:px-8 mt-2">
            <div className="glass-strong rounded-3xl p-6 border border-violet-400/20 space-y-4">
              <Link
                href="#destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-fg hover:text-fuchsia-300"
              >
                Destinations
              </Link>
              <Link
                href="#properties"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-fg hover:text-fuchsia-300"
              >
                Chalets & Villas
              </Link>
              <Link
                href="#deals"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-fuchsia-300"
              >
                Flash Deals 🔥
              </Link>
              <Link
                href="#collections"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-fg hover:text-fuchsia-300"
              >
                Second Home Collections
              </Link>
              <Link
                href="#app"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-fg hover:text-fuchsia-300"
              >
                Download Mobile App
              </Link>
              <Link
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-fg hover:text-fuchsia-300"
              >
                Customer FAQs
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openHostModal();
                }}
                className="w-full py-2.5 rounded-full bg-luxe-gradient text-white text-xs font-bold uppercase tracking-wider text-center"
              >
                List Your Property
              </button>
            </div>
          </div>
        )}
      </motion.header>
    </>
  );
}

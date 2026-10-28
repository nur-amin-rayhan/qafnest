"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Home,
  Calendar,
  Users,
  Search,
  Zap,
  Waves,
  Key,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import MagneticButton from "@/components/ui/MagneticButton";

export default function Hero() {
  const {
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    instantOnly,
    setInstantOnly,
    poolOnly,
    setPoolOnly,
    selfCheckinOnly,
    setSelfCheckinOnly,
  } = useApp();

  const [checkin, setCheckin] = useState("2026-10-28");
  const [checkout, setCheckout] = useState("2026-10-30");
  const [guests, setGuests] = useState("4");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const propertiesEl = document.getElementById("properties");
    if (propertiesEl) {
      propertiesEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="top" className="relative pt-32 pb-6 lg:pt-36 lg:pb-8 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />

      {/* Floating Luxury Badges from Reference Project */}
      <div className="hidden xl:block absolute left-10 top-[40%] z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass glow-border animate-float rounded-2xl px-4 py-3 shadow-glow" style={{ animationDelay: "0s" }}>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              <div className="text-left">
                <p className="font-display text-sm font-bold text-fg">12,000+ Stays</p>
                <p className="text-[10px] text-muted/70">Verified in Saudi Arabia</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="hidden xl:block absolute right-10 top-[40%] z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass glow-border animate-float rounded-2xl px-4 py-3 shadow-glow" style={{ animationDelay: "1.5s" }}>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
              <div className="text-left">
                <p className="font-display text-sm font-bold text-fg">Smart Digital Lock</p>
                <p className="text-[10px] text-muted/70">100% Keyless Check-in</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10 text-center">
        {/* Ministry License Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-300 mb-6 border border-violet-500/20 shadow-glow"
        >
          <span className="h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.9)] animate-pulse" />
          Officially Licensed by the Saudi Ministry of Tourism · ترخيص وزارة السياحة
        </motion.div>

        {/* Hero Title with Staggered Word Reveals */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-fg max-w-4xl mx-auto leading-[1.1] mb-6">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            Feel at Home.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="block text-gradient font-serif italic font-normal"
          >
            Stay Exceptional.
          </motion.span>
        </h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm sm:text-base lg:text-lg text-muted/80 max-w-2xl mx-auto font-light leading-relaxed mb-10"
        >
          Book handpicked luxury chalets, private pool villas, country farms, and stargazing desert camps across Saudi Arabia with instant smart lock keyless check-in.
        </motion.p>

        {/* Gathern Inspired Multi-Search Bar Engine */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl mx-auto relative z-20"
        >
          <div className="glass-strong glow-border rounded-3xl p-4 sm:p-5 shadow-2xl border border-violet-400/20">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
              {/* Destination City */}
              <div className="glass rounded-2xl p-3 text-left border border-white/10 hover:border-violet-400/40 transition-colors">
                <label className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-fuchsia-400" /> Destination
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-fg focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-gray-900 text-white">
                    All Saudi Destinations (المملكة)
                  </option>
                  <option value="riyadh" className="bg-gray-900 text-white">
                    Riyadh & Al-Ammariyah (الرياض)
                  </option>
                  <option value="jeddah" className="bg-gray-900 text-white">
                    Jeddah & Obhur Creek (جدة وأبحر)
                  </option>
                  <option value="alula" className="bg-gray-900 text-white">
                    AlUla Desert Valley (العلا)
                  </option>
                  <option value="khobar" className="bg-gray-900 text-white">
                    Al Khobar & Dammam (الخبر والدمام)
                  </option>
                  <option value="abha" className="bg-gray-900 text-white">
                    Abha & Asir Highlands (أبها وعسير)
                  </option>
                </select>
              </div>

              {/* Property Type */}
              <div className="glass rounded-2xl p-3 text-left border border-white/10 hover:border-violet-400/40 transition-colors">
                <label className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block mb-1 flex items-center gap-1">
                  <Home className="w-3 h-3 text-fuchsia-400" /> Property Type
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-fg focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-gray-900 text-white">
                    All Stay Types (جميع العقارات)
                  </option>
                  <option value="chalet" className="bg-gray-900 text-white">
                    Chalets & Resorts (شاليهات)
                  </option>
                  <option value="villa" className="bg-gray-900 text-white">
                    Private Villas (فلل خاصة)
                  </option>
                  <option value="farm" className="bg-gray-900 text-white">
                    Country Farms (مزارع واستراحات)
                  </option>
                  <option value="camp" className="bg-gray-900 text-white">
                    Desert Camps (مخيمات وقباب)
                  </option>
                  <option value="penthouse" className="bg-gray-900 text-white">
                    Sky Penthouses (بنتهاوس)
                  </option>
                </select>
              </div>

              {/* Dates */}
              <div className="glass rounded-2xl p-3 text-left border border-white/10 hover:border-violet-400/40 transition-colors">
                <label className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-fuchsia-400" /> Check In & Out
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                    className="w-1/2 bg-transparent text-xs sm:text-sm font-semibold text-fg focus:outline-none cursor-pointer"
                  />
                  <span className="text-white/30 text-xs">→</span>
                  <input
                    type="date"
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                    className="w-1/2 bg-transparent text-xs sm:text-sm font-semibold text-fg focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Guests Count */}
              <div className="glass rounded-2xl p-3 text-left border border-white/10 hover:border-violet-400/40 transition-colors">
                <label className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-fuchsia-400" /> Guests & Majlis
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-fg focus:outline-none cursor-pointer"
                >
                  <option value="2" className="bg-gray-900 text-white">
                    2 Guests (Couples)
                  </option>
                  <option value="4" className="bg-gray-900 text-white">
                    4 - 6 Guests (Small Family)
                  </option>
                  <option value="8" className="bg-gray-900 text-white">
                    8 - 12 Guests (Large Family)
                  </option>
                  <option value="15" className="bg-gray-900 text-white">
                    15+ Guests (Event & Majlis)
                  </option>
                </select>
              </div>

              {/* Search Submit Button */}
              <div className="h-full flex items-center">
                <MagneticButton
                  type="submit"
                  rounded="rounded-2xl"
                  className="w-full h-full py-4 px-6 text-sm group"
                >
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Search Stays</span>
                </MagneticButton>
              </div>
            </form>

            {/* Quick Check Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-white/5 text-xs text-muted">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer hover:text-fg transition-colors">
                  <input
                    type="checkbox"
                    checked={instantOnly}
                    onChange={(e) => setInstantOnly(e.target.checked)}
                    className="rounded accent-violet-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-fuchsia-400" /> Instant Book
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer hover:text-fg transition-colors">
                  <input
                    type="checkbox"
                    checked={poolOnly}
                    onChange={(e) => setPoolOnly(e.target.checked)}
                    className="rounded accent-violet-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Waves className="w-3.5 h-3.5 text-cyan-400" /> Private Pool
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer hover:text-fg transition-colors">
                  <input
                    type="checkbox"
                    checked={selfCheckinOnly}
                    onChange={(e) => setSelfCheckinOnly(e.target.checked)}
                    className="rounded accent-violet-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-400" /> Self Check-in
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-violet-300 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Split any stay into 4 months with Tabby & Tamara</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

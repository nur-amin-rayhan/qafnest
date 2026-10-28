"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Moon,
  Sun,
  Globe,
  ArrowUpRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Key,
  Home,
  MapPin,
  Flame,
  Check,
} from "lucide-react";
import { useApp, Currency } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const {
    currency,
    setCurrency,
    isDarkTheme,
    toggleTheme,
    openHostModal,
    setSelectedCity,
    setSelectedCategory,
  } = useApp();

  const { user, profile, isHost, role, openAuthModal, signOut } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<"EN" | "AR">("EN");

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setLangDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchClick = () => {
    const heroSearch = document.getElementById("hero-search") || document.getElementById("properties");
    if (heroSearch) {
      heroSearch.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setActiveDropdown(null);
    const el = document.getElementById("properties");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setActiveDropdown(null);
    const el = document.getElementById("properties");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      ref={navRef}
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-[#06060B]/90 backdrop-blur-xl border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-3"
          : "bg-[#06060B]/75 backdrop-blur-md border-white/[0.05] py-4"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* ================= LEFT: BRAND LOGO ================= */}
        <Link href="#top" className="flex items-center gap-3 group shrink-0">
          {/* Circular Orbit / Radar Glyph matching the reference icon */}
          <div className="relative flex items-center justify-center h-8 w-8 rounded-full border border-violet-500/40 bg-violet-950/40 shadow-[0_0_14px_rgba(168,85,247,0.4)]">
            <div className="absolute inset-0 rounded-full border border-dashed border-violet-400/50 animate-[spin_10s_linear_infinite]" />
            <div className="h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.95)]" />
          </div>

          {/* Brand Typography: DIGITIZE STUDIO style -> QAF NEST */}
          <div className="flex items-center font-display font-bold tracking-[0.14em] text-base sm:text-lg">
            <span className="text-white">QAF</span>
            <span className="text-fuchsia-400 ml-1.5 font-extrabold text-gradient">NEST</span>
          </div>
        </Link>

        {/* ================= MIDDLE: NAVIGATION LINKS WITH CHEVRONS ================= */}
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-white/80">
          {/* Destinations Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("destinations")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => setActiveDropdown(activeDropdown === "destinations" ? null : "destinations")}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1"
            >
              <span>Destinations</span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                  activeDropdown === "destinations" ? "rotate-180 opacity-100 text-fuchsia-400" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === "destinations" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-[#0B0B14]/95 backdrop-blur-xl border border-white/10 p-2 shadow-2xl z-50"
                >
                  <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-violet-300/80 tracking-wider">
                    Popular Cities
                  </p>
                  {[
                    { id: "all", name: "All Destinations" },
                    { id: "riyadh", name: "Riyadh (الرياض)" },
                    { id: "jeddah", name: "Jeddah (جدة)" },
                    { id: "alula", name: "AlUla (العلا)" },
                    { id: "khobar", name: "Khobar (الخبر)" },
                    { id: "abha", name: "Abha (أبها)" },
                  ].map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city.id)}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-violet-400" />
                      <span>{city.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chalets & Villas Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("categories")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => setActiveDropdown(activeDropdown === "categories" ? null : "categories")}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1"
            >
              <span>Chalets & Villas</span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                  activeDropdown === "categories" ? "rotate-180 opacity-100 text-fuchsia-400" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === "categories" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-[#0B0B14]/95 backdrop-blur-xl border border-white/10 p-2 shadow-2xl z-50"
                >
                  <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-violet-300/80 tracking-wider">
                    Property Types
                  </p>
                  {[
                    { id: "all", name: "All Types" },
                    { id: "chalet", name: "Private Chalets (شاليهات)" },
                    { id: "villa", name: "Luxury Villas (فلل فاخرة)" },
                    { id: "farm", name: "Heritage Farms (مزارع)" },
                    { id: "camp", name: "Desert Camps (مخيمات)" },
                    { id: "penthouse", name: "VIP Penthouses" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5 text-violet-400" />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Flash Deals Link */}
          <Link
            href="#deals"
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 text-fuchsia-300 font-semibold"
          >
            <span>Flash Deals</span>
            <Flame className="w-3.5 h-3.5 text-fuchsia-400" />
          </Link>

          {/* Second Home / Collections Link */}
          <Link
            href="#collections"
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1"
          >
            <span>Second Home</span>
          </Link>

          {/* Host with Us */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("host")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={openHostModal}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 text-violet-300"
            >
              <span>Host with Us</span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                  activeDropdown === "host" ? "rotate-180 opacity-100 text-fuchsia-400" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === "host" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-60 rounded-2xl bg-[#0B0B14]/95 backdrop-blur-xl border border-white/10 p-2 shadow-2xl z-50"
                >
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      openHostModal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-xl text-fuchsia-300 hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>List Your Property</span>
                  </button>
                  <Link
                    href="#host"
                    onClick={() => setActiveDropdown(null)}
                    className="w-full text-left px-3 py-2 text-xs rounded-xl text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Host Earnings Calculator</span>
                  </Link>
                  <Link
                    href="#faq"
                    onClick={() => setActiveDropdown(null)}
                    className="w-full text-left px-3 py-2 text-xs rounded-xl text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Host FAQs & Protection</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* ================= RIGHT: SEARCH, THEME, LANG/CURRENCY, AUTH & CTA ================= */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Icon */}
          <button
            onClick={handleSearchClick}
            aria-label="Search"
            className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle (Moon / Sun) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {isDarkTheme ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300" />
            )}
          </button>

          {/* Globe & Language / Currency Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white py-1 px-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4 text-white/70" />
              <span>{selectedLang}</span>
              <span className="text-[10px] text-violet-300">({currency})</span>
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[#0B0B14]/95 backdrop-blur-xl border border-white/10 p-2 shadow-2xl z-50 text-xs"
                >
                  <p className="px-3 py-1 text-[10px] uppercase font-bold text-muted tracking-wider">
                    Language
                  </p>
                  <button
                    onClick={() => {
                      setSelectedLang("EN");
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.06] flex items-center justify-between"
                  >
                    <span>English</span>
                    {selectedLang === "EN" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLang("AR");
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.06] flex items-center justify-between"
                  >
                    <span>العربية (Saudi Arabia)</span>
                    {selectedLang === "AR" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <div className="my-1.5 border-t border-white/10" />

                  <p className="px-3 py-1 text-[10px] uppercase font-bold text-muted tracking-wider">
                    Currency
                  </p>
                  {(["SAR", "USD", "AED", "EUR"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCurrency(c);
                        setLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.06] flex items-center justify-between"
                    >
                      <span>{c}</span>
                      {currency === c && <Check className="w-3.5 h-3.5 text-fuchsia-400" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu (If Logged In) */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 pl-2 bg-white/[0.05] border border-white/10 hover:border-violet-400/40 transition-colors cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-400 flex items-center justify-center text-white font-bold text-[10px]">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden xl:inline-block max-w-[80px] truncate text-xs font-semibold text-white">
                  {profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-white/60 mr-1" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0B0B14]/95 backdrop-blur-xl border border-white/10 p-2 shadow-2xl z-50 text-xs"
                  >
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="font-bold text-white truncate">
                        {profile?.full_name || "Valued User"}
                      </p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-bold uppercase">
                        {role}
                      </span>
                    </div>

                    <div className="py-1">
                      {isHost ? (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            openHostModal();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-fuchsia-300 hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-fuchsia-400" /> Host Portal & Listings
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            openHostModal();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-violet-300 hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-violet-400" /> Become a Host
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer mt-1 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal("signin")}
              className="hidden sm:inline-flex text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer px-2"
            >
              Sign In
            </button>
          )}

          {/* ================= PRIMARY CTA BUTTON (Matching "Book Consultation ↗") ================= */}
          <Link
            href="#properties"
            className="group relative inline-flex items-center gap-1.5 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 shadow-[0_0_24px_rgba(168,85,247,0.4)] transition-all duration-300 cursor-pointer shrink-0"
          >
            <span>Book a Stay</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white"
            aria-label="Open Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0B0B14]/98 border-b border-white/10 px-6 py-5 space-y-4"
          >
            <Link
              href="#destinations"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-white/90 hover:text-fuchsia-300"
            >
              Destinations
            </Link>
            <Link
              href="#properties"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-white/90 hover:text-fuchsia-300"
            >
              Chalets & Villas
            </Link>
            <Link
              href="#deals"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-fuchsia-300 flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" /> Flash Deals
            </Link>
            <Link
              href="#collections"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-white/90 hover:text-fuchsia-300"
            >
              Second Home
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openHostModal();
              }}
              className="block text-left text-sm font-semibold text-violet-300"
            >
              Host with Us
            </button>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              {user ? (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs font-bold text-white">{profile?.full_name || user.email}</p>
                    <span className="text-[10px] text-fuchsia-300 font-bold uppercase">{role}</span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="text-xs text-rose-400 font-bold"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("signin");
                  }}
                  className="w-full py-2.5 rounded-full border border-violet-400/40 bg-violet-600/20 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

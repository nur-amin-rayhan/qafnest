"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Key,
  CalendarDays,
  Heart,
  PlusCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const {
    language,
    toggleLanguage,
    t,
    isDarkTheme,
    toggleTheme,
    selectedCategory,
    setSelectedCategory,
  } = useApp();

  const { user, profile, role, openAuthModal, signOut } = useAuth();
  const contactEmail =
    user?.email ||
    (typeof user?.user_metadata?.contact_email === "string"
      ? user.user_metadata.contact_email
      : "");
  const accountName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "");

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gathern-exact Header Navigation Links
  const navMenuItems = [
    {
      id: "apartments",
      labelEn: "Villas & Apartments",
      labelAr: "شقق وفلل",
      href: "/apartments",
      type: "villa",
      isActive:
        pathname === "/apartments" ||
        pathname === "/en/apartments" ||
        (pathname === "/search" &&
          (selectedCategory === "villa" || selectedCategory === "penthouse")),
    },
    {
      id: "chalets",
      labelEn: "Chalets & Resorts",
      labelAr: "شاليهات ومنتجعات",
      href: "/chalets",
      type: "chalet",
      isActive:
        pathname === "/chalets" ||
        pathname === "/en/chalets" ||
        (pathname === "/search" && selectedCategory === "chalet"),
    },
    {
      id: "farms",
      labelEn: "Farms",
      labelAr: "مزارع",
      href: "/farms",
      type: "farm",
      isActive:
        pathname === "/farms" ||
        pathname === "/en/farms" ||
        (pathname === "/search" && selectedCategory === "farm"),
    },
    {
      id: "camps",
      labelEn: "Camps",
      labelAr: "مخيّمات",
      href: "/camps",
      type: "camp",
      isActive:
        pathname === "/camps" ||
        pathname === "/en/camps" ||
        (pathname === "/search" && selectedCategory === "camp"),
    },
    {
      id: "blog",
      labelEn: "Blog",
      labelAr: "المدونة",
      href: "/blog",
      type: null,
      isActive: pathname === "/blog" || pathname === "/en/blog",
    },
  ];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof navMenuItems)[0]
  ) => {
    if (item.type) {
      setSelectedCategory(item.type);
    }
    // If clicking on homepage, smoothly scroll to property listing if present
    if (item.type && pathname === "/" && typeof window !== "undefined") {
      const el = document.getElementById("properties");
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const dropdownContainerClass = isDarkTheme
    ? "bg-[#0B0B14] border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
    : "bg-white border-purple-100 shadow-[0_20px_50px_rgba(88,28,135,0.16)] text-gray-800";

  const dropdownItemClass = isDarkTheme
    ? "text-white/80 hover:text-white hover:bg-white/[0.08]"
    : "text-gray-700 hover:text-purple-900 hover:bg-purple-50/80";

  return (
    <header
      ref={navRef}
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isDarkTheme
          ? scrolled
            ? "bg-[#06060B]/95 backdrop-blur-xl border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-3"
            : "bg-[#06060B]/85 backdrop-blur-md border-white/[0.05] py-4"
          : scrolled
            ? "bg-white/95 backdrop-blur-xl border-purple-900/[0.08] shadow-[0_4px_25px_rgba(88,28,135,0.06)] py-3 text-gray-900"
            : "bg-white/95 backdrop-blur-md border-purple-900/[0.05] py-4 text-gray-900"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
        {/* ================= LEFT / START: BRAND LOGO ================= */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/#top" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex items-center justify-center h-8 w-8 rounded-full border border-violet-500/40 bg-violet-950/40 shadow-[0_0_14px_rgba(168,85,247,0.4)]">
              <div className="absolute inset-0 rounded-full border border-dashed border-violet-400/50 animate-[spin_10s_linear_infinite]" />
              <div className="h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.95)]" />
            </div>

            <div className="flex items-center font-display font-bold tracking-[0.14em] text-base sm:text-lg">
              <span className={isDarkTheme ? "text-white" : "text-gray-900"}>QAF</span>
              <span className="text-fuchsia-400 ml-1.5 rtl:mr-1.5 rtl:ml-0 font-extrabold text-gradient">NEST</span>
            </div>
          </Link>
        </div>

        {/* ================= MIDDLE: GATHERN-STYLE MENU BAR ================= */}
        <nav
          aria-label="Main Navigation"
          className="hidden min-[1025px]:flex items-center gap-1 xl:gap-2"
        >
          <ul className="flex items-center gap-1 xl:gap-1.5 list-none p-0 m-0">
            {navMenuItems.map((item) => {
              const label = language === "ar" ? item.labelAr : item.labelEn;
              return (
                <li key={item.id} className="relative shrink-0">
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`relative flex items-center px-3.5 py-2 rounded-xl text-[14px] xl:text-[15px] font-medium transition-all duration-200 cursor-pointer ${
                      item.isActive
                        ? isDarkTheme
                          ? "text-fuchsia-400 font-semibold bg-white/[0.08] shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                          : "text-purple-700 font-semibold bg-purple-50 shadow-sm"
                        : isDarkTheme
                          ? "text-white/80 hover:text-white hover:bg-white/[0.05]"
                          : "text-gray-700 hover:text-purple-700 hover:bg-gray-100/70"
                    }`}
                  >
                    <span className="whitespace-nowrap">{label}</span>
                    {item.isActive && (
                      <motion.div
                        layoutId="activeNavPill"
                        className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-400 rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ================= RIGHT: HOST CTA, USER AUTH, LANGUAGE & THEME ================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Host Portal Link (Gathern "أعلن معنا / List your property") */}
          <a
            href="https://business.qafnest.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 ${
              isDarkTheme
                ? "text-violet-300 hover:text-white hover:bg-violet-950/40 border border-violet-500/20"
                : "text-purple-700 hover:text-purple-900 hover:bg-purple-50 border border-purple-200"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
            <span>{t.nav.host}</span>
          </a>

          {/* Theme Toggle (Moon / Sun) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDarkTheme
                ? "text-white/80 hover:text-white hover:bg-white/10"
                : "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
            }`}
          >
            {isDarkTheme ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {/* User Profile Menu (If Logged In) or Sign In button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 rounded-full p-1 pl-2 rtl:pl-1 rtl:pr-2 border transition-colors cursor-pointer ${
                  isDarkTheme
                    ? "bg-white/[0.05] border-white/10 hover:border-violet-400/40 text-white"
                    : "bg-purple-50 border-purple-200 hover:border-purple-300 text-gray-900"
                }`}
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-400 flex items-center justify-center text-white font-bold text-[10px]">
                  {accountName.charAt(0) || contactEmail.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden xl:inline-block max-w-[80px] truncate text-xs font-semibold">
                  {accountName.split(" ")[0] || contactEmail.split("@")[0]}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 mr-1 rtl:ml-1 rtl:mr-0" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-56 rounded-2xl border p-2 shadow-2xl z-50 text-xs before:absolute before:-top-3 before:left-0 before:right-0 before:h-4 before:content-[''] ${dropdownContainerClass}`}
                  >
                    <div className="px-3 py-2 border-b border-purple-500/15">
                      <p className="font-bold truncate">
                        {accountName || "Valued User"}
                      </p>
                      <p className="text-[10px] text-muted truncate">{contactEmail}</p>
                      <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-bold uppercase">
                        {role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/my-bookings"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`w-full rounded-xl px-3 py-2 flex items-center gap-2 text-xs ${dropdownItemClass}`}
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-violet-400" />{" "}
                        {language === "ar" ? "حجوزاتي" : "My bookings"}
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`w-full rounded-xl px-3 py-2 flex items-center gap-2 text-xs ${dropdownItemClass}`}
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-400" />{" "}
                        {language === "ar" ? "المفضلة" : "Wishlist"}
                      </Link>

                      <a
                        href="https://business.qafnest.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left rtl:text-right px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer text-violet-600 dark:text-violet-400 hover:bg-purple-500/10 text-xs font-semibold"
                      >
                        <Key className="w-3.5 h-3.5 text-violet-500 shrink-0" /> {t.nav.host}
                      </a>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left rtl:text-right px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer mt-1 font-semibold text-xs"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" /> {t.nav.signOut}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal("signin")}
              className={`text-xs font-bold transition-colors cursor-pointer px-3.5 py-2 rounded-xl ${
                isDarkTheme
                  ? "text-white/80 hover:text-white hover:bg-white/5"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {t.nav.signIn}
            </button>
          )}

          {/* ================= DEDICATED LANGUAGE SELECTION BUTTON ================= */}
          <button
            onClick={toggleLanguage}
            aria-label="Switch Language"
            className="group relative inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-white group-hover:rotate-45 transition-transform duration-300" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`min-[1025px]:hidden p-2 rounded-lg ${
              isDarkTheme
                ? "text-white/80 hover:text-white hover:bg-white/5"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="Open Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU DRAWER ================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`min-[1025px]:hidden border-b px-6 py-5 space-y-3 ${
              isDarkTheme
                ? "bg-[#0B0B14] border-white/10 text-white"
                : "bg-white border-purple-100 text-gray-900 shadow-xl"
            }`}
          >
            {navMenuItems.map((item) => {
              const label = language === "ar" ? item.labelAr : item.labelEn;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(e, item);
                    setMobileMenuOpen(false);
                  }}
                  className={`block py-2 text-sm font-semibold rounded-lg px-2 transition-colors ${
                    item.isActive
                      ? "text-fuchsia-400 bg-purple-500/10 font-bold"
                      : "hover:text-fuchsia-400"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-purple-500/15">
              <a
                href="https://business.qafnest.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-semibold text-violet-400 hover:text-fuchsia-400"
              >
                <PlusCircle className="w-4 h-4 text-fuchsia-400" />
                <span>{t.nav.host}</span>
              </a>
            </div>

            {/* Language Switch Button inside Mobile Menu */}
            <div className="pt-1">
              <button
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-600/15 text-xs font-bold text-violet-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>
                  {language === "en" ? "تبديل إلى العربية" : "Switch to English"}
                </span>
              </button>
            </div>

            <div className="pt-3 border-t border-purple-500/15">
              {user ? (
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{accountName || contactEmail}</p>
                      <span className="text-[10px] text-fuchsia-400 font-bold uppercase">
                        {role}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      className="text-xs text-rose-400 font-bold"
                    >
                      {t.nav.signOut}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <Link
                      href="/my-bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-semibold text-violet-300"
                    >
                      {language === "ar" ? "حجوزاتي" : "My bookings"}
                    </Link>
                    <span className="text-white/20">·</span>
                    <Link
                      href="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-semibold text-rose-300"
                    >
                      {language === "ar" ? "المفضلة" : "Wishlist"}
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("signin");
                  }}
                  className="w-full py-2.5 rounded-xl border border-violet-400/40 bg-violet-600/20 text-xs font-bold uppercase tracking-wider text-violet-300"
                >
                  {t.nav.signIn}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

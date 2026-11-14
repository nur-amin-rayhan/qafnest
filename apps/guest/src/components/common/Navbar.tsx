"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Moon, Sun, Globe, Menu, X, PlusCircle, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { localizePath, stripLocaleFromPathname } from "@/lib/localization/localeHelper";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
import { getNavMenuItems, NavMenuItem } from "./navbar/navConstants";
import NavUserDropdown from "./navbar/NavUserDropdown";
import NavMobileMenu from "./navbar/NavMobileMenu";

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
  const [mounted, setMounted] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const router = useRouter();

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearchQuery.trim()) return;
    router.push(localizePath(`/search?q=${encodeURIComponent(headerSearchQuery.trim())}`, language));
    setMobileSearchOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const navMenuItems = getNavMenuItems(pathname, selectedCategory, language);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavMenuItem
  ) => {
    if (item.type) {
      setSelectedCategory(item.type);
    }
    // If clicking on homepage, smoothly scroll to property listing if present
    const cleanPath = stripLocaleFromPathname(pathname);
    if (item.type && cleanPath === "/" && typeof window !== "undefined") {
      const el = document.getElementById("properties");
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

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
        {/* Brand Logo */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Link href={localizePath("/", language)} className="inline-flex items-center gap-1 select-none shrink-0 group">
            <span
              className={`text-[26px] sm:text-[30px] font-black tracking-[-0.05em] transition-colors ${
                isDarkTheme ? "text-white" : "text-[#4F2396]"
              }`}
            >
              Qaf<span className={isDarkTheme ? "text-violet-300" : "text-[#7c3aed]"}>Nest</span>
              <span className="text-[#FF9750]">.</span>
            </span>
          </Link>
        </div>

        {/* Desktop Header Property Search Bar */}
        <form
          onSubmit={handleHeaderSearchSubmit}
          className="hidden md:flex items-center relative max-w-xs xl:max-w-sm w-full mx-2"
        >
          <input
            type="text"
            value={headerSearchQuery}
            onChange={(e) => setHeaderSearchQuery(e.target.value)}
            placeholder={language === "ar" ? "ابحث باسم العقار، الشاليه..." : "Search chalets, villas by name..."}
            className={`w-full h-9 ps-3.5 pe-9 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
              isDarkTheme
                ? "bg-white/5 border border-white/10 text-white placeholder-white/40 focus:bg-white/10"
                : "bg-purple-50/70 border border-purple-200/80 text-gray-800 placeholder-gray-400 focus:bg-white"
            }`}
          />
          <button
            type="submit"
            title={language === "ar" ? "بحث عن عقار" : "Search Properties"}
            className="absolute end-1 w-7 h-7 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white flex items-center justify-center cursor-pointer transition shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Desktop Menu Bar */}
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

        {/* Host CTA (Visible only when signed out), Theme, User Auth, Language */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!user && (
            <a
              href={`${ECOSYSTEM_URLS.host}/?lang=${language}`}
              rel="noopener noreferrer"
              className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                isDarkTheme
                  ? "text-violet-300 hover:text-white hover:bg-violet-950/40 border border-violet-500/20"
                  : "text-purple-700 hover:text-purple-900 hover:bg-purple-50 border border-purple-200"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
              <span>{t.nav.host}</span>
            </a>
          )}

          {/* Theme Toggle */}
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

          {/* User Profile or Sign In */}
          {mounted && user ? (
            <NavUserDropdown
              accountName={accountName}
              contactEmail={contactEmail}
              role={role}
              isOpen={userDropdownOpen}
              onToggle={() => setUserDropdownOpen(!userDropdownOpen)}
              onClose={() => setUserDropdownOpen(false)}
              language={language}
              t={t}
              signOut={signOut}
              isDarkTheme={isDarkTheme}
            />
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

          {/* Language Selection */}
          <button
            onClick={toggleLanguage}
            aria-label="Switch Language"
            className="group relative inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-white group-hover:rotate-45 transition-transform duration-300" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </button>

          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkTheme
                ? "text-white/80 hover:text-white hover:bg-white/5"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="Toggle Property Search"
          >
            <Search className="w-4 h-4 text-violet-400" />
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

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pt-2 pb-3 border-t border-purple-500/10 bg-inherit">
          <form onSubmit={handleHeaderSearchSubmit} className="relative flex items-center w-full">
            <input
              type="text"
              autoFocus
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              placeholder={language === "ar" ? "ابحث باسم العقار..." : "Search properties by name..."}
              className={`w-full h-10 ps-3.5 pe-10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                isDarkTheme
                  ? "bg-white/10 text-white placeholder-white/50 border border-white/10"
                  : "bg-purple-50 text-gray-900 placeholder-gray-400 border border-purple-200"
              }`}
            />
            <button
              type="submit"
              className="absolute end-1.5 w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      <NavMobileMenu
        isOpen={mobileMenuOpen}
        isDarkTheme={isDarkTheme}
        navMenuItems={navMenuItems}
        language={language}
        onNavClick={handleNavClick}
        onClose={() => setMobileMenuOpen(false)}
        toggleLanguage={toggleLanguage}
        mounted={mounted}
        user={user}
        accountName={accountName}
        contactEmail={contactEmail}
        role={role}
        signOut={signOut}
        openAuthModal={openAuthModal}
        t={t}
      />
    </header>
  );
}

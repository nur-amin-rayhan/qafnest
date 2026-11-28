"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Globe, Menu, MessageSquareText, Moon, Sun, X } from "lucide-react";
import { HostNotificationsDropdown } from "./nav/HostNotificationsDropdown";
import { HostProfileDropdown } from "./nav/HostProfileDropdown";
import { HostMobileNavDrawer } from "./nav/HostMobileNavDrawer";

export type Module =
  | "overview"
  | "calendar"
  | "reservations"
  | "analytics"
  | "reviews"
  | "properties"
  | "finance"
  | "pricing"
  | "settings";

export interface HostNotification {
  id: string;
  property_id?: string | null;
  booking_id?: string | null;
  event_type?: string | null;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const MODULE_TITLES: Record<Module, { en: string; ar: string }> = {
  overview: { en: "Operations Overview", ar: "نظرة عامة على العمليات" },
  properties: { en: "Properties Fleet", ar: "إدارة العقارات" },
  reservations: { en: "Guest Reservations", ar: "حجوزات الضيوف" },
  calendar: { en: "Calendar & Pricing", ar: "التقويم والأسعار" },
  pricing: { en: "Dynamic Pricing", ar: "التسعير الذكي" },
  finance: { en: "Financials & Payouts", ar: "المالية والتحويلات" },
  analytics: { en: "Sales & Analytics", ar: "التحليلات والمبيعات" },
  reviews: { en: "Guest Reviews", ar: "تقييمات النزلاء" },
  settings: { en: "Account Settings", ar: "إعدادات الحساب" },
};

interface HostTopNavProps {
  active: Module;
  setActive: (module: Module) => void;
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  t: (en: string, ar: string) => string;
  user: {
    id?: string;
    email?: string | null;
    phone?: string | null;
    user_metadata?: { full_name?: string; name?: string };
  } | null;
  profile: {
    full_name?: string | null;
    phone?: string | null;
  } | null;
  signOut: () => Promise<void>;
  submittedPropertiesCount: number;
  hasPropertyIssues: boolean;
  bookingsCount: number;
  notifications: HostNotification[];
  onSelectNotification?: (notification: HostNotification) => void;
  onMarkAllNotificationsRead: () => Promise<void>;
  mobileNavOpen?: boolean;
  setMobileNavOpen?: (open: boolean) => void;
  theme?: "light" | "dark";
  toggleTheme?: () => void;
}

export default function HostTopNav({
  active,
  setActive,
  lang,
  setLang,
  t,
  user,
  profile,
  signOut,
  submittedPropertiesCount,
  hasPropertyIssues,
  bookingsCount,
  notifications,
  onSelectNotification,
  onMarkAllNotificationsRead,
  mobileNavOpen,
  setMobileNavOpen,
  theme = "light",
  toggleTheme,
}: HostTopNavProps) {
  const [internalMobileNav, setInternalMobileNav] = useState(false);
  const isNavOpen = mobileNavOpen !== undefined ? mobileNavOpen : internalMobileNav;
  const toggleMobileNav = () => {
    if (setMobileNavOpen) {
      setMobileNavOpen(!isNavOpen);
    } else {
      setInternalMobileNav(!isNavOpen);
    }
  };
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeTitle = MODULE_TITLES[active] || MODULE_TITLES.overview;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c0d1b]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-[58px] sm:h-[64px] w-full items-center justify-between gap-2 px-3 sm:px-6 xl:px-8">
        {/* Left Side: Mobile Logo + Hamburger OR Desktop Module Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile & Tablet Hamburger + Logo (xl:hidden) */}
          <div className="flex items-center gap-2 xl:hidden min-w-0">
            <button
              type="button"
              className="grid h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 shrink-0 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              onClick={toggleMobileNav}
              aria-label={t("Toggle Navigation Menu", "تبديل قائمة التنقل")}
            >
              {isNavOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            <Link
              href={`/${lang}/app/overview`}
              onClick={(e) => {
                e.preventDefault();
                setActive("overview");
              }}
              className="inline-flex items-center gap-1.5 select-none min-w-0"
            >
              <span className="text-[19px] sm:text-[22px] font-black tracking-[-0.04em] text-slate-900 dark:text-white whitespace-nowrap">
                Qaf<span className="text-violet-600 dark:text-violet-400">Nest</span>
                <span className="text-[#FF9750]">.</span>
              </span>
              <span className="hidden min-[420px]:inline-block rounded-full bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 text-[9px] font-black tracking-wider uppercase text-violet-800 dark:text-violet-300">
                {t("HOST", "مضيف")}
              </span>
            </Link>
          </div>

          {/* Desktop Breadcrumb & Module Title (hidden xl:flex) */}
          <div className="hidden xl:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {t("Host Portal", "بوابة المضيف")}
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {lang === "ar" ? activeTitle.ar : activeTitle.en}
            </h1>
          </div>
        </div>

        {/* Right Side: Theme Toggle, Language Toggle, Notifications, WhatsApp, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dark / Light Mode Toggle */}
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={theme === "dark" ? t("Switch to Light Mode", "تفعيل الوضع الفاتح") : t("Switch to Dark Mode", "تفعيل الوضع الداكن")}
              aria-label={theme === "dark" ? t("Switch to Light Mode", "تفعيل الوضع الفاتح") : t("Switch to Dark Mode", "تفعيل الوضع الداكن")}
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-slate-600" />
              )}
            </button>
          )}

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="inline-flex h-8.5 sm:h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="leading-none">{lang === "ar" ? "EN" : "العربية"}</span>
          </button>

          {/* Notification Bell with Badge & Dropdown */}
          <HostNotificationsDropdown
            ref={notifRef}
            notifications={notifications}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            onSelectNotification={onSelectNotification}
            onMarkAllNotificationsRead={onMarkAllNotificationsRead}
            lang={lang}
            t={t}
          />

          {/* WhatsApp Support Link */}
          <a
            href="https://wa.me/966576707709"
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={t("Chat & Support (WhatsApp)", "المحادثات والدعم (واتساب)")}
            aria-label={t("Chat & Support (WhatsApp)", "المحادثات والدعم (واتساب)")}
          >
            <MessageSquareText size={16} />
          </a>

          {/* Profile Dropdown */}
          <HostProfileDropdown
            ref={profileRef}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
            setActive={setActive}
            signOut={signOut}
            user={user}
            profile={profile}
            lang={lang}
            t={t}
          />
        </div>
      </div>

      {/* Mobile / Tablet Navigation Drawer */}
      <HostMobileNavDrawer
        isOpen={isNavOpen}
        active={active}
        setActive={setActive}
        onClose={() => {
          if (setMobileNavOpen) setMobileNavOpen(false);
          else setInternalMobileNav(false);
        }}
        lang={lang}
        setLang={setLang}
        t={t}
        user={user}
        profile={profile}
        signOut={signOut}
        submittedPropertiesCount={submittedPropertiesCount}
        bookingsCount={bookingsCount}
        hasPropertyIssues={hasPropertyIssues}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </header>
  );
}


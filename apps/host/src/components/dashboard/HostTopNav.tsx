"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Globe, Menu, MessageSquareText, Plus, X } from "lucide-react";
import { HostNavLinks } from "./nav/HostNavLinks";
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
}: HostTopNavProps) {
  const [mobileNav, setMobileNav] = useState(false);
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex h-[64px] sm:h-[74px] max-w-[1640px] items-center justify-between gap-2 sm:gap-4 px-3 sm:px-8">
        {/* Logo + 7 Horizontal Tabs */}
        <div className="flex items-center gap-3 xl:gap-12 h-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl border border-slate-200 lg:hidden cursor-pointer"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label={t("Toggle Navigation Menu", "تبديل قائمة التنقل")}
            >
              {mobileNav ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link
              href={`/${lang}/app/overview`}
              onClick={(e) => {
                e.preventDefault();
                setActive("overview");
              }}
              className="inline-flex items-center gap-1.5 select-none min-w-0"
            >
              <span className="text-[22px] sm:text-[28px] lg:text-[32px] font-black tracking-[-0.05em] text-[#4F2396] whitespace-nowrap">
                Qaf<span className="text-[#7c3aed]">Nest</span>
                <span className="text-[#FF9750]">.</span>
              </span>
              <span className="hidden min-[390px]:inline-block rounded-full bg-violet-100 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-[#4F2396]">
                {t("HOST", "مضيف")}
              </span>
            </Link>
          </div>

          <HostNavLinks
            active={active}
            setActive={setActive}
            submittedPropertiesCount={submittedPropertiesCount}
            hasPropertyIssues={hasPropertyIssues}
            bookingsCount={bookingsCount}
            lang={lang}
            t={t}
          />
        </div>

        {/* Action Controls: Add Property, Language Toggle, Notifications, Support, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href={`/${lang}/properties/new?mode=new`}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] text-white px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>{t("Add Property", "إضافة عقار")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border border-violet-200 bg-violet-50/70 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-[#4F2396] hover:bg-violet-100 cursor-pointer"
          >
            <Globe size={14} />
            <span>{lang === "ar" ? "EN" : "العربية"}</span>
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

          <a
            href="https://wa.me/966576707709"
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-[#dcd4ef] text-[#4F2396] hover:bg-[#ceC2e8] transition cursor-pointer"
            title={t("Chat & Support (WhatsApp)", "المحادثات والدعم (واتساب)")}
          >
            <MessageSquareText size={18} />
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

      {/* Mobile Navigation Drawer */}
      <HostMobileNavDrawer
        isOpen={mobileNav}
        active={active}
        setActive={setActive}
        onClose={() => setMobileNav(false)}
        lang={lang}
        t={t}
      />
    </header>
  );
}

"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CalendarDays, Heart, Key, LogOut, User } from "lucide-react";
import { localizePath, Locale } from "@/lib/localization/localeHelper";
import { ECOSYSTEM_URLS } from "@qafnest/shared";

interface NavUserDropdownProps {
  accountName: string;
  contactEmail: string;
  role?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  language: string;
  t: {
    nav: {
      host: string;
      signOut: string;
      [key: string]: string;
    };
    [key: string]: unknown;
  };
  signOut: () => void;
  isDarkTheme: boolean;
}

export default function NavUserDropdown({
  accountName,
  contactEmail,
  role = "guest",
  isOpen,
  onToggle,
  onClose,
  language,
  t,
  signOut,
  isDarkTheme,
}: NavUserDropdownProps) {
  const dropdownContainerClass = isDarkTheme
    ? "bg-[#0B0B14] border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
    : "bg-white border-purple-100 shadow-[0_20px_50px_rgba(88,28,135,0.16)] text-gray-800";

  const dropdownItemClass = isDarkTheme
    ? "text-white/80 hover:text-white hover:bg-white/[0.08]"
    : "text-gray-700 hover:text-purple-900 hover:bg-purple-50/80";

  return (
    <div className="relative">
      <button
        onClick={onToggle}
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
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-56 rounded-2xl border p-2 shadow-2xl z-50 text-xs before:absolute before:-top-3 before:left-0 before:right-0 before:h-4 before:content-[''] ${dropdownContainerClass}`}
          >
            <div className="px-3 py-2 border-b border-purple-500/15">
              <p className="font-bold truncate">{accountName || "Valued User"}</p>
              <p className="text-[10px] text-muted truncate">{contactEmail}</p>
              <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-bold uppercase">
                {role}
              </span>
            </div>

            <div className="py-1">
              <Link
                href={localizePath("/account", language as Locale)}
                onClick={onClose}
                className={`w-full rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-bold ${dropdownItemClass}`}
              >
                <User className="w-3.5 h-3.5 text-violet-400" />{" "}
                {language === "ar" ? "حسابي والمزيد" : "Account & More"}
              </Link>
              <Link
                href={localizePath("/my-bookings", language as Locale)}
                onClick={onClose}
                className={`w-full rounded-xl px-3 py-2 flex items-center gap-2 text-xs ${dropdownItemClass}`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-violet-400" />{" "}
                {language === "ar" ? "حجوزاتي" : "My bookings"}
              </Link>
              <Link
                href={localizePath("/wishlist", language as Locale)}
                onClick={onClose}
                className={`w-full rounded-xl px-3 py-2 flex items-center gap-2 text-xs ${dropdownItemClass}`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />{" "}
                {language === "ar" ? "المفضلة" : "Wishlist"}
              </Link>

              {role?.toLowerCase() !== "guest" && (
                <a
                  href={ECOSYSTEM_URLS.host}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="w-full text-left rtl:text-right px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer text-violet-600 dark:text-violet-400 hover:bg-purple-500/10 text-xs font-semibold"
                >
                  <Key className="w-3.5 h-3.5 text-violet-500 shrink-0" /> {t.nav.host}
                </a>
              )}

              <button
                onClick={() => {
                  onClose();
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
  );
}


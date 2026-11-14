"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, PlusCircle } from "lucide-react";
import { localizePath, Locale } from "@/lib/localization/localeHelper";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
import { NavMenuItem } from "./navConstants";

interface NavMobileMenuProps {
  isOpen: boolean;
  isDarkTheme: boolean;
  navMenuItems: NavMenuItem[];
  language: string;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, item: NavMenuItem) => void;
  onClose: () => void;
  toggleLanguage: () => void;
  mounted: boolean;
  user: unknown;
  accountName: string;
  contactEmail: string;
  role?: string;
  signOut: () => void;
  openAuthModal: (mode: "signin" | "signup") => void;
  t: {
    nav: {
      host: string;
      signIn: string;
      signOut: string;
      [key: string]: string;
    };
    [key: string]: unknown;
  };
}

export default function NavMobileMenu({
  isOpen,
  isDarkTheme,
  navMenuItems,
  language,
  onNavClick,
  onClose,
  toggleLanguage,
  mounted,
  user,
  accountName,
  contactEmail,
  role = "guest",
  signOut,
  openAuthModal,
  t,
}: NavMobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
                  onNavClick(e, item);
                  onClose();
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

          {!user && (
            <div className="pt-2 border-t border-purple-500/15">
              <a
                href={`${ECOSYSTEM_URLS.host}/?lang=${language}`}
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-2 py-2 text-sm font-semibold text-violet-400 hover:text-fuchsia-400 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-fuchsia-400" />
                <span>{t.nav.host}</span>
              </a>
            </div>
          )}

          {/* Language Switch Button inside Mobile Menu */}
          <div className="pt-1">
            <button
              onClick={() => {
                toggleLanguage();
                onClose();
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
            {mounted && user ? (
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
                      onClose();
                      signOut();
                    }}
                    className="text-xs text-rose-400 font-bold cursor-pointer"
                  >
                    {t.nav.signOut}
                  </button>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Link
                    href={localizePath("/account", language as Locale)}
                    onClick={onClose}
                    className="text-xs font-semibold text-violet-300"
                  >
                    {language === "ar" ? "حسابي والمزيد" : "Account"}
                  </Link>
                  <span className="text-white/20">·</span>
                  <Link
                    href={localizePath("/my-bookings", language as Locale)}
                    onClick={onClose}
                    className="text-xs font-semibold text-violet-300"
                  >
                    {language === "ar" ? "حجوزاتي" : "My bookings"}
                  </Link>
                  <span className="text-white/20">·</span>
                  <Link
                    href={localizePath("/wishlist", language as Locale)}
                    onClick={onClose}
                    className="text-xs font-semibold text-rose-300"
                  >
                    {language === "ar" ? "المفضلة" : "Wishlist"}
                  </Link>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  openAuthModal("signin");
                }}
                className="w-full py-2.5 rounded-xl border border-violet-400/40 bg-violet-600/20 text-xs font-bold uppercase tracking-wider text-violet-300 cursor-pointer"
              >
                {t.nav.signIn}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


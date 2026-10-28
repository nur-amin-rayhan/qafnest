"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, TRANSLATIONS } from "@/data/translations";

export type Currency = "SAR";

interface BookingModalState {
  isOpen: boolean;
  propertyTitle: string;
  basePrice: number;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof TRANSLATIONS.en;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (baseSAR: number) => string;
  formatTabby: (baseSAR: number) => string;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  instantOnly: boolean;
  setInstantOnly: (v: boolean) => void;
  poolOnly: boolean;
  setPoolOnly: (v: boolean) => void;
  selfCheckinOnly: boolean;
  setSelfCheckinOnly: (v: boolean) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  checkinDate: string;
  setCheckinDate: (d: string) => void;
  checkoutDate: string;
  setCheckoutDate: (d: string) => void;
  guestsCount: number;
  setGuestsCount: (n: number) => void;
  stayTiming: string;
  setStayTiming: (t: string) => void;
  rentMode: "daily" | "monthly";
  setRentMode: (m: "daily" | "monthly") => void;
  bookingModal: BookingModalState;
  openBookingModal: (title: string, price: number) => void;
  closeBookingModal: () => void;
  hostModalOpen: boolean;
  openHostModal: () => void;
  closeHostModal: () => void;
  searchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  appModalOpen: boolean;
  openAppModal: () => void;
  closeAppModal: () => void;
  promoBannerVisible: boolean;
  dismissPromoBanner: () => void;
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("SAR");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [instantOnly, setInstantOnly] = useState<boolean>(false);
  const [poolOnly, setPoolOnly] = useState<boolean>(false);
  const [selfCheckinOnly, setSelfCheckinOnly] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [checkinDate, setCheckinDate] = useState<string>("2026-10-29");
  const [checkoutDate, setCheckoutDate] = useState<string>("2026-10-31");
  const [guestsCount, setGuestsCount] = useState<number>(4);
  const [stayTiming, setStayTiming] = useState<string>("full_day");
  const [rentMode, setRentMode] = useState<"daily" | "monthly">("daily");
  const [promoBannerVisible, setPromoBannerVisible] = useState<boolean>(true);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

  // Sync language with localStorage & document attributes (dir and lang)
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem("qafnest_lang") as Language;
      if (storedLang === "ar" || storedLang === "en") {
        setLanguageState(storedLang);
        document.documentElement.lang = storedLang;
        document.documentElement.dir = storedLang === "ar" ? "rtl" : "ltr";
        if (storedLang === "ar") {
          document.documentElement.classList.add("rtl");
        } else {
          document.documentElement.classList.remove("rtl");
        }
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (lang === "ar") {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
    try {
      localStorage.setItem("qafnest_lang", lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  // Sync theme with localStorage & documentElement
  useEffect(() => {
    try {
      const stored = localStorage.getItem("qafnest_theme");
      if (stored === "light") {
        setIsDarkTheme(false);
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        setIsDarkTheme(true);
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    } catch {}
  }, []);

  const [bookingModal, setBookingModal] = useState<BookingModalState>({
    isOpen: false,
    propertyTitle: "Al-Ammariyah Royal Chalet",
    basePrice: 1850,
  });
  const [hostModalOpen, setHostModalOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [appModalOpen, setAppModalOpen] = useState<boolean>(false);

  // Formats price cleanly in SAR (fixed currency)
  const formatPrice = (baseSAR: number) => {
    const formatted = Math.round(baseSAR).toLocaleString();
    if (language === "ar") {
      return `${formatted} ر.س`;
    }
    return `${formatted} SAR`;
  };

  // Formats Tabby installment in SAR
  const formatTabby = (baseSAR: number) => {
    const split = Math.round(baseSAR / 4).toLocaleString();
    if (language === "ar") {
      return `${split} ر.س / شهر`;
    }
    return `${split} SAR / mo`;
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openBookingModal = (title: string, price: number) => {
    setBookingModal({ isOpen: true, propertyTitle: title, basePrice: price });
  };

  const closeBookingModal = () => {
    setBookingModal((prev) => ({ ...prev, isOpen: false }));
  };

  const openHostModal = () => setHostModalOpen(true);
  const closeHostModal = () => setHostModalOpen(false);

  const openSearchModal = () => setSearchModalOpen(true);
  const closeSearchModal = () => setSearchModalOpen(false);

  const openAppModal = () => setAppModalOpen(true);
  const closeAppModal = () => setAppModalOpen(false);

  const dismissPromoBanner = () => setPromoBannerVisible(false);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        try {
          localStorage.setItem("qafnest_theme", "dark");
        } catch {}
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
        try {
          localStorage.setItem("qafnest_theme", "light");
        } catch {}
      }
      return next;
    });
  };

  const t = TRANSLATIONS[language];

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        currency,
        setCurrency,
        formatPrice,
        formatTabby,
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
        wishlist,
        toggleWishlist,
        checkinDate,
        setCheckinDate,
        checkoutDate,
        setCheckoutDate,
        guestsCount,
        setGuestsCount,
        stayTiming,
        setStayTiming,
        rentMode,
        setRentMode,
        bookingModal,
        openBookingModal,
        closeBookingModal,
        hostModalOpen,
        openHostModal,
        closeHostModal,
        searchModalOpen,
        openSearchModal,
        closeSearchModal,
        appModalOpen,
        openAppModal,
        closeAppModal,
        promoBannerVisible,
        dismissPromoBanner,
        isDarkTheme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

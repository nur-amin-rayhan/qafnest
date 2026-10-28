"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "SAR" | "AED" | "USD" | "EUR";

interface CurrencyInfo {
  symbol: string;
  rate: number;
  suffix: string;
}

const CURRENCY_RATES: Record<Currency, CurrencyInfo> = {
  SAR: { symbol: "﷼", rate: 1, suffix: " ﷼" },
  AED: { symbol: "د.إ", rate: 0.98, suffix: " د.إ" },
  USD: { symbol: "$", rate: 0.27, suffix: "" },
  EUR: { symbol: "€", rate: 0.25, suffix: "" },
};

interface BookingModalState {
  isOpen: boolean;
  propertyTitle: string;
  basePrice: number;
}

interface AppContextType {
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
  bookingModal: BookingModalState;
  openBookingModal: (title: string, price: number) => void;
  closeBookingModal: () => void;
  hostModalOpen: boolean;
  openHostModal: () => void;
  closeHostModal: () => void;
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
  const [currency, setCurrency] = useState<Currency>("SAR");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [instantOnly, setInstantOnly] = useState<boolean>(false);
  const [poolOnly, setPoolOnly] = useState<boolean>(false);
  const [selfCheckinOnly, setSelfCheckinOnly] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [promoBannerVisible, setPromoBannerVisible] = useState<boolean>(true);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

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
  const [appModalOpen, setAppModalOpen] = useState<boolean>(false);

  const formatPrice = (baseSAR: number) => {
    const { symbol, rate, suffix } = CURRENCY_RATES[currency];
    const converted = Math.round(baseSAR * rate).toLocaleString();
    if (currency === "USD" || currency === "EUR") {
      return `${symbol}${converted}`;
    }
    return `${converted}${suffix}`;
  };

  const formatTabby = (baseSAR: number) => {
    const { symbol, rate, suffix } = CURRENCY_RATES[currency];
    const split = Math.round((baseSAR / 4) * rate).toLocaleString();
    if (currency === "USD" || currency === "EUR") {
      return `${symbol}${split} / mo`;
    }
    return `${split}${suffix} / mo`;
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

  return (
    <AppContext.Provider
      value={{
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
        bookingModal,
        openBookingModal,
        closeBookingModal,
        hostModalOpen,
        openHostModal,
        closeHostModal,
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

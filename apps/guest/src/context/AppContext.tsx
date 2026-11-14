"use client";

import React, { createContext, useContext, useState } from "react";
import { TRANSLATIONS } from "@/data/translations";
import type {
  AppContextType,
  BookingModalState,
  Currency,
  Language,
} from "./app/appContextTypes";
import { useWishlistSync } from "./app/useWishlistSync";
import { getRiyadhDate, useAppPreferences } from "./app/useAppPreferences";

export type { Language, Currency, BookingModalState, AppContextType };

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Language;
}) {
  const {
    language,
    setLanguage,
    toggleLanguage,
    isDarkTheme,
    toggleTheme,
    formatPrice,
    formatTabby,
  } = useAppPreferences(initialLang);

  const { wishlist, toggleWishlist } = useWishlistSync();

  const [currency, setCurrency] = useState<Currency>("SAR");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [instantOnly, setInstantOnly] = useState<boolean>(false);
  const [poolOnly, setPoolOnly] = useState<boolean>(false);
  const [selfCheckinOnly, setSelfCheckinOnly] = useState<boolean>(false);
  const [checkinDate, setCheckinDate] = useState<string>(() => getRiyadhDate(0));
  const [checkinTime, setCheckinTime] = useState<string>("16:00");
  const [checkoutDate, setCheckoutDate] = useState<string>(() => getRiyadhDate(1));
  const [checkoutTime, setCheckoutTime] = useState<string>("12:00");
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [stayTiming, setStayTiming] = useState<string>("full_day");
  const [rentMode, setRentMode] = useState<"daily" | "monthly">("daily");
  const [promoBannerVisible, setPromoBannerVisible] = useState<boolean>(true);

  const [bookingModal, setBookingModal] = useState<BookingModalState>({
    isOpen: false,
    propertyTitle: "",
    basePrice: 0,
  });
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [appModalOpen, setAppModalOpen] = useState<boolean>(false);

  const openBookingModal = (title: string, price: number) => {
    setBookingModal({ isOpen: true, propertyTitle: title, basePrice: price });
  };

  const closeBookingModal = () => {
    setBookingModal((prev) => ({ ...prev, isOpen: false }));
  };

  const openSearchModal = () => setSearchModalOpen(true);
  const closeSearchModal = () => setSearchModalOpen(false);

  const openAppModal = () => setAppModalOpen(true);
  const closeAppModal = () => setAppModalOpen(false);

  const dismissPromoBanner = () => setPromoBannerVisible(false);

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
        checkinTime,
        setCheckinTime,
        checkoutDate,
        setCheckoutDate,
        checkoutTime,
        setCheckoutTime,
        guestsCount,
        setGuestsCount,
        stayTiming,
        setStayTiming,
        rentMode,
        setRentMode,
        bookingModal,
        openBookingModal,
        closeBookingModal,
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

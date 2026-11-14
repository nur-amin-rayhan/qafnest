"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { normalizeCityId } from "@/data/properties";
import { CATEGORY_NAMES_AR } from "@/data/translations";
import { CITIES, PROPERTY_TYPES } from "./heroConstants";
import { getLocalizedCityName } from "@/lib/localization/localeHelper";

export function useHeroSearchForm() {
  const {
    t,
    language,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    checkinDate,
    setCheckinDate,
    checkoutDate,
    setCheckoutDate,
    guestsCount,
    setGuestsCount,
  } = useApp();

  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stepper counters for guests & rooms (defaults: rooms=1, adults=1, children=0)
  const [rooms, setRooms] = useState<number>(1);
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);

  // Calendar view navigation state
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (checkinDate) {
      const [y, m, d] = checkinDate.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const getTodayISO = () => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  };

  const getFutureISO = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(d);
  };

  // Initialize dates if empty
  useEffect(() => {
    if (!checkinDate) {
      setCheckinDate(getFutureISO(1));
    }
    if (!checkoutDate) {
      setCheckoutDate(getFutureISO(2));
    }
  }, [checkinDate, checkoutDate, setCheckinDate, setCheckoutDate]);

  // Sync guests count
  useEffect(() => {
    setGuestsCount(adults + children);
  }, [adults, children, setGuestsCount]);

  // Format date like: "Wednesday, 28 October"
  const formatSingleDate = (isoString: string) => {
    if (!isoString) return "";
    const [y, m, d] = isoString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    return `${weekday}, ${day} ${month}`;
  };

  // Date range display string for search bar
  const dateRangeDisplay = () => {
    if (!checkinDate) return "Select dates";
    if (!checkoutDate) return `${formatSingleDate(checkinDate)} → Check-out`;
    return `${formatSingleDate(checkinDate)} → ${formatSingleDate(checkoutDate)}`;
  };

  // Handle clicking outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleDayClick = (dayISO: string) => {
    if (dayISO < getTodayISO()) return;

    if (!checkinDate || (checkinDate && checkoutDate)) {
      setCheckinDate(dayISO);
      setCheckoutDate("");
    } else if (checkinDate && !checkoutDate) {
      if (dayISO > checkinDate) {
        setCheckoutDate(dayISO);
        setTimeout(() => setActiveDropdown(null), 250);
      } else {
        setCheckinDate(dayISO);
        setCheckoutDate("");
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveDropdown(null);

    const params = new URLSearchParams({
      city: normalizeCityId(selectedCity),
      type: selectedCategory,
      check_in: checkinDate,
      check_out: checkoutDate,
      guests: String(guestsCount),
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    });
    router.push(`/search?${params.toString()}`);
  };

  const getCityLabel = (cityId: string, englishName: string) => {
    return getLocalizedCityName(cityId || englishName, language === "ar" ? "ar" : "en");
  };

  const getTypeLabel = (catId: string, englishName: string) => {
    if (language === "ar") {
      return CATEGORY_NAMES_AR[catId] || englishName;
    }
    return englishName;
  };

  const activeCityName = getCityLabel(
    selectedCity,
    CITIES.find((c) => c.id === selectedCity)?.name || "All Saudi Destinations"
  );

  const activeTypeName =
    selectedCategory === "all"
      ? language === "ar"
        ? "جميع الوحدات"
        : "All Stays"
      : getTypeLabel(
          selectedCategory,
          PROPERTY_TYPES.find((p) => p.id === selectedCategory)?.name || "All Stays"
        );

  return {
    t,
    language,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    checkinDate,
    checkoutDate,
    guestsCount,
    adults,
    setAdults,
    children,
    setChildren,
    rooms,
    setRooms,
    viewDate,
    setViewDate,
    activeDropdown,
    setActiveDropdown,
    containerRef,
    getTodayISO,
    dateRangeDisplay,
    handleDayClick,
    handleSearchSubmit,
    getCityLabel,
    getTypeLabel,
    activeCityName,
    activeTypeName,
  };
}


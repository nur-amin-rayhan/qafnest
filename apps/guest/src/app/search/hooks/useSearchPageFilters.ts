"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProperties } from "@/hooks/useProperties";
import { useApp } from "@/context/AppContext";
import { getPropertyCapacity, normalizeCityId } from "@/data/properties";
import { getLocalizedCityName, localizePath } from "@/lib/localization/localeHelper";
import { filterProperties, sortProperties } from "./filterAndSortProperties";

export function useSearchPageFilters() {
  const { properties } = useProperties();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    language,
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
    checkinDate,
    setCheckinDate,
    checkoutDate,
    setCheckoutDate,
    guestsCount,
    setGuestsCount,
  } = useApp();

  // Separate Adults, Children & Rooms counters (defaults: rooms=0 [Any], adults=1, children=0)
  const [adults, setAdults] = useState<number>(() => Math.max(1, guestsCount || 1));
  const [children, setChildren] = useState<number>(0);
  const [bedrooms, setBedrooms] = useState<number>(0);

  // Initialize from URL params if present
  const searchParamString = searchParams.toString();
  useEffect(() => {
    const params = new URLSearchParams(searchParamString);
    const cityParam = params.get("city");
    const normalizedCity = cityParam ? normalizeCityId(cityParam) : null;
    if (normalizedCity) setSelectedCity(normalizedCity);

    const catParam = params.get("type") || params.get("category");
    if (catParam) setSelectedCategory(catParam);

    const checkinParam = params.get("check_in");
    if (checkinParam) setCheckinDate(checkinParam);
    const checkoutParam = params.get("check_out");
    if (checkoutParam) setCheckoutDate(checkoutParam);

    const adultsParam = params.get("adults");
    const childrenParam = params.get("children");
    const guestsParam = params.get("guests");
    const roomsParam = params.get("rooms") || params.get("bedrooms");

    if (roomsParam !== null) {
      const parsedRooms = Math.max(0, Number(roomsParam) || 0);
      setBedrooms(parsedRooms);
    }

    if (adultsParam !== null || childrenParam !== null) {
      const parsedAdults = Math.max(1, Number(adultsParam) || 1);
      const parsedChildren = Math.max(0, Number(childrenParam) || 0);
      setAdults(parsedAdults);
      setChildren(parsedChildren);
      setGuestsCount(parsedAdults + parsedChildren);
    } else if (guestsParam) {
      const parsedGuests = Number(guestsParam);
      if (Number.isInteger(parsedGuests) && parsedGuests > 0) {
        setGuestsCount(parsedGuests);
        setAdults(Math.max(1, parsedGuests));
        setChildren(0);
      }
    }
  }, [searchParamString, setSelectedCity, setSelectedCategory, setCheckinDate, setCheckoutDate, setGuestsCount]);

  // Keep total guestsCount synced when adults or children change
  useEffect(() => {
    setGuestsCount(adults + children);
  }, [adults, children, setGuestsCount]);

  const activeCity = normalizeCityId(searchParams.get("city") || selectedCity);

  // View state: 'grid' | 'map'
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "price-low" | "price-high" | "rating" | "reviews">("recommended");
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get("q") || searchParams.get("search") || searchParams.get("name") || "");

  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("search") || searchParams.get("name") || "";
    setSearchQuery(qParam);
  }, [searchParamString, searchParams]);

  // Filter Bar States
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<"all" | "under500" | "500to1000" | "above1000">("all");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<"all" | "north" | "south" | "east" | "west">("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Advanced price range numbers
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [isStickyScrolled, setIsStickyScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsStickyScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return filterProperties(properties, {
      searchQuery,
      activeCity,
      selectedCategory,
      selectedDistrict,
      selectedDirection,
      dealsOnly,
      minRating,
      priceRange,
      minPrice,
      maxPrice,
      bedrooms,
      instantOnly,
      poolOnly,
      selfCheckinOnly,
      guestsCount,
      checkinDate,
      checkoutDate,
    });
  }, [
    searchQuery, activeCity, selectedCategory, selectedDistrict, selectedDirection, dealsOnly,
    minRating, priceRange, minPrice, maxPrice, bedrooms, instantOnly, poolOnly,
    selfCheckinOnly, guestsCount, checkinDate, checkoutDate, properties,
  ]);

  const sortedProperties = useMemo(() => sortProperties(filteredProperties, sortBy), [filteredProperties, sortBy]);

  // Extract available districts for this city
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    properties
      .filter((p) => activeCity === "all" || normalizeCityId(p.city) === activeCity)
      .forEach((p) => {
        if (p.district) {
          const parts = p.district.split(",");
          const distName = parts.length > 1 ? parts[1].trim() : parts[0].trim();
          set.add(distName);
        }
      });
    return Array.from(set);
  }, [activeCity, properties]);

  // Count apartments
  const apartmentCount = useMemo(() => {
    return properties.filter(
      (p) =>
        (activeCity === "all" || normalizeCityId(p.city) === activeCity) &&
        getPropertyCapacity(p) >= guestsCount &&
        (p.category === "penthouse" || p.categoryName.toLowerCase().includes("apartment"))
    ).length;
  }, [activeCity, guestsCount, properties]);

  const handleResetFilters = () => {
    setSelectedDistrict("all");
    setPriceRange("all");
    setDealsOnly(false);
    setSelectedDirection("all");
    setMinRating(0);
    setMinPrice(0);
    setMaxPrice(5000);
    setBedrooms(0);
    setAdults(1);
    setChildren(0);
    setSelectedCategory("all");
    setInstantOnly(false);
    setPoolOnly(false);
    setSelfCheckinOnly(false);
  };

  const cityName = getLocalizedCityName(activeCity, language);

  const buildSearchParams = (cityId = activeCity) => {
    const params = new URLSearchParams(searchParamString);
    params.set("city", cityId);
    params.set("type", selectedCategory);
    if (checkinDate) params.set("check_in", checkinDate); else params.delete("check_in");
    if (checkoutDate) params.set("check_out", checkoutDate); else params.delete("check_out");
    params.set("guests", String(adults + children));
    params.set("adults", String(adults));
    params.set("children", String(children));
    if (bedrooms > 0) params.set("rooms", String(bedrooms)); else params.delete("rooms");
    return params;
  };

  const selectCity = (cityId: string) => {
    const normalizedCity = normalizeCityId(cityId);
    setSelectedCity(normalizedCity);
    setSelectedDistrict("all");
    router.replace(localizePath(`/search?${buildSearchParams(normalizedCity).toString()}`, language), { scroll: false });
  };

  const handleSearch = () => {
    router.replace(localizePath(`/search?${buildSearchParams().toString()}`, language), { scroll: false });
    document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth" });
  };

  const hasActiveFilters = Boolean(
    selectedDistrict !== "all" ||
      selectedCategory !== "all" ||
      priceRange !== "all" ||
      dealsOnly ||
      selectedDirection !== "all" ||
      minRating > 0 ||
      minPrice > 0 ||
      maxPrice < 5000 ||
      bedrooms > 1 ||
      adults > 1 ||
      children > 0 ||
      instantOnly ||
      poolOnly ||
      selfCheckinOnly
  );

  return {
    language,
    activeCity,
    cityName,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    checkinDate,
    setCheckinDate,
    checkoutDate,
    setCheckoutDate,
    guestsCount,
    setGuestsCount,
    adults,
    setAdults,
    children,
    setChildren,
    viewMode,
    setViewMode,
    selectedMapPropertyId,
    setSelectedMapPropertyId,
    sortBy,
    setSortBy,
    selectedDistrict,
    setSelectedDistrict,
    priceRange,
    setPriceRange,
    dealsOnly,
    setDealsOnly,
    selectedDirection,
    setSelectedDirection,
    minRating,
    setMinRating,
    instantOnly,
    setInstantOnly,
    poolOnly,
    setPoolOnly,
    selfCheckinOnly,
    setSelfCheckinOnly,
    isFilterModalOpen,
    setIsFilterModalOpen,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    bedrooms,
    setBedrooms,
    isStickyScrolled,
    filteredProperties,
    sortedProperties,
    availableDistricts,
    apartmentCount,
    handleResetFilters,
    selectCity,
    handleSearch,
    hasActiveFilters,
  };
}

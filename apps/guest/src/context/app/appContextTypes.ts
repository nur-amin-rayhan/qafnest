import type { Language, TRANSLATIONS } from "@/data/translations";

export type { Language };
export type Currency = "SAR";

export interface BookingModalState {
  isOpen: boolean;
  propertyTitle: string;
  basePrice: number;
}

export interface AppContextType {
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
  checkinTime: string;
  setCheckinTime: (t: string) => void;
  checkoutDate: string;
  setCheckoutDate: (d: string) => void;
  checkoutTime: string;
  setCheckoutTime: (t: string) => void;
  guestsCount: number;
  setGuestsCount: (n: number) => void;
  stayTiming: string;
  setStayTiming: (t: string) => void;
  rentMode: "daily" | "monthly";
  setRentMode: (m: "daily" | "monthly") => void;
  bookingModal: BookingModalState;
  openBookingModal: (title: string, price: number) => void;
  closeBookingModal: () => void;
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


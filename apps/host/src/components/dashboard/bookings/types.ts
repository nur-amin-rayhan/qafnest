export interface HostBookingItem {
  id: string;
  booking_reference: string;
  property_id: string;
  guest_id: string | null;
  auth_subject: string | null;
  check_in: string;
  check_out: string;
  total_nights: number;
  guests_count: number;
  total_price: number;
  listingGross?: number;
  commissionAmount?: number;
  promoDiscountAmount?: number;
  vatAmount?: number;
  netPayout?: number;
  commissionRatePercent?: number;
  vatRatePercent?: number;
  status: "confirmed" | "pending" | "cancelled";
  payment_status: "success" | "initiated" | "failed";
  payment_id: string | null;
  payment_method: string | null;
  smart_lock_pin: string | null;
  created_at: string;
  propertyTitle: string;
  propertyTitleAr: string;
  propertyCity: string;
  propertyState?: string;
  propertyStateAr?: string;
  propertyDistrict: string;
  propertyDistrictAr?: string;
  propertyStreet?: string;
  propertyStreetAr?: string;
  propertyPostalCode?: string;
  propertyCategory: string;
  propertyImage: string;
  guestName: string;
  guestPhone: string;
  stayStatus: "upcoming" | "today" | "in_house" | "past";
  isGuestVerified?: boolean;
  propertyLat?: number | null;
  propertyLng?: number | null;
  propertyAddress?: string | null;
  propertyAddressAr?: string | null;
  propertyGoogleMapsUrl?: string | null;
}

export type BookingTabKey = "all" | "upcoming" | "today" | "pending" | "past";

export interface BookingCounts {
  all: number;
  upcoming: number;
  today: number;
  pending: number;
  past: number;
}


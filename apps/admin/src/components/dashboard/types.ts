import type { BookingSettlementBreakdown } from "@qafnest/shared/platformFee";

export type NavTab =
  | "dashboard-overview"
  | "properties-management"
  | "bookings-and-reservations"
  | "helpline-booking"
  | "user-management"
  | "promotions-and-coupons"
  | "loyalty-and-rewards"
  | "financials-and-payouts"
  | "guest-reviews"
  | "settings";

export interface PropertyItem {
  id: string;
  title: string;
  title_ar?: string;
  slug?: string;
  description?: string;
  description_ar?: string;
  city?: string;
  city_name?: string;
  district?: string;
  district_ar?: string;
  category?: string;
  category_name?: string;
  base_price?: number;
  weekday_price?: number;
  weekend_price?: number;
  tourism_license_number?: string;
  host_id?: string;
  host_name?: string;
  host_phone?: string;
  host_email?: string;
  host_total_properties?: number;
  is_approved?: boolean;
  status?: "approved" | "pending" | "rejected";
  images?: string[];
  features?: string[];
  specs?: string;
  area_sqm?: number;
  bedrooms_count?: number;
  living_rooms_count?: number;
  bathrooms_count?: number;
  lat?: number;
  lng?: number;
  address?: string;
  address_ar?: string;
  street?: string;
  street_ar?: string;
  postal_code?: string;
  admin_feedback?: string;
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminReviewItem {
  id: string;
  property_id: string;
  property_title?: string;
  property_city?: string;
  guest_id?: string;
  guest_display_name?: string;
  title?: string;
  title_ar?: string | null;
  comment: string;
  comment_ar?: string | null;
  rating: number;
  cleanliness_rating?: number;
  accuracy_rating?: number;
  checkin_rating?: number;
  value_rating?: number;
  services_rating?: number;
  property_state_rating?: number;
  is_published: boolean;
  created_at: string;
  admin_reply?: string | null;
  admin_reply_ar?: string | null;
  admin_reply_by?: string | null;
  admin_reply_at?: string | null;
}

export interface BookingItem {
  id: string;
  booking_reference?: string;
  auth_subject?: string;
  guest_name?: string;
  guest_phone?: string;
  property_title?: string;
  property_city?: string;
  property_district?: string;
  total_price: number;
  total_nights?: number;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  property_id: string;
  created_at: string;
  refund?: any;
  transferClaim?: any;
  settlement?: BookingSettlementBreakdown | null;
}

export interface AdminMetrics {
  grossRevenue: number;
  totalBookings: number;
  activeListings: number;
  avgOccupancy: number;
  pendingVerification: number;
  pendingPayoutsCount?: number;
  overduePayoutsCount?: number;
}

export interface SelectedBookingDetail {
  id: string;
  dbId?: string;
  guestName: string;
  phone: string;
  propertyTitle: string;
  dates: string;
  nights: number;
  amount: number;
  status: string;
  payoutStatus: string;
  guests: string;
  accommodations: string;
  refund?: any;
  transferClaim?: any;
  settlement?: BookingSettlementBreakdown | null;
}

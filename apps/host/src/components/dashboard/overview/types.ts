export interface HostPropertySummary {
  id: string;
  title: string;
  titleAr?: string;
  city: string;
  district: string;
  districtAr?: string;
  address?: string;
  addressAr?: string;
  category: string;
  basePrice: number;
  status: string;
  isApproved?: boolean;
  adminFeedback?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  images?: string[];
}

export interface HostBookingSummary {
  id: string;
  booking_reference?: string;
  property_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  guests_count: number;
  status: string;
  payment_status: string;
  created_at: string;
  propertyTitle?: string;
  guestName?: string;
  guestPhone?: string;
  smart_lock_pin?: string;
}

export interface HostReviewSummary {
  id: string;
  property_id: string;
  guest_display_name?: string | null;
  rating: number;
  comment?: string | null;
  comment_ar?: string | null;
  created_at: string;
  propertyTitle?: string;
}

export type OverviewNavigateTab =
  | "overview"
  | "properties"
  | "reservations"
  | "analytics"
  | "reviews"
  | "calendar"
  | "finance";


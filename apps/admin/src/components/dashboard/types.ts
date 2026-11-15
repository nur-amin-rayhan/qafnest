import type { BookingSettlementBreakdown } from "@qafnest/shared/platformFee";
import type {
  BlockingReservationSummary,
  PropertyDeletionRequest,
} from "@qafnest/shared";

export interface AdminPropertyDeletionRequest extends PropertyDeletionRequest {
  activeBookingsCount: number;
  blockingBookings: BlockingReservationSummary[];
  eligibleToDelete: boolean;
}

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
  host_business_name?: string;
  host_phone?: string;
  host_email?: string;
  host_city?: string;
  host_address?: string;
  host_verified?: boolean;
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
  pending_deletion_request?: AdminPropertyDeletionRequest | null;
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

export interface BookingPayoutSummary {
  id: string;
  reference: string;
  status: string;
  iban?: string;
  bankName?: string;
  slaDeadlineAt?: string;
  netPayoutAmount?: number;
  sarieTxnId?: string;
}

export interface BookingItem {
  id: string;
  booking_reference?: string;
  auth_subject?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  guest_city?: string;
  guest_address?: string;
  guest_id_masked?: string;
  guest_verified?: boolean;
  host_id?: string;
  host_name?: string;
  host_business_name?: string;
  host_phone?: string;
  host_email?: string;
  host_city?: string;
  host_address?: string;
  host_id_masked?: string;
  host_verified?: boolean;
  property_id: string;
  property_title?: string;
  property_city?: string;
  property_district?: string;
  property_address?: string;
  property_license?: string;
  property_image?: string;
  property_category?: string;
  property_base_price?: number;
  payment_method?: string;
  smart_lock_pin?: string;
  total_price: number;
  total_nights?: number;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  created_at: string;
  refund?: any;
  transferClaim?: any;
  settlement?: BookingSettlementBreakdown | null;
  payoutSummary?: BookingPayoutSummary | null;
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
  guestEmail?: string;
  guestCity?: string;
  guestAddress?: string;
  guestIdMasked?: string;
  guestVerified?: boolean;
  hostId?: string;
  hostName?: string;
  hostBusinessName?: string;
  hostPhone?: string;
  hostEmail?: string;
  hostCity?: string;
  hostAddress?: string;
  hostIdMasked?: string;
  hostVerified?: boolean;
  propertyId?: string;
  propertyTitle: string;
  propertyCity?: string;
  propertyDistrict?: string;
  propertyAddress?: string;
  propertyLicense?: string;
  propertyImage?: string;
  propertyCategory?: string;
  propertyBasePrice?: number;
  paymentMethod?: string;
  smartLockPin?: string;
  createdAt?: string;
  dates: string;
  checkIn?: string;
  checkOut?: string;
  nights: number;
  amount: number;
  status: string;
  payoutStatus: string;
  guests: string;
  accommodations: string;
  refund?: any;
  transferClaim?: any;
  settlement?: BookingSettlementBreakdown | null;
  payoutSummary?: BookingPayoutSummary | null;
}

export function buildSelectedBookingDetail(
  b: BookingItem,
  t: (en: string, ar: string) => string
): SelectedBookingDetail {
  const nightsCount =
    Number(b.total_nights) ||
    Math.max(
      1,
      Math.round(
        ((b.check_out ? Date.parse(b.check_out) : 0) -
          (b.check_in ? Date.parse(b.check_in) : 0)) /
          86_400_000
      ) || 1
    );
  const subjectName = b.auth_subject
    ? String(b.auth_subject).split(" | ")[0]
    : "";
  const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(subjectName);
  const guestName =
    b.guest_name ||
    (!isUuidLike && !subjectName.startsWith("guest_phone_") ? subjectName : "") ||
    t("Verified Guest", "ضيف موثق");
  const phone = b.guest_phone || (b.auth_subject && String(b.auth_subject).split(" | ")[1]) || "";

  const payoutLabel =
    b.payoutSummary?.status === "disbursed"
      ? t("Disbursed via SARIE", "تم التحويل عبر سريع")
      : b.payoutSummary?.status === "on_hold"
      ? t("Payout On Hold", "المستحقات معلقة")
      : b.payoutSummary?.status === "processing"
      ? t("Processing SARIE Transfer", "جاري التحويل عبر سريع")
      : b.payment_status === "paid" || b.payment_status === "success"
      ? t("Escrowed (24h SARIE SLA)", "محجوز (تسوية خلال 24 ساعة)")
      : t("Awaiting Settlement", "بانتظار التسوية");

  return {
    id: b.booking_reference || `#BK-${b.id.slice(0, 6).toUpperCase()}`,
    dbId: b.id,
    guestName,
    phone,
    guestEmail: b.guest_email || "",
    guestCity: b.guest_city || "",
    guestAddress: b.guest_address || "",
    guestIdMasked: b.guest_id_masked || "",
    guestVerified: Boolean(b.guest_verified),
    hostId: b.host_id || "",
    hostName: b.host_name || "",
    hostBusinessName: b.host_business_name || "",
    hostPhone: b.host_phone || "",
    hostEmail: b.host_email || "",
    hostCity: b.host_city || "",
    hostAddress: b.host_address || "",
    hostIdMasked: b.host_id_masked || "",
    hostVerified: Boolean(b.host_verified),
    propertyId: b.property_id,
    propertyTitle: b.property_title || t("Allocated Unit", "وحدة محجوزة"),
    propertyCity: b.property_city || "",
    propertyDistrict: b.property_district || "",
    propertyAddress: b.property_address || "",
    propertyLicense: b.property_license || "",
    propertyImage: b.property_image || "",
    propertyCategory: b.property_category || "",
    propertyBasePrice: b.property_base_price || 0,
    paymentMethod: b.payment_method || "",
    smartLockPin: b.smart_lock_pin || "",
    createdAt: b.created_at,
    dates: `${b.check_in} → ${b.check_out}`,
    checkIn: b.check_in,
    checkOut: b.check_out,
    nights: nightsCount,
    amount: Number(b.total_price || 0),
    status: b.status || "confirmed",
    payoutStatus: payoutLabel,
    guests: `${b.guests_count || 1} ${t("Guests", "ضيوف")}`,
    accommodations: b.property_city
      ? `${b.property_city}${b.property_district ? ` - ${b.property_district}` : ""}`
      : t("QafNest Verified", "موثق من قاف نست"),
    refund: b.refund,
    transferClaim: b.transferClaim,
    settlement: b.settlement,
    payoutSummary: b.payoutSummary || null,
  };
}

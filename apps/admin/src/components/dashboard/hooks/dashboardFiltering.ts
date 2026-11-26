import {
  matchesPropertySearchQuery,
  normalizeSaudiCityId,
} from "@qafnest/shared";
import type { PropertyItem, BookingItem } from "@/components/dashboard/types";

export interface PropertyFilterParams {
  status: "all" | "approved" | "pending" | "rejected";
  city: string;
  type: string;
  searchQuery: string;
}

export function filterProperties(
  properties: PropertyItem[],
  filters: PropertyFilterParams
): PropertyItem[] {
  const { status, city, type, searchQuery } = filters;
  return properties.filter((p) => {
    if (status === "approved" && p.status !== "approved" && !p.is_approved) return false;
    if (status === "pending" && p.status !== "pending" && p.is_approved) return false;
    if (status === "rejected" && p.status !== "rejected") return false;

    if (city !== "all") {
      const normalizedFilter = normalizeSaudiCityId(city) || city.toLowerCase();
      const normalizedProp = normalizeSaudiCityId(p.city || p.city_name);
      const cityLower = (p.city_name || p.city || "").toLowerCase();
      if (normalizedProp !== normalizedFilter && !cityLower.includes(city.toLowerCase())) {
        return false;
      }
    }

    if (type !== "all") {
      const catLower = (p.category || "").toLowerCase();
      if (!catLower.includes(type.toLowerCase())) return false;
    }

    if (searchQuery.trim()) {
      return matchesPropertySearchQuery(p, searchQuery);
    }

    return true;
  });
}

export interface BookingFilterParams {
  status: string;
  search: string;
}

export function filterBookings(
  bookings: BookingItem[],
  filters: BookingFilterParams
): BookingItem[] {
  const { status, search } = filters;
  return bookings.filter((b) => {
    if (status !== "all") {
      if (status === "pending" && b.status !== "pending") return false;
      if (status === "confirmed" && b.status !== "confirmed") return false;
      if (status === "in-stay" && b.status !== "in-stay") return false;
      if (status === "completed" && b.status !== "completed") return false;
      if (
        status === "cancelled" &&
        b.status !== "cancelled" &&
        b.status !== "refund_requested"
      )
        return false;
      if (
        status === "disputes" &&
        b.status !== "disputed" &&
        b.status !== "chargeback" &&
        !b.transferClaim
      )
        return false;
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      const ref = (b.booking_reference || b.id).toLowerCase();
      const pid = (b.property_id || "").toLowerCase();
      const gname = (b.guest_name || "").toLowerCase();
      const gphone = (b.guest_phone || "").toLowerCase();
      const ptitle = (b.property_title || "").toLowerCase();
      return (
        ref.includes(term) ||
        pid.includes(term) ||
        gname.includes(term) ||
        gphone.includes(term) ||
        ptitle.includes(term)
      );
    }

    return true;
  });
}


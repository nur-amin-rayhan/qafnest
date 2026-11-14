import type { PropertyItem, BookingItem, AdminMetrics } from "./types";

export const DEFAULT_ADMIN_METRICS: AdminMetrics = {
  grossRevenue: 0,
  totalBookings: 0,
  activeListings: 0,
  avgOccupancy: 0,
  pendingVerification: 0,
};

export const INITIAL_MOCK_PROPERTIES: PropertyItem[] = [];

export const INITIAL_MOCK_BOOKINGS: BookingItem[] = [];

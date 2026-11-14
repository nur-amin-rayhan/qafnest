export interface AnalyticsMetrics {
  totalRevenue: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalNights: number;
  averageDailyRate: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
}

export interface MonthlyRevenueItem {
  monthKey: string;
  labelEn: string;
  labelAr: string;
  revenue: number;
  bookings: number;
}

export interface PropertyPerformanceItem {
  propertyId: string;
  title: string;
  titleAr: string;
  city: string;
  district: string;
  category: string;
  basePrice: number;
  image: string;
  totalRevenue: number;
  bookingsCount: number;
  nightsBooked: number;
  averageRating: number;
  reviewsCount: number;
  isApproved: boolean;
  status: string;
}

export interface CategoryRatings {
  cleanliness: number;
  services: number;
  accuracy: number;
  checkin: number;
  condition: number;
  value: number;
}


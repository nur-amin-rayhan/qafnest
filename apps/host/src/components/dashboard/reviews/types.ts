export interface HostReviewItem {
  id: string;
  property_id: string;
  guest_id: string | null;
  booking_id: string | null;
  rating: number;
  title: string | null;
  title_ar: string | null;
  comment: string | null;
  comment_ar: string | null;
  guest_display_name: string | null;
  cleanliness_rating: number | null;
  accuracy_rating: number | null;
  checkin_rating: number | null;
  value_rating: number | null;
  services_rating: number | null;
  property_state_rating: number | null;
  is_verified_stay: boolean;
  admin_reply: string | null;
  admin_reply_ar: string | null;
  admin_reply_by: string | null;
  admin_reply_at: string | null;
  host_reply?: string | null;
  host_reply_ar?: string | null;
  host_reply_at?: string | null;
  created_at: string;
  propertyTitle: string;
  propertyTitleAr: string;
  propertyCity: string;
  propertyDistrict: string;
  propertyImage: string;
}

export interface HostReviewsStats {
  averageRating: number;
  totalCount: number;
  withReplyCount: number;
  needsReplyCount: number;
  distribution: {
    exceptional: number;
    veryGood: number;
    good: number;
    belowSeven: number;
  };
  subScores: {
    cleanliness: number;
    services: number;
    condition: number;
    value: number;
    accuracy: number;
    checkin: number;
  };
}


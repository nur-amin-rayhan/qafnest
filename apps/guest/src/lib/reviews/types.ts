export type GuestReview = {
  id: string;
  property_id: string;
  booking_id?: string | null;
  guest_display_name: string;
  title: string;
  comment: string;
  title_ar?: string;
  comment_ar?: string;
  admin_reply_ar?: string | null;
  rating: number;
  cleanliness_rating: number;
  accuracy_rating: number;
  checkin_rating: number;
  value_rating: number;
  services_rating: number | null;
  property_state_rating: number | null;
  created_at: string;
  is_sample: boolean;
  is_verified_stay: boolean;
  admin_reply?: string | null;
  admin_reply_by?: string | null;
  admin_reply_at?: string | null;
};

export type ReviewSummary = {
  total: number;
  average: number;
  categoryAverages: {
    accuracy: number | null;
    cleanliness: number | null;
    services: number | null;
    propertyState: number | null;
  };
};

export const REVIEW_PAGE_SIZE = 18;
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 10;

import { type Property } from "@/data/properties";
import type { GuestReview, ReviewSummary } from "./types";

export function getSampleReviews(_propertyId: string, _property?: Property): GuestReview[] {
  return [];
}

export function summarizeReviews(reviews: GuestReview[]): ReviewSummary {
  const average = (values: Array<number | null | undefined>) => {
    const available = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return available.length
      ? Math.round((available.reduce((sum, value) => sum + value, 0) / available.length) * 10) / 10
      : null;
  };

  return {
    total: reviews.length,
    average: average(reviews.map((review) => review.rating)) || 0,
    categoryAverages: {
      accuracy: average(reviews.map((review) => review.accuracy_rating)),
      cleanliness: average(reviews.map((review) => review.cleanliness_rating)),
      services: average(reviews.map((review) => review.services_rating)),
      propertyState: average(reviews.map((review) => review.property_state_rating)),
    },
  };
}

export function isDemoProperty(_propertyId: string) {
  return false;
}

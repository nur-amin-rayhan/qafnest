import type { ReviewSummary } from "@/lib/reviews/types";

export const categoryKeys = ["accuracy", "cleanliness", "services", "propertyState"] as const;
export type CategoryKey = (typeof categoryKeys)[number];

export type EligibleBooking = {
  id: string;
  check_in: string;
  check_out: string;
};

export const CATEGORY_LABELS: Record<CategoryKey, [string, string]> = {
  accuracy: ["Accuracy of listing information", "دقة معلومات الإعلان"],
  cleanliness: ["Cleanliness", "النظافة"],
  services: ["Services", "الخدمات"],
  propertyState: ["Property condition", "حالة العقار"],
};

export function ratingDescription(value: number, isArabic: boolean) {
  if (isArabic) {
    if (value >= 9) return "ممتاز";
    if (value >= 7) return "جيد جداً";
    if (value >= 5) return "جيد";
    return "يحتاج إلى تحسين";
  }
  if (value >= 9) return "Amazing";
  if (value >= 7) return "Very good";
  if (value >= 5) return "Good";
  return "Needs improvement";
}

export function reviewDate(date: string, isArabic: boolean) {
  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function reviewSummaryLines(
  summary: ReviewSummary,
  isArabic: boolean,
  categoryLabels: Record<CategoryKey, [string, string]> = CATEGORY_LABELS,
) {
  if (!summary.total) return [];
  const availableScores = categoryKeys
    .map((key) => ({ key, score: summary.categoryAverages[key] }))
    .filter(
      (entry): entry is { key: CategoryKey; score: number } =>
        entry.score !== null && Number.isFinite(entry.score),
    );
  const strongest = availableScores.sort((a, b) => b.score - a.score)[0];
  const strongestName = strongest ? categoryLabels[strongest.key][isArabic ? 1 : 0] : "";
  return isArabic
    ? [
        `بلغ متوسط التقييم العام ${summary.average.toFixed(1)} من 10 بناءً على ${summary.total} تقييمات.`,
        strongest
          ? `أعلى الجوانب تقييماً: ${strongestName} (${strongest.score.toFixed(1)} من 10).`
          : "تقييمات الضيوف الموثقة معروضة أدناه.",
        "تشمل التقييمات دقة المعلومات والنظافة والخدمات وحالة العقار.",
      ]
    : [
        `Guests gave this stay an average rating of ${summary.average.toFixed(1)} out of 10 across ${summary.total} reviews.`,
        strongest
          ? `Highest-rated category: ${strongestName} (${strongest.score.toFixed(1)} out of 10).`
          : "Verified guest feedback is shown below.",
        "Ratings cover listing accuracy, cleanliness, services, and property condition.",
      ];
}


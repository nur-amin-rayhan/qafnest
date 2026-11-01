import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROPERTIES } from "@/data/properties";
import { getSampleReviews, isDemoProperty, summarizeReviews } from "@/lib/reviews/sampleReviews";
import { REVIEW_PAGE_SIZE } from "@/lib/reviews/types";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reviewFields = "id, property_id, guest_display_name, title, comment, title_ar, comment_ar, rating, cleanliness_rating, accuracy_rating, checkin_rating, value_rating, services_rating, property_state_rating, created_at, is_sample, is_verified_stay, admin_reply, admin_reply_by, admin_reply_at, admin_reply_ar";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const propertyId = params.get("propertyId") || "";
  const page = Math.max(1, Number(params.get("page") || 1));

  if (!propertyId || propertyId.length > 100 || !Number.isSafeInteger(page)) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  if (!uuidPattern.test(propertyId) && isDemoProperty(propertyId)) {
    const allReviews = getSampleReviews(propertyId, PROPERTIES.find((property) => property.id === propertyId));
    const start = (page - 1) * REVIEW_PAGE_SIZE;
    return NextResponse.json({
      reviews: allReviews.slice(start, start + REVIEW_PAGE_SIZE),
      total: allReviews.length,
      page,
      pageSize: REVIEW_PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(allReviews.length / REVIEW_PAGE_SIZE)),
      summary: summarizeReviews(allReviews),
      isDemo: true,
    });
  }

  if (!uuidPattern.test(propertyId)) {
    return NextResponse.json({ code: "property_not_found" }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const start = (page - 1) * REVIEW_PAGE_SIZE;
    const [{ data, count, error }, { data: summaryData, error: summaryError }] = await Promise.all([
      supabase
        .from("reviews")
        .select(reviewFields, { count: "exact" })
        .eq("property_id", propertyId)
        .eq("is_published", true)
        .eq("is_sample", false)
        .order("created_at", { ascending: false })
        .range(start, start + REVIEW_PAGE_SIZE - 1),
      supabase.rpc("get_review_summary", { target_property_id: propertyId }),
    ]);

    if (error || summaryError) throw error || summaryError;
    const summaryRow = Array.isArray(summaryData) ? summaryData[0] : summaryData;
    const summary = {
      total: Number(summaryRow?.total_reviews || 0),
      average: Number(summaryRow?.average_rating || 0),
      categoryAverages: {
        accuracy: summaryRow?.average_accuracy == null ? null : Number(summaryRow.average_accuracy),
        cleanliness: summaryRow?.average_cleanliness == null ? null : Number(summaryRow.average_cleanliness),
        services: summaryRow?.average_services == null ? null : Number(summaryRow.average_services),
        propertyState: summaryRow?.average_property_state == null ? null : Number(summaryRow.average_property_state),
      },
    };

    return NextResponse.json({
      reviews: data || [],
      total: count || 0,
      page,
      pageSize: REVIEW_PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil((count || 0) / REVIEW_PAGE_SIZE)),
      summary,
      isDemo: false,
    });
  } catch (error) {
    return NextResponse.json({ code: isReviewSchemaUnavailable(error) ? "review_schema_not_ready" : "review_data_unavailable" }, { status: 503 });
  }
}

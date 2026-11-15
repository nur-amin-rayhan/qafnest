import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REVIEW_PAGE_SIZE } from "@/lib/reviews/types";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { translateReviewContent } from "@/lib/services/translationService";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reviewFields = "id, property_id, guest_id, guest_subject, guest_display_name, title, comment, title_ar, comment_ar, rating, cleanliness_rating, accuracy_rating, checkin_rating, value_rating, services_rating, property_state_rating, created_at, is_sample, is_verified_stay, admin_reply, admin_reply_by, admin_reply_at, admin_reply_ar";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawPropertyId = params.get("propertyId") || "";
  const propertyId = rawPropertyId.trim();
  const page = Math.max(1, Number(params.get("page") || 1));

  if (!propertyId || propertyId.length > 100 || !Number.isSafeInteger(page)) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  let resolvedPropertyId = propertyId;
  if (!uuidPattern.test(propertyId)) {
    try {
      const adminClient = await getAdminOrServerClient();
      const { data: propData } = await adminClient
        .from("properties")
        .select("id")
        .or(`slug.eq.${propertyId},id.eq.${propertyId}`)
        .maybeSingle();

      if (propData?.id && uuidPattern.test(propData.id)) {
        resolvedPropertyId = propData.id;
      }
    } catch {}
  }

  if (!uuidPattern.test(resolvedPropertyId)) {
    return NextResponse.json({ code: "property_not_found" }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const start = (page - 1) * REVIEW_PAGE_SIZE;
    const [{ data, count, error }, { data: summaryData, error: summaryError }] = await Promise.all([
      supabase
        .from("reviews")
        .select(reviewFields, { count: "exact" })
        .eq("property_id", resolvedPropertyId)
        .eq("is_published", true)
        .eq("is_sample", false)
        .order("created_at", { ascending: false })
        .range(start, start + REVIEW_PAGE_SIZE - 1),
      supabase.rpc("get_review_summary", { target_property_id: resolvedPropertyId }),
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

    const formattedReviews = await Promise.all(
      (data || []).map(async (review) => {
        if ((!review.comment_ar && review.comment) || (!review.title_ar && review.title)) {
          try {
            const { titleAr, commentAr } = await translateReviewContent({
              title: review.title || "",
              comment: review.comment || "",
            });
            const updatedTitleAr = review.title_ar || titleAr;
            const updatedCommentAr = review.comment_ar || commentAr;

            review.title_ar = updatedTitleAr;
            review.comment_ar = updatedCommentAr;

            // Background update to cache translation in database
            getAdminOrServerClient().then((admin) => {
              admin
                .from("reviews")
                .update({
                  title_ar: updatedTitleAr,
                  comment_ar: updatedCommentAr,
                })
                .eq("id", review.id)
                .then(() => {});
            }).catch(() => {});
          } catch (tErr) {
            console.warn("Notice: Live review translation error:", tErr);
          }
        }
        return review;
      })
    );

    return NextResponse.json({
      reviews: formattedReviews,
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

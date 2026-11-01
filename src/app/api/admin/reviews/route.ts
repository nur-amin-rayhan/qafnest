import { NextResponse } from "next/server";
import { getReviewAdminContext, ReviewAuthError } from "@/lib/reviews/adminAuth";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") || 1);
  if (!Number.isSafeInteger(page) || page < 1) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  try {
    const admin = await getReviewAdminContext(request);
    if (!admin) {
      const hasBearer = /^Bearer\s+.+$/i.test(request.headers.get("authorization") || "");
      return NextResponse.json({ code: hasBearer ? "admin_access_required" : "sign_in_required" }, { status: hasBearer ? 403 : 401 });
    }

    const pageSize = 20;
    const start = (page - 1) * pageSize;
    const { data, count, error } = await admin.supabase
      .from("reviews")
      .select("id, property_id, guest_display_name, title, comment, rating, created_at, admin_reply, admin_reply_ar, admin_reply_by, admin_reply_at", { count: "exact" })
      .eq("is_published", true)
      .eq("is_sample", false)
      .order("created_at", { ascending: false })
      .range(start, start + pageSize - 1);

    if (error) throw error;
    const reviews = data || [];
    const propertyIds = Array.from(new Set(reviews.map((review) => review.property_id)));
    const { data: properties, error: propertyError } = propertyIds.length
      ? await admin.supabase.from("properties").select("id, title").in("id", propertyIds)
      : { data: [], error: null };
    if (propertyError) throw propertyError;

    const propertyNames = new Map((properties || []).map((property) => [property.id, property.title]));
    return NextResponse.json({
      reviews: reviews.map((review) => ({ ...review, property_title: propertyNames.get(review.property_id) || "Listing" })),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
      adminName: admin.adminDisplayName,
    });
  } catch (error) {
    if (error instanceof ReviewAuthError) return NextResponse.json({ code: error.code }, { status: 401 });
    return NextResponse.json({ code: isReviewSchemaUnavailable(error) ? "review_admin_schema_not_ready" : "review_admin_load_failed" }, { status: 503 });
  }
}

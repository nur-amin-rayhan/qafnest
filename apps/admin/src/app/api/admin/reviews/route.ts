import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, getAdminSession, isAdminRequest } from "@/lib/adminApi";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const statusFilter = searchParams.get("status") || "all";
  const propertyId = searchParams.get("propertyId") || "";

  try {
    const baseSelectCols =
      "id, property_id, guest_id, guest_display_name, title, title_ar, comment, comment_ar, rating, cleanliness_rating, accuracy_rating, checkin_rating, value_rating, services_rating, property_state_rating, is_published, is_sample, created_at, admin_reply, admin_reply_ar, admin_reply_by, admin_reply_at";

    const runListQuery = (withHostCols: boolean) => {
      const cols = withHostCols
        ? `${baseSelectCols}, host_reply, host_reply_ar, host_reply_at`
        : baseSelectCols;
      let q = supabase
        .from("reviews")
        .select(cols, { count: "exact" })
        .eq("is_published", true)
        .eq("is_sample", false)
        .order("created_at", { ascending: false });

      if (statusFilter === "pending") {
        q = withHostCols
          ? q.is("admin_reply", null).is("host_reply", null)
          : q.is("admin_reply", null);
      } else if (statusFilter === "replied") {
        q = withHostCols
          ? q.or("admin_reply.not.is.null,host_reply.not.is.null")
          : q.not("admin_reply", "is", null);
      }

      if (propertyId && UUID_REGEX.test(propertyId)) {
        q = q.eq("property_id", propertyId);
      }

      const start = (page - 1) * pageSize;
      return q.range(start, start + pageSize - 1);
    };

    let { data: rawReviews, count, error } = await runListQuery(true);
    let hasHostCols = true;
    if (error && /host_reply/i.test(error.message || "")) {
      hasHostCols = false;
      const legacy = await runListQuery(false);
      rawReviews = legacy.data;
      count = legacy.count;
      error = legacy.error;
    }

    if (error) {
      console.error("[admin reviews] query failed:", error);
      return NextResponse.json({ code: "reviews_query_failed", message: "Failed to load reviews." }, { status: 500 });
    }

    const reviewsList = (rawReviews || []) as unknown as Array<Record<string, any>>;
    const propertyIds = Array.from(new Set(reviewsList.map((r) => r.property_id).filter(Boolean)));

    let propertyMap = new Map<string, { title: string; city?: string }>();
    if (propertyIds.length > 0) {
      const { data: propsData } = await supabase
        .from("properties")
        .select("id, title, city, city_name")
        .in("id", propertyIds);

      if (propsData) {
        propertyMap = new Map(
          propsData.map((p) => [p.id, { title: p.title || "—", city: p.city_name || p.city }])
        );
      }
    }

    // Fetch summary statistics
    const statsRes = await supabase
      .from("reviews")
      .select(hasHostCols ? "rating, admin_reply, host_reply" : "rating, admin_reply")
      .eq("is_published", true)
      .eq("is_sample", false);

    const allReviews = (statsRes.data || []) as unknown as Array<Record<string, any>>;
    const totalCount = allReviews.length;
    const repliedCount = allReviews.filter((r) => Boolean(r.admin_reply || r.host_reply)).length;
    const pendingCount = totalCount - repliedCount;
    const avgRating =
      totalCount > 0
        ? Number((allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalCount).toFixed(1))
        : 0;

    const enrichedReviews = reviewsList.map((rev) => {
      const propInfo = propertyMap.get(rev.property_id);
      return {
        ...rev,
        admin_reply: rev.admin_reply || rev.host_reply || null,
        admin_reply_ar: rev.admin_reply_ar || rev.host_reply_ar || null,
        admin_reply_at: rev.admin_reply_at || rev.host_reply_at || null,
        property_title: propInfo?.title || "—",
        property_city: propInfo?.city || "—",
        guest_display_name: rev.guest_display_name || "Guest",
      };
    });

    return NextResponse.json({
      success: true,
      reviews: enrichedReviews,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
      stats: {
        totalReviews: totalCount,
        avgRating,
        pendingCount,
        repliedCount,
      },
    });
  } catch (err: unknown) {
    console.error("[admin reviews GET] server error:", err);
    return NextResponse.json(
      { code: "server_error", message: "Failed to process reviews request." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const session = getAdminSession(request);
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      reviewId?: string;
      reply?: string;
      replyAr?: string;
    };

    const reviewId = body.reviewId?.trim();
    if (!reviewId || !UUID_REGEX.test(reviewId)) {
      return NextResponse.json({ code: "invalid_review_id" }, { status: 400 });
    }

    const reply = (body.reply || "").trim().slice(0, 2000);
    const replyAr = (body.replyAr || "").trim().slice(0, 2000);

    if (reply.length < 3 && replyAr.length < 3) {
      return NextResponse.json(
        { code: "reply_too_short", message: "Response must contain at least 3 characters." },
        { status: 400 }
      );
    }

    const adminName = session?.email ? session.email.split("@")[0] : "Operations Admin";

    const { data, error } = await supabase
      .from("reviews")
      .update({
        admin_reply: reply || replyAr,
        admin_reply_ar: replyAr || null,
        admin_reply_by: `QafNest Admin (${adminName})`,
        admin_reply_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select("id, admin_reply, admin_reply_ar, admin_reply_by, admin_reply_at")
      .single();

    if (error) {
      console.error("[admin/reviews POST] failed:", error);
      return NextResponse.json(
        { code: "review_reply_failed", message: "Failed to save admin review reply." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: data });
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    let reviewId = url.searchParams.get("reviewId") || url.searchParams.get("id");

    if (!reviewId) {
      try {
        const body = (await request.json()) as { reviewId?: string; id?: string };
        reviewId = body.reviewId || body.id || null;
      } catch {}
    }

    if (!reviewId || !UUID_REGEX.test(reviewId)) {
      return NextResponse.json({ code: "invalid_review_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .update({
        admin_reply: null,
        admin_reply_ar: null,
        admin_reply_by: null,
        admin_reply_at: null,
      })
      .eq("id", reviewId)
      .select("id")
      .single();

    if (error) {
      console.error("[admin/reviews DELETE] failed:", error);
      return NextResponse.json(
        { code: "review_reply_remove_failed", message: "Failed to remove admin review reply." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json({ code: "server_error" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { verifyHostSession } from "@/lib/auth/serverAuth";

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: NextRequest) {
  // 1. Authenticate host session
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const effectiveHostId = authUser.id;
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const filterPropertyId = searchParams.get("propertyId") || "all";
  const filterReply = searchParams.get("hasReply") || "all"; // 'all', 'replied', 'unreplied'
  const sortBy = searchParams.get("sortBy") || "newest"; // 'newest', 'highest', 'lowest'

  try {
    // 2. Fetch properties owned by authenticated host
    let propQuery = supabase
      .from("properties")
      .select("id, title, city_name, district, images")
      .eq("host_id", effectiveHostId);

    if (filterPropertyId !== "all") {
      propQuery = propQuery.eq("id", filterPropertyId);
    }

    const { data: properties, error: propErr } = await propQuery;
    if (propErr) {
      return NextResponse.json({ code: "db_error", message: propErr.message }, { status: 500 });
    }

    const hostProperties = properties || [];
    const propertyIds = hostProperties.map((p) => p.id);
    const propertyMap = new Map(hostProperties.map((p) => [p.id, p]));

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        hostId: effectiveHostId,
        reviews: [],
        stats: {
          averageRating: 0,
          totalCount: 0,
          withReplyCount: 0,
          needsReplyCount: 0,
          distribution: { exceptional: 0, veryGood: 0, good: 0, belowSeven: 0 },
          subScores: { cleanliness: 0, services: 0, condition: 0, value: 0, accuracy: 0, checkin: 0 },
        },
      });
    }

    // 3. Fetch reviews for host's properties
    const { data: reviewsData, error: revErr } = await supabase
      .from("reviews")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    if (revErr) {
      return NextResponse.json({ code: "db_error", message: revErr.message }, { status: 500 });
    }

    let allReviews = (reviewsData || []).map((r) => {
      const prop = propertyMap.get(r.property_id);
      let img = "";
      if (prop && Array.isArray(prop.images) && prop.images.length > 0) {
        img = typeof prop.images[0] === "string" ? prop.images[0] : prop.images[0]?.url || "";
      }

      return {
        ...r,
        propertyTitle: prop?.title || "Property",
        propertyTitleAr: prop?.title || "العقار",
        propertyCity: prop?.city_name || "Saudi Arabia",
        propertyDistrict: prop?.district || "",
        propertyImage: img,
      };
    });

    // 4. Calculate aggregates across all reviews before filtering
    const totalCount = allReviews.length;
    let sumRating = 0;
    let sumClean = 0;
    let sumServ = 0;
    let sumCond = 0;
    let sumVal = 0;
    let sumAcc = 0;
    let sumCheckin = 0;

    let withReplyCount = 0;
    let needsReplyCount = 0;

    const distribution = {
      exceptional: 0, // 9.0 - 10.0
      veryGood: 0,    // 8.0 - 8.9
      good: 0,        // 7.0 - 7.9
      belowSeven: 0,  // < 7.0
    };

    for (const r of allReviews) {
      const score = Number(r.rating) || 0;
      sumRating += score;
      sumClean += Number(r.cleanliness_rating) || score;
      sumServ += Number(r.services_rating) || score;
      sumCond += Number(r.property_state_rating) || score;
      sumVal += Number(r.value_rating) || score;
      sumAcc += Number(r.accuracy_rating) || score;
      sumCheckin += Number(r.checkin_rating) || score;

      if (r.admin_reply || r.host_reply) {
        withReplyCount++;
      } else {
        needsReplyCount++;
      }

      if (score >= 9.0) distribution.exceptional++;
      else if (score >= 8.0) distribution.veryGood++;
      else if (score >= 7.0) distribution.good++;
      else distribution.belowSeven++;
    }

    const averageRating = totalCount > 0 ? Number((sumRating / totalCount).toFixed(1)) : 0;
    const subScores = {
      cleanliness: totalCount > 0 ? Number((sumClean / totalCount).toFixed(1)) : 0,
      services: totalCount > 0 ? Number((sumServ / totalCount).toFixed(1)) : 0,
      condition: totalCount > 0 ? Number((sumCond / totalCount).toFixed(1)) : 0,
      value: totalCount > 0 ? Number((sumVal / totalCount).toFixed(1)) : 0,
      accuracy: totalCount > 0 ? Number((sumAcc / totalCount).toFixed(1)) : 0,
      checkin: totalCount > 0 ? Number((sumCheckin / totalCount).toFixed(1)) : 0,
    };

    // 5. Apply filters for list response
    if (filterReply === "replied") {
      allReviews = allReviews.filter((r) => !!r.admin_reply || !!r.host_reply);
    } else if (filterReply === "unreplied") {
      allReviews = allReviews.filter((r) => !r.admin_reply && !r.host_reply);
    }

    if (sortBy === "highest") {
      allReviews.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sortBy === "lowest") {
      allReviews.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
    } else {
      // newest
      allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return NextResponse.json({
      success: true,
      hostId: effectiveHostId,
      reviews: allReviews,
      stats: {
        averageRating,
        totalCount,
        withReplyCount,
        needsReplyCount,
        distribution,
        subScores,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

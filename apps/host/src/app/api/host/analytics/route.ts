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
  // 1. Authenticate host session or token
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
  const timeframe = searchParams.get("timeframe") || "all"; // '30d', '90d', 'year', 'all'
  const filterPropertyId = searchParams.get("propertyId") || "all";

  try {
    // 2. Fetch properties owned by authenticated host
    let propQuery = supabase
      .from("properties")
      .select("id, title, city, city_name, district, category, category_name, base_price, is_approved, status, images, created_at")
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

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        hostId: effectiveHostId,
        properties: [],
        metrics: {
          totalRevenue: 0,
          confirmedBookings: 0,
          pendingBookings: 0,
          cancelledBookings: 0,
          totalNights: 0,
          averageDailyRate: 0,
          occupancyRate: 0,
          averageRating: 0,
          totalReviews: 0,
        },
        monthlyRevenue: [],
        categoryRatings: {
          cleanliness: 0,
          services: 0,
          accuracy: 0,
          checkin: 0,
          condition: 0,
          value: 0,
        },
        propertyPerformance: [],
      });
    }

    // 3. Fetch all bookings for host's properties
    const { data: bookings, error: bookErr } = await supabase
      .from("bookings")
      .select("id, booking_reference, property_id, check_in, check_out, total_nights, guests_count, total_price, status, payment_status, payment_method, created_at")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    if (bookErr) {
      return NextResponse.json({ code: "db_error", message: bookErr.message }, { status: 500 });
    }

    const allBookings = bookings || [];

    // Filter bookings by timeframe if requested
    const now = new Date();
    let cutoffDate: Date | null = null;
    if (timeframe === "30d") {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    } else if (timeframe === "90d") {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    } else if (timeframe === "year") {
      cutoffDate = new Date(now.getFullYear(), 0, 1);
    }

    const filteredBookings = cutoffDate
      ? allBookings.filter((b) => new Date(b.created_at) >= cutoffDate)
      : allBookings;

    // 4. Calculate core financial KPIs
    let totalRevenue = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalNights = 0;

    const isVerifiedPaidBooking = (b: { status?: string | null; payment_status?: string | null }) =>
      (b.status === "confirmed" || b.status === "completed") &&
      (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid");

    for (const b of filteredBookings) {
      const price = Number(b.total_price) || 0;
      if (isVerifiedPaidBooking(b)) {
        totalRevenue += price;
        confirmedCount++;
        totalNights += Number(b.total_nights) || 1;
      } else if (b.status === "pending" && b.payment_status !== "initiated") {
        pendingCount++;
      } else if (b.status === "cancelled") {
        cancelledCount++;
      }
    }

    const averageDailyRate = totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0;

    // Occupancy estimation: (Nights booked in period) / (Total available room-nights in period)
    const periodDays = timeframe === "30d" ? 30 : timeframe === "90d" ? 90 : 365;
    const totalPotentialNights = Math.max(1, hostProperties.length * periodDays);
    const occupancyRate = Math.min(100, Math.round((totalNights / totalPotentialNights) * 100));

    // 5. Monthly Revenue Series (Past 6 months)
    const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    const monthlyMap: Record<string, { labelEn: string; labelAr: string; revenue: number; bookings: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = {
        labelEn: `${monthNamesEn[d.getMonth()]} ${d.getFullYear()}`,
        labelAr: `${monthNamesAr[d.getMonth()]} ${d.getFullYear()}`,
        revenue: 0,
        bookings: 0,
      };
    }

    for (const b of allBookings) {
      if (isVerifiedPaidBooking(b)) {
        const bDate = new Date(b.created_at);
        const key = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap[key]) {
          monthlyMap[key].revenue += Number(b.total_price) || 0;
          monthlyMap[key].bookings += 1;
        }
      }
    }

    const monthlyRevenue = Object.entries(monthlyMap).map(([key, val]) => ({
      monthKey: key,
      ...val,
    }));

    // 6. Fetch reviews for satisfaction analysis
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, property_id, rating, cleanliness_rating, accuracy_rating, checkin_rating, value_rating, services_rating, property_state_rating, created_at")
      .in("property_id", propertyIds);

    const allReviews = reviews || [];
    const totalReviews = allReviews.length;

    let sumRating = 0;
    let sumClean = 0;
    let sumAcc = 0;
    let sumCheckin = 0;
    let sumValue = 0;
    let sumServ = 0;
    let sumCond = 0;

    for (const r of allReviews) {
      sumRating += Number(r.rating) || 0;
      sumClean += Number(r.cleanliness_rating) || Number(r.rating) || 0;
      sumAcc += Number(r.accuracy_rating) || Number(r.rating) || 0;
      sumCheckin += Number(r.checkin_rating) || Number(r.rating) || 0;
      sumValue += Number(r.value_rating) || Number(r.rating) || 0;
      sumServ += Number(r.services_rating) || Number(r.rating) || 0;
      sumCond += Number(r.property_state_rating) || Number(r.rating) || 0;
    }

    const avgRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;
    const categoryRatings = {
      cleanliness: totalReviews > 0 ? Number((sumClean / totalReviews).toFixed(1)) : 0,
      services: totalReviews > 0 ? Number((sumServ / totalReviews).toFixed(1)) : 0,
      accuracy: totalReviews > 0 ? Number((sumAcc / totalReviews).toFixed(1)) : 0,
      checkin: totalReviews > 0 ? Number((sumCheckin / totalReviews).toFixed(1)) : 0,
      condition: totalReviews > 0 ? Number((sumCond / totalReviews).toFixed(1)) : 0,
      value: totalReviews > 0 ? Number((sumValue / totalReviews).toFixed(1)) : 0,
    };

    // 7. Per-Property Performance Breakdown
    const propertyPerformance = hostProperties.map((p) => {
      const propBookings = allBookings.filter(
        (b) => b.property_id === p.id && isVerifiedPaidBooking(b)
      );
      const propRevenue = propBookings.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);
      const propNights = propBookings.reduce((acc, b) => acc + (Number(b.total_nights) || 1), 0);

      const propReviews = allReviews.filter((r) => r.property_id === p.id);
      const propAvgRating =
        propReviews.length > 0
          ? Number(
              (
                propReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) /
                propReviews.length
              ).toFixed(1)
            )
          : null;

      let firstImg = "";
      if (Array.isArray(p.images) && p.images.length > 0) {
        firstImg = typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.url || "";
      }

      return {
        propertyId: p.id,
        title: p.title || "Untitled Property",
        titleAr: p.title || "عقار بدون عنوان",
        city: p.city_name || p.city || "Riyadh",
        district: p.district || "",
        address: p.district || "",
        category: p.category_name || p.category || "Chalet",
        basePrice: p.base_price,
        image: firstImg,
        totalRevenue: propRevenue,
        bookingsCount: propBookings.length,
        nightsBooked: propNights,
        averageRating: propAvgRating ?? 0,
        reviewsCount: propReviews.length,
        isApproved: p.is_approved,
        status: p.status,
      };
    });

    return NextResponse.json({
      success: true,
      hostId: effectiveHostId,
      timeframe,
      properties: hostProperties,
      metrics: {
        totalRevenue,
        confirmedBookings: confirmedCount,
        pendingBookings: pendingCount,
        cancelledBookings: cancelledCount,
        totalNights,
        averageDailyRate,
        occupancyRate,
        averageRating: avgRating,
        totalReviews,
      },
      monthlyRevenue,
      categoryRatings,
      propertyPerformance,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

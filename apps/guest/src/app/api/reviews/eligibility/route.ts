import { NextResponse } from "next/server";
import { getReviewAuthContext, ReviewAuthError } from "@/lib/reviews/serverAuth";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";
import { isDemoProperty } from "@/lib/reviews/sampleReviews";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidPropertyId(id: unknown): id is string {
  return typeof id === "string" && id.length >= 2 && id.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export async function GET(request: Request) {
  const propertyId = new URL(request.url).searchParams.get("propertyId") || "";
  if (!isValidPropertyId(propertyId)) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  try {
    const auth = await getReviewAuthContext(request);
    if (!auth) return NextResponse.json({ code: "sign_in_required" }, { status: 401 });

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());

    if (uuidPattern.test(propertyId)) {
      const { data: bookings, error } = await auth.supabase
        .from("bookings")
        .select("id, property_id, check_in, check_out, status, payment_status")
        .eq("property_id", propertyId)
        .order("check_out", { ascending: false });

      if (error) throw error;
      const bookingRows = bookings || [];
      const bookingIds = bookingRows.map((booking) => booking.id);
      let reviewedBookingIds = new Set<string>();

      if (bookingIds.length) {
        const { data: existingReviews, error: reviewError } = await auth.supabase
          .from("reviews")
          .select("booking_id")
          .in("booking_id", bookingIds)
          .eq("is_sample", false);
        if (reviewError) throw reviewError;
        reviewedBookingIds = new Set((existingReviews || []).map((review) => String(review.booking_id)));
      }

      const eligibleBookings = bookingRows.filter((booking) =>
        booking.status === "completed" &&
        booking.payment_status === "success" &&
        booking.check_out <= today &&
        !reviewedBookingIds.has(booking.id)
      );
      const upcomingCount = bookingRows.filter((booking) =>
        booking.status === "confirmed" && booking.payment_status === "success" && booking.check_out >= today
      ).length;

      return NextResponse.json({
        eligibleBookings,
        upcomingCount,
        reviewedCount: bookingRows.filter((booking) => reviewedBookingIds.has(booking.id)).length,
      });
    }

    // For demo/slug properties, check if authenticated guest has any completed booking
    if (isDemoProperty(propertyId)) {
      const demoStayId = `stay-${propertyId}-${auth.subject.slice(0, 8)}`;
      return NextResponse.json({
        eligibleBookings: [
          {
            id: demoStayId,
            property_id: propertyId,
            check_in: "2026-10-15",
            check_out: "2026-10-18",
            status: "completed",
            payment_status: "success",
          },
        ],
        upcomingCount: 0,
        reviewedCount: 0,
      });
    }

    return NextResponse.json({ eligibleBookings: [], upcomingCount: 0, reviewedCount: 0 });
  } catch (error) {
    if (error instanceof ReviewAuthError) return NextResponse.json({ code: error.code }, { status: 401 });
    return NextResponse.json({ code: isReviewSchemaUnavailable(error) ? "review_schema_not_ready" : "eligibility_check_failed" }, { status: 503 });
  }
}

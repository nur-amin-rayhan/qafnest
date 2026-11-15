import { NextResponse } from "next/server";
import { getReviewAuthContext, ReviewAuthError } from "@/lib/reviews/serverAuth";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";
import { getAdminOrServerClient } from "@/lib/supabase/service";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidPropertyId(id: unknown): id is string {
  return typeof id === "string" && id.length >= 2 && id.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export async function GET(request: Request) {
  const rawPropertyId = new URL(request.url).searchParams.get("propertyId") || "";
  const propertyId = rawPropertyId.trim();
  if (!isValidPropertyId(propertyId)) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  try {
    const auth = await getReviewAuthContext(request);
    if (!auth) return NextResponse.json({ code: "sign_in_required" }, { status: 401 });

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());

    const adminClient = await getAdminOrServerClient();

    // Resolve property UUID if a slug was provided
    let resolvedPropertyId = propertyId;
    if (!uuidPattern.test(propertyId)) {
      try {
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

    if (uuidPattern.test(resolvedPropertyId)) {
      let bookingRows: Array<{
        id: string;
        property_id: string;
        guest_id?: string | null;
        auth_subject?: string | null;
        check_in: string;
        check_out: string;
        status: string;
        payment_status: string;
      }> = [];

      try {
        let query = adminClient
          .from("bookings")
          .select("id, property_id, guest_id, auth_subject, check_in, check_out, status, payment_status")
          .eq("property_id", resolvedPropertyId)
          .order("check_out", { ascending: false });

        if (auth.guestId && auth.subject && auth.guestId !== auth.subject) {
          query = query.or(`guest_id.eq.${auth.guestId},auth_subject.eq.${auth.subject}`);
        } else if (auth.guestId) {
          query = query.or(`guest_id.eq.${auth.guestId},auth_subject.eq.${auth.guestId}`);
        } else if (auth.subject) {
          query = query.eq("auth_subject", auth.subject);
        }

        const { data: bookings } = await query;
        if (bookings) {
          bookingRows = bookings;
        }
      } catch {}

      // Filter bookings to those owned by the authenticated guest
      bookingRows = bookingRows.filter((b) => {
        if (!b.guest_id && !b.auth_subject) return true;
        return (
          (auth.guestId && b.guest_id === auth.guestId) ||
          (auth.subject && b.auth_subject === auth.subject) ||
          (auth.subject && b.guest_id === auth.subject) ||
          (auth.guestId && b.auth_subject === auth.guestId)
        );
      });

      const bookingIds = bookingRows.map((booking) => booking.id);
      let reviewedBookingIds = new Set<string>();
      let userReviews: Array<{
        id: string;
        booking_id: string | null;
        property_id: string;
        title: string;
        comment: string;
        rating: number;
        cleanliness_rating: number;
        accuracy_rating: number;
        services_rating: number | null;
        property_state_rating: number | null;
        created_at: string;
      }> = [];

      if (bookingIds.length) {
        try {
          const { data: existingReviews, error: reviewError } = await adminClient
            .from("reviews")
            .select("id, booking_id, property_id, title, comment, rating, cleanliness_rating, accuracy_rating, services_rating, property_state_rating, created_at")
            .in("booking_id", bookingIds)
            .eq("is_sample", false);
          if (!reviewError && existingReviews) {
            userReviews = existingReviews;
            reviewedBookingIds = new Set(existingReviews.map((review) => String(review.booking_id)));
          }
        } catch {}
      }

      // Also check if user has any review for this property regardless of bookingId lookup
      if (userReviews.length === 0) {
        try {
          let uQuery = adminClient
            .from("reviews")
            .select("id, booking_id, property_id, title, comment, rating, cleanliness_rating, accuracy_rating, services_rating, property_state_rating, created_at")
            .eq("property_id", resolvedPropertyId)
            .eq("is_sample", false);

          if (auth.guestId && auth.subject && auth.guestId !== auth.subject) {
            uQuery = uQuery.or(`guest_id.eq.${auth.guestId},guest_subject.eq.${auth.subject}`);
          } else if (auth.guestId) {
            uQuery = uQuery.or(`guest_id.eq.${auth.guestId},guest_subject.eq.${auth.guestId}`);
          } else if (auth.subject) {
            uQuery = uQuery.eq("guest_subject", auth.subject);
          }

          const { data: directReviews } = await uQuery;
          if (directReviews && directReviews.length > 0) {
            userReviews = directReviews;
          }
        } catch {}
      }

      // Accept stays where payment succeeded and stay has commenced or completed
      const eligibleBookings = bookingRows.filter((booking) =>
        (booking.status === "completed" || booking.status === "confirmed") &&
        booking.payment_status === "success" &&
        (booking.check_in <= today || booking.check_out <= today || booking.status === "completed") &&
        !reviewedBookingIds.has(booking.id)
      );

      const upcomingCount = bookingRows.filter((booking) =>
        (booking.status === "confirmed" || booking.status === "completed") &&
        booking.payment_status === "success" &&
        booking.check_in > today &&
        booking.check_out > today
      ).length;

      return NextResponse.json({
        eligibleBookings,
        upcomingCount,
        reviewedCount: userReviews.length || bookingRows.filter((booking) => reviewedBookingIds.has(booking.id)).length,
        userReviews,
      });
    }

    return NextResponse.json({ eligibleBookings: [], upcomingCount: 0, reviewedCount: 0 });
  } catch (error) {
    if (error instanceof ReviewAuthError) return NextResponse.json({ code: error.code }, { status: 401 });
    return NextResponse.json({ code: isReviewSchemaUnavailable(error) ? "review_schema_not_ready" : "eligibility_check_failed" }, { status: 503 });
  }
}

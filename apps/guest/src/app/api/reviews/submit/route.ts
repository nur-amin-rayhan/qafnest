import { NextResponse } from "next/server";
import { getReviewAuthContext, ReviewAuthError } from "@/lib/reviews/serverAuth";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";
import { isDemoProperty } from "@/lib/reviews/sampleReviews";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidPropertyId(id: unknown): id is string {
  return typeof id === "string" && id.length >= 2 && id.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function isValidBookingId(id: unknown): id is string {
  return typeof id === "string" && id.length >= 3 && id.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\u0000/g, "").trim().slice(0, maxLength)
    : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    }
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  const title = cleanText(body.title, 120);
  const comment = cleanText(body.comment, 3000);
  const rating = Number(body.rating);
  const cleanliness = Number(body.cleanliness);
  const accuracy = Number(body.accuracy);
  const services = Number(body.services);
  const propertyState = Number(body.propertyState);

  if (!isValidPropertyId(propertyId) || !isValidBookingId(bookingId)) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }
  if (title.length < 5 || comment.length < 20 || comment.length > 3000) {
    return NextResponse.json({ code: "invalid_review_text" }, { status: 400 });
  }
  if ([rating, cleanliness, accuracy, services, propertyState].some((score) => !Number.isInteger(score) || score < 1 || score > 10)) {
    return NextResponse.json({ code: "invalid_rating" }, { status: 400 });
  }

  try {
    const auth = await getReviewAuthContext(request);
    if (!auth) return NextResponse.json({ code: "sign_in_required" }, { status: 401 });

    // Allow submission for demo / catalog properties
    if (isDemoProperty(propertyId)) {
      return NextResponse.json({ success: true, isDemo: true }, { status: 201 });
    }

    if (!uuidPattern.test(propertyId) || !uuidPattern.test(bookingId)) {
      return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await auth.supabase
      .from("bookings")
      .select("id, property_id, guest_id, auth_subject, check_in, check_out, status, payment_status")
      .eq("id", bookingId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (bookingError) throw bookingError;
    const isOwner = booking && (booking.guest_id === auth.guestId || booking.auth_subject === auth.subject);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
    if (!booking || !isOwner || booking.status !== "completed" || booking.payment_status !== "success" || booking.check_out > today) {
      return NextResponse.json({ code: "completed_stay_required" }, { status: 403 });
    }

    const { error: insertError } = await auth.supabase.from("reviews").insert({
      property_id: propertyId,
      booking_id: bookingId,
      guest_id: auth.guestId,
      guest_subject: auth.subject,
      guest_display_name: auth.displayName,
      title,
      comment,
      rating,
      cleanliness_rating: cleanliness,
      accuracy_rating: accuracy,
      services_rating: services,
      property_state_rating: propertyState,
      is_sample: false,
      is_verified_stay: true,
      is_published: true,
    });

    if (insertError?.code === "23505") {
      return NextResponse.json({ code: "review_already_submitted" }, { status: 409 });
    }
    if (insertError) throw insertError;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ReviewAuthError) return NextResponse.json({ code: error.code }, { status: 401 });
    return NextResponse.json({ code: isReviewSchemaUnavailable(error) ? "review_schema_not_ready" : "review_submission_failed" }, { status: 503 });
  }
}

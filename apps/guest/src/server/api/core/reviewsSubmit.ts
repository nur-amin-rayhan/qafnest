import { NextResponse } from "next/server";
import { getReviewAuthContext, ReviewAuthError } from "@/lib/reviews/serverAuth";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { translateReviewContent } from "@/lib/services/translationService";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidPropertyId(id: unknown): id is string {
  return typeof id === "string" && id.length >= 1 && id.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(id);
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
      return NextResponse.json({ code: "invalid_request", message: "Invalid request payload" }, { status: 400 });
    }
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_request", message: "Malformed JSON body" }, { status: 400 });
  }

  const propertyId = typeof body.propertyId === "string" ? body.propertyId.trim() : "";
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const title = cleanText(body.title, 120);
  const comment = cleanText(body.comment, 3000);
  const rating = Number(body.rating);
  const cleanliness = Number(body.cleanliness);
  const accuracy = Number(body.accuracy);
  const services = Number(body.services);
  const propertyState = Number(body.propertyState);

  if (!isValidPropertyId(propertyId) || !isValidBookingId(bookingId)) {
    return NextResponse.json(
      { code: "invalid_booking", message: "Property ID or Booking ID is missing or invalid." },
      { status: 400 }
    );
  }
  if (title.length < 5 || comment.length < 20 || comment.length > 3000) {
    return NextResponse.json(
      {
        code: "invalid_review_text",
        message: "Title must be at least 5 characters and review must be at least 20 characters.",
      },
      { status: 400 }
    );
  }
  if ([rating, cleanliness, accuracy, services, propertyState].some((score) => !Number.isInteger(score) || score < 1 || score > 10)) {
    return NextResponse.json(
      { code: "invalid_rating", message: "All ratings must be integer values between 1 and 10." },
      { status: 400 }
    );
  }

  try {
    const auth = await getReviewAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { code: "sign_in_required", message: "Please sign in to submit a review." },
        { status: 401 }
      );
    }

    const adminClient = await getAdminOrServerClient();

    // Resolve property UUID if propertyId was passed as a slug
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
        } else {
          return NextResponse.json(
            { code: "invalid_booking", message: "Property listing could not be found." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { code: "invalid_booking", message: "Could not resolve property." },
          { status: 400 }
        );
      }
    }

    // Lookup booking strictly via adminClient
    let booking: {
      id: string;
      property_id: string;
      guest_id?: string | null;
      auth_subject?: string | null;
      check_in: string;
      check_out: string;
      status: string;
      payment_status: string;
    } | null = null;

    try {
      const { data: dbBooking } = await adminClient
        .from("bookings")
        .select("id, property_id, guest_id, auth_subject, check_in, check_out, status, payment_status")
        .eq("id", bookingId)
        .maybeSingle();

      if (dbBooking) {
        booking = dbBooking;
      }
    } catch (err) {
      console.error("Booking lookup error:", err);
    }

    if (!booking) {
      return NextResponse.json(
        { code: "invalid_booking", message: "Selected reservation was not found in our records." },
        { status: 400 }
      );
    }

    // Check ownership
    const isOwner =
      (auth.guestId && booking.guest_id === auth.guestId) ||
      (auth.subject && booking.auth_subject === auth.subject) ||
      (auth.subject && booking.guest_id === auth.subject) ||
      (auth.guestId && booking.auth_subject === auth.guestId) ||
      (!booking.guest_id && !booking.auth_subject);

    if (!isOwner) {
      return NextResponse.json(
        { code: "completed_stay_required", message: "This booking belongs to a different guest account." },
        { status: 403 }
      );
    }

    // Check payment status and stay eligibility
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());

    const isStayEligible =
      (booking.status === "completed" || booking.status === "confirmed") &&
      booking.payment_status === "success" &&
      (booking.check_in <= today || booking.check_out <= today || booking.status === "completed");

    if (!isStayEligible) {
      return NextResponse.json(
        {
          code: "completed_stay_required",
          message: "A paid, verified stay is required before submitting a review.",
        },
        { status: 403 }
      );
    }

    // Check duplicate review
    const { data: existingReview } = await adminClient
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { code: "review_already_submitted", message: "A review has already been submitted for this booking." },
        { status: 409 }
      );
    }

    // Automatically translate review between English and Arabic
    let titleEn = title;
    let titleAr = title;
    let commentEn = comment;
    let commentAr = comment;

    try {
      const translated = await translateReviewContent({ title, comment });
      titleEn = translated.titleEn || title;
      titleAr = translated.titleAr || title;
      commentEn = translated.commentEn || comment;
      commentAr = translated.commentAr || comment;
    } catch (transErr) {
      console.warn("Notice: Review auto-translation skipped:", transErr);
    }

    // Insert review using adminClient to avoid client-token RLS mismatch
    const { data: insertedReview, error: insertError } = await adminClient
      .from("reviews")
      .insert({
        property_id: resolvedPropertyId,
        booking_id: bookingId,
        guest_id: auth.guestId || (uuidPattern.test(auth.subject) ? auth.subject : null),
        guest_subject: auth.subject,
        guest_display_name: auth.displayName || "Verified guest",
        title: titleEn,
        title_ar: titleAr,
        comment: commentEn,
        comment_ar: commentAr,
        rating,
        cleanliness_rating: cleanliness,
        accuracy_rating: accuracy,
        services_rating: services,
        property_state_rating: propertyState,
        checkin_rating: services || rating,
        value_rating: propertyState || rating,
        is_sample: false,
        is_verified_stay: true,
        is_published: true,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { code: "review_already_submitted", message: "A review has already been submitted for this booking." },
          { status: 409 }
        );
      }
      console.error("Admin reviews insert error:", insertError);
      throw insertError;
    }

    // Mark confirmed booking as completed
    if (booking.status === "confirmed") {
      try {
        await adminClient
          .from("bookings")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
      } catch (markErr) {
        console.warn("Notice: Could not transition booking to completed status:", markErr);
      }
    }

    // Update property rating and reviews_count
    try {
      const { data: allReviews } = await adminClient
        .from("reviews")
        .select("rating")
        .eq("property_id", resolvedPropertyId)
        .eq("is_published", true)
        .eq("is_sample", false);

      if (allReviews && allReviews.length > 0) {
        const count = allReviews.length;
        const avg =
          Math.round(
            (allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count) * 10
          ) / 10;

        await adminClient
          .from("properties")
          .update({
            rating: avg,
            reviews_count: count,
          })
          .eq("id", resolvedPropertyId);
      }
    } catch (aggErr) {
      console.warn("Notice: Could not update aggregate property rating:", aggErr);
    }

    return NextResponse.json({ success: true, reviewId: insertedReview?.id }, { status: 201 });
  } catch (error) {
    console.error("Review submission exception:", error);
    if (error instanceof ReviewAuthError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        code: isReviewSchemaUnavailable(error) ? "review_schema_not_ready" : "review_submission_failed",
        message: "Your review could not be submitted. Please try again.",
      },
      { status: 503 }
    );
  }
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ code: "invalid_request", message: "Invalid request payload" }, { status: 400 });
    }
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_request", message: "Malformed JSON body" }, { status: 400 });
  }

  const reviewId = typeof body.reviewId === "string" ? body.reviewId.trim() : "";
  const title = cleanText(body.title, 120);
  const comment = cleanText(body.comment, 3000);
  const rating = Number(body.rating);
  const cleanliness = Number(body.cleanliness);
  const accuracy = Number(body.accuracy);
  const services = Number(body.services);
  const propertyState = Number(body.propertyState);

  if (!reviewId) {
    return NextResponse.json({ code: "invalid_request", message: "Review ID is required." }, { status: 400 });
  }
  if (title.length < 5 || comment.length < 20 || comment.length > 3000) {
    return NextResponse.json(
      {
        code: "invalid_review_text",
        message: "Title must be at least 5 characters and review must be at least 20 characters.",
      },
      { status: 400 }
    );
  }
  if ([rating, cleanliness, accuracy, services, propertyState].some((score) => !Number.isInteger(score) || score < 1 || score > 10)) {
    return NextResponse.json(
      { code: "invalid_rating", message: "All ratings must be integer values between 1 and 10." },
      { status: 400 }
    );
  }

  try {
    const auth = await getReviewAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { code: "sign_in_required", message: "Please sign in to edit your review." },
        { status: 401 }
      );
    }

    const adminClient = await getAdminOrServerClient();

    // Fetch existing review
    const { data: existingReview, error: fetchErr } = await adminClient
      .from("reviews")
      .select("id, property_id, guest_id, guest_subject, booking_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchErr || !existingReview) {
      return NextResponse.json(
        { code: "review_not_found", message: "Review not found." },
        { status: 404 }
      );
    }

    // Verify ownership
    const isOwner =
      (auth.guestId && existingReview.guest_id === auth.guestId) ||
      (auth.subject && existingReview.guest_subject === auth.subject) ||
      (auth.subject && existingReview.guest_id === auth.subject) ||
      (auth.guestId && existingReview.guest_subject === auth.guestId);

    if (!isOwner) {
      return NextResponse.json(
        { code: "forbidden", message: "You can only edit your own reviews." },
        { status: 403 }
      );
    }

    // Automatically translate updated review content
    let titleEn = title;
    let titleAr = title;
    let commentEn = comment;
    let commentAr = comment;

    try {
      const translated = await translateReviewContent({ title, comment });
      titleEn = translated.titleEn || title;
      titleAr = translated.titleAr || title;
      commentEn = translated.commentEn || comment;
      commentAr = translated.commentAr || comment;
    } catch (transErr) {
      console.warn("Notice: Review edit auto-translation skipped:", transErr);
    }

    // Update review
    const { error: updateError } = await adminClient
      .from("reviews")
      .update({
        title: titleEn,
        title_ar: titleAr,
        comment: commentEn,
        comment_ar: commentAr,
        rating,
        cleanliness_rating: cleanliness,
        accuracy_rating: accuracy,
        services_rating: services,
        property_state_rating: propertyState,
        checkin_rating: services || rating,
        value_rating: propertyState || rating,
      })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Admin reviews update error:", updateError);
      throw updateError;
    }

    // Recalculate property aggregate rating
    try {
      const { data: allReviews } = await adminClient
        .from("reviews")
        .select("rating")
        .eq("property_id", existingReview.property_id)
        .eq("is_published", true)
        .eq("is_sample", false);

      if (allReviews && allReviews.length > 0) {
        const count = allReviews.length;
        const avg =
          Math.round(
            (allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count) * 10
          ) / 10;

        await adminClient
          .from("properties")
          .update({
            rating: avg,
            reviews_count: count,
          })
          .eq("id", existingReview.property_id);
      }
    } catch (aggErr) {
      console.warn("Notice: Could not update aggregate property rating:", aggErr);
    }

    return NextResponse.json({ success: true, updated: true, reviewId }, { status: 200 });
  } catch (error) {
    console.error("Review edit exception:", error);
    if (error instanceof ReviewAuthError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { code: "review_update_failed", message: "Your review could not be updated. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROPERTIES } from "@/data/properties";

const paymentMethods = ["card", "apple", "tabby", "tamara"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "QAF-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

function generateSmartLockPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
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

  const method = body.method;
  if (typeof method !== "string" || !paymentMethods.includes(method as PaymentMethod)) {
    return NextResponse.json({ code: "unsupported_payment_method" }, { status: 400 });
  }
  const selectedMethod = method as PaymentMethod;

  // Resolve Guest Identity from Supabase Session, Bearer Token, or Body
  const supabase = await createClient();
  let guestId: string | null = null;
  let guestSubject: string | null = null;
  let guestPhone: string | null = null;
  let guestName: string | null = null;
  let guestEmail: string | null = null;
  let isPhoneVerified = false;

  // 1. Try Supabase Cookie Session
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      guestId = user.id;
      guestSubject = user.id;
      guestPhone = user.phone || (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
      guestName = (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") || null;
      guestEmail = user.email || (typeof user.user_metadata?.contact_email === "string" ? user.user_metadata.contact_email : null);
      isPhoneVerified = Boolean(user.phone_confirmed_at || guestPhone);
    }
  } catch {}

  // 2. Try Authorization Bearer Header (Firebase ID Token or Supabase JWT)
  if (!guestPhone) {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (bearer) {
      const claims = decodeJwtPayload(bearer);
      if (claims) {
        guestSubject = typeof claims.sub === "string" ? claims.sub : null;
        guestPhone = typeof claims.phone_number === "string" ? claims.phone_number : null;
        guestName = typeof claims.name === "string" ? claims.name : null;
        guestEmail = typeof claims.email === "string" ? claims.email : null;
        if (guestPhone) isPhoneVerified = true;
      }
    }
  }

  // 3. Fallback to Guest Details provided in request body (e.g. from Firebase client session)
  if (!guestPhone && typeof body.guestPhone === "string" && body.guestPhone.trim()) {
    guestPhone = body.guestPhone.trim();
    isPhoneVerified = true;
  }
  if (!guestName && typeof body.guestName === "string" && body.guestName.trim()) {
    guestName = body.guestName.trim();
  }
  if (!guestEmail && typeof body.guestEmail === "string" && body.guestEmail.includes("@")) {
    guestEmail = body.guestEmail.trim();
  }
  if (!guestSubject && typeof body.guestSubject === "string") {
    guestSubject = body.guestSubject.trim();
  }

  if (!isPhoneVerified || !guestPhone) {
    return NextResponse.json({ code: "phone_verification_required" }, { status: 401 });
  }

  if (!guestName || !guestEmail || !guestEmail.includes("@")) {
    return NextResponse.json({ code: "profile_details_required" }, { status: 400 });
  }

  const propertyId = body.propertyId;
  const checkIn = body.checkIn;
  const checkOut = body.checkOut;
  const guests = body.guests;
  if (typeof propertyId !== "string" || !isIsoDate(checkIn) || !isIsoDate(checkOut) || !Number.isInteger(guests)) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }

  // Look up property in Supabase DB first, then fallback to bundled catalog
  let propTitle = "";
  let propCityName = "";
  let propImages: string[] = [];
  let propBasePrice = 0;
  let propWeekdayPrice: number | null = null;
  let propWeekendPrice: number | null = null;
  let propCapacity = 4;
  let isDbProperty = false;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(propertyId)) {
    try {
      const { data: dbProperty } = await supabase
        .from("properties")
        .select("id, title, city_name, images, base_price, weekday_price, weekend_price, capacity, is_approved")
        .eq("id", propertyId)
        .eq("is_approved", true)
        .maybeSingle();

      if (dbProperty) {
        isDbProperty = true;
        propTitle = dbProperty.title;
        propCityName = dbProperty.city_name || "";
        propImages = dbProperty.images || [];
        propBasePrice = Number(dbProperty.base_price);
        propWeekdayPrice = dbProperty.weekday_price ? Number(dbProperty.weekday_price) : propBasePrice;
        propWeekendPrice = dbProperty.weekend_price ? Number(dbProperty.weekend_price) : propBasePrice;
        propCapacity = Number(dbProperty.capacity || 4);
      }
    } catch {}
  }

  if (!isDbProperty) {
    const bundled = PROPERTIES.find((item) => item.id === propertyId);
    if (!bundled) {
      return NextResponse.json({ code: "property_unavailable" }, { status: 404 });
    }
    propTitle = bundled.title;
    propCityName = bundled.cityName;
    propImages = bundled.images || [];
    propBasePrice = bundled.basePrice;
    propWeekdayPrice = bundled.basePrice;
    propWeekendPrice = bundled.weekendPrice || bundled.basePrice;
    propCapacity = bundled.capacity || 4;
  }

  const nights = (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86_400_000;
  if (nights < 1 || nights > 90 || Number(guests) < 1 || Number(guests) > propCapacity) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Date.parse(`${checkIn}T00:00:00.000Z`) < today.getTime()) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }

  // Availability Check: ensure no overlapping confirmed/completed booking exists
  try {
    const { data: conflictingBookings } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, status")
      .eq("property_id", propertyId)
      .in("status", ["confirmed", "completed"])
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json({ code: "dates_unavailable" }, { status: 409 });
    }
  } catch {}

  let totalPrice = 0;
  if (isDbProperty) {
    try {
      const { data: availability } = await supabase
        .from("property_availability")
        .select("date, is_available, nightly_price")
        .eq("property_id", propertyId)
        .gte("date", checkIn)
        .lt("date", checkOut);

      const availabilityByDate = new Map((availability || []).map((day) => [day.date, day]));
      for (let offset = 0; offset < nights; offset += 1) {
        const date = new Date(Date.parse(`${checkIn}T00:00:00.000Z`) + offset * 86_400_000);
        const isoDate = date.toISOString().slice(0, 10);
        const day = availabilityByDate.get(isoDate);
        if (day?.is_available === false) {
          return NextResponse.json({ code: "dates_unavailable" }, { status: 409 });
        }
        const isSaudiWeekend = date.getUTCDay() === 5 || date.getUTCDay() === 6;
        const nightlyRate = Number(day?.nightly_price || (isSaudiWeekend && propWeekendPrice ? propWeekendPrice : propWeekdayPrice || propBasePrice));
        totalPrice += nightlyRate;
      }
    } catch {
      for (let offset = 0; offset < nights; offset += 1) {
        const date = new Date(Date.parse(`${checkIn}T00:00:00.000Z`) + offset * 86_400_000);
        const isSaudiWeekend = date.getUTCDay() === 5 || date.getUTCDay() === 6;
        totalPrice += isSaudiWeekend && propWeekendPrice ? propWeekendPrice : (propWeekdayPrice || propBasePrice);
      }
    }
  } else {
    for (let offset = 0; offset < nights; offset += 1) {
      const date = new Date(Date.parse(`${checkIn}T00:00:00.000Z`) + offset * 86_400_000);
      const isSaudiWeekend = date.getUTCDay() === 5 || date.getUTCDay() === 6;
      totalPrice += isSaudiWeekend && propWeekendPrice ? propWeekendPrice : (propWeekdayPrice || propBasePrice);
    }
  }

  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    return NextResponse.json({ code: "invalid_booking_price" }, { status: 400 });
  }

  // Generate Booking Identifiers
  const bookingRef = generateBookingReference();
  const smartLockPin = generateSmartLockPin();
  let bookingId = `book-${Math.random().toString(36).slice(2, 10)}`;

  // Create booking record in database
  try {
    const bookingPayload: Record<string, unknown> = {
      booking_reference: bookingRef,
      property_id: uuidPattern.test(propertyId) ? propertyId : null,
      guest_id: guestId && uuidPattern.test(guestId) ? guestId : null,
      auth_subject: guestSubject || guestId || guestPhone,
      check_in: checkIn,
      check_out: checkOut,
      total_nights: nights,
      guests_count: Number(guests),
      total_price: totalPrice,
      status: "confirmed",
      payment_status: "success",
      smart_lock_pin: smartLockPin,
    };

    const { data: insertedBooking } = await supabase
      .from("bookings")
      .insert(bookingPayload)
      .select("id")
      .maybeSingle();

    if (insertedBooking?.id) {
      bookingId = String(insertedBooking.id);
    }
  } catch (err) {
    console.warn("Notice: Database booking insert fallback:", err);
  }

  return NextResponse.json({
    success: true,
    bookingId,
    bookingRef,
    smartLockPin,
    amount: totalPrice,
    checkIn,
    checkOut,
    nights,
    guests: Number(guests),
    property: {
      id: propertyId,
      title: propTitle,
      city_name: propCityName,
      images: propImages,
    },
    method: selectedMethod,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractExtendedLocationToExternalMeta,
  isMissingBilingualColumnError,
  stripBilingualColumnsWithFallback,
} from "@qafnest/shared";
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

const ALLOWED_PROPERTY_KEYS = [
  "title",
  "title_ar",
  "description",
  "description_ar",
  "category",
  "category_name",
  "city",
  "city_name",
  "state",
  "state_ar",
  "district",
  "district_ar",
  "address",
  "address_ar",
  "street",
  "street_ar",
  "postal_code",
  "google_maps_url",
  "area_sqm",
  "specs",
  "base_price",
  "weekday_price",
  "weekend_price",
  "tourism_license_number",
  "is_licensed",
  "capacity",
  "bedrooms_count",
  "bathrooms_count",
  "living_rooms_count",
  "images",
  "features",
  "self_checkin",
  "has_pool",
  "checkin_time",
  "checkout_time",
  "custom_day_pricing",
  "slug",
  "lat",
  "lng",
  "external_host_id",
] as const;

export async function POST(request: NextRequest) {
  // 1. Enforce authenticated host session or cryptographically verified token
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required to create properties." },
      { status: 401 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    const rawPayload = await request.json();
    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
      return NextResponse.json({ code: "invalid_property_payload" }, { status: 400 });
    }

    const payload = rawPayload as Record<string, unknown>;

    // 2. Validate mandatory fields
    if (!payload.title || typeof payload.title !== "string" || !payload.title.trim()) {
      return NextResponse.json({ code: "missing_title", message: "Property title is required." }, { status: 400 });
    }
    if (
      !payload.tourism_license_number ||
      typeof payload.tourism_license_number !== "string" ||
      !payload.tourism_license_number.trim()
    ) {
      return NextResponse.json(
        {
          code: "missing_tourism_license",
          message: "Ministry of Tourism license number is required.",
        },
        { status: 400 }
      );
    }

    const rawBasePrice = Number(payload.base_price ?? payload.weekday_price);
    if (!Number.isFinite(rawBasePrice) || rawBasePrice <= 0 || rawBasePrice > 1_000_000) {
      return NextResponse.json(
        { code: "invalid_price", message: "Base nightly price must be a positive number." },
        { status: 400 }
      );
    }
    if (
      payload.weekday_price !== undefined &&
      (!Number.isFinite(Number(payload.weekday_price)) ||
        Number(payload.weekday_price) <= 0 ||
        Number(payload.weekday_price) > 1_000_000)
    ) {
      return NextResponse.json(
        { code: "invalid_weekday_price", message: "Weekday price must be a positive number." },
        { status: 400 }
      );
    }
    if (
      payload.weekend_price !== undefined &&
      (!Number.isFinite(Number(payload.weekend_price)) ||
        Number(payload.weekend_price) <= 0 ||
        Number(payload.weekend_price) > 1_000_000)
    ) {
      return NextResponse.json(
        { code: "invalid_weekend_price", message: "Weekend price must be a positive number." },
        { status: 400 }
      );
    }
    if (payload.lat !== undefined || payload.lng !== undefined) {
      const latNum = Number(payload.lat);
      const lngNum = Number(payload.lng);
      if (
        !Number.isFinite(latNum) ||
        !Number.isFinite(lngNum) ||
        latNum < -90 ||
        latNum > 90 ||
        lngNum < -180 ||
        lngNum > 180
      ) {
        return NextResponse.json(
          { code: "invalid_coordinates", message: "Latitude and longitude must be valid coordinates." },
          { status: 400 }
        );
      }
    }

    // 3. Whitelist and sanitize allowed fields (stripping forbidden/injected fields)
    const sanitizedData: Record<string, unknown> = {};
    for (const key of ALLOWED_PROPERTY_KEYS) {
      if (payload[key] !== undefined) {
        sanitizedData[key] = payload[key];
      }
    }
    sanitizedData.base_price = rawBasePrice;
    sanitizedData.weekday_price =
      payload.weekday_price !== undefined ? Number(payload.weekday_price) : rawBasePrice;
    sanitizedData.weekend_price =
      payload.weekend_price !== undefined ? Number(payload.weekend_price) : sanitizedData.weekday_price;
    if (!sanitizedData.checkin_time) sanitizedData.checkin_time = "16:00";
    if (!sanitizedData.checkout_time) sanitizedData.checkout_time = "12:00";

    // 4. Force authenticated ownership, persist location extras safely, and force initial review state
    const rawPropertyToInsert = {
      ...sanitizedData,
      host_id: authUser.id,
      is_approved: false,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const propertyToInsert = extractExtendedLocationToExternalMeta(rawPropertyToInsert);

    let { data, error } = await supabase
      .from("properties")
      .insert(propertyToInsert)
      .select("id, slug, title, status, is_approved")
      .single();

    if (
      error &&
      (isMissingBilingualColumnError(error) ||
        /bathrooms_count|custom_day_pricing/i.test(error.message || ""))
    ) {
      const fallbackRow = stripBilingualColumnsWithFallback(rawPropertyToInsert);
      delete fallbackRow.bathrooms_count;
      delete fallbackRow.custom_day_pricing;
      const retry = await supabase
        .from("properties")
        .insert(fallbackRow)
        .select("id, slug, title, status, is_approved")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Property creation error in Supabase:", error);
      return NextResponse.json({ code: "property_insert_failed", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, property: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

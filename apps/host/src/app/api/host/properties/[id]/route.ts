import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractBilingualPropertyFields,
  extractExtendedLocationToExternalMeta,
  isMissingBilingualColumnError,
  parseExternalHostMeta,
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const propertyId = params.id;
  if (!propertyId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    const { data: prop, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (error || !prop) {
      return NextResponse.json(
        { code: "property_not_found", message: error?.message || "Property not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (prop.host_id && prop.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to view this property." },
        { status: 403 }
      );
    }

    const enrichedProp = extractBilingualPropertyFields(prop as Record<string, unknown>);
    const meta = parseExternalHostMeta(enrichedProp.external_host_id);
    const admin_feedback = (prop.admin_feedback as string) || meta.admin_feedback;
    const rejection_reason = (prop.rejection_reason as string) || meta.rejection_reason;
    const reviewed_at = (prop.reviewed_at as string) || meta.reviewed_at;

    return NextResponse.json({
      property: {
        ...enrichedProp,
        admin_feedback,
        rejection_reason,
        reviewed_at,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const propertyId = params.id;
  if (!propertyId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    // 1. Verify property exists and belongs to host
    const { data: existing, error: checkError } = await supabase
      .from("properties")
      .select("id, host_id, status, external_host_id")
      .eq("id", propertyId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ code: "property_not_found" }, { status: 404 });
    }

    if (existing.host_id && existing.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to edit this property." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ code: "invalid_payload" }, { status: 400 });
    }
    if (
      !body.tourism_license_number ||
      typeof body.tourism_license_number !== "string" ||
      !body.tourism_license_number.trim()
    ) {
      return NextResponse.json(
        {
          code: "missing_tourism_license",
          message: "Ministry of Tourism license number is required.",
        },
        { status: 400 }
      );
    }

    // 2. Prepare updated fields with sanitization
    const fallbackTitle = (body.title || body.title_ar || "").trim();
    const fallbackDesc = (body.description || body.description_ar || "").trim();
    const fallbackDistrict = (body.district || body.district_ar || "").trim();
    const updatePayload: Record<string, any> = {
      title: fallbackTitle,
      title_ar: typeof body.title_ar === "string" ? body.title_ar.trim() : null,
      description: fallbackDesc,
      description_ar: typeof body.description_ar === "string" ? body.description_ar.trim() : null,
      category: body.category,
      category_name: body.category_name || body.category,
      city: body.city,
      city_name: body.city_name || body.city,
      state: typeof body.state === "string" ? body.state.trim() : null,
      state_ar: typeof body.state_ar === "string" ? body.state_ar.trim() : null,
      district: fallbackDistrict,
      district_ar: typeof body.district_ar === "string" ? body.district_ar.trim() : null,
      address: typeof body.address === "string" ? body.address.trim() : null,
      address_ar: typeof body.address_ar === "string" ? body.address_ar.trim() : null,
      street: typeof body.street === "string" ? body.street.trim() : null,
      street_ar: typeof body.street_ar === "string" ? body.street_ar.trim() : null,
      postal_code: typeof body.postal_code === "string" ? body.postal_code.trim() : null,
      google_maps_url: typeof body.google_maps_url === "string" ? body.google_maps_url.trim() : null,
      specs: body.specs,
      base_price: Number(body.base_price || body.weekday_price || 0),
      weekday_price: Number(body.weekday_price || body.base_price || 0),
      weekend_price: Number(body.weekend_price || body.weekday_price || body.base_price || 0),
      tourism_license_number: body.tourism_license_number || null,
      is_licensed: Boolean(body.tourism_license_number),
      capacity: Number(body.capacity ?? 4),
      bedrooms_count: body.bedrooms_count !== undefined && body.bedrooms_count !== null ? Number(body.bedrooms_count) : 0,
      living_rooms_count: body.living_rooms_count !== undefined && body.living_rooms_count !== null ? Number(body.living_rooms_count) : 0,
      area_sqm: body.area_sqm !== undefined && body.area_sqm !== null ? Number(body.area_sqm) : 0,
      images: Array.isArray(body.images) ? body.images : [],
      features: Array.isArray(body.features) ? body.features : [],
      has_pool: Boolean(body.has_pool),
      self_checkin: Boolean(body.self_checkin),
      // Automatically reset status back to 'pending' for Admin re-approval upon editing!
      status: "pending",
      is_approved: false,
      updated_at: new Date().toISOString(),
    };

    if (body.lat !== undefined) updatePayload.lat = body.lat;
    if (body.lng !== undefined) updatePayload.lng = body.lng;

    const preparedUpdatePayload = extractExtendedLocationToExternalMeta(updatePayload, {
      existingExternalHostId: existing.external_host_id,
      clearReview: true,
    });

    let { data: updated, error: updateError } = await supabase
      .from("properties")
      .update(preparedUpdatePayload)
      .eq("id", propertyId)
      .select("*")
      .single();

    if (updateError && isMissingBilingualColumnError(updateError)) {
      const retry = await supabase
        .from("properties")
        .update(
          stripBilingualColumnsWithFallback(updatePayload, {
            existingExternalHostId: existing.external_host_id,
            clearReview: true,
          })
        )
        .eq("id", propertyId)
        .select("*")
        .single();
      updated = retry.data;
      updateError = retry.error;
    }

    if (updateError) {
      return NextResponse.json(
        { code: "property_update_failed", message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      property: updated ? extractBilingualPropertyFields(updated as Record<string, unknown>) : updated,
    });
  } catch (err) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const propertyId = params.id;
  if (!propertyId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    const { data: existing, error: checkError } = await supabase
      .from("properties")
      .select("id, host_id, title")
      .eq("id", propertyId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ code: "property_not_found", message: "Property not found." }, { status: 404 });
    }

    if (existing.host_id && existing.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to delete this property." },
        { status: 403 }
      );
    }

    // Prevent accidental deletion if active upcoming confirmed/held stays exist
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: activeBookings, error: bookingsCheckError } = await supabase
      .from("bookings")
      .select("id, status, payment_status, auth_subject, check_out")
      .eq("property_id", propertyId)
      .in("status", ["confirmed", "pending"])
      .gte("check_out", todayIso);

    if (bookingsCheckError) {
      return NextResponse.json(
        { code: "bookings_check_failed", message: bookingsCheckError.message },
        { status: 500 }
      );
    }

    const blockingBookings = (activeBookings || []).filter(
      (b) =>
        !(
          b.status === "pending" &&
          b.payment_status === "initiated" &&
          !String(b.auth_subject || "").includes("SADAD_HOLD")
        )
    );

    if (blockingBookings.length > 0) {
      return NextResponse.json(
        {
          code: "active_bookings_exist",
          message:
            "Cannot delete this property while it has active upcoming or confirmed guest bookings.",
          message_ar:
            "لا يمكن حذف هذا العقار لوجود حجوزات قائمة أو مؤكدة قادمة عليه.",
        },
        { status: 409 }
      );
    }

    let deleteQuery = supabase.from("properties").delete().eq("id", propertyId);
    if (existing.host_id) {
      deleteQuery = deleteQuery.eq("host_id", existing.host_id);
    }
    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return NextResponse.json(
        { code: "property_delete_failed", message: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedId: propertyId });
  } catch (err) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

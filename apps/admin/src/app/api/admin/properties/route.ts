import { NextRequest, NextResponse } from "next/server";
import {
  extractBilingualPropertyFields,
  isMissingBilingualColumnError,
  parseExternalHostMeta,
  serializeExternalHostMeta,
  stripBilingualFromSelect,
} from "@qafnest/shared";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import { readPropertyDeletionRequests } from "@qafnest/shared/propertyDeletionStore";
import { enrichDeletionRequestsWithLiveBookings } from "@/lib/propertyDeletionServer";

const ADMIN_PROPERTY_SELECT =
  "id, title, title_ar, slug, city, city_name, district, district_ar, category, category_name, base_price, weekday_price, weekend_price, tourism_license_number, host_id, is_approved, status, created_at, updated_at, description, description_ar, specs, images, features, area_sqm, bedrooms_count, living_rooms_count, lat, lng, external_host_id, address, address_ar, street, street_ar, postal_code";

interface HostMetaFallback {
  full_name?: string;
  business_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  is_verified?: boolean;
}

function formatAdminPropertyRow(row: Record<string, unknown>, profile?: HostMetaFallback | null) {
  const enriched = extractBilingualPropertyFields(row);
  const { admin_feedback, rejection_reason, reviewed_at, reviewed_by } = parseExternalHostMeta(
    enriched.external_host_id
  );
  const hostName = (enriched.host_name as string) || profile?.full_name || "";
  const hostPhone = (enriched.host_phone as string) || profile?.phone || "";
  const hostEmail = (enriched.host_email as string) || profile?.email || "";

  return {
    ...enriched,
    host_name: hostName,
    host_business_name: profile?.business_name || "",
    host_phone: hostPhone,
    host_email: hostEmail,
    host_city: profile?.city || (enriched.city_name as string) || (enriched.city as string) || "",
    host_address: profile?.address || (enriched.address as string) || (enriched.district as string) || "",
    host_verified: Boolean(profile?.is_verified || enriched.is_approved || enriched.tourism_license_number),
    admin_feedback,
    rejection_reason,
    reviewed_at,
    reviewed_by,
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  const searchId = request.nextUrl.searchParams.get("id");

  // Single property query
  if (searchId) {
    const initialSingle = await supabase
      .from("properties")
      .select(ADMIN_PROPERTY_SELECT)
      .or(`id.eq.${searchId},slug.eq.${searchId}`)
      .single();

    let p = initialSingle.data as Record<string, unknown> | null;
    let error = initialSingle.error;

    if (error && isMissingBilingualColumnError(error)) {
      const retrySingle = await supabase
        .from("properties")
        .select(stripBilingualFromSelect(ADMIN_PROPERTY_SELECT))
        .or(`id.eq.${searchId},slug.eq.${searchId}`)
        .single();
      p = retrySingle.data as Record<string, unknown> | null;
      error = retrySingle.error;
    }

    if (error || !p) {
      return NextResponse.json({ code: "property_not_found" }, { status: 404 });
    }

    const rec = p;
    let profile: { full_name?: string; phone?: string } | null = null;
    if (typeof rec.host_id === "string" && rec.host_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", rec.host_id)
        .maybeSingle();
      if (prof) profile = prof;
    }
    return NextResponse.json({
      property: formatAdminPropertyRow(rec, profile),
    });
  }

  // Properties list query
  const initialList = await supabase
    .from("properties")
    .select(ADMIN_PROPERTY_SELECT)
    .order("created_at", { ascending: false })
    .limit(250);

  let data = initialList.data as unknown as Array<Record<string, unknown>> | null;
  let error = initialList.error;

  if (error && isMissingBilingualColumnError(error)) {
    const retryList = await supabase
      .from("properties")
      .select(stripBilingualFromSelect(ADMIN_PROPERTY_SELECT))
      .order("created_at", { ascending: false })
      .limit(250);
    data = retryList.data as unknown as Array<Record<string, unknown>> | null;
    error = retryList.error;
  }

  if (error) {
    return NextResponse.json({ code: "properties_read_failed", message: error.message }, { status: 500 });
  }

  const rows = data || [];
  const hostIds = Array.from(
    new Set(
      rows
        .map((r) => (typeof r.host_id === "string" ? r.host_id : ""))
        .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    )
  );

  const profileMap = new Map<string, HostMetaFallback>();
  if (hostIds.length > 0) {
    try {
      const [{ data: profs }, authRes] = await Promise.all([
        supabase.from("profiles").select("*").in("id", hostIds),
        supabase.auth.admin.listUsers({ page: 1, perPage: 500 }).catch(() => ({ data: { users: [] } })),
      ]);

      const authById = new Map<string, Record<string, any>>();
      for (const u of (authRes as { data?: { users?: Array<Record<string, any>> } })?.data?.users || []) {
        authById.set(String(u.id), u);
      }

      const profById = new Map<string, Record<string, any>>();
      for (const prof of (profs || []) as Array<Record<string, any>>) {
        if (prof?.id) profById.set(String(prof.id), prof);
      }

      for (const hid of hostIds) {
        const prof = profById.get(hid);
        const authU = authById.get(hid);
        const meta = (authU?.user_metadata || {}) as Record<string, unknown>;
        profileMap.set(hid, {
          full_name: String(prof?.full_name || meta.full_name || meta.name || "").trim() || undefined,
          business_name: String(prof?.business_name || meta.business_name || meta.company || "").trim() || undefined,
          phone: String(prof?.phone || authU?.phone || meta.phone || "").trim() || undefined,
          email: String(prof?.email || authU?.email || meta.contact_email || "").trim() || undefined,
          city: String(prof?.city || meta.city || "").trim() || undefined,
          address: String(prof?.address || meta.address || "").trim() || undefined,
          is_verified: Boolean(
            prof?.is_verified ||
              prof?.nafath_verified_at ||
              meta.is_verified ||
              authU?.email_confirmed_at ||
              authU?.phone_confirmed_at
          ),
        });
      }
    } catch {}
  }

  const deletionRequests = await enrichDeletionRequestsWithLiveBookings(
    supabase,
    readPropertyDeletionRequests()
  );
  const pendingDeletionMap = new Map(
    deletionRequests
      .filter((req) => req.status === "pending")
      .map((req) => [req.propertyId, req])
  );

  const properties = rows.map((p) => {
    const profile = typeof p.host_id === "string" ? profileMap.get(p.host_id) || null : null;
    const formatted = formatAdminPropertyRow(p, profile);
    return {
      ...formatted,
      pending_deletion_request:
        pendingDeletionMap.get(String(p.id || "")) || null,
    };
  });

  return NextResponse.json({ properties, deletionRequests });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  let body: {
    id?: string;
    ids?: string[];
    status?: "approved" | "rejected" | "pending";
    rejection_reason?: string;
    admin_feedback?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  // 1. Bulk Update Handler
  if (
    Array.isArray(body.ids) &&
    body.ids.length > 0 &&
    body.status &&
    ["approved", "rejected", "pending"].includes(body.status)
  ) {
    const isApproved = body.status === "approved";
    const feedbackText = (body.admin_feedback || body.rejection_reason || "").trim();
    const { data: existingRows } = await supabase
      .from("properties")
      .select("id, external_host_id")
      .in("id", body.ids);

    const reviewPayload = isApproved
      ? null
      : body.status === "rejected"
        ? {
            admin_feedback: feedbackText || "Suspended by administration",
            rejection_reason: feedbackText || "Suspended by administration",
            reviewed_at: new Date().toISOString(),
            reviewed_by: "QafNest Operations",
          }
        : undefined;

    const nowIso = new Date().toISOString();
    let updatedList: Array<Record<string, unknown>> = [];

    if (reviewPayload !== undefined) {
      const results = await Promise.all(
        (existingRows || body.ids.map((id) => ({ id, external_host_id: null }))).map(
          async (row: { id: string; external_host_id?: unknown }) => {
            const { data: item, error: itemError } = await supabase
              .from("properties")
              .update({
                is_approved: isApproved,
                status: body.status,
                updated_at: nowIso,
                external_host_id: serializeExternalHostMeta({
                  baseRaw: row.external_host_id,
                  review: reviewPayload,
                }),
              })
              .eq("id", row.id)
              .select("id, status, is_approved, external_host_id")
              .single();
            if (itemError) throw itemError;
            return item as Record<string, unknown>;
          }
        )
      ).catch((err) => {
        return { error: err };
      });

      if (!Array.isArray(results)) {
        const message = results.error instanceof Error ? results.error.message : "Bulk update failed";
        return NextResponse.json(
          { code: "bulk_property_update_failed", message },
          { status: 500 }
        );
      }
      updatedList = results;
    } else {
      const { data: pendingList, error: bulkError } = await supabase
        .from("properties")
        .update({
          is_approved: isApproved,
          status: body.status,
          updated_at: nowIso,
        })
        .in("id", body.ids)
        .select("id, status, is_approved, external_host_id");

      if (bulkError) {
        return NextResponse.json(
          { code: "bulk_property_update_failed", message: bulkError.message },
          { status: 500 }
        );
      }
      updatedList = (pendingList || []) as Array<Record<string, unknown>>;
    }

    const formattedList = updatedList.map((p: Record<string, unknown>) => {
      const { admin_feedback, rejection_reason, reviewed_at, reviewed_by } = parseExternalHostMeta(
        p.external_host_id
      );
      return {
        ...p,
        admin_feedback,
        rejection_reason,
        reviewed_at,
        reviewed_by,
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedList.length,
      properties: formattedList,
    });
  }

  // 2. Single Property Update Handler
  if (!body.id || !body.status || !["approved", "rejected", "pending"].includes(body.status)) {
    return NextResponse.json({ code: "invalid_property_status" }, { status: 400 });
  }

  const feedbackText = (body.admin_feedback || body.rejection_reason || "").trim();
  const { data: existingSingle } = await supabase
    .from("properties")
    .select("id, external_host_id")
    .eq("id", body.id)
    .maybeSingle();

  const updatePayload: Record<string, unknown> = {
    is_approved: body.status === "approved",
    status: body.status,
    updated_at: new Date().toISOString(),
  };

  if (body.status === "rejected") {
    const reason = feedbackText || "Revisions required by compliance team";
    updatePayload.external_host_id = serializeExternalHostMeta({
      baseRaw: existingSingle?.external_host_id,
      review: {
        admin_feedback: reason,
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: "QafNest Operations",
      },
    });
  } else if (body.status === "approved") {
    updatePayload.external_host_id = serializeExternalHostMeta({
      baseRaw: existingSingle?.external_host_id,
      review: null,
    });
  }

  const { data, error } = await supabase
    .from("properties")
    .update(updatePayload)
    .eq("id", body.id)
    .select("id, status, is_approved, external_host_id")
    .single();

  if (error) {
    return NextResponse.json(
      { code: "property_status_update_failed", message: error.message },
      { status: 500 }
    );
  }

  const { admin_feedback, rejection_reason, reviewed_at, reviewed_by } = parseExternalHostMeta(
    data?.external_host_id
  );

  return NextResponse.json({
    property: {
      ...data,
      admin_feedback: admin_feedback || feedbackText,
      rejection_reason: rejection_reason || feedbackText,
      reviewed_at: reviewed_at || new Date().toISOString(),
      reviewed_by,
    },
  });
}

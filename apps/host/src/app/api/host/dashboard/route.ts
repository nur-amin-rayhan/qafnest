import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractBilingualPropertyFields,
  getNumericUnitCode,
  isMissingBilingualColumnError,
  parseExternalHostMeta,
  stripBilingualFromSelect,
} from "@qafnest/shared";
import {
  getLatestDeletionRequestForProperty,
  hydratePropertyDeletionStore,
  readPropertyDeletionRequests,
  toDeletionRequestSummary,
} from "@qafnest/shared/propertyDeletionStore";
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
  // 1. Enforce authenticated host session or cryptographically verified token
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  // 2. Prevent BOLA/IDOR: Validate hostId if specified by query parameter
  const requestedHostId = request.nextUrl.searchParams.get("hostId");
  if (requestedHostId && requestedHostId !== authUser.id) {
    return NextResponse.json(
      { code: "forbidden", message: "You are not authorized to view this host's dashboard." },
      { status: 403 }
    );
  }

  const effectiveHostId = authUser.id;

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    const dashboardPropSelect =
      "id, title, title_ar, city, city_name, district, district_ar, address, address_ar, category, category_name, base_price, is_approved, status, created_at, images, external_host_id";

    // 3. Fetch properties and notifications concurrently to eliminate DB waterfall
    const [initialPropResult, notifResult] = await Promise.all([
      supabase
        .from("properties")
        .select(dashboardPropSelect)
        .eq("host_id", effectiveHostId)
        .order("created_at", { ascending: false }),
      supabase
        .from("host_notifications")
        .select("id, host_id, property_id, booking_id, event_type, title, body, is_read, created_at")
        .eq("host_id", effectiveHostId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    let propData = initialPropResult.data as unknown[] | null;
    let propError = initialPropResult.error;

    if (propError && isMissingBilingualColumnError(propError)) {
      const retry = await supabase
        .from("properties")
        .select(stripBilingualFromSelect(dashboardPropSelect))
        .eq("host_id", effectiveHostId)
        .order("created_at", { ascending: false });
      propData = retry.data as unknown[] | null;
      propError = retry.error;
    }

    if (propError) {
      return NextResponse.json({ code: "properties_query_failed", message: propError.message }, { status: 500 });
    }

    const hostProperties: Array<Record<string, unknown> & { id: string; title?: string }> = (
      propData || []
    ).map((raw) => {
      const p = extractBilingualPropertyFields(raw as Record<string, unknown>) as Record<
        string,
        unknown
      >;
      const { admin_feedback, rejection_reason, reviewed_at } = parseExternalHostMeta(
        p.external_host_id
      );

      const latestDeletion = getLatestDeletionRequestForProperty(String(p.id));

      return {
        ...p,
        id: String(p.id),
        unit_code: getNumericUnitCode(String(p.id)),
        title: typeof p.title === "string" ? p.title : "",
        address: p.address || p.district || p.city_name || p.city || "",
        admin_feedback,
        rejection_reason,
        reviewed_at,
        deletion_request: toDeletionRequestSummary(latestDeletion),
      };
    });
    const propertyIds = hostProperties.map((p: { id: string }) => p.id);

    // 4. Fetch bookings and reviews strictly for this host's verified properties
    let bookings: Array<Record<string, unknown>> = [];
    let reviews: Array<Record<string, unknown>> = [];
    let reviewStats = { averageRating: 0, totalCount: 0 };

    if (propertyIds.length > 0) {
      const propTitleMap = new Map<string, string>();
      for (const p of hostProperties) {
        propTitleMap.set(p.id, p.title || "");
      }

      const [bookingRes, reviewRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, booking_reference, property_id, guest_id, auth_subject, check_in, check_out, total_nights, guests_count, total_price, status, payment_status, smart_lock_pin, created_at")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("reviews")
          .select("id, property_id, guest_display_name, rating, comment, comment_ar, created_at")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (!bookingRes.error && bookingRes.data) {
        const rawFiltered = bookingRes.data.filter(
          (b) => !(b.status === "pending" && b.payment_status === "initiated")
        );
        const guestIds = Array.from(new Set(rawFiltered.map((b) => b.guest_id).filter(Boolean)));
        const profileMap = new Map<string, string>();
        if (guestIds.length > 0) {
          try {
            const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", guestIds);
            if (profs) profs.forEach((p) => profileMap.set(p.id, p.full_name || ""));
          } catch {}
        }

        bookings = rawFiltered.map((b) => ({
          ...b,
          propertyTitle: propTitleMap.get(b.property_id) || "",
          guestName: (b.guest_id ? profileMap.get(b.guest_id) : "") || "",
        }));
      }

      if (!reviewRes.error && reviewRes.data) {
        reviews = reviewRes.data.map((r) => ({
          ...r,
          propertyTitle: propTitleMap.get(r.property_id) || "",
        }));
        const totalCount = reviews.length;
        const averageRating =
          totalCount > 0
            ? Number(
                (
                  reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalCount
                ).toFixed(2)
              )
            : 0;
        reviewStats = { averageRating, totalCount };
      }
    }

    await hydratePropertyDeletionStore();
    const deletionNotifications: Array<Record<string, unknown>> = readPropertyDeletionRequests()
      .filter((r) => r.hostId === effectiveHostId && r.status !== "cancelled")
      .slice(0, 10)
      .map((r) => ({
        id: `del-notif-${r.id}-${r.status}`,
        host_id: effectiveHostId,
        property_id: r.propertyId,
        booking_id: null,
        event_type:
          r.status === "approved"
            ? "property_deletion_approved"
            : r.status === "rejected"
              ? "property_deletion_rejected"
              : "property_deletion_pending",
        title:
          r.status === "approved"
            ? `Property Removed: ${r.propertyTitle}`
            : r.status === "rejected"
              ? `Deletion Request Declined: ${r.propertyTitle}`
              : `Deletion Under Review: ${r.propertyTitle}`,
        body:
          r.status === "approved"
            ? `Admin approved removal (${r.reasonLabelEn}) and automatically deleted the listing.`
            : r.status === "rejected"
              ? `Admin declined removal: ${r.adminNotes || "Please contact support for details."}`
              : `Submitted reason: ${r.reasonLabelEn} — awaiting admin approval.`,
        is_read: false,
        created_at: r.reviewedAt || r.requestedAt,
      }));

    const notifications: Array<Record<string, unknown>> = [
      ...deletionNotifications,
      ...(notifResult.data || []),
    ];

    return NextResponse.json({
      success: true,
      hostId: effectiveHostId,
      properties: hostProperties,
      bookings,
      reviews,
      reviewStats,
      notifications,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // 1. Enforce authenticated host session or cryptographically verified token
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

  try {
    const body = (await request.json()) as { notificationId?: string; markAllRead?: boolean; hostId?: string };

    // Prevent modifying notifications belonging to another host
    if (body.hostId && body.hostId !== effectiveHostId) {
      return NextResponse.json(
        { code: "forbidden", message: "You cannot modify notifications for another host." },
        { status: 403 }
      );
    }

    if (body.notificationId) {
      await supabase
        .from("host_notifications")
        .update({ is_read: true })
        .eq("id", body.notificationId)
        .eq("host_id", effectiveHostId);
      return NextResponse.json({ success: true });
    }

    if (body.markAllRead) {
      await supabase
        .from("host_notifications")
        .update({ is_read: true })
        .eq("host_id", effectiveHostId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

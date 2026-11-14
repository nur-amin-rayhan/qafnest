import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import {
  getHostPayoutPolicy,
  summarizePayoutReminders,
  syncConfirmedBookingsToPayouts,
  computePayoutSlaMetrics,
} from "@qafnest/shared/hostPayoutStore";
import { getBookingRefundRecord } from "@qafnest/shared/bookingRefundStore";
import { getTransferClaim } from "@qafnest/shared/helplineVerificationStore";
import { getServerPlatformFeeConfig } from "@qafnest/shared/platformFeeStore";
import { resolveBookingSettlement } from "@qafnest/shared/bookingFinancialsStore";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  try {
    const [propertiesRes, bookingsRes] = await Promise.all([
      supabase
        .from("properties")
        .select("id, status, is_approved, base_price, category, title, city, city_name, district, images, host_id"),
      supabase
        .from("bookings")
        .select("id, booking_reference, total_price, total_nights, status, payment_status, check_in, check_out, guests_count, property_id, created_at, guest_id, auth_subject")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (propertiesRes.error) {
      throw new Error(`properties query failed: ${propertiesRes.error.message}`);
    }
    if (bookingsRes.error) {
      throw new Error(`bookings query failed: ${bookingsRes.error.message}`);
    }

    const rawProperties = propertiesRes.data || [];
    const rawBookings = bookingsRes.data || [];

    const profileIds = Array.from(
      new Set([
        ...rawProperties.map((p: any) => p.host_id).filter(Boolean),
        ...rawBookings.map((b: any) => b.guest_id).filter(Boolean),
      ])
    ) as string[];
    const profileMap = new Map<string, { full_name?: string; phone?: string }>();
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", profileIds);
      for (const prof of profiles || []) {
        profileMap.set(prof.id, prof);
      }
    }

    const properties = rawProperties.map((p: any) => {
      const hostProf = p.host_id ? profileMap.get(p.host_id) : undefined;
      return {
        ...p,
        host_name: hostProf?.full_name || "",
        host_phone: hostProf?.phone || "",
      };
    });

    const propMap = new Map(properties.map((p) => [p.id, p]));

    const bookings = rawBookings.map((b: any) => {
      const prop = propMap.get(b.property_id);
      const guestProf = b.guest_id ? profileMap.get(b.guest_id) : undefined;
      const subjectParts = String(b.auth_subject || "").split(" | ").map((s) => s.trim());
      const parsedName = subjectParts[0] || "";
      const parsedPhone = subjectParts[1] || "";
      return {
        ...b,
        guest_name: guestProf?.full_name || parsedName || "",
        guest_phone: guestProf?.phone || parsedPhone || "",
        property_title: prop?.title || "",
        property_city: prop?.city || "",
        property_district: prop?.district || "",
      };
    });

    const activeListings = properties.filter((p) => p.is_approved).length;
    const pendingVerification = properties.filter((p) => !p.is_approved || p.status === "pending").length;

    const feeConfig = getServerPlatformFeeConfig();
    const visibleBookings = bookings
      .filter(
        (b) =>
          !(
            b.status === "pending" &&
            b.payment_status === "initiated" &&
            !String(b.auth_subject || "").includes("SADAD_HOLD")
          )
      )
      .map((b) => {
        const prop = propMap.get(b.property_id);
        const startMs = b.check_in ? Date.parse(String(b.check_in)) : NaN;
        const endMs = b.check_out ? Date.parse(String(b.check_out)) : NaN;
        const nightsFallback =
          Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
            ? Math.max(1, Math.round((endMs - startMs) / 86_400_000))
            : 1;
        const totalPaid = Number(b.total_price || 0);
        const settlement =
          totalPaid > 0
            ? resolveBookingSettlement({
                bookingId: String(b.id),
                bookingReference: b.booking_reference ? String(b.booking_reference) : undefined,
                totalPricePaid: totalPaid,
                nights: Number(b.total_nights) || nightsFallback,
                nightlyPrice: prop?.base_price !== undefined ? Number(prop.base_price) : undefined,
                category: prop?.category ? String(prop.category) : undefined,
                feeConfig,
              })
            : null;
        return {
          ...b,
          refund: getBookingRefundRecord(b.booking_reference),
          transferClaim: getTransferClaim(b.booking_reference),
          settlement,
        };
      });
    const confirmedBookings = bookings.filter(
      (b) =>
        (b.status === "confirmed" || b.status === "completed") &&
        (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid")
    );
    const grossRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

    const syncedPayouts = syncConfirmedBookingsToPayouts(
      confirmedBookings.map((b) => ({
        ...b,
        property: propMap.get(b.property_id) || null,
      }))
    );
    const policy = getHostPayoutPolicy();
    const payoutReminders = summarizePayoutReminders(syncedPayouts, Date.now(), policy);
    const urgentPayoutQueue = syncedPayouts
      .filter((p) => p.status === "pending" || p.status === "processing")
      .sort((a, b) => Date.parse(a.slaDeadlineAt) - Date.parse(b.slaDeadlineAt))
      .slice(0, 5)
      .map((p) => ({
        ...p,
        sla: computePayoutSlaMetrics(p, Date.now(), policy.reminderLeadHours),
      }));

    const confirmedNights = confirmedBookings.reduce(
      (sum, b) => sum + Math.max(1, Number((b as Record<string, unknown>).total_nights || 1)),
      0
    );
    const avgOccupancy =
      activeListings > 0 && confirmedNights > 0
        ? Math.min(100, Math.round((confirmedNights / (activeListings * 30)) * 1000) / 10)
        : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        grossRevenue,
        totalBookings: confirmedBookings.length,
        activeListings,
        avgOccupancy,
        pendingVerification,
        pendingPayoutsCount: payoutReminders.dueWithin24hCount,
        overduePayoutsCount: payoutReminders.overdueCount,
      },
      payoutReminders,
      urgentPayoutQueue,
      bookings: visibleBookings,
      recentBookings: visibleBookings,
      properties,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

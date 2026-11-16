import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { verifyHostSession } from "@/lib/auth/serverAuth";
import {
  extractBilingualPropertyFields,
  formatPropertyAddressLine,
  isMissingBilingualColumnError,
  resolvePropertyGoogleMapsUrl,
  stripBilingualFromSelect,
} from "@qafnest/shared";
import { getServerPlatformFeeConfig } from "@qafnest/shared/platformFeeStore";
import { resolveBookingSettlement } from "@qafnest/shared/bookingFinancialsStore";

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: NextRequest) {
  // 1. Authenticate host session (strictly verified session/token)
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

  const { searchParams } = request.nextUrl;
  const filterPropertyId = searchParams.get("propertyId") || "all";
  const filterStatus = searchParams.get("status") || "all"; // 'all', 'confirmed', 'pending', 'cancelled'
  const filterTimeframe = searchParams.get("timeframe") || "all"; // 'all', 'today', 'upcoming', 'past'
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();

  try {
    // 2. Fetch properties owned by authenticated host (with bilingual/location fallback)
    const fullPropSelect =
      "id, title, title_ar, city, city_name, state, state_ar, district, district_ar, street, street_ar, address, address_ar, postal_code, google_maps_url, category, category_name, images, base_price, lat, lng, external_host_id";

    const runPropSelect = async (selectCols: string) => {
      let q = supabase
        .from("properties")
        .select(selectCols)
        .eq("host_id", effectiveHostId);
      if (filterPropertyId !== "all") {
        q = q.eq("id", filterPropertyId);
      }
      return q;
    };

    let { data: properties, error: propErr } = await runPropSelect(fullPropSelect);
    if (propErr && isMissingBilingualColumnError(propErr)) {
      const fallbackResult = await runPropSelect(stripBilingualFromSelect(fullPropSelect));
      properties = fallbackResult.data;
      propErr = fallbackResult.error;
    }

    if (propErr) {
      return NextResponse.json({ code: "db_error", message: propErr.message }, { status: 500 });
    }

    type HostPropertyRow = Record<string, unknown> & {
      id: string;
      title?: string;
      city?: string;
      city_name?: string;
      district?: string;
      category?: string;
      category_name?: string;
      images?: Array<string | { url?: string }>;
      base_price?: number;
      lat?: number | null;
      lng?: number | null;
    };

    const hostProperties = (properties || []) as unknown as HostPropertyRow[];
    const propertyIds = hostProperties.map((p) => p.id);
    const propertyMap = new Map<string, HostPropertyRow>(hostProperties.map((p) => [p.id, p]));

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        hostId: effectiveHostId,
        bookings: [],
        summary: {
          total: 0,
          upcoming: 0,
          checkedInToday: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
          totalRevenueSAR: 0,
        },
      });
    }

    // 3. Auto-expire stale initiated checkout sessions older than 15 minutes
    const cutoffDate = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    try {
      await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .in("property_id", propertyIds)
        .eq("status", "pending")
        .eq("payment_status", "initiated")
        .neq("status", "confirmed")
        .neq("payment_status", "success")
        .lt("created_at", cutoffDate);
    } catch {}

    // 3b. Fetch bookings for this host's properties
    const { data: bookingData, error: bookErr } = await supabase
      .from("bookings")
      .select("id, booking_reference, property_id, guest_id, auth_subject, check_in, check_out, checkin_time, checkout_time, total_nights, guests_count, total_price, promo_discount, coupon_discount, status, payment_status, payment_id, payment_method, smart_lock_pin, created_at, updated_at")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    if (bookErr) {
      return NextResponse.json({ code: "db_error", message: bookErr.message }, { status: 500 });
    }

    // Exclude unverified in-flight gateway checkouts so hosts never see abandoned sessions as pending approvals
    const rawList = (bookingData || []).filter(
      (b) => !(b.status === "pending" && b.payment_status === "initiated")
    );
    const guestIds = Array.from(new Set(rawList.map((b) => b.guest_id).filter(Boolean)));
    const profileMap = new Map<string, { full_name?: string; phone?: string; is_verified?: boolean; national_id?: string; iqama?: string }>();
    if (guestIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone, national_id, avatar_url")
          .in("id", guestIds);
        if (profiles) {
          for (const p of profiles) {
            profileMap.set(p.id, p);
          }
        }
      } catch (profErr) {
        console.warn("Notice: Failed to batch fetch guest profiles:", profErr);
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const feeCfg = getServerPlatformFeeConfig();
    const commRatePct = feeCfg.baseCommissionPercent;
    const vatRatePct = feeCfg.vatRatePercent;

    let allBookings = rawList.map((b) => {
      const prop = propertyMap.get(b.property_id);
      let img = "";
      if (prop && Array.isArray(prop.images) && prop.images.length > 0) {
        img = typeof prop.images[0] === "string" ? prop.images[0] : prop.images[0]?.url || "";
      }

      // Guest Display Info & Verification Auto-population
      const profile = b.guest_id ? profileMap.get(b.guest_id) : null;
      let guestName = profile?.full_name?.trim() || "Guest";
      let guestPhone = profile?.phone?.trim() || "";
      let isGuestVerified = Boolean(profile?.is_verified || profile?.national_id || profile?.iqama);

      if (!guestPhone && b.auth_subject) {
        if (b.auth_subject.startsWith("guest_phone_")) {
          const raw = b.auth_subject.replace("guest_phone_", "");
          guestPhone = `+${raw}`;
          if (guestName === "Guest") {
            guestName = `Guest (${raw.slice(-4)})`;
          }
          isGuestVerified = true;
        } else if (b.auth_subject.startsWith("+966") || /^\d{10,14}$/.test(b.auth_subject)) {
          guestPhone = b.auth_subject.startsWith("+") ? b.auth_subject : `+${b.auth_subject}`;
          if (guestName === "Guest") {
            guestName = `Guest (${guestPhone.slice(-4)})`;
          }
          isGuestVerified = true;
        } else if (guestName === "Guest") {
          guestName = b.auth_subject;
        }
      }

      // Determine stay timing status
      let stayStatus: "upcoming" | "today" | "in_house" | "past" = "upcoming";
      if (b.check_in <= todayStr && b.check_out >= todayStr) {
        stayStatus = b.check_in === todayStr ? "today" : "in_house";
      } else if (b.check_out < todayStr) {
        stayStatus = "past";
      } else {
        stayStatus = "upcoming";
      }

      const totalNum = Number(b.total_price) || 0;
      const nights =
        b.total_nights ||
        Math.max(1, Math.round((Date.parse(b.check_out) - Date.parse(b.check_in)) / 86_400_000) || 1);
      const settlement = resolveBookingSettlement({
        bookingId: b.id,
        bookingReference: b.booking_reference,
        totalPricePaid: totalNum,
        nights,
        nightlyPrice: prop?.base_price,
        category: prop?.category,
        promoDiscount: Number(
          (b as Record<string, unknown>).promo_discount ??
            (b as Record<string, unknown>).coupon_discount ??
            0
        ),
        feeConfig: feeCfg,
      });
      const commissionAmount = settlement.hostCommissionAmountSar;
      const vatAmount = settlement.governmentVatRemittanceSar;
      const netPayout = settlement.hostNetPayoutSar;

      const meta = extractBilingualPropertyFields((prop || {}) as Record<string, unknown>);
      const propLat = typeof prop?.lat === "number" ? prop.lat : prop?.lat != null ? Number(prop.lat) : null;
      const propLng = typeof prop?.lng === "number" ? prop.lng : prop?.lng != null ? Number(prop.lng) : null;
      const locationFields = {
        title: prop?.title || null,
        title_ar: meta.title_ar || null,
        city: prop?.city || null,
        city_name: prop?.city_name || prop?.city || null,
        state: meta.state || null,
        state_ar: meta.state_ar || null,
        district: prop?.district || null,
        district_ar: meta.district_ar || null,
        street: meta.street || null,
        street_ar: meta.street_ar || null,
        address: meta.address || null,
        address_ar: meta.address_ar || null,
        postal_code: meta.postal_code || null,
        lat: Number.isFinite(propLat as number) ? propLat : null,
        lng: Number.isFinite(propLng as number) ? propLng : null,
        google_maps_url: meta.google_maps_url || null,
      };

      return {
        ...b,
        listingGross: settlement.hostGrossEntitlementSar,
        commissionAmount,
        promoDiscountAmount: settlement.promoDeductionFromHostSar,
        welcomeBonusSubsidyAmount: settlement.platformWelcomeBonusSubsidySar,
        vatAmount,
        netPayout,
        commissionRatePercent: settlement.hostCommissionPercent,
        vatRatePercent: vatRatePct,
        propertyTitle: prop?.title || "Property",
        propertyTitleAr: meta.title_ar || prop?.title || "العقار",
        propertyCity: prop?.city_name || prop?.city || "Saudi Arabia",
        propertyState: meta.state || "",
        propertyStateAr: meta.state_ar || meta.state || "",
        propertyDistrict: prop?.district || "",
        propertyDistrictAr: meta.district_ar || prop?.district || "",
        propertyStreet: meta.street || "",
        propertyStreetAr: meta.street_ar || "",
        propertyPostalCode: meta.postal_code || "",
        propertyCategory: prop?.category_name || "Chalet",
        propertyImage: img,
        propertyLat: locationFields.lat,
        propertyLng: locationFields.lng,
        propertyGoogleMapsUrl: resolvePropertyGoogleMapsUrl(locationFields),
        propertyAddress: formatPropertyAddressLine(locationFields, "en"),
        propertyAddressAr: formatPropertyAddressLine(locationFields, "ar"),
        guestName,
        guestPhone,
        isGuestVerified,
        stayStatus,
      };
    });

    // 4. Calculate summary stats
    let upcomingCount = 0;
    let checkedInTodayCount = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let totalRevenueSAR = 0;

    for (const b of allBookings) {
      const isPaid =
        !b.payment_status || b.payment_status === "success" || b.payment_status === "paid";
      if ((b.status === "confirmed" || b.status === "completed") && isPaid) {
        totalRevenueSAR += Number(b.total_price) || 0;
        if (b.stayStatus === "today" || b.stayStatus === "in_house") {
          checkedInTodayCount++;
        } else if (b.stayStatus === "upcoming") {
          upcomingCount++;
        } else {
          completedCount++;
        }
      } else if (b.status === "pending" && b.payment_status !== "initiated") {
        pendingCount++;
      } else if (b.status === "cancelled") {
        cancelledCount++;
      }
    }

    // 5. Apply query filters
    if (filterStatus !== "all") {
      allBookings = allBookings.filter((b) => b.status === filterStatus);
    }

    if (filterTimeframe === "today") {
      allBookings = allBookings.filter((b) => b.stayStatus === "today" || b.stayStatus === "in_house");
    } else if (filterTimeframe === "upcoming") {
      allBookings = allBookings.filter((b) => b.stayStatus === "upcoming");
    } else if (filterTimeframe === "past") {
      allBookings = allBookings.filter((b) => b.stayStatus === "past");
    }

    if (searchQuery) {
      allBookings = allBookings.filter((b) => {
        const refMatch = b.booking_reference?.toLowerCase().includes(searchQuery);
        const nameMatch = b.guestName?.toLowerCase().includes(searchQuery);
        const phoneMatch = b.guestPhone?.toLowerCase().includes(searchQuery);
        const propMatch = b.propertyTitle?.toLowerCase().includes(searchQuery) || b.propertyTitleAr?.toLowerCase().includes(searchQuery);
        return refMatch || nameMatch || phoneMatch || propMatch;
      });
    }

    return NextResponse.json({
      success: true,
      hostId: effectiveHostId,
      bookings: allBookings,
      summary: {
        total: rawList.length,
        upcoming: upcomingCount,
        checkedInToday: checkedInTodayCount,
        pending: pendingCount,
        completed: completedCount,
        cancelled: cancelledCount,
        totalRevenueSAR,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

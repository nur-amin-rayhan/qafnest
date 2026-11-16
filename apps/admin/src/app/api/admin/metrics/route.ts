import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import {
  getHostPayoutPolicy,
  hydrateHostPayoutStore,
  summarizePayoutReminders,
  syncConfirmedBookingsToPayouts,
  computePayoutSlaMetrics,
} from "@qafnest/shared/hostPayoutStore";
import { getBookingRefundRecord, hydrateBookingRefundStore } from "@qafnest/shared/bookingRefundStore";
import { getTransferClaim, hydrateHelplineVerificationStore } from "@qafnest/shared/helplineVerificationStore";
import { getServerPlatformFeeConfig, hydratePlatformFeeConfig } from "@qafnest/shared/platformFeeStore";
import { hydrateBookingFinancialsStore, resolveBookingSettlement } from "@qafnest/shared/bookingFinancialsStore";
import {
  hydratePropertyDeletionStore,
  readPropertyDeletionRequests,
  type PropertyDeletionRequestSummary,
} from "@qafnest/shared/propertyDeletionStore";
import { enrichDeletionRequestsWithLiveBookings } from "@/lib/propertyDeletionServer";

function maskIdentityValue(val?: unknown): string {
  const clean = String(val || "").trim();
  if (!clean) return "";
  if (clean.length <= 4) return clean;
  return `${"•".repeat(Math.max(2, clean.length - 4))}${clean.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  try {
    await Promise.all([
      hydrateHostPayoutStore(),
      hydrateBookingRefundStore(),
      hydrateHelplineVerificationStore(),
      hydratePlatformFeeConfig(),
      hydrateBookingFinancialsStore(),
      hydratePropertyDeletionStore(),
    ]);

    const [propertiesRes, bookingsRes, authUsersRes] = await Promise.all([
      supabase
        .from("properties")
        .select(
          "id, slug, status, is_approved, base_price, category, title, title_ar, city, city_name, district, district_ar, address, address_ar, images, host_id, tourism_license_number, external_host_id"
        ),
      supabase
        .from("bookings")
        .select(
          "id, booking_reference, total_price, total_nights, status, payment_status, payment_method, smart_lock_pin, check_in, check_out, guests_count, property_id, created_at, guest_id, auth_subject"
        )
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase.auth.admin
        .listUsers({ page: 1, perPage: 500 })
        .catch(() => ({ data: { users: [] } })),
    ]);

    if (propertiesRes.error) {
      throw new Error(`properties query failed: ${propertiesRes.error.message}`);
    }
    if (bookingsRes.error) {
      throw new Error(`bookings query failed: ${bookingsRes.error.message}`);
    }

    const rawProperties = propertiesRes.data || [];
    const rawBookings = bookingsRes.data || [];
    const authUsers = authUsersRes?.data?.users || [];

    type ResolvedUserMeta = {
      full_name?: string;
      business_name?: string;
      phone?: string;
      email?: string;
      city?: string;
      address?: string;
      id_type?: string;
      id_masked?: string;
      is_verified?: boolean;
      verified_at?: string;
    };

    const authUserMap = new Map<string, ResolvedUserMeta>();
    const contactByPhoneSuffix = new Map<string, ResolvedUserMeta>();

    for (const u of authUsers) {
      const meta = (u.user_metadata || {}) as Record<string, unknown>;
      const fullName =
        String(meta.full_name || meta.name || meta.fullName || "").trim() || undefined;
      const businessName =
        String(meta.business_name || meta.company || "").trim() || undefined;
      const phone = String(u.phone || meta.phone || "").trim() || undefined;
      const email = String(u.email || meta.contact_email || "").trim() || undefined;
      const city = String(meta.city || "").trim() || undefined;
      const address = String(meta.address || "").trim() || undefined;
      const rawId = meta.national_id || meta.iqama;
      const idMasked = maskIdentityValue(rawId) || undefined;
      const idType = meta.iqama
        ? "iqama"
        : meta.national_id
        ? "national_id"
        : (meta.id_type as string | undefined) || undefined;
      const isVerified = Boolean(
        meta.is_verified ||
          meta.nafath_verified_at ||
          u.email_confirmed_at ||
          u.phone_confirmed_at ||
          rawId
      );
      const entry: ResolvedUserMeta = {
        full_name: fullName,
        business_name: businessName,
        phone,
        email,
        city,
        address,
        id_type: idType,
        id_masked: idMasked,
        is_verified: isVerified,
        verified_at: (meta.nafath_verified_at as string | undefined) || u.email_confirmed_at || undefined,
      };
      authUserMap.set(u.id, entry);
      if (phone) {
        const suffix = phone.replace(/\D/g, "").slice(-9);
        if (suffix.length >= 8) {
          contactByPhoneSuffix.set(suffix, entry);
        }
      }
    }

    const profileIds = Array.from(
      new Set([
        ...rawProperties.map((p: any) => p.host_id).filter(Boolean),
        ...rawBookings.map((b: any) => b.guest_id).filter(Boolean),
      ])
    ) as string[];
    const profileMap = new Map<string, ResolvedUserMeta>();
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", profileIds);
      for (const prof of (profiles || []) as Array<Record<string, any>>) {
        const rawId = prof.national_id || prof.iqama;
        const entry: ResolvedUserMeta = {
          full_name: prof.full_name || undefined,
          business_name: prof.business_name || undefined,
          phone: prof.phone || undefined,
          email: prof.email || undefined,
          city: prof.city || undefined,
          address: prof.address || undefined,
          id_type: prof.id_type || (prof.iqama ? "iqama" : prof.national_id ? "national_id" : undefined),
          id_masked: maskIdentityValue(rawId) || undefined,
          is_verified: Boolean(prof.is_verified || prof.nafath_verified_at || rawId),
          verified_at: prof.nafath_verified_at || undefined,
        };
        profileMap.set(prof.id, entry);
        if (prof.phone) {
          const suffix = String(prof.phone).replace(/\D/g, "").slice(-9);
          if (suffix.length >= 8) {
            const prev = contactByPhoneSuffix.get(suffix);
            contactByPhoneSuffix.set(suffix, {
              ...prev,
              ...entry,
              full_name: entry.full_name || prev?.full_name,
              phone: entry.phone || prev?.phone,
              email: entry.email || prev?.email,
              city: entry.city || prev?.city,
              address: entry.address || prev?.address,
              id_masked: entry.id_masked || prev?.id_masked,
              id_type: entry.id_type || prev?.id_type,
              is_verified: Boolean(entry.is_verified || prev?.is_verified),
            });
          }
        }
      }
    }

    const properties = rawProperties.map((p: any) => {
      const hostProf = p.host_id ? profileMap.get(p.host_id) : undefined;
      const hostAuth = p.host_id ? authUserMap.get(p.host_id) : undefined;
      return {
        ...p,
        host_name: hostProf?.full_name || hostAuth?.full_name || "",
        host_business_name: hostProf?.business_name || hostAuth?.business_name || "",
        host_phone: hostProf?.phone || hostAuth?.phone || "",
        host_email: hostProf?.email || hostAuth?.email || "",
        host_city: hostProf?.city || hostAuth?.city || p.city_name || p.city || "",
        host_address: hostProf?.address || hostAuth?.address || p.address || p.district || "",
        host_id_masked: hostProf?.id_masked || hostAuth?.id_masked || "",
        host_verified: Boolean(
          hostProf?.is_verified || hostAuth?.is_verified || p.is_approved || p.tourism_license_number
        ),
      };
    });

    const propMap = new Map(properties.map((p) => [p.id, p]));
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const bookings = rawBookings.map((b: any) => {
      const prop = propMap.get(b.property_id);
      const guestProf = b.guest_id ? profileMap.get(b.guest_id) : undefined;
      const guestAuth = b.guest_id ? authUserMap.get(b.guest_id) : undefined;
      const rawSubject = String(b.auth_subject || "").trim();
      const subjectParts = rawSubject.includes(" | ")
        ? rawSubject.split(" | ").map((s) => s.trim())
        : [];

      let parsedName = "";
      let parsedPhone = "";
      let parsedEmail = "";

      if (subjectParts.length > 0) {
        parsedName =
          subjectParts[0] && !subjectParts[0].includes("SADAD_HOLD") ? subjectParts[0] : "";
        for (const part of subjectParts.slice(1)) {
          if (!part || part.includes("SADAD_HOLD")) continue;
          if (!parsedEmail && part.includes("@")) {
            parsedEmail = part;
          } else if (!parsedPhone && /\d{7,}/.test(part)) {
            parsedPhone = part;
          }
        }
      } else if (rawSubject) {
        if (rawSubject.startsWith("guest_phone_")) {
          const digits = rawSubject.replace("guest_phone_", "").replace(/\D/g, "");
          if (digits) parsedPhone = `+${digits}`;
        } else if (rawSubject.startsWith("+") || /^\d{8,15}$/.test(rawSubject)) {
          parsedPhone = rawSubject.startsWith("+") ? rawSubject : `+${rawSubject}`;
        } else if (rawSubject.includes("@")) {
          parsedEmail = rawSubject;
        } else if (!uuidPattern.test(rawSubject)) {
          parsedName = rawSubject;
        }
      }

      const phoneSuffix = (guestProf?.phone || guestAuth?.phone || parsedPhone)
        .replace(/\D/g, "")
        .slice(-9);
      const phoneLookup =
        phoneSuffix.length >= 8 ? contactByPhoneSuffix.get(phoneSuffix) : undefined;

      const resolvedPhone =
        guestProf?.phone || guestAuth?.phone || parsedPhone || phoneLookup?.phone || "";
      const resolvedEmail =
        guestProf?.email || guestAuth?.email || parsedEmail || phoneLookup?.email || "";
      const resolvedName =
        guestProf?.full_name ||
        guestAuth?.full_name ||
        parsedName ||
        phoneLookup?.full_name ||
        (resolvedPhone ? `Guest (${resolvedPhone.slice(-4)})` : "") ||
        (resolvedEmail ? resolvedEmail.split("@")[0] : "");

      const rawImages = Array.isArray(prop?.images) ? prop.images : [];
      const firstImage =
        rawImages.length > 0
          ? typeof rawImages[0] === "string"
            ? rawImages[0]
            : rawImages[0]?.url || ""
          : "";

      const subjectNidMatch = rawSubject.match(/NID:([A-Za-z0-9]+)/);
      const guestCity = guestProf?.city || guestAuth?.city || phoneLookup?.city || "";
      const guestAddress = guestProf?.address || guestAuth?.address || phoneLookup?.address || "";
      const guestIdMasked =
        guestProf?.id_masked ||
        guestAuth?.id_masked ||
        phoneLookup?.id_masked ||
        (subjectNidMatch ? maskIdentityValue(subjectNidMatch[1]) : "");
      const guestVerified = Boolean(
        guestProf?.is_verified ||
          guestAuth?.is_verified ||
          phoneLookup?.is_verified ||
          subjectNidMatch ||
          rawSubject.includes("ID_VERIFIED")
      );

      return {
        ...b,
        guest_name: resolvedName,
        guest_phone: resolvedPhone,
        guest_email: resolvedEmail,
        guest_city: guestCity,
        guest_address: guestAddress,
        guest_id_masked: guestIdMasked,
        guest_verified: guestVerified,
        host_id: prop?.host_id || "",
        host_name: prop?.host_name || "",
        host_business_name: prop?.host_business_name || "",
        host_phone: prop?.host_phone || "",
        host_email: prop?.host_email || "",
        host_city: prop?.host_city || "",
        host_address: prop?.host_address || "",
        host_id_masked: prop?.host_id_masked || "",
        host_verified: Boolean(prop?.host_verified),
        property_title: prop?.title || "",
        property_city: prop?.city_name || prop?.city || "",
        property_district: prop?.district || "",
        property_address: prop?.address || prop?.district || "",
        property_license: prop?.tourism_license_number || "",
        property_image: firstImage,
        property_category: prop?.category || "",
        property_base_price: prop?.base_price ? Number(prop.base_price) : 0,
      };
    });

    const activeListings = properties.filter((p) => p.is_approved).length;
    const pendingVerification = properties.filter((p) => !p.is_approved || p.status === "pending").length;

    const feeConfig = getServerPlatformFeeConfig();
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

    const payoutByBookingKey = new Map<string, (typeof syncedPayouts)[number]>();
    for (const p of syncedPayouts) {
      if (p.bookingId) payoutByBookingKey.set(String(p.bookingId), p);
      const refWithoutPrefix = p.reference.startsWith("SARIE-")
        ? p.reference.slice(6)
        : p.reference;
      if (refWithoutPrefix) payoutByBookingKey.set(refWithoutPrefix, p);
      if (Array.isArray(p.bookings)) {
        for (const bk of p.bookings) {
          if (bk.id) payoutByBookingKey.set(String(bk.id), p);
          if (bk.reference) payoutByBookingKey.set(String(bk.reference), p);
        }
      }
    }

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
        const matchedPayout =
          payoutByBookingKey.get(String(b.id)) ||
          (b.booking_reference ? payoutByBookingKey.get(String(b.booking_reference)) : undefined);
        return {
          ...b,
          host_name: b.host_name || matchedPayout?.hostName || "",
          host_phone: b.host_phone || matchedPayout?.hostPhone || "",
          host_email: b.host_email || matchedPayout?.hostEmail || "",
          host_verified: Boolean(b.host_verified || (matchedPayout?.iban && matchedPayout.iban !== "")),
          refund: getBookingRefundRecord(b.booking_reference),
          transferClaim: getTransferClaim(b.booking_reference),
          settlement,
          payoutSummary: matchedPayout
            ? {
                id: matchedPayout.id,
                reference: matchedPayout.reference,
                status: matchedPayout.status,
                iban: matchedPayout.iban,
                bankName: matchedPayout.bankName,
                slaDeadlineAt: matchedPayout.slaDeadlineAt,
                netPayoutAmount: matchedPayout.netPayoutAmount,
                sarieTxnId: matchedPayout.sarieTxnId,
              }
            : null,
        };
      });
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

    const deletionRequests = await enrichDeletionRequestsWithLiveBookings(
      supabase,
      readPropertyDeletionRequests()
    );
    const pendingDeletionMap = new Map(
      deletionRequests
        .filter((req) => req.status === "pending")
        .map((req) => [req.propertyId, req])
    );
    const propertiesWithDeletion = properties.map((prop) => ({
      ...prop,
      pending_deletion_request:
        pendingDeletionMap.get(String(prop.id)) || null,
    }));

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
      deletionRequests,
      bookings: visibleBookings,
      recentBookings: visibleBookings,
      properties: propertiesWithDeletion,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

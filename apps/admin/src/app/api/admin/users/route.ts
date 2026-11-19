import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminDataClient, getAdminSession, isAdminRequest } from "@/lib/adminApi";
import { getSignupSecurityOverview } from "@qafnest/shared/signupSecurityStore";
import { hydrateRootJsonFile } from "@qafnest/shared/serverJsonStore";
import {
  readUserGovernanceStore,
  recordUserActivity,
  updateUserGovernanceOverride,
} from "@qafnest/shared/userActivityStore";
import {
  getServerPlatformFeeConfig,
} from "@qafnest/shared/platformFeeStore";
import { resolveBookingSettlement } from "@qafnest/shared/bookingFinancialsStore";

export interface AdminSavedCardRecord {
  id: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  cardholderName: string;
  brand: string;
  last4: string;
  maskedNumber: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  supportsDirectCharge: boolean;
  createdAt: string;
}

export const dynamic = "force-dynamic";

export interface UserActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  role: "guest" | "host" | "admin" | "system";
  category: "booking" | "payment" | "property" | "review" | "favorite" | "auth" | "security" | "governance";
  action: string;
  title: string;
  details: string;
  targetId?: string;
  targetLabel?: string;
  actor?: string;
  timestamp: string;
}

export interface ManagedGuestUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  idType: string;
  idNumberMasked: string;
  accountSource: "registered" | "helpline_guest";
  isVerified: boolean;
  emailVerified: boolean;
  nafathVerifiedAt: string | null;
  isSuspended: boolean;
  suspendedReason: string | null;
  totalBookings: number;
  confirmedBookings: number;
  pendingSadadBookings: number;
  cancelledBookings: number;
  totalSpendSar: number;
  reviewsCount: number;
  favoritesCount: number;
  lastIp: string | null;
  lastDeviceId: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  lastActivityAt: string;
  adminNote: string | null;
}

export interface ManagedHostUser {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  city: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedReason: string | null;
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  rejectedProperties: number;
  totalBookings: number;
  grossRevenueSar: number;
  netEarningsSar: number;
  reviewsReceived: number;
  repliesPosted: number;
  createdAt: string;
  lastSignInAt: string | null;
  lastActivityAt: string;
  adminNote: string | null;
  properties: Array<{
    id: string;
    title: string;
    city: string;
    status: string;
    basePrice: number;
  }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function maskNationalId(val?: string | null): string {
  const clean = String(val || "").trim();
  if (!clean) return "—";
  if (clean.length <= 4) return clean;
  return `${"•".repeat(Math.max(2, clean.length - 4))}${clean.slice(-4)}`;
}

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  await import("@qafnest/shared/userActivityStore").then((m) => m.hydrateUserGovernanceStore());
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  try {
    const [
      authUsersRes,
      profilesRes,
      propertiesRes,
      bookingsRes,
      reviewsRes,
      favoritesRes,
    ] = await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 500 }).catch(() => ({ data: { users: [] } })),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      supabase
        .from("properties")
        .select("id, slug, title, category, city, city_name, district, status, is_approved, base_price, host_id, created_at, updated_at, reviewed_at, reviewed_by")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("bookings")
        .select("id, booking_reference, guest_id, auth_subject, property_id, total_price, total_nights, status, payment_status, check_in, check_out, guests_count, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("reviews")
        .select("id, property_id, guest_id, guest_subject, guest_display_name, rating, title, created_at, host_reply, host_reply_at")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("favorites")
        .select("id, guest_id, property_id, created_at")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    const authUsers = ((authUsersRes as { data?: { users?: Array<Record<string, any>> } })?.data?.users || []) as Array<Record<string, any>>;
    const profiles = (profilesRes.data || []) as Array<Record<string, any>>;
    const properties = (propertiesRes.data || []) as Array<Record<string, any>>;
    const bookings = (bookingsRes.data || []) as Array<Record<string, any>>;
    const reviews = reviewsRes.error ? [] : ((reviewsRes.data || []) as Array<Record<string, any>>);
    const favorites = favoritesRes.error ? [] : ((favoritesRes.data || []) as Array<Record<string, any>>);

    const securityOverview = getSignupSecurityOverview();
    const governanceStore = readUserGovernanceStore();
    const feeConfig = getServerPlatformFeeConfig();

    const authMap = new Map<string, Record<string, any>>();
    for (const u of authUsers) {
      authMap.set(String(u.id), u);
    }

    const profileMap = new Map<string, Record<string, any>>();
    for (const p of profiles) {
      profileMap.set(String(p.id), p);
    }

    const propertyMap = new Map<string, Record<string, any>>();
    const hostPropertyIds = new Set<string>();
    for (const prop of properties) {
      propertyMap.set(String(prop.id), prop);
      if (prop.host_id) hostPropertyIds.add(String(prop.host_id));
    }

    // Security IP/device map by userId
    const latestSecurityByUser = new Map<string, { ip: string; deviceId: string; createdAt: string }>();
    for (const reg of securityOverview.registrations) {
      const existing = latestSecurityByUser.get(reg.userId);
      if (!existing || reg.createdAt > existing.createdAt) {
        latestSecurityByUser.set(reg.userId, {
          ip: reg.ip,
          deviceId: reg.deviceId,
          createdAt: reg.createdAt,
        });
      }
    }

    // Identify hosts cleanly
    const hostIds = new Set<string>(Array.from(hostPropertyIds));
    for (const u of authUsers) {
      const uMeta = (u.user_metadata || {}) as Record<string, unknown>;
      const aMeta = (u.app_metadata || {}) as Record<string, unknown>;
      const role = String(uMeta.role || aMeta.role || "").toLowerCase();
      const emailLower = String(u.email || "").toLowerCase();
      if (role === "host" || emailLower === "host.dev@qafnest.com") {
        hostIds.add(String(u.id));
      }
    }

    // Build Host directory
    const hosts: ManagedHostUser[] = Array.from(hostIds).map((hostId) => {
      const authU = authMap.get(hostId);
      const prof = profileMap.get(hostId);
      const uMeta = ((authU?.user_metadata || {}) as Record<string, unknown>);
      const gov = governanceStore.overrides[hostId];

      const hostProps = properties.filter((p) => String(p.host_id || "") === hostId);
      const hostPropIdSet = new Set(hostProps.map((p) => String(p.id)));
      const hostBookings = bookings.filter((b) => hostPropIdSet.has(String(b.property_id || "")));
      const confirmedHostBookings = hostBookings.filter(
        (b) =>
          (b.status === "confirmed" || b.status === "completed") &&
          (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid")
      );

      let grossRevenueSar = 0;
      let netEarningsSar = 0;
      for (const b of confirmedHostBookings) {
        const total = Number(b.total_price) || 0;
        grossRevenueSar += total;
        const prop = propertyMap.get(String(b.property_id));
        const startMs = b.check_in ? Date.parse(String(b.check_in)) : NaN;
        const endMs = b.check_out ? Date.parse(String(b.check_out)) : NaN;
        const nightsFallback =
          Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
            ? Math.max(1, Math.round((endMs - startMs) / 86_400_000))
            : 1;
        const settlement = resolveBookingSettlement({
          bookingId: String(b.id),
          bookingReference: b.booking_reference ? String(b.booking_reference) : undefined,
          totalPricePaid: total,
          nights: Number(b.total_nights) || nightsFallback,
          nightlyPrice: prop?.base_price !== undefined ? Number(prop.base_price) : undefined,
          category: prop?.category ? String(prop.category) : undefined,
          feeConfig,
        });
        netEarningsSar += settlement.hostNetPayoutSar;
      }

      const hostReviews = reviews.filter((r) => hostPropIdSet.has(String(r.property_id || "")));
      const repliesPosted = hostReviews.filter((r) => Boolean(r.host_reply)).length;

      const bannedUntil = authU?.banned_until ? Date.parse(String(authU.banned_until)) : 0;
      const isAuthBanned = bannedUntil > Date.now();
      const isSuspended = gov?.suspended !== undefined ? gov.suspended : isAuthBanned;

      const createdAt =
        String(authU?.created_at || prof?.created_at || hostProps[hostProps.length - 1]?.created_at || new Date().toISOString());
      const lastSignInAt = authU?.last_sign_in_at ? String(authU.last_sign_in_at) : null;

      const latestBookingAt = hostBookings[0]?.created_at ? String(hostBookings[0].created_at) : "";
      const latestPropAt = hostProps[0]?.updated_at || hostProps[0]?.created_at || "";
      const lastActivityAt = [lastSignInAt || "", latestBookingAt, String(latestPropAt), createdAt]
        .filter(Boolean)
        .sort()
        .reverse()[0] || createdAt;

      const name =
        String(prof?.full_name || uMeta.full_name || uMeta.name || authU?.email?.split("@")[0] || `Host ${hostId.slice(0, 6)}`);
      const businessName = String(uMeta.business_name || uMeta.company || name);

      return {
        id: hostId,
        name,
        businessName,
        email: String(authU?.email || prof?.email || "—"),
        phone: String(prof?.phone || authU?.phone || uMeta.phone || "—"),
        city: String(prof?.city || hostProps[0]?.city_name || hostProps[0]?.city || "الرياض"),
        isVerified:
          gov?.verifiedOverride !== undefined
            ? gov.verifiedOverride
            : Boolean(prof?.is_verified || authU?.email_confirmed_at || hostProps.some((p) => p.is_approved)),
        isSuspended,
        suspendedReason: gov?.suspendedReason || null,
        totalProperties: hostProps.length,
        approvedProperties: hostProps.filter((p) => p.status === "approved" || p.is_approved).length,
        pendingProperties: hostProps.filter((p) => p.status === "pending").length,
        rejectedProperties: hostProps.filter((p) => p.status === "rejected").length,
        totalBookings: hostBookings.length,
        grossRevenueSar: round2(grossRevenueSar),
        netEarningsSar: round2(netEarningsSar),
        reviewsReceived: hostReviews.length,
        repliesPosted,
        createdAt,
        lastSignInAt,
        lastActivityAt,
        adminNote: gov?.adminNote || null,
        properties: hostProps.map((p) => ({
          id: String(p.id),
          title: String(p.title || "Property"),
          city: String(p.city_name || p.city || "Riyadh"),
          status: p.status === "approved" || p.is_approved ? "approved" : String(p.status || "pending"),
          basePrice: Number(p.base_price) || 0,
        })),
      };
    });

    // Build Guest directory from registered users + profiles + distinct helpline callers
    const guestIdSet = new Set<string>();
    for (const p of profiles) {
      if (!hostIds.has(String(p.id))) guestIdSet.add(String(p.id));
    }
    for (const u of authUsers) {
      const uid = String(u.id);
      const uMeta = (u.user_metadata || {}) as Record<string, unknown>;
      const aMeta = (u.app_metadata || {}) as Record<string, unknown>;
      const role = String(uMeta.role || aMeta.role || "").toLowerCase();
      if (!hostIds.has(uid) && role !== "admin") {
        guestIdSet.add(uid);
      }
    }

    const guests: ManagedGuestUser[] = [];

    for (const guestId of Array.from(guestIdSet)) {
      const authU = authMap.get(guestId);
      const prof = profileMap.get(guestId);
      const uMeta = ((authU?.user_metadata || {}) as Record<string, unknown>);
      const gov = governanceStore.overrides[guestId];
      const sec = latestSecurityByUser.get(guestId);

      const guestBookings = bookings.filter(
        (b) => String(b.guest_id || "") === guestId || String(b.auth_subject || "") === guestId
      );
      const confirmedBookings = guestBookings.filter(
        (b) =>
          (b.status === "confirmed" || b.status === "completed") &&
          (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid")
      );
      const pendingSadadBookings = guestBookings.filter(
        (b) => b.status === "pending" && String(b.auth_subject || "").includes("SADAD_HOLD")
      );
      const cancelledBookings = guestBookings.filter((b) => b.status === "cancelled");
      const totalSpendSar = confirmedBookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0);

      const guestReviews = reviews.filter(
        (r) => String(r.guest_id || "") === guestId || String(r.guest_subject || "") === guestId
      );
      const guestFavorites = favorites.filter((f) => String(f.guest_id || "") === guestId);

      const bannedUntil = authU?.banned_until ? Date.parse(String(authU.banned_until)) : 0;
      const isAuthBanned = bannedUntil > Date.now();
      const isSuspended = gov?.suspended !== undefined ? gov.suspended : isAuthBanned;

      const createdAt = String(prof?.created_at || authU?.created_at || new Date().toISOString());
      const lastSignInAt = authU?.last_sign_in_at ? String(authU.last_sign_in_at) : null;
      const latestBookingAt = guestBookings[0]?.created_at ? String(guestBookings[0].created_at) : "";
      const latestReviewAt = guestReviews[0]?.created_at ? String(guestReviews[0].created_at) : "";
      const lastActivityAt = [lastSignInAt || "", latestBookingAt, latestReviewAt, createdAt]
        .filter(Boolean)
        .sort()
        .reverse()[0] || createdAt;

      guests.push({
        id: guestId,
        name: String(prof?.full_name || uMeta.full_name || uMeta.name || authU?.email?.split("@")[0] || "Guest Account"),
        email: String(prof?.email || authU?.email || "—"),
        phone: String(prof?.phone || authU?.phone || uMeta.phone || "—"),
        city: String(prof?.city || "الرياض"),
        idType: String(prof?.id_type || (prof?.iqama ? "iqama" : "national_id")),
        idNumberMasked: maskNationalId(prof?.national_id || prof?.iqama),
        accountSource: "registered",
        isVerified:
          gov?.verifiedOverride !== undefined
            ? gov.verifiedOverride
            : Boolean(prof?.is_verified || prof?.nafath_verified_at),
        emailVerified: Boolean(prof?.email_verified || authU?.email_confirmed_at),
        nafathVerifiedAt: prof?.nafath_verified_at ? String(prof.nafath_verified_at) : null,
        isSuspended,
        suspendedReason: gov?.suspendedReason || null,
        totalBookings: guestBookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingSadadBookings: pendingSadadBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalSpendSar: round2(totalSpendSar),
        reviewsCount: guestReviews.length,
        favoritesCount: guestFavorites.length,
        lastIp: sec?.ip || null,
        lastDeviceId: sec?.deviceId || null,
        createdAt,
        lastSignInAt,
        lastActivityAt,
        adminNote: gov?.adminNote || null,
      });
    }

    // Also include unregistered Helpline callers (bookings with `Name | Phone` where guest_id is null)
    const helplineCallersMap = new Map<string, Array<Record<string, any>>>();
    for (const b of bookings) {
      if (!b.guest_id && String(b.auth_subject || "").includes(" | ")) {
        const parts = String(b.auth_subject).split(" | ");
        const name = (parts[0] || "Phone Guest").trim();
        const phone = (parts[1] || "").trim();
        const key = phone || name;
        const arr = helplineCallersMap.get(key) || [];
        arr.push(b);
        helplineCallersMap.set(key, arr);
      }
    }

    for (const [callerKey, callerBookings] of Array.from(helplineCallersMap.entries())) {
      const sampleParts = String(callerBookings[0].auth_subject || "").split(" | ");
      const callerName = (sampleParts[0] || "Phone Guest").trim();
      const callerPhone = (sampleParts[1] || callerKey).trim();
      const helplineId = `helpline:${callerPhone}`;
      const gov = governanceStore.overrides[helplineId];

      const confirmedCount = callerBookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;
      const pendingSadadCount = callerBookings.filter(
        (b) => b.status === "pending" && String(b.auth_subject || "").includes("SADAD_HOLD")
      ).length;
      const cancelledCount = callerBookings.filter((b) => b.status === "cancelled").length;
      const spend = callerBookings
        .filter((b) => b.status === "confirmed" || b.status === "completed")
        .reduce((s, b) => s + (Number(b.total_price) || 0), 0);

      guests.push({
        id: helplineId,
        name: callerName,
        email: "Helpline Phone Caller",
        phone: callerPhone,
        city: "Saudi Helpline",
        idType: "phone_verified",
        idNumberMasked: "Phone Desk",
        accountSource: "helpline_guest",
        isVerified: gov?.verifiedOverride ?? confirmedCount > 0,
        emailVerified: false,
        nafathVerifiedAt: null,
        isSuspended: gov?.suspended ?? false,
        suspendedReason: gov?.suspendedReason || null,
        totalBookings: callerBookings.length,
        confirmedBookings: confirmedCount,
        pendingSadadBookings: pendingSadadCount,
        cancelledBookings: cancelledCount,
        totalSpendSar: round2(spend),
        reviewsCount: 0,
        favoritesCount: 0,
        lastIp: null,
        lastDeviceId: null,
        createdAt: String(callerBookings[callerBookings.length - 1]?.created_at || new Date().toISOString()),
        lastSignInAt: null,
        lastActivityAt: String(callerBookings[0]?.created_at || new Date().toISOString()),
        adminNote: gov?.adminNote || null,
      });
    }

    guests.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    hosts.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

    // Synthesize unified User Activity Feed
    const guestLookup = new Map<string, string>();
    for (const g of guests) guestLookup.set(g.id, g.name);
    const hostLookup = new Map<string, string>();
    for (const h of hosts) hostLookup.set(h.id, h.name);

    const activities: UserActivityFeedItem[] = [];

    // 1. Booking lifecycle activities
    for (const b of bookings.slice(0, 150)) {
      const prop = propertyMap.get(String(b.property_id));
      const propTitle = String(prop?.title || "Property");
      const ref = String(b.booking_reference || String(b.id).slice(0, 8));
      const authSubj = String(b.auth_subject || "");
      const isHelpline = authSubj.includes(" | ");
      const parsedParts = isHelpline ? authSubj.split(" | ") : [];
      const userId = b.guest_id
        ? String(b.guest_id)
        : isHelpline
        ? `helpline:${(parsedParts[1] || parsedParts[0] || "").trim()}`
        : String(b.auth_subject || "guest");
      const userName = b.guest_id
        ? guestLookup.get(userId) || "Registered Guest"
        : isHelpline
        ? (parsedParts[0] || "Helpline Caller").trim()
        : "Guest";

      const isHold = b.status === "pending" && authSubj.includes("SADAD_HOLD");
      const statusLabel =
        b.status === "cancelled"
          ? "Booking Cancelled"
          : isHold
          ? "Helpline Room Held (Pending SADAD)"
          : b.status === "confirmed" || b.status === "completed"
          ? "Booking Confirmed & Paid"
          : "Checkout Initiated";

      activities.push({
        id: `bk-${b.id}`,
        userId,
        userName,
        role: "guest",
        category: isHold ? "payment" : "booking",
        action: `booking_${b.status}`,
        title: `${statusLabel} · #${ref}`,
        details: `${propTitle} (${b.check_in} → ${b.check_out}) · SAR ${Number(b.total_price || 0).toFixed(2)}`,
        targetId: String(b.id),
        targetLabel: ref,
        actor: isHelpline ? "Helpline Desk" : "Guest Web Portal",
        timestamp: String(b.updated_at || b.created_at),
      });
    }

    // 2. Host property submissions & reviews
    for (const p of properties.slice(0, 120)) {
      const hostId = String(p.host_id || "unknown-host");
      const hostName = hostLookup.get(hostId) || "Host Partner";
      activities.push({
        id: `prop-${p.id}`,
        userId: hostId,
        userName: hostName,
        role: "host",
        category: "property",
        action: p.reviewed_at ? `property_${p.status}` : "property_listed",
        title: p.reviewed_at
          ? `Listing ${p.status === "approved" || p.is_approved ? "Approved" : p.status}: ${p.title}`
          : `Listing Created / Synced: ${p.title}`,
        details: `${p.city_name || p.city || "Riyadh"} · Base Rate SAR ${Number(p.base_price || 0).toFixed(0)}`,
        targetId: String(p.id),
        targetLabel: String(p.title),
        actor: p.reviewed_by ? `Admin (${p.reviewed_by})` : hostName,
        timestamp: String(p.reviewed_at || p.updated_at || p.created_at),
      });
    }

    // 3. Guest reviews & Host replies
    for (const r of reviews.slice(0, 100)) {
      const prop = propertyMap.get(String(r.property_id));
      const gid = String(r.guest_id || r.guest_subject || "guest");
      activities.push({
        id: `rev-${r.id}`,
        userId: gid,
        userName: String(r.guest_display_name || guestLookup.get(gid) || "Guest"),
        role: "guest",
        category: "review",
        action: "review_posted",
        title: `Rated ${r.rating}/10 on ${prop?.title || "Property"}`,
        details: String(r.title || r.comment || "Verified stay review"),
        targetId: String(r.property_id),
        targetLabel: String(prop?.title || "Listing"),
        timestamp: String(r.created_at),
      });

      if (r.host_reply && r.host_reply_at && prop?.host_id) {
        const hid = String(prop.host_id);
        activities.push({
          id: `revh-${r.id}`,
          userId: hid,
          userName: hostLookup.get(hid) || "Host Partner",
          role: "host",
          category: "review",
          action: "host_reply_posted",
          title: `Host Replied to Review on ${prop.title}`,
          details: String(r.host_reply).slice(0, 140),
          targetId: String(r.id),
          timestamp: String(r.host_reply_at),
        });
      }
    }

    // 4. Guest Favorites
    for (const fav of favorites.slice(0, 80)) {
      const gid = String(fav.guest_id || "");
      const prop = propertyMap.get(String(fav.property_id));
      activities.push({
        id: `fav-${fav.id}`,
        userId: gid,
        userName: guestLookup.get(gid) || "Guest",
        role: "guest",
        category: "favorite",
        action: "favorite_added",
        title: `Saved "${prop?.title || "Listing"}" to Wishlist`,
        details: `${prop?.city_name || prop?.city || "KSA"}`,
        targetId: String(fav.property_id),
        timestamp: String(fav.created_at),
      });
    }

    // 5. Auth sign-ins & signups + Nafath verifications
    for (const u of authUsers.slice(0, 120)) {
      const uid = String(u.id);
      const isHost = hostIds.has(uid);
      const userName = isHost
        ? hostLookup.get(uid) || String(u.email || "Host")
        : guestLookup.get(uid) || String(u.email || "Guest");
      if (u.last_sign_in_at) {
        activities.push({
          id: `signin-${uid}-${u.last_sign_in_at}`,
          userId: uid,
          userName,
          role: isHost ? "host" : "guest",
          category: "auth",
          action: "user_signin",
          title: `${isHost ? "Host" : "Guest"} Signed In`,
          details: `${u.email || u.phone || uid}`,
          timestamp: String(u.last_sign_in_at),
        });
      }
      if (u.created_at) {
        activities.push({
          id: `signup-${uid}`,
          userId: uid,
          userName,
          role: isHost ? "host" : "guest",
          category: "auth",
          action: "user_registered",
          title: `Account Created (${isHost ? "Host" : "Guest"})`,
          details: `${u.email || u.phone || uid}`,
          timestamp: String(u.created_at),
        });
      }
    }

    // 6. Security alerts & IP registrations
    for (const reg of securityOverview.registrations.slice(0, 60)) {
      activities.push({
        id: `sec-reg-${reg.id}`,
        userId: reg.userId,
        userName: guestLookup.get(reg.userId) || hostLookup.get(reg.userId) || reg.email || "User",
        role: hostIds.has(reg.userId) ? "host" : "guest",
        category: "security",
        action: "device_registered",
        title: `Registered IP ${reg.ip}`,
        details: `Device ${reg.deviceId.slice(0, 12)}…${reg.welcomeBonusAwarded ? ` · Welcome Bonus SAR ${reg.welcomeBonusAmount}` : ""}`,
        timestamp: reg.createdAt,
      });
    }

    for (const alert of securityOverview.alerts.slice(0, 60)) {
      activities.push({
        id: `sec-alert-${alert.id}`,
        userId: alert.email || alert.phone || alert.ip,
        userName: alert.email || alert.phone || `IP ${alert.ip}`,
        role: "system",
        category: "security",
        action: alert.actionTaken,
        title: `Security ${alert.actionTaken.toUpperCase()}: ${alert.ip}`,
        details: alert.reason,
        timestamp: alert.attemptedAt,
      });
    }

    // 7. Stored Admin Governance & Helpline Audit Events
    for (const ev of governanceStore.events) {
      activities.push({
        id: ev.id,
        userId: ev.userId,
        userName: ev.userName || guestLookup.get(ev.userId) || hostLookup.get(ev.userId) || ev.userId,
        role: ev.role,
        category: ev.category,
        action: ev.action,
        title: ev.title,
        details: ev.details,
        targetId: ev.targetId,
        targetLabel: ev.targetLabel,
        actor: ev.actor,
        timestamp: ev.timestamp,
      });
    }

    activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // 8. PCI-DSS Safe Saved Guest Cards Directory (masked PAN only — never exposes full PAN or CVV)
    const savedCardsMap = new Map<string, AdminSavedCardRecord>();
    const guestById = new Map(guests.map((g) => [g.id, g]));

    const collectWalletCards = (userId: string, rawCards: unknown) => {
      if (!Array.isArray(rawCards)) return;
      const g = guestById.get(userId);
      for (const entry of rawCards) {
        if (!entry || typeof entry !== "object") continue;
        const c = entry as Record<string, unknown>;
        const id = String(c.id || "").trim();
        const last4 = String(c.last4 || "").replace(/\D/g, "").slice(-4);
        if (!id || !last4) continue;
        const key = `${userId}:${id}`;
        if (savedCardsMap.has(key)) continue;
        savedCardsMap.set(key, {
          id,
          userId,
          guestName: g?.name || guestLookup.get(userId) || String(c.cardholderName || "Guest"),
          guestEmail: g?.email || "—",
          guestPhone: g?.phone || "—",
          cardholderName: String(c.cardholderName || g?.name || "Guest Cardholder"),
          brand: String(c.brand || "card").toLowerCase(),
          last4,
          maskedNumber: `•••• •••• •••• ${last4}`,
          expiryMonth: String(c.expiryMonth || "--").padStart(2, "0"),
          expiryYear: String(c.expiryYear || "--"),
          isDefault: Boolean(c.isDefault),
          supportsDirectCharge: Boolean(c.supportsDirectCharge || c.gatewayToken || c.cardToken),
          createdAt: String(c.createdAt || ""),
        });
      }
    };

    try {
      const rootWallets = await hydrateRootJsonFile<{
        wallets?: Record<string, { userId?: string; savedCards?: unknown[] }>;
      }>(".qafnest-wallets.json", () => ({ wallets: {} }));
      if (rootWallets?.wallets && typeof rootWallets.wallets === "object") {
        for (const [uid, wallet] of Object.entries(rootWallets.wallets)) {
          collectWalletCards(wallet?.userId || uid, wallet?.savedCards);
        }
      }
    } catch {
      // Non-fatal fallback
    }

    try {
      const sbClient = supabase as SupabaseClient;
      const { data: walletFiles } = await sbClient.storage
        .from("qafnest-private-state")
        .list("wallets", { limit: 100 });
      if (Array.isArray(walletFiles) && walletFiles.length > 0) {
        await Promise.all(
          walletFiles
            .filter((f) => f.name && f.name.endsWith(".json"))
            .slice(0, 60)
            .map(async (f) => {
              try {
                const { data: blob } = await sbClient.storage
                  .from("qafnest-private-state")
                  .download(`wallets/${f.name}`);
                if (!blob) return;
                const parsed = JSON.parse(await blob.text()) as {
                  userId?: string;
                  savedCards?: unknown[];
                };
                if (parsed?.userId && Array.isArray(parsed.savedCards)) {
                  collectWalletCards(parsed.userId, parsed.savedCards);
                }
              } catch {
                // ignore malformed storage object
              }
            })
        );
      }
    } catch {
      // Non-fatal when bucket not created yet
    }

    const savedCards = Array.from(savedCardsMap.values()).sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );

    const now24hCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      summary: {
        totalGuests: guests.length,
        verifiedGuests: guests.filter((g) => g.isVerified).length,
        suspendedGuests: guests.filter((g) => g.isSuspended).length,
        totalHosts: hosts.length,
        verifiedHosts: hosts.filter((h) => h.isVerified).length,
        suspendedHosts: hosts.filter((h) => h.isSuspended).length,
        totalActivities: activities.length,
        activitiesLast24h: activities.filter((a) => a.timestamp >= now24hCutoff).length,
        totalSavedCards: savedCards.length,
      },
      guests,
      hosts,
      savedCards,
      activities: activities.slice(0, 300),
      securityAlertsCount: securityOverview.alerts.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        code: "server_error",
        message: err instanceof Error ? err.message : "Failed to load user management directory.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  await import("@qafnest/shared/userActivityStore").then((m) => m.hydrateUserGovernanceStore());
  const supabase = createAdminDataClient();
  const session = getAdminSession(request);
  const actorEmail = session?.email || "Admin Operations";

  try {
    const body = (await request.json()) as {
      userId?: string;
      userName?: string;
      role?: "guest" | "host";
      action?: "suspend_user" | "activate_user" | "verify_user" | "unverify_user" | "add_note";
      reason?: string;
      note?: string;
    };

    const userId = String(body.userId || "").trim();
    const role = body.role === "host" ? "host" : "guest";
    const action = body.action;

    if (!userId || !action) {
      return NextResponse.json(
        { code: "invalid_payload", message: "userId and action are required." },
        { status: 400 }
      );
    }

    const isUuid = UUID_REGEX.test(userId);
    let actionTitle = "";
    let actionDetails = "";

    if (action === "suspend_user") {
      if (supabase && isUuid) {
        await supabase.auth.admin
          .updateUserById(userId, { ban_duration: "876000h" })
          .catch(() => null);
      }
      updateUserGovernanceOverride(
        userId,
        role,
        { suspended: true, suspendedReason: body.reason || "Suspended by Admin Operations" },
        actorEmail
      );
      actionTitle = `${role === "host" ? "Host" : "Guest"} Account Suspended`;
      actionDetails = body.reason || "Account access temporarily suspended by Operations.";
    } else if (action === "activate_user") {
      if (supabase && isUuid) {
        await supabase.auth.admin
          .updateUserById(userId, { ban_duration: "none" })
          .catch(() => null);
      }
      updateUserGovernanceOverride(
        userId,
        role,
        { suspended: false, suspendedReason: undefined },
        actorEmail
      );
      actionTitle = `${role === "host" ? "Host" : "Guest"} Account Re-activated`;
      actionDetails = "Account suspension lifted by Operations.";
    } else if (action === "verify_user") {
      if (supabase && isUuid) {
        await supabase
          .from("profiles")
          .update({
            is_verified: true,
            nafath_verified_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
      updateUserGovernanceOverride(userId, role, { verifiedOverride: true }, actorEmail);
      actionTitle = `${role === "host" ? "Host" : "Guest"} KYC / Identity Verified`;
      actionDetails = "Verified manually by Operations Admin.";
    } else if (action === "unverify_user") {
      if (supabase && isUuid) {
        await supabase
          .from("profiles")
          .update({ is_verified: false })
          .eq("id", userId);
      }
      updateUserGovernanceOverride(userId, role, { verifiedOverride: false }, actorEmail);
      actionTitle = `${role === "host" ? "Host" : "Guest"} Verification Revoked`;
      actionDetails = body.reason || "Verification status cleared for re-check.";
    } else if (action === "add_note") {
      const note = String(body.note || "").trim();
      if (!note) {
        return NextResponse.json({ code: "invalid_payload", message: "Note cannot be empty." }, { status: 400 });
      }
      updateUserGovernanceOverride(userId, role, { adminNote: note }, actorEmail);
      actionTitle = `Compliance Note Added (${role === "host" ? "Host" : "Guest"})`;
      actionDetails = note;
    }

    recordUserActivity({
      userId,
      userName: body.userName || userId,
      role,
      category: "governance",
      action,
      title: actionTitle,
      details: actionDetails,
      actor: actorEmail,
    });

    return NextResponse.json({
      success: true,
      message: `${actionTitle}: ${body.userName || userId}`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        code: "server_error",
        message: err instanceof Error ? err.message : "Failed to update user governance state.",
      },
      { status: 500 }
    );
  }
}

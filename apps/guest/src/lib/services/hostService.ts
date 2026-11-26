import type { Property } from "@/data/properties";
import { getMemoryPropertiesSnapshot, listProperties } from "@/lib/services/properties";
import { createClient } from "@/lib/supabase/client";

export interface HostReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  propertyTitle?: string;
  cleanlinessRating?: number;
  accuracyRating?: number;
  checkinRating?: number;
  servicesRating?: number;
  propertyStateRating?: number;
}

export interface HostProfile {
  id: string;
  name: string;
  nameAr: string;
  avatarUrl?: string;
  badge: string;
  badgeAr: string;
  about: string;
  aboutAr: string;
  memberSince: string;
  responseRate: string;
  responseTime: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  propertiesCount: number;
  properties: Property[];
  reviews: HostReview[];
}

export function resolveHostIdForProperty(property: Property): string {
  return property.hostId || property.host?.id || "";
}

export function resolveHostForProperty(property: Property, allProperties?: Property[]) {
  const hostId = resolveHostIdForProperty(property);
  const h = property.host;
  const pool = allProperties && allProperties.length > 0 ? allProperties : getMemoryPropertiesSnapshot();
  let propertiesCount = typeof h?.propertiesCount === "number" ? h.propertiesCount : 1;

  if (hostId && pool && pool.length > 0) {
    const matched = pool.filter((p) => resolveHostIdForProperty(p) === hostId);
    if (matched.length > 0) {
      propertiesCount = matched.length;
    }
  }

  return {
    id: hostId,
    name: h?.name || "Host Partner",
    nameAr: h?.nameAr || h?.name || "شريك ضيافة",
    badge: h?.badge || "Host Partner",
    badgeAr: h?.badgeAr || "شريك ضيافة",
    about: h?.about || "",
    aboutAr: h?.aboutAr || "",
    memberSince: h?.memberSince || "",
    responseRate: h?.responseRate || "—",
    responseTime: h?.responseTime || "—",
    verified: typeof h?.verified === "boolean" ? h.verified : Boolean(hostId),
    profileHref: hostId ? `/host/${encodeURIComponent(hostId)}` : "",
    rating: typeof property.rating === "number" ? property.rating : 0,
    reviewsCount: typeof property.reviewsCount === "number" ? property.reviewsCount : 0,
    propertiesCount,
  };
}

export async function getHostProfile(hostId: string): Promise<HostProfile | null> {
  const allProperties = await listProperties();
  const matchedProperties = allProperties.filter((p) => resolveHostIdForProperty(p) === hostId);

  // If hostId is a UUID, fetch non-PII host display details via server endpoint (bypasses RLS cleanly)
  let dbProfile: { full_name?: string | null; avatar_url?: string | null; created_at?: string | null } | null = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hostId);

  if (isUuid && typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/hosts/public?id=${encodeURIComponent(hostId)}`);
      if (res.ok) {
        const json = (await res.json()) as { host?: { full_name?: string | null; avatar_url?: string | null; created_at?: string | null } | null };
        if (json?.host) dbProfile = json.host;
      }
    } catch {}
  }

  if (!dbProfile && matchedProperties.length === 0) {
    return null;
  }

  const hostMeta = matchedProperties.find((p) => p.host)?.host;
  const name = dbProfile?.full_name || hostMeta?.name || "Host Partner";
  const nameAr = hostMeta?.nameAr || dbProfile?.full_name || "شريك ضيافة";
  const memberSince = dbProfile?.created_at
    ? new Date(dbProfile.created_at).getFullYear().toString()
    : hostMeta?.memberSince || "";

  // Aggregate reviews from database
  const propertyIds = matchedProperties.map((p) => p.id);
  const reviews: HostReview[] = [];

  if (propertyIds.length > 0) {
    try {
      const supabase = createClient();
      const { data: dbReviews } = await supabase
        .from("reviews")
        .select("id, property_id, guest_display_name, rating, comment, comment_ar, created_at, cleanliness_rating, accuracy_rating, checkin_rating, services_rating, property_state_rating")
        .in("property_id", propertyIds)
        .eq("is_published", true)
        .eq("is_sample", false)
        .order("created_at", { ascending: false });

      if (dbReviews && dbReviews.length > 0) {
        const propTitleMap = new Map(matchedProperties.map((p) => [p.id, p.title]));
        for (const rev of dbReviews) {
          reviews.push({
            id: rev.id,
            author: rev.guest_display_name || "Guest",
            rating: Number(rev.rating) || 0,
            date: new Date(rev.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            comment: rev.comment || rev.comment_ar || "",
            propertyTitle: propTitleMap.get(rev.property_id) || "",
            cleanlinessRating: rev.cleanliness_rating != null ? Number(rev.cleanliness_rating) : undefined,
            accuracyRating: rev.accuracy_rating != null ? Number(rev.accuracy_rating) : undefined,
            checkinRating: rev.checkin_rating != null ? Number(rev.checkin_rating) : undefined,
            servicesRating: rev.services_rating != null ? Number(rev.services_rating) : undefined,
            propertyStateRating: rev.property_state_rating != null ? Number(rev.property_state_rating) : undefined,
          });
        }
      }
    } catch {}
  }

  // Fallback only to reviews explicitly attached to real properties
  if (reviews.length === 0) {
    for (const p of matchedProperties) {
      if (p.guestReviews && p.guestReviews.length > 0) {
        for (const gr of p.guestReviews) {
          reviews.push({
            id: `${p.id}-${gr.author}`,
            author: gr.author,
            rating: gr.rating,
            date: gr.date,
            comment: gr.comment,
            propertyTitle: p.title,
          });
        }
      }
    }
  }

  const totalReviewsCount =
    reviews.length > 0
      ? reviews.length
      : matchedProperties.reduce((acc, p) => acc + (p.reviewsCount || 0), 0);

  const ratedProperties = matchedProperties.filter((p) => typeof p.rating === "number" && p.rating > 0);
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
      : ratedProperties.length > 0
      ? Math.round((ratedProperties.reduce((acc, p) => acc + p.rating, 0) / ratedProperties.length) * 10) / 10
      : 0;

  return {
    id: hostId,
    name,
    nameAr,
    avatarUrl: dbProfile?.avatar_url || hostMeta?.avatar,
    badge: hostMeta?.badge || "Host Partner",
    badgeAr: hostMeta?.badgeAr || "شريك ضيافة",
    about: hostMeta?.about || "",
    aboutAr: hostMeta?.aboutAr || "",
    memberSince,
    responseRate: hostMeta?.responseRate || "—",
    responseTime: hostMeta?.responseTime || "—",
    verified: Boolean(dbProfile || hostMeta?.verified),
    rating: avgRating,
    reviewsCount: totalReviewsCount,
    propertiesCount: matchedProperties.length,
    properties: matchedProperties,
    reviews,
  };
}


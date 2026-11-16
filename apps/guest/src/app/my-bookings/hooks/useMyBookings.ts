"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { createFirebaseReviewDataClient, getReviewAuthorizationHeaders } from "@/lib/reviews/client";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { formatBookingPropertyPayload } from "@/lib/bookings/bookingProperty";
import type { Booking } from "../types";

const BOOKINGS_SESSION_PREFIX = "qafnest_bookings_swr_v1_";
const bookingsMemoryCache = new Map<string, Booking[]>();

function readCachedBookings(userId: string): Booking[] | null {
  const mem = bookingsMemoryCache.get(userId);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${BOOKINGS_SESSION_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Booking[];
    if (Array.isArray(parsed)) {
      bookingsMemoryCache.set(userId, parsed);
      return parsed;
    }
  } catch {
    // Ignore storage read failures
  }
  return null;
}

function writeCachedBookings(userId: string, list: Booking[]) {
  bookingsMemoryCache.set(userId, list);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${BOOKINGS_SESSION_PREFIX}${userId}`, JSON.stringify(list));
  } catch {
    // Ignore quota failures
  }
}

export function useMyBookings(user: User | null, session: Session | null, authLoading: boolean) {
  const userId = user?.id ?? null;
  const initialCached = userId ? bookingsMemoryCache.get(userId) ?? null : null;
  const [bookings, setBookings] = useState<Booking[]>(() => initialCached ?? []);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  // Hold volatile auth objects in refs so browser-tab token refreshes do not wipe or reload slips.
  const userRef = useRef(user);
  userRef.current = user;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const loadBookings = useCallback(async (options: { silent?: boolean } = {}) => {
    const currentUser = userRef.current;
    const currentSession = sessionRef.current;

    setError(null);

    if (!currentUser || !userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const warmCache = bookingsMemoryCache.get(userId) ?? readCachedBookings(userId);
    if (warmCache && !options.silent) {
      setBookings(warmCache);
      setLoading(false);
    } else if (!warmCache) {
      setLoading(true);
    }

    try {
      // 1. Fetch verified bookings from server-side /api/bookings API route
      let remoteBookings: Booking[] = [];
      let apiSucceeded = false;
      try {
        const headers = await getReviewAuthorizationHeaders(currentSession);
        const res = await fetch("/api/bookings", {
          headers,
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.bookings)) {
            remoteBookings = data.bookings as unknown as Booking[];
            apiSucceeded = true;
          }
        }
      } catch (err) {
        console.warn("Notice: /api/bookings route fetch fallback:", err);
      }

      // Only fallback to direct Supabase query when the server API route failed
      if (!apiSucceeded && remoteBookings.length === 0) {
        try {
          const isFirebaseUser = currentUser.app_metadata?.provider === "firebase_phone";
          const queryClient = isFirebaseUser ? await createFirebaseReviewDataClient() : supabase;
          if (queryClient) {
            let query = queryClient
              .from("bookings")
              .select(
                "id, booking_reference, check_in, check_out, total_nights, guests_count, total_price, status, payment_status, smart_lock_pin, created_at, auth_subject, property:properties(id, title, city, city_name, district, lat, lng, images, external_host_id)"
              )
              .order("created_at", { ascending: false });
            query = query.or(`guest_id.eq.${currentUser.id},auth_subject.eq.${currentUser.id}`);
            const { data, error: queryError } = await query;
            if (!queryError && data) {
              remoteBookings = (data as unknown as Array<Record<string, unknown>>)
                .filter(
                  (b) =>
                    !(
                      b.status === "pending" &&
                      b.payment_status === "initiated" &&
                      !String(b.auth_subject || "").includes("SADAD_HOLD")
                    )
                )
                .map((b) => {
                  const canAccessExact =
                    (b.status === "confirmed" || b.status === "completed") &&
                    b.payment_status === "success";
                  const rawProp = b.property as Record<string, unknown> | null;
                  return {
                    ...(b as unknown as Booking),
                    property: rawProp
                      ? formatBookingPropertyPayload(rawProp, canAccessExact)
                      : null,
                  };
                });
            }
          }
        } catch (err) {
          console.warn("Notice: Remote bookings query fallback:", err);
        }
      }

      // Immediately present verified remote bookings to guest (instant load)
      setBookings(remoteBookings);
      writeCachedBookings(userId, remoteBookings);
      setLoading(false);

      // 2. Parallel, non-blocking check for any unverified offline bookings in localStorage
      try {
        const raw = window.localStorage.getItem("qafnest_guest_bookings");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const missingRefs = parsed
              .map((item) => String(item.bookingRef || item.bookingId || ""))
              .filter((ref) => {
                if (!ref) return false;
                return !remoteBookings.some(
                  (rb) => rb.id === ref || (rb as unknown as Record<string, unknown>).booking_reference === ref
                );
              });

            if (missingRefs.length > 0) {
              let authToken: string | undefined;
              try {
                if (currentSession?.access_token) {
                  authToken = currentSession.access_token;
                } else if (isFirebaseConfigured()) {
                  const fbUser = getFirebaseAuth().currentUser;
                  if (fbUser) authToken = await fbUser.getIdToken();
                }
              } catch {}

              const headers: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};
              const invalidRefs = new Set<string>();
              const verifiedLocalBookings: Booking[] = [];

              // Fetch in parallel using Promise.allSettled to eliminate sequential latency waterfall
              const results = await Promise.allSettled(
                missingRefs.map(async (ref) => {
                  const res = await fetch(`/api/bookings/${ref}`, { headers });
                  if (res.status === 403 || res.status === 404) {
                    invalidRefs.add(ref);
                    return null;
                  }
                  if (res.ok) {
                    const data = await res.json();
                    if (data?.success && data.booking) return data.booking;
                  }
                  return null;
                })
              );

              for (const res of results) {
                if (res.status === "fulfilled" && res.value) {
                  const b = res.value;
                  verifiedLocalBookings.push({
                    id: b.bookingRef || b.id,
                    check_in: b.checkIn,
                    check_out: b.checkOut,
                    total_nights: b.totalNights || 1,
                    guests_count: b.guestsCount || 1,
                    total_price: b.totalPrice || 0,
                    status: b.status,
                    payment_status: b.paymentStatus,
                    smart_lock_pin: b.smartLockPin,
                    created_at: b.createdAt || new Date().toISOString(),
                    property: b.property
                      ? {
                          ...b.property,
                          id: b.property.id,
                          title: b.property.title,
                          titleAr: b.property.titleAr ?? null,
                          title_ar: b.property.title_ar ?? null,
                          city_name: b.property.city_name || b.property.city || null,
                          images: b.property.images,
                        }
                      : null,
                  });
                }
              }

              // Prune stale / 403 unauthorized refs from localStorage so they never block future requests
              if (invalidRefs.size > 0) {
                try {
                  const cleaned = parsed.filter(
                    (item) => !invalidRefs.has(String(item.bookingRef || item.bookingId || ""))
                  );
                  window.localStorage.setItem("qafnest_guest_bookings", JSON.stringify(cleaned));
                } catch {}
              }

              if (verifiedLocalBookings.length > 0) {
                const seen = new Set<string>();
                const combined: Booking[] = [];
                for (const b of [...remoteBookings, ...verifiedLocalBookings]) {
                  const key = b.id || `${b.property?.id}-${b.check_in}-${b.check_out}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    combined.push(b);
                  }
                }
                setBookings(combined);
                if (userId) writeCachedBookings(userId, combined);
              }
            }
          }
        }
      } catch {}
    } catch (loadError) {
      if (!bookingsMemoryCache.get(userId)) {
        setBookings([]);
        setError(loadError instanceof Error ? loadError.message : "Booking records are unavailable.");
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (authLoading) return;
    if (userId) {
      const warm = readCachedBookings(userId);
      if (warm) {
        setBookings(warm);
        setLoading(false);
      }
      void loadBookings({ silent: Boolean(warm) });
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [authLoading, userId, loadBookings]);

  return {
    bookings,
    loading,
    error,
    loadBookings,
  };
}


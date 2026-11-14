"use client";

import { useState, useEffect } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";

export function useAccountBookings(
  supabase: SupabaseClient,
  user: User | null,
  session: Session | null
) {
  const [bookingsCount, setBookingsCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      if (!user?.id) return;
      try {
        const authHeaders = await getReviewAuthorizationHeaders(session);
        const res = await fetch("/api/bookings", {
          headers: authHeaders,
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.bookings) && mounted) {
            setBookingsCount(data.bookings.length);
            return;
          }
        }
      } catch {}

      try {
        const { count, error } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("guest_id", user.id);
        if (!error && count !== null && mounted) {
          setBookingsCount(count);
        }
      } catch {
        // graceful fallback
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, [supabase, user, session]);

  return { bookingsCount, setBookingsCount };
}


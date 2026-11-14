"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolvePropertyIdentifier } from "@/lib/services/propertyIdentifiers";

export function useWishlistSync() {
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Sync wishlist with localStorage and Supabase
  useEffect(() => {
    let initialLocal: string[] = [];
    try {
      const stored = localStorage.getItem("qafnest_wishlist");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          initialLocal = parsed;
          setWishlist(parsed);
        }
      }
    } catch {}

    // Attempt remote sync if authenticated
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from("favorites")
          .select("property_id")
          .eq("guest_id", user.id)
          .then(({ data, error }) => {
            if (!error && data) {
              const remoteIds = data.map((d) => d.property_id);
              const merged = Array.from(new Set([...initialLocal, ...remoteIds]));
              setWishlist(merged);
              try {
                localStorage.setItem("qafnest_wishlist", JSON.stringify(merged));
              } catch {}
            }
          });
      });
    } catch {}
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const isExisting = prev.includes(id);
      const next = isExisting ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("qafnest_wishlist", JSON.stringify(next));
      } catch {}

      // Background remote sync
      try {
        const supabase = createClient();
        const { uuid } = resolvePropertyIdentifier(id);
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          if (isExisting) {
            void supabase
              .from("favorites")
              .delete()
              .eq("guest_id", user.id)
              .or(`property_id.eq.${uuid},property_id.eq.${id}`);
          } else {
            void supabase.from("favorites").insert({
              guest_id: user.id,
              property_id: uuid,
            });
          }
        });
      } catch {}

      return next;
    });
  };

  return {
    wishlist,
    toggleWishlist,
  };
}


"use client";

import { useEffect, useState } from "react";
import { type Property } from "@/data/properties";
import { listProperties } from "@/lib/services/properties";
import { clearPropertyCache } from "@/lib/services/properties";
import { createClient } from "@/lib/supabase/client";

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listProperties().then((result) => {
      if (!active) return;
      setProperties(result);
      setLoading(false);
    });

    let supabase: ReturnType<typeof createClient> | undefined;
    try {
      supabase = createClient();
      const channel = supabase
        .channel("guest-approved-property-feed")
        .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
          clearPropertyCache();
          void listProperties({ refresh: true }).then((result) => {
            if (active) setProperties(result);
          });
        })
        .subscribe();

      return () => {
        active = false;
        if (supabase) void supabase.removeChannel(channel);
      };
    } catch {
      // The bundled property catalog remains available without Supabase configuration.
    }
    return () => {
      active = false;
    };
  }, []);

  return { properties, loading };
}

"use client";

import { useEffect, useState } from "react";
import { PROPERTIES, type Property } from "@/data/properties";
import { listProperties } from "@/lib/services/properties";

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listProperties().then((result) => {
      if (!active) return;
      setProperties(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { properties, loading };
}

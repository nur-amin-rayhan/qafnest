"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProperties } from "@/hooks/useProperties";
import { Property } from "@/data/properties";
import {
  clearRecentlyViewed as clearStorage,
  getRecentlyViewedIds,
  RECENTLY_VIEWED_EVENT,
} from "@/lib/services/recentlyViewed";

export function useRecentlyViewed() {
  const { properties, loading: propertiesLoading } = useProperties();
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state with local storage safely after hydration
  useEffect(() => {
    setViewedIds(getRecentlyViewedIds());
    setIsLoaded(true);

    const handleUpdate = () => {
      setViewedIds(getRecentlyViewedIds());
    };

    window.addEventListener(RECENTLY_VIEWED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Map IDs to Property objects maintaining exact chronological order
  const recentlyViewedProperties = useMemo<Property[]>(() => {
    if (!isLoaded || propertiesLoading || viewedIds.length === 0) return [];

    const map = new Map<string, Property>();
    for (const p of properties) {
      map.set(p.id, p);
      if (p.slug) map.set(p.slug, p);
    }

    const result: Property[] = [];
    const seen = new Set<string>();

    for (const id of viewedIds) {
      const match = map.get(id);
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        result.push(match);
      }
    }

    return result;
  }, [viewedIds, properties, isLoaded, propertiesLoading]);

  const clear = useCallback(() => {
    clearStorage();
    setViewedIds([]);
  }, []);

  return {
    recentlyViewedProperties,
    rawIds: viewedIds,
    clearRecentlyViewed: clear,
    isLoaded: isLoaded && !propertiesLoading,
  };
}


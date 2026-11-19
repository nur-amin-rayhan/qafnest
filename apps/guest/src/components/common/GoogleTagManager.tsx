"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function GoogleTagManagerTracker({ gtmId }: { gtmId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gtmId || typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    const qs = searchParams?.toString();
    const fullPath = qs ? `${pathname}?${qs}` : pathname;
    window.dataLayer.push({
      event: "page_view",
      page_path: fullPath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [gtmId, pathname, searchParams]);

  return null;
}

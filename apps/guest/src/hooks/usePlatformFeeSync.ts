"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GuestFeeMode } from "@qafnest/shared/platformFee";

export interface PlatformFeeSyncState {
  feeMode: GuestFeeMode;
  fixedFeeAmountSar: number;
  feeRate: number; // e.g. 0.13
  feePercent: number; // e.g. 13
  vatRate: number; // 0.15
  welcomeBonusAmountSar: number;
  welcomeBonusEnabled: boolean;
  isLiveSynced: boolean;
  refreshFee: () => Promise<void>;
}

interface FeeCacheEntry {
  feeMode: GuestFeeMode;
  fixedFeeAmountSar: number;
  serviceFeeRate: number;
  vatRatePercent: number;
  welcomeBonusAmountSar: number;
  welcomeBonusEnabled: boolean;
  timestamp: number;
}

const feeCache = new Map<string, FeeCacheEntry>();
const inFlightFetches = new Map<string, Promise<FeeCacheEntry | null>>();
const CACHE_TTL_MS = 3_000;

async function fetchFeeCached(category?: string, forceFresh = false): Promise<FeeCacheEntry | null> {
  const cacheKey = category || "default";
  const cached = feeCache.get(cacheKey);

  if (!forceFresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  if (inFlightFetches.has(cacheKey)) {
    return inFlightFetches.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const url = category
        ? `/api/platform/fees?category=${encodeURIComponent(category)}&t=${Date.now()}`
        : `/api/platform/fees?t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const entry: FeeCacheEntry = {
          feeMode: data.feeMode === "fixed_amount" ? "fixed_amount" : "percentage",
          fixedFeeAmountSar:
            typeof data.fixedFeeAmountSar === "number" ? Math.max(0, data.fixedFeeAmountSar) : 0,
          serviceFeeRate: typeof data.serviceFeeRate === "number" ? data.serviceFeeRate : 0.13,
          vatRatePercent: typeof data.vatRatePercent === "number" ? data.vatRatePercent : 15,
          welcomeBonusAmountSar:
            typeof data.welcomeBonusAmountSar === "number" ? data.welcomeBonusAmountSar : 50,
          welcomeBonusEnabled: data.welcomeBonusEnabled !== false,
          timestamp: Date.now(),
        };
        feeCache.set(cacheKey, entry);
        return entry;
      }
    } catch {
      // Fallback on network failure
    } finally {
      inFlightFetches.delete(cacheKey);
    }
    return null;
  })();

  inFlightFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export function usePlatformFeeSync(category?: string, initialRate: number = 0.13): PlatformFeeSyncState {
  const cacheKey = category || "default";
  const initialCached = feeCache.get(cacheKey);

  const [feeMode, setFeeMode] = useState<GuestFeeMode>(initialCached?.feeMode ?? "percentage");
  const [fixedFeeAmountSar, setFixedFeeAmountSar] = useState<number>(
    initialCached?.fixedFeeAmountSar ?? 0
  );
  const [feeRate, setFeeRate] = useState<number>(initialCached?.serviceFeeRate ?? initialRate);
  const [vatRate, setVatRate] = useState<number>((initialCached?.vatRatePercent ?? 15) / 100);
  const [welcomeBonusAmountSar, setWelcomeBonusAmountSar] = useState<number>(
    initialCached?.welcomeBonusAmountSar ?? 50
  );
  const [welcomeBonusEnabled, setWelcomeBonusEnabled] = useState<boolean>(
    initialCached?.welcomeBonusEnabled ?? true
  );
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(Boolean(initialCached));
  const isMountedRef = useRef(true);

  const applyEntry = useCallback((entry: FeeCacheEntry | null) => {
    if (!entry || !isMountedRef.current) return;
    setFeeMode(entry.feeMode);
    setFixedFeeAmountSar(entry.fixedFeeAmountSar);
    setFeeRate(entry.serviceFeeRate);
    setVatRate(entry.vatRatePercent / 100);
    setWelcomeBonusAmountSar(entry.welcomeBonusAmountSar);
    setWelcomeBonusEnabled(entry.welcomeBonusEnabled);
    setIsLiveSynced(true);
  }, []);

  const fetchFee = useCallback(async () => {
    const entry = await fetchFeeCached(category, true);
    applyEntry(entry);
  }, [category, applyEntry]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchFee();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("qafnest_platform_fee_sync");
      channel.onmessage = (event) => {
        if (!isMountedRef.current) return;
        if (event.data?.type === "PLATFORM_FEE_UPDATED") {
          feeCache.delete(cacheKey);
          if (event.data.guestFeeMode === "fixed_amount" || event.data.guestFeeMode === "percentage") {
            setFeeMode(event.data.guestFeeMode);
          }
          if (typeof event.data.fixedFeeAmountSar === "number") {
            setFixedFeeAmountSar(Math.max(0, event.data.fixedFeeAmountSar));
          }
          if (typeof event.data.serviceFeeRate === "number") {
            setFeeRate(event.data.serviceFeeRate);
          }
          if (typeof event.data.vatRatePercent === "number") {
            setVatRate(event.data.vatRatePercent / 100);
          }
          setIsLiveSynced(true);
          void fetchFee();
        }
      };
    }

    const handleRevalidate = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void fetchFee();
    };
    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    const interval = setInterval(() => {
      void fetchFeeCached(category, true).then(applyEntry);
    }, 30_000);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
      clearInterval(interval);
      if (channel) {
        channel.close();
      }
    };
  }, [category, cacheKey, fetchFee, applyEntry]);

  return {
    feeMode,
    fixedFeeAmountSar,
    feeRate,
    feePercent: Math.round(feeRate * 1000) / 10,
    vatRate,
    welcomeBonusAmountSar,
    welcomeBonusEnabled,
    isLiveSynced,
    refreshFee: fetchFee,
  };
}

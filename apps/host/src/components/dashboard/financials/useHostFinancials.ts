"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  HostRemittance,
  HostPayoutIban,
  HostVatInvoice,
  HostSettlementSummary,
  HostSettlementSettings,
  HostPropertyFinanceSummary,
} from "@/lib/services/hostFinancialsService";

export interface HostFinancialsState {
  totalGrossRevenue: string;
  platformCommission: string;
  vatOnCommission: string;
  netHostEarnings: string;
  totalPaidOut: string;
  upcomingPayout: string;
  availableInstantBalance: string;
}

const DEFAULT_KPIS: HostFinancialsState = {
  totalGrossRevenue: "0.00",
  platformCommission: "0.00",
  vatOnCommission: "0.00",
  netHostEarnings: "0.00",
  totalPaidOut: "0.00",
  upcomingPayout: "0.00",
  availableInstantBalance: "0.00",
};

const DEFAULT_IBAN: HostPayoutIban = {
  iban: "",
  formattedIban: "",
  bankNameEn: "",
  bankNameAr: "",
  accountHolder: "",
  isVerified: false,
  verifiedAt: "",
};

const DEFAULT_SETTLEMENT: HostSettlementSummary = {
  grossRevenue: 0,
  commissionAmount: 0,
  vatAmount: 0,
  commissionRatePercent: 13,
  vatRatePercent: 15,
  netEarnings: 0,
  disbursedTotal: 0,
  pendingSettlement: 0,
  settings: {
    payoutFrequency: "weekly",
    minPayoutThreshold: 500,
    autoReleaseAfterCheckin: true,
    notifySms: true,
  },
  adjustments: [],
};

export function useHostFinancials() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [querySynced, setQuerySynced] = useState(false);
  const [propertyLedgers, setPropertyLedgers] = useState<HostPropertyFinanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<HostFinancialsState>(DEFAULT_KPIS);
  const [iban, setIban] = useState<HostPayoutIban>(DEFAULT_IBAN);
  const [remittances, setRemittances] = useState<HostRemittance[]>([]);
  const [vatInvoices, setVatInvoices] = useState<HostVatInvoice[]>([]);
  const [settlement, setSettlement] = useState<HostSettlementSummary>(DEFAULT_SETTLEMENT);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadFinancials = useCallback(
    async (propertyOverride?: string) => {
      const targetProp = propertyOverride ?? selectedPropertyId;
      setLoading(true);
      try {
        const qs = targetProp && targetProp !== "all" ? `?propertyId=${encodeURIComponent(targetProp)}` : "";
        const res = await fetch(`/api/host/financials${qs}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.kpis) setKpis(data.kpis);
          if (data.iban) setIban(data.iban);
          if (Array.isArray(data.remittances)) setRemittances(data.remittances);
          if (Array.isArray(data.vatInvoices)) setVatInvoices(data.vatInvoices);
          if (data.settlement) setSettlement(data.settlement);
          if (Array.isArray(data.propertyLedgers)) setPropertyLedgers(data.propertyLedgers);
          if (typeof data.selectedPropertyId === "string" && propertyOverride === undefined) {
            setSelectedPropertyId(data.selectedPropertyId);
          }
        }
      } catch (e) {
        console.warn("Could not synchronize live host financials:", e);
      } finally {
        setLoading(false);
      }
    },
    [selectedPropertyId]
  );

  const selectProperty = useCallback(
    (propertyId: string) => {
      const normalized = propertyId || "all";
      setSelectedPropertyId(normalized);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (normalized === "all") {
          url.searchParams.delete("property");
        } else {
          url.searchParams.set("property", normalized);
        }
        window.history.replaceState({}, "", url.pathname + url.search);
      }
      void loadFinancials(normalized);
    },
    [loadFinancials]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const propParam = new URLSearchParams(window.location.search).get("property") || "all";
    setSelectedPropertyId(propParam);
    setQuerySynced(true);
  }, []);

  useEffect(() => {
    if (!querySynced) return;
    void loadFinancials();
  }, [querySynced, loadFinancials]);

  const handleUpdateIban = async (newIban: string, accountHolder: string) => {
    const res = await fetch("/api/host/financials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_iban",
        iban: newIban,
        accountHolder,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update IBAN");
    if (data.iban) setIban(data.iban);
    triggerToast(data.message || "IBAN updated and verified successfully with SAMA.");
  };

  const handleRequestPayout = async (amount: number) => {
    const res = await fetch("/api/host/financials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request_payout",
        amount,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit payout request");
    if (data.remittance) {
      setRemittances((prev) => [data.remittance, ...prev]);
    }
    triggerToast(data.message || "Payout transfer initiated successfully.");
    void loadFinancials();
  };

  const handleUpdateSettlementSettings = async (settings: HostSettlementSettings) => {
    const res = await fetch("/api/host/financials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_settlement_settings",
        settings,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update settlement settings");
    if (data.settings) {
      setSettlement((prev) => ({ ...prev, settings: data.settings }));
    }
    triggerToast(data.message || "Settlement preferences saved successfully.");
  };

  return {
    loading,
    selectedPropertyId,
    selectProperty,
    propertyLedgers,
    kpis,
    iban,
    remittances,
    vatInvoices,
    settlement,
    toastMsg,
    triggerToast,
    loadFinancials,
    handleUpdateIban,
    handleRequestPayout,
    handleUpdateSettlementSettings,
  };
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { AdminPayoutRecord, AdminHostLedger } from "@/lib/services/adminFinancialsService";
import type { AdminTaxInvoiceRecord } from "@/lib/services/adminInvoicesService";
import {
  DEFAULT_HOST_PAYOUT_POLICY,
  computePayoutSlaMetrics,
  summarizePayoutReminders,
  type HostPayoutPolicy,
  type PayoutReminderSummary,
} from "@qafnest/shared";

import { adminPath } from "@/lib/adminUrl";
export interface AdminFinancialMetrics {
  totalGrossVolume: number;
  platformCommission: number;
  vatCollected: number;
  disbursedTotal: number;
  pendingTotal: number;
  commissionRate: number;
  vatRate: number;
}

export interface MyFatoorahSupplierProbe {
  configured: boolean;
  multiVendorEnabled: boolean;
  httpStatus?: number;
  latencyMs?: number;
  totalSuppliers?: number;
  activeSuppliersCount: number;
  endpoint?: string;
  message: string;
}

export function useAdminFinancials() {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSectionState] = useState<"payouts" | "hosts" | "invoices" | "fees">("payouts");
  const [selectedHostId, setSelectedHostIdState] = useState<string>("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section");
    const h = params.get("host");
    if (h) {
      setSelectedHostIdState(h);
      setActiveSectionState("hosts");
    } else if (s === "payouts" || s === "hosts" || s === "invoices" || s === "fees") {
      setActiveSectionState(s);
    }
  }, []);

  const syncUrlParams = useCallback((section: string, hostId: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (section === "payouts") {
      url.searchParams.delete("section");
    } else {
      url.searchParams.set("section", section);
    }
    if (section !== "hosts" || !hostId || hostId === "all") {
      url.searchParams.delete("host");
    } else {
      url.searchParams.set("host", hostId);
    }
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  const setActiveSection = useCallback(
    (next: "payouts" | "hosts" | "invoices" | "fees") => {
      setActiveSectionState(next);
      syncUrlParams(next, next === "hosts" ? selectedHostId : "all");
    },
    [selectedHostId, syncUrlParams]
  );

  const setSelectedHostId = useCallback(
    (hostId: string) => {
      const normalized = hostId || "all";
      setSelectedHostIdState(normalized);
      const nextSec = normalized !== "all" ? "hosts" : activeSection;
      if (normalized !== "all" && activeSection !== "hosts") {
        setActiveSectionState("hosts");
      }
      syncUrlParams(nextSec, normalized);
    },
    [activeSection, syncUrlParams]
  );

  const [metrics, setMetrics] = useState<AdminFinancialMetrics>({
    totalGrossVolume: 0,
    platformCommission: 0,
    vatCollected: 0,
    disbursedTotal: 0,
    pendingTotal: 0,
    commissionRate: 20,
    vatRate: 15,
  });
  const [payouts, setPayouts] = useState<AdminPayoutRecord[]>([]);
  const [hostLedgers, setHostLedgers] = useState<AdminHostLedger[]>([]);
  const [policy, setPolicy] = useState<HostPayoutPolicy>(DEFAULT_HOST_PAYOUT_POLICY);
  const [serverReminders, setServerReminders] = useState<PayoutReminderSummary | null>(null);
  const [supplierProbe, setSupplierProbe] = useState<MyFatoorahSupplierProbe | null>(null);
  const [probingSuppliers, setProbingSuppliers] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  const [invoices, setInvoices] = useState<AdminTaxInvoiceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Tick every 30 seconds so 24-hour SLA countdown timers update live
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(adminPath("/api/admin/financials"), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (Array.isArray(data.payouts)) setPayouts(data.payouts);
        if (Array.isArray(data.hostLedgers)) setHostLedgers(data.hostLedgers);
        if (data.policy) setPolicy(data.policy);
        if (data.reminders) setServerReminders(data.reminders);
        if (Array.isArray(data.invoices)) {
          setInvoices(data.invoices);
        }
      }
    } catch {
      // Ignore network blip
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinancials();
  }, [loadFinancials]);

  const reminders = useMemo(() => {
    if (payouts.length > 0) {
      return summarizePayoutReminders(payouts, nowTick, policy);
    }
    return (
      serverReminders ||
      summarizePayoutReminders([], nowTick, policy)
    );
  }, [payouts, nowTick, policy, serverReminders]);

  const handleUpdateStatus = async (
    payoutId: string,
    status: "disbursed" | "pending" | "processing" | "on_hold",
    holdReason?: string,
    sarieTxnId?: string
  ) => {
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, status, holdReason, sarieTxnId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update payout status");

      if (data.payout) {
        setPayouts((prev) => prev.map((p) => (p.id === payoutId ? data.payout : p)));
      } else {
        await loadFinancials();
      }
      triggerToast(data.message || `Payout status updated to ${status}.`);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error updating payout");
    }
  };

  const handleBatchUpdateStatus = async (
    payoutIds: string[],
    status: "disbursed" | "pending" | "processing" | "on_hold",
    sarieTxnId?: string
  ) => {
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batch_update_status", payoutIds, status, sarieTxnId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to batch update");

      await loadFinancials();
      triggerToast(data.message || `Updated ${payoutIds.length} payouts to ${status}.`);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error in batch update");
    }
  };

  const handleProcessSarieSettlement = async (sarieTxnId?: string) => {
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_settlement", sarieTxnId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process settlement");

      await loadFinancials();
      triggerToast(data.message || "SAMA SARIE settlement processed successfully!");
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error processing settlement");
    }
  };

  const handleReviewPayoutRequest = async (
    payoutId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: decision === "approved" ? "approve_request" : "reject_request",
          payoutId,
          rejectionReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to review payout request");

      if (data.payout) {
        setPayouts((prev) => prev.map((p) => (p.id === payoutId ? data.payout : p)));
      } else {
        await loadFinancials();
      }
      triggerToast(
        data.message ||
          (decision === "approved"
            ? "Host payout request approved for Finance disbursement."
            : "Host payout request declined.")
      );
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error reviewing payout request");
    }
  };

  const handleSendReminders = async (payoutIds?: string[]) => {
    setSendingReminders(true);
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_reminder", payoutIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to dispatch reminders");

      await loadFinancials();
      triggerToast(data.message || "24h payout reminders dispatched to host & finance queue.");
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error sending reminder");
    } finally {
      setSendingReminders(false);
    }
  };

  const handleUpdatePolicy = async (updates: Partial<HostPayoutPolicy>) => {
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_policy", policy: updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update payout policy");

      if (data.policy) setPolicy(data.policy);
      triggerToast(data.message || "24h payout policy updated.");
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error updating payout policy");
    }
  };

  const handleCheckSuppliers = async () => {
    setProbingSuppliers(true);
    try {
      const res = await fetch(adminPath("/api/admin/financials?check=suppliers"), { cache: "no-store" });
      const data = await res.json();
      if (data?.supplierProbe) {
        setSupplierProbe(data.supplierProbe);
      }
    } catch {
      // Ignore
    } finally {
      setProbingSuppliers(false);
    }
  };

  const handleExportCsv = () => {
    if (typeof window !== "undefined") window.location.href = adminPath("/api/admin/financials?format=csv");
  };

  const handleExportTaxJournal = () => {
    if (typeof window !== "undefined") window.location.href = adminPath("/api/admin/financials?format=tax_journal_csv");
  };

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      if (statusFilter === "sla_urgent") {
        const m = computePayoutSlaMetrics(p, nowTick, policy.reminderLeadHours);
        if (m.tier !== "overdue" && m.tier !== "urgent") return false;
      } else if (statusFilter === "escrow") {
        const m = computePayoutSlaMetrics(p, nowTick, policy.reminderLeadHours);
        if (p.status === "disbursed" || m.tier !== "escrow") return false;
      } else if (statusFilter === "host_requested") {
        if (p.status === "disbursed" || p.payoutRequestStatus !== "requested") return false;
      } else if (statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.reference.toLowerCase().includes(q) ||
          p.hostName.toLowerCase().includes(q) ||
          p.propertyTitle.toLowerCase().includes(q) ||
          p.iban.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payouts, statusFilter, searchQuery, nowTick, policy.reminderLeadHours]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (invoiceTypeFilter !== "all" && inv.type !== invoiceTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.bookingReference.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q) ||
          inv.propertyTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, invoiceTypeFilter, searchQuery]);

  return {
    loading,
    activeSection,
    setActiveSection,
    selectedHostId,
    setSelectedHostId,
    metrics,
    payouts,
    hostLedgers,
    filteredPayouts,
    policy,
    reminders,
    nowTick,
    supplierProbe,
    probingSuppliers,
    sendingReminders,
    invoices,
    filteredInvoices,
    statusFilter,
    setStatusFilter,
    invoiceTypeFilter,
    setInvoiceTypeFilter,
    searchQuery,
    setSearchQuery,
    toastMsg,
    handleUpdateStatus,
    handleBatchUpdateStatus,
    handleProcessSarieSettlement,
    handleReviewPayoutRequest,
    handleSendReminders,
    handleUpdatePolicy,
    handleCheckSuppliers,
    handleExportCsv,
    handleExportTaxJournal,
    loadFinancials,
  };
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_ADMIN_METRICS,
  INITIAL_MOCK_PROPERTIES,
  INITIAL_MOCK_BOOKINGS,
} from "@/components/dashboard/mockData";
import type {
  PropertyItem,
  BookingItem,
  AdminMetrics,
  AdminPropertyDeletionRequest,
} from "@/components/dashboard/types";
import type {
  PayoutReminderSummary,
  SharedHostPayoutRecord,
} from "@qafnest/shared";
import { filterProperties, filterBookings } from "./dashboardFiltering";
import {
  patchSinglePropertyStatus,
  patchBulkPropertyStatus,
} from "./dashboardPropertyApi";

import { adminPath } from "@/lib/adminUrl";
export function useAdminDashboardData() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters for Properties Tab
  const [propertyStatusFilter, setPropertyStatusFilter] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");
  const [propertyCityFilter, setPropertyCityFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");

  // Filters for Bookings Tab
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  // Batch menu & selected checkboxes
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  // Toast notification
  const [toastMsg, setToastMsg] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 3800);
  };

  const [metrics, setMetrics] = useState<AdminMetrics>(DEFAULT_ADMIN_METRICS);
  const [properties, setProperties] = useState<PropertyItem[]>(INITIAL_MOCK_PROPERTIES);
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_MOCK_BOOKINGS);
  const [payoutReminders, setPayoutReminders] = useState<PayoutReminderSummary | null>(null);
  const [urgentPayoutQueue, setUrgentPayoutQueue] = useState<SharedHostPayoutRecord[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<AdminPropertyDeletionRequest[]>([]);

  const loadLiveAdminData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [resMetrics, resProps] = await Promise.all([
        fetch(adminPath("/api/admin/metrics"), { cache: "no-store" }),
        fetch(adminPath("/api/admin/properties"), { cache: "no-store" }),
      ]);

      if (resMetrics.ok) {
        const metData = await resMetrics.json();
        if (metData.metrics) {
          setMetrics(metData.metrics);
        }
        if (metData.payoutReminders) {
          setPayoutReminders(metData.payoutReminders);
        }
        if (Array.isArray(metData.urgentPayoutQueue)) {
          setUrgentPayoutQueue(metData.urgentPayoutQueue);
        }
        if (Array.isArray(metData.deletionRequests)) {
          setDeletionRequests(metData.deletionRequests);
        }
        const liveBookings = metData.bookings || metData.recentBookings;
        if (Array.isArray(liveBookings)) {
          setBookings(liveBookings);
        }
      }

      if (resProps.ok) {
        const propData = await resProps.json();
        if (Array.isArray(propData.properties)) {
          setProperties(propData.properties);
        }
        if (Array.isArray(propData.deletionRequests)) {
          setDeletionRequests(propData.deletionRequests);
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to synchronize latest data from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLiveAdminData();

    // Auto-refresh when admin refocuses tab
    const handleFocus = () => {
      void loadLiveAdminData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }

    // Dynamic background poller fallback
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadLiveAdminData();
    }, 10000);

    let supabase: ReturnType<typeof createClient> | undefined;
    try {
      supabase = createClient();
      const channel = supabase
        .channel("admin-realtime-feed")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "properties" },
          (payload) => {
            console.log("Admin received property update:", payload.eventType);
            void loadLiveAdminData();
            if (payload.eventType === "INSERT") {
              triggerToast("New host property submitted for review!");
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bookings" },
          (payload) => {
            console.log("Admin received booking update:", payload.eventType);
            void loadLiveAdminData();
            if (payload.eventType === "INSERT") {
              triggerToast("New reservation booked on Guest platform!");
            }
          }
        )
        .subscribe();

      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("focus", handleFocus);
        }
        clearInterval(interval);
        if (supabase) void supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn("Could not setup admin realtime listener:", e);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
      clearInterval(interval);
    };
  }, [loadLiveAdminData]);

  const updatePropertyStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending",
    feedback?: string
  ) => {
    try {
      await patchSinglePropertyStatus(id, status, feedback);

      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                is_approved: status === "approved",
                admin_feedback: feedback || (status === "approved" ? "" : p.admin_feedback),
                rejection_reason: feedback || (status === "approved" ? "" : p.rejection_reason),
              }
            : p
        )
      );

      triggerToast(
        `Property ${id.slice(0, 8)} has been ${
          status === "approved"
            ? "approved & published."
            : status === "rejected"
            ? "rejected with review feedback."
            : "updated."
        }`
      );
    } catch (err) {
      console.error(err);
      triggerToast("Error updating property status.");
    }
  };

  const handleBulkPublish = async () => {
    if (selectedPropertyIds.length === 0) return;
    const targetIds = [...selectedPropertyIds];
    try {
      await patchBulkPropertyStatus(targetIds, "approved");

      setProperties((prev) =>
        prev.map((p) =>
          targetIds.includes(p.id)
            ? { ...p, status: "approved", is_approved: true, admin_feedback: "", rejection_reason: "" }
            : p
        )
      );
      triggerToast(`Bulk published and verified ${targetIds.length} properties.`);
      setSelectedPropertyIds([]);
      setShowBatchMenu(false);
    } catch (err) {
      console.error(err);
      triggerToast("Error saving bulk publish to server.");
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedPropertyIds.length === 0) return;
    const targetIds = [...selectedPropertyIds];
    try {
      const reason = "Suspended by administration via bulk operations.";
      await patchBulkPropertyStatus(targetIds, "rejected", reason);

      setProperties((prev) =>
        prev.map((p) =>
          targetIds.includes(p.id)
            ? {
                ...p,
                status: "rejected",
                is_approved: false,
                admin_feedback: reason,
                rejection_reason: reason,
              }
            : p
        )
      );
      triggerToast(`Bulk suspended and saved ${targetIds.length} properties.`);
      setSelectedPropertyIds([]);
      setShowBatchMenu(false);
    } catch (err) {
      console.error(err);
      triggerToast("Error saving bulk suspend to server.");
    }
  };

  const filteredProperties = useMemo(() => {
    return filterProperties(properties, {
      status: propertyStatusFilter,
      city: propertyCityFilter,
      type: propertyTypeFilter,
      searchQuery,
    });
  }, [properties, propertyStatusFilter, propertyCityFilter, propertyTypeFilter, searchQuery]);

  const filteredBookings = useMemo(() => {
    return filterBookings(bookings, {
      status: bookingStatusFilter,
      search: bookingSearch,
    });
  }, [bookings, bookingStatusFilter, bookingSearch]);

  const selectAllProps = () => {
    if (selectedPropertyIds.length === filteredProperties.length) {
      setSelectedPropertyIds([]);
    } else {
      setSelectedPropertyIds(filteredProperties.map((p) => p.id));
    }
  };

  const togglePropSelection = (id: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const quickDisbursePayout = async (payoutId: string) => {
    const sarieInput =
      typeof window !== "undefined"
        ? window.prompt("Enter SAMA SARIE Transaction Reference (6+ alphanumeric chars):")
        : null;
    if (sarieInput === null) return;
    const cleanedTxn = sarieInput.trim();
    if (!/^[a-zA-Z0-9_-]{6,64}$/.test(cleanedTxn)) {
      triggerToast("Valid SAMA SARIE transaction reference (6+ chars) is required.");
      return;
    }
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, status: "disbursed", sarieTxnId: cleanedTxn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to disburse");
      triggerToast(data.message || "Payout marked as disbursed via SARIE.");
      await loadLiveAdminData();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error disbursing payout");
    }
  };

  const sendOverviewPayoutReminders = async (payoutIds?: string[]) => {
    try {
      const res = await fetch(adminPath("/api/admin/financials"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_reminder", payoutIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reminder");
      triggerToast(data.message || "24-hour payout reminders sent.");
      await loadLiveAdminData();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : "Error sending reminder");
    }
  };

  const reviewDeletionRequest = useCallback(
    async (params: {
      requestId: string;
      action: "approve" | "reject";
      adminNotes?: string;
    }): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch(
          adminPath("/api/admin/properties/deletion-requests"),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            data.message || data.error || "Failed to review deletion request.";
          triggerToast(msg);
          return { ok: false, error: msg };
        }
        triggerToast(
          params.action === "approve"
            ? "Property approved for removal and auto-deleted cleanly."
            : "Property deletion request declined and host notified."
        );
        await loadLiveAdminData();
        return { ok: true };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Error reviewing property deletion request.";
        triggerToast(msg);
        return { ok: false, error: msg };
      }
    },
    [loadLiveAdminData]
  );

  return {
    loading,
    errorMsg,
    searchQuery,
    setSearchQuery,
    propertyStatusFilter,
    setPropertyStatusFilter,
    propertyCityFilter,
    setPropertyCityFilter,
    propertyTypeFilter,
    setPropertyTypeFilter,
    bookingStatusFilter,
    setBookingStatusFilter,
    bookingSearch,
    setBookingSearch,
    selectedPropertyIds,
    setSelectedPropertyIds,
    showBatchMenu,
    setShowBatchMenu,
    toastMsg,
    triggerToast,
    metrics,
    properties,
    bookings,
    payoutReminders,
    urgentPayoutQueue,
    deletionRequests,
    reviewDeletionRequest,
    quickDisbursePayout,
    sendOverviewPayoutReminders,
    loadLiveAdminData,
    updatePropertyStatus,
    handleBulkPublish,
    handleBulkSuspend,
    filteredProperties,
    filteredBookings,
    selectAllProps,
    togglePropSelection,
  };
}

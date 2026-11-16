"use client";

import { useState, useEffect, useCallback } from "react";
import {
  deleteHostPropertyRequest,
  getHostRequestHeaders,
} from "@/lib/hostPropertyActions";
import type { HostNotification } from "@/components/dashboard/HostTopNav";
import type { HostReviewSummary } from "@/components/dashboard/overview/types";
import type { DeletePropertyTarget } from "@/components/dashboard/properties/DeletePropertyModal";
import type {
  PropertyDeletionReasonCode,
  PropertyDeletionRequestSummary,
} from "@qafnest/shared";
import { useHostRealtime } from "@/hooks/useHostRealtime";

export type HostSubmittedProperty = {
  id: string;
  unitCode?: string;
  title: string;
  titleAr?: string;
  city: string;
  district: string;
  districtAr?: string;
  address?: string;
  addressAr?: string;
  category: string;
  basePrice: number;
  status: string;
  isApproved?: boolean;
  adminFeedback?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  images?: string[];
  deletionRequest?: PropertyDeletionRequestSummary | null;
};

export type HostLiveBooking = {
  id: string;
  booking_reference?: string;
  property_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  guests_count: number;
  status: string;
  payment_status: string;
  created_at: string;
  propertyTitle?: string;
};

export function useHostWorkspaceData(userId: string | undefined, lang: "ar" | "en") {
  const [submittedProperties, setSubmittedProperties] = useState<HostSubmittedProperty[]>([]);
  const [liveBookings, setLiveBookings] = useState<HostLiveBooking[]>([]);
  const [reviews, setReviews] = useState<HostReviewSummary[]>([]);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; totalCount: number }>({
    averageRating: 0,
    totalCount: 0,
  });
  const [notifications, setNotifications] = useState<HostNotification[]>([]);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeletePropertyTarget | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Check URL params for submission / resubmission / deletion messages
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const listingParam = urlParams.get("listing");
        if (listingParam === "resubmitted") {
          setBannerNotice(
            lang === "ar"
              ? "تم تحديث العقار وإعادة إرساله للإدارة بنجاح، وستتم مراجعته في أقرب وقت."
              : "Property updated & resubmitted for admin review successfully."
          );
        } else if (listingParam === "submitted") {
          setBannerNotice(
            lang === "ar"
              ? "تم إرسال العقار الجديد للمراجعة بنجاح! سيظهر للضيوف بمجرد اعتماده من الإدارة."
              : "New property submitted for review successfully! It will go live once approved."
          );
        } else if (listingParam === "deleted") {
          setBannerNotice(
            lang === "ar"
              ? "تم حذف العقار نهائياً بنجاح."
              : "Property deleted permanently."
          );
        } else if (listingParam === "deletion_requested") {
          setBannerNotice(
            lang === "ar"
              ? "تم إرسال طلب حذف العقار للمراجعة الإدارية بنجاح. سيتم الحذف تلقائياً فور الموافقة."
              : "Property removal request submitted for admin review. It will be removed automatically upon approval."
          );
        }
      }
    } catch {}
  }, [lang]);

  // Fetch live properties, bookings, and notifications for this host
  const loadDashboardData = useCallback(async () => {
    if (!userId) return;
    try {
      const headers = await getHostRequestHeaders(userId);
      const res = await fetch(`/api/host/dashboard?hostId=${encodeURIComponent(userId)}`, {
        headers,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      if (Array.isArray(data.properties)) {
        const mappedProps = data.properties.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          unitCode: typeof p.unit_code === "string" ? p.unit_code : undefined,
          title: String(p.title || ""),
          titleAr: typeof p.title_ar === "string" ? p.title_ar : "",
          city: String(p.city_name || p.city || ""),
          district: String(p.district || ""),
          districtAr: typeof p.district_ar === "string" ? p.district_ar : "",
          address: typeof p.address === "string" ? p.address : "",
          addressAr: typeof p.address_ar === "string" ? p.address_ar : "",
          category: String(p.category_name || p.category || ""),
          basePrice: Number(p.base_price || 0),
          status: String(p.status || (p.is_approved ? "approved" : "pending")),
          isApproved: Boolean(p.is_approved),
          adminFeedback: typeof p.admin_feedback === "string" ? p.admin_feedback : "",
          rejectionReason: typeof p.rejection_reason === "string" ? p.rejection_reason : "",
          reviewedAt: typeof p.reviewed_at === "string" ? p.reviewed_at : "",
          images: Array.isArray(p.images) ? (p.images as string[]) : [],
          deletionRequest:
            (p.deletion_request as PropertyDeletionRequestSummary | null) ?? null,
        }));
        setSubmittedProperties(mappedProps);
      }

      if (Array.isArray(data.bookings)) {
        setLiveBookings(data.bookings);
      }

      if (Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }

      if (data.reviewStats && typeof data.reviewStats === "object") {
        setReviewStats({
          averageRating: Number(data.reviewStats.averageRating) || 0,
          totalCount: Number(data.reviewStats.totalCount) || 0,
        });
      }

      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.warn("Notice: Live host data sync fallback:", err);
    }
  }, [userId]);

  // Supabase WebSocket Real-Time Hook
  const {
    alerts: realtimeAlerts,
    isConnected: isRealtimeConnected,
    dismissAlert,
  } = useHostRealtime({
    hostId: userId,
    propertyIds: submittedProperties.map((p) => p.id),
    onBookingChange: () => {
      void loadDashboardData();
    },
    onReviewChange: () => {
      void loadDashboardData();
    },
    onNotification: () => {
      void loadDashboardData();
    },
  });

  useEffect(() => {
    if (!userId) return;
    void loadDashboardData();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, loadDashboardData]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("qafnest-host-submitted-properties");
      }
    } catch {}
  }, []);

  const handleMarkNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!userId || !notificationId) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      try {
        const authHeaders = await getHostRequestHeaders(userId);
        await fetch("/api/host/dashboard", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ notificationId, hostId: userId }),
        });
      } catch {}
    },
    [userId]
  );

  const handleMarkAllNotificationsRead = async () => {
    if (!userId) return;
    const authHeaders = await getHostRequestHeaders(userId);
    await fetch("/api/host/dashboard", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ markAllRead: true, hostId: userId }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const requestDeleteProperty = useCallback((prop: DeletePropertyTarget) => {
    setDeleteError(null);
    setDeleteTarget(prop);
  }, []);

  const cancelDeleteProperty = useCallback(() => {
    if (deletingPropertyId) return;
    setDeleteError(null);
    setDeleteTarget(null);
  }, [deletingPropertyId]);

  const confirmDeleteProperty = useCallback(
    async (payload: {
      reasonCode: PropertyDeletionReasonCode;
      reasonDetails: string;
    }) => {
      if (!deleteTarget) return;
      const targetId = deleteTarget.id;
      setDeletingPropertyId(targetId);
      setDeleteError(null);
      try {
        const result = await deleteHostPropertyRequest({
          propertyId: targetId,
          userId,
          reasonCode: payload.reasonCode,
          reasonDetails: payload.reasonDetails,
          lang,
        });
        if (result.pendingReview) {
          setSubmittedProperties((prev) =>
            prev.map((item) =>
              item.id === targetId
                ? {
                    ...item,
                    deletionRequest: result.request ?? item.deletionRequest ?? null,
                  }
                : item
            )
          );
        } else {
          setSubmittedProperties((prev) => prev.filter((item) => item.id !== targetId));
        }
        setDeleteTarget(null);
        setBannerNotice(
          result.message ||
            (lang === "ar"
              ? "تم إرسال طلب حذف العقار للمراجعة الإدارية."
              : "Property removal request submitted for admin review.")
        );
        void loadDashboardData();
      } catch (err) {
        setDeleteError(
          err instanceof Error
            ? err.message
            : lang === "ar"
              ? "تعذر إرسال طلب حذف العقار."
              : "Could not submit property deletion request."
        );
      } finally {
        setDeletingPropertyId(null);
      }
    },
    [deleteTarget, userId, lang, loadDashboardData]
  );

  return {
    submittedProperties,
    liveBookings,
    reviews,
    reviewStats,
    notifications,
    bannerNotice,
    setBannerNotice,
    loadDashboardData,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    deleteTarget,
    deletingPropertyId,
    deleteError,
    requestDeleteProperty,
    cancelDeleteProperty,
    confirmDeleteProperty,
    realtimeAlerts,
    isRealtimeConnected,
    dismissAlert,
  };
}


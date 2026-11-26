"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeAlert {
  id: string;
  type: "booking" | "review" | "notification";
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  timestamp: string;
}

interface UseHostRealtimeOptions {
  hostId?: string | null;
  propertyIds?: string[];
  onBookingChange?: (payload: unknown) => void;
  onReviewChange?: (payload: unknown) => void;
  onNotification?: (payload: unknown) => void;
  onPropertyChange?: (payload: unknown) => void;
}

export function useHostRealtime({
  hostId,
  propertyIds = [],
  onBookingChange,
  onReviewChange,
  onNotification,
  onPropertyChange,
}: UseHostRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Keep latest callbacks in refs to prevent unnecessary channel re-subscriptions
  const onBookingChangeRef = useRef(onBookingChange);
  const onReviewChangeRef = useRef(onReviewChange);
  const onNotificationRef = useRef(onNotification);
  const onPropertyChangeRef = useRef(onPropertyChange);
  const propertyIdsRef = useRef(propertyIds);

  useEffect(() => {
    onBookingChangeRef.current = onBookingChange;
    onReviewChangeRef.current = onReviewChange;
    onNotificationRef.current = onNotification;
    onPropertyChangeRef.current = onPropertyChange;
    propertyIdsRef.current = propertyIds;
  });

  const addAlert = useCallback((alert: Omit<RealtimeAlert, "id" | "timestamp">) => {
    const newAlert: RealtimeAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    if (!hostId) return;

    let mounted = true;
    const supabase = createClient();
    const channelName = `host-rt-${hostId.slice(0, 8)}`;
    const channel = supabase.channel(channelName);

    // 1. Listen for Booking changes
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          const oldRow = payload.old as Record<string, unknown> | undefined;
          const targetPropId = String(newRow?.property_id || oldRow?.property_id || "");
          const currentProps = propertyIdsRef.current;
          const matchesHostProperty = Boolean(targetPropId && currentProps.includes(targetPropId));
          if (matchesHostProperty) {
            onBookingChangeRef.current?.(payload);

            if (newRow) {
              const ref = String(newRow.booking_reference || "QAF-BOOKING");
              if (payload.eventType === "INSERT") {
                addAlert({
                  type: "booking",
                  title: "New Booking Received!",
                  titleAr: "تم استلام حجز جديد!",
                  message: `Booking #${ref} has been created for your property.`,
                  messageAr: `تم إنشاء الحجز #${ref} لإحدى وحداتك المعروضة.`,
                });
              } else if (payload.eventType === "UPDATE") {
                const status = String(newRow.status || "");
                addAlert({
                  type: "booking",
                  title: "Booking Updated",
                  titleAr: "تحديث في بيانات الحجز",
                  message: `Booking #${ref} status changed to ${status}.`,
                  messageAr: `تم تحديث حالة الحجز #${ref} إلى ${status === "confirmed" ? "مؤكد" : status}.`,
                });
              }
            }
          }
        }
      )
      // 2. Listen for Reviews
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          const currentProps = propertyIdsRef.current;
          if (newRow && currentProps.length > 0 && currentProps.includes(String(newRow.property_id))) {
            onReviewChangeRef.current?.(payload);

            if (payload.eventType === "INSERT") {
              addAlert({
                type: "review",
                title: "New Guest Review!",
                titleAr: "تقييم جديد من ضيف!",
                message: `A guest just rated your property ${newRow.rating}/10.`,
                messageAr: `قام أحد الضيوف بتقييم وحدتك بعلامة ${newRow.rating}/10.`,
              });
            }
          }
        }
      )
      // 3. Listen for Host Notifications
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "host_notifications",
          filter: `host_id=eq.${hostId}`,
        },
        (payload) => {
          onNotificationRef.current?.(payload);
          const newRow = payload.new as Record<string, unknown> | undefined;
          if (newRow) {
            addAlert({
              type: "notification",
              title: String(newRow.title || "Notification"),
              titleAr: "إشعار جديد للمضيف",
              message: String(newRow.body || "You have a new update."),
              messageAr: String(newRow.body || "لديك تحديث جديد."),
            });
          }
        }
      )
      // 4. Listen for Property status updates (approvals, revisions, updates)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "properties",
          filter: `host_id=eq.${hostId}`,
        },
        (payload) => {
          onPropertyChangeRef.current?.(payload);
          const newRow = payload.new as Record<string, unknown> | undefined;
          if (newRow && payload.eventType === "UPDATE") {
            const status = String(newRow.status || "");
            const title = String(newRow.title || "Property");
            const isApproved = status === "approved" || Boolean(newRow.is_approved);
            addAlert({
              type: "notification",
              title: isApproved ? "Listing Approved!" : "Listing Updated",
              titleAr: isApproved ? "تمت الموافقة على العقار!" : "تم تحديث بيانات العقار",
              message: isApproved
                ? `Your listing "${title}" has been approved and is now live!`
                : `Listing "${title}" status changed to ${status}.`,
              messageAr: isApproved
                ? `تم اعتماد عقارك "${title}" بنجاح وأصبح متاحاً للضيوف!`
                : `تم تحديث حالة عقارك "${title}" إلى ${status}.`,
            });
          }
        }
      )
      .subscribe((status) => {
        if (!mounted) return;
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [hostId, addAlert]);

  return {
    isConnected,
    alerts,
    dismissAlert,
  };
}

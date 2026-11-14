"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getReviewAuthorizationHeaders } from "@/lib/reviews/client";

export interface ZatcaInvoiceStatusRecord {
  uuid: string;
  invoiceNumber: string;
  bookingReference?: string;
  icv: number;
  environment: "sandbox" | "simulation" | "production";
  clearanceStatus: "REPORTED" | "CLEARED" | "NOT_REPORTED" | "ERROR";
  validationStatus: "PASS" | "WARNING" | "ERROR";
  httpStatus: number;
  invoiceHash: string;
  qrPayload: string;
  signedXml?: string;
  reportedAt: string;
  requestId?: string;
}

export function useZatcaInvoiceStatus(params: {
  kind: "booking" | "wallet";
  id?: string;
  reference?: string;
  invoiceNumber?: string;
  propertyTitle?: string;
  enabled: boolean;
}) {
  const { session } = useAuth();
  const [record, setRecord] = useState<ZatcaInvoiceStatusRecord | null>(null);
  const [syncing, setSyncing] = useState(false);

  const syncWithZatcaApi = useCallback(async () => {
    if (!params.enabled || !params.id) return;
    setSyncing(true);
    try {
      const headers = await getReviewAuthorizationHeaders(session);
      const res = await fetch("/api/invoices/zatca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          kind: params.kind,
          id: params.id,
          reference: params.reference,
          invoiceNumber: params.invoiceNumber,
          propertyTitle: params.propertyTitle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.record) {
          setRecord(data.record as ZatcaInvoiceStatusRecord);
        }
      }
    } catch (err) {
      console.warn("Notice: ZATCA sync notice:", err);
    } finally {
      setSyncing(false);
    }
  }, [params.enabled, params.kind, params.id, params.reference, params.invoiceNumber, params.propertyTitle, session]);

  useEffect(() => {
    if (!params.enabled || !params.id) {
      setRecord(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const headers = await getReviewAuthorizationHeaders(session);
        const q = new URLSearchParams();
        if (params.id) q.set("uuid", params.id);
        if (params.invoiceNumber) q.set("invoiceNumber", params.invoiceNumber);
        if (params.reference) q.set("ref", params.reference);

        const res = await fetch(`/api/invoices/zatca?${q.toString()}`, {
          headers,
          cache: "no-store",
        });

        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (
            data?.found &&
            data?.record &&
            (data.record.clearanceStatus === "REPORTED" || data.record.clearanceStatus === "CLEARED")
          ) {
            setRecord(data.record as ZatcaInvoiceStatusRecord);
            setSyncing(false);
            return;
          }
        }

        // Not reported yet or pending -> report via ZATCA API on-demand
        const postRes = await fetch("/api/invoices/zatca", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            kind: params.kind,
            id: params.id,
            reference: params.reference,
            invoiceNumber: params.invoiceNumber,
            propertyTitle: params.propertyTitle,
          }),
        });

        if (!cancelled && postRes.ok) {
          const postData = await postRes.json();
          if (postData?.record) {
            setRecord(postData.record as ZatcaInvoiceStatusRecord);
          }
        }
      } catch (err) {
        console.warn("Notice: ZATCA lookup fallback:", err);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.enabled, params.id, params.invoiceNumber, params.reference, params.kind, params.propertyTitle, session]);

  return { record, syncing, syncWithZatcaApi };
}

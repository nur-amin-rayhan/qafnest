"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PropertyFullPagePreview } from "@/components/dashboard/PropertyFullPagePreview";
import { PropertyReviewModal } from "@/components/dashboard/PropertyReviewModal";
import { PropertyItem } from "@/components/dashboard/types";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminPath } from "@/lib/adminUrl";
// Fallback catalog of properties if running without DB connection
const MOCK_PROPERTIES: PropertyItem[] = [];

export default function AdminPropertyPreviewPage() {
  const { t, dir } = useAdminAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(params.id || "");

  const initialMock = MOCK_PROPERTIES.find((p) => p.id === id || p.slug === id) || null;
  const [property, setProperty] = useState<PropertyItem | null>(initialMock);
  const [loading, setLoading] = useState(() => !initialMock);
  const [reviewModalTarget, setReviewModalTarget] = useState<PropertyItem | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProperty() {
      try {
        const res = await fetch(adminPath(`/api/admin/properties?id=${encodeURIComponent(id)}`), { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.property && active) {
            setProperty(json.property as PropertyItem);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to client or mock
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .or(`id.eq.${id},slug.eq.${id}`)
          .single();

        if (!error && data && active) {
          setProperty(data as PropertyItem);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local catalog
      }

      const fallback = MOCK_PROPERTIES.find((p) => p.id === id || p.slug === id);
      if (active) {
        setProperty(fallback || null);
        setLoading(false);
      }
    }

    void loadProperty();

    return () => {
      active = false;
    };
  }, [id]);

  const updateStatus = async (status: "approved" | "rejected", feedback?: string) => {
    if (!property) return;
    try {
      const response = await fetch(adminPath("/api/admin/properties"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: property.id,
          status,
          admin_feedback: feedback,
        }),
      });
      if (response.ok) {
        setProperty((prev) =>
          prev
            ? {
                ...prev,
                status,
                is_approved: status === "approved",
                admin_feedback: feedback,
              }
            : null
        );
      }
    } catch {
      setProperty((prev) =>
        prev
          ? {
              ...prev,
              status,
              is_approved: status === "approved",
              admin_feedback: feedback,
            }
          : null
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#08070D]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (!property) {
    return (
      <main
        dir={dir}
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-[#08070D]"
      >
        <span className="material-symbols-outlined text-[48px] text-outline">domain_disabled</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("Listing not found", "العقار غير موجود")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            `The property ID "${id}" was not found in the operations catalog.`,
            `لم يتم العثور على العقار رقم "${id}" في دليل العمليات.`
          )}
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800 transition cursor-pointer"
        >
          {t("Return to Admin Dashboard", "العودة إلى لوحة التحكم")}
        </button>
      </main>
    );
  }

  const handleClosePreview = () => {
    if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
      try {
        window.close();
        return;
      } catch {}
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <PropertyFullPagePreview
        property={property}
        isOpen={true}
        onClose={handleClosePreview}
        onApprove={async () => {
          await updateStatus("approved");
        }}
        onRequestRevisions={(prop) => {
          setReviewModalTarget(prop);
        }}
        isStandalonePage={true}
      />

      <PropertyReviewModal
        property={reviewModalTarget}
        isOpen={Boolean(reviewModalTarget)}
        onClose={() => setReviewModalTarget(null)}
        onSubmitFeedback={async (_propId, feedback) => {
          await updateStatus("rejected", feedback);
          setReviewModalTarget(null);
        }}
      />
    </>
  );
}

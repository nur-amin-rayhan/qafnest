"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { localizePath } from "@/lib/localization/localeHelper";
import { getHostProfile, type HostProfile } from "@/lib/services/hostService";
import HostProfileHeader from "./components/HostProfileHeader";
import HostPropertiesGrid from "./components/HostPropertiesGrid";
import HostReviewsSection from "./components/HostReviewsSection";

export default function HostProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useApp();
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);

  const hostId = params?.id ? decodeURIComponent(params.id) : "";
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!hostId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getHostProfile(hostId)
      .then((profile) => {
        if (mounted) {
          setHost(profile);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setHost(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [hostId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-[#08070D]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6 pt-32">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            <span>{label("Loading host profile…", "جارٍ تحميل الملف التعريفي للمضيف…")}</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-[#08070D]">
        <Navbar />
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-32 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-950 dark:text-white">
            {label("Host Profile Not Found", "لم يتم العثور على ملف المضيف")}
          </h1>
          <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
            {label(
              "The requested host profile does not exist or may have been updated.",
              "ملف المضيف المطلوب غير متوفر حالياً أو ربما تم تحديث معرف الحساب."
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {label("Go back", "الرجوع للخلف")}
            </button>
            <Link
              href={localizePath("/search", language)}
              className="rounded-xl bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
            >
              {label("Browse all stays", "استكشف العقارات")}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hostDisplayName = isAr && host.nameAr ? host.nameAr : host.name;

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-[#08070D]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <HostProfileHeader host={host} language={language} />
        <HostPropertiesGrid
          properties={host.properties}
          hostName={hostDisplayName}
          language={language}
        />
        <HostReviewsSection
          reviews={host.reviews}
          rating={host.rating}
          reviewsCount={host.reviewsCount}
          language={language}
        />
      </main>
      <Footer />
    </div>
  );
}


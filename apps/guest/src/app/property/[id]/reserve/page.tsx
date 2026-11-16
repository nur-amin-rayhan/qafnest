import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import PropertyRouteLoader from "@/components/property/PropertyRouteLoader";
import {
  getSeoAlternates,
  getLocalizedPropertyTitle,
} from "@/lib/localization/localeHelper";
import type { Property } from "@/data/properties";
import {
  extractBilingualPropertyFields,
  isMissingBilingualColumnError,
} from "@qafnest/shared";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [cookieStore, reqHeaders] = await Promise.all([cookies(), headers()]);
  const headerLang = reqHeaders.get("x-qafnest-locale");
  const rawLang = headerLang || cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";
  const propertyId = decodeURIComponent(params.id);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId);
  let property: Pick<Property, "id" | "title" | "titleAr"> | null = null;
  try {
    const supabase = await createClient();
    type ReserveMetadataRow = {
      id: string;
      title: string;
      title_ar?: string | null;
      external_host_id?: string | null;
    };

    const initial = await supabase
      .from("properties")
      .select("id, title, title_ar, external_host_id")
      .eq(isUuid ? "id" : "slug", propertyId)
      .maybeSingle();

    let data = initial.data as ReserveMetadataRow | null;
    const error = initial.error;

    if (error && isMissingBilingualColumnError(error)) {
      const retry = await supabase
        .from("properties")
        .select("id, title, external_host_id")
        .eq(isUuid ? "id" : "slug", propertyId)
        .maybeSingle();
      data = retry.data as ReserveMetadataRow | null;
    }

    if (data) {
      const localized = extractBilingualPropertyFields(data as Record<string, unknown>);
      property = {
        id: data.id,
        title: data.title,
        titleAr: localized.title_ar || undefined,
      };
    }
  } catch {}
  const { alternates, canonical } = getSeoAlternates(`/property/${params.id}/reserve`, lang);

  const title = property
    ? getLocalizedPropertyTitle(property, lang)
    : "";

  const metaTitle =
    lang === "ar"
      ? `تأكيد الحجز والدفع ${title ? `· ${title} ` : ""}| قاف نست`
      : `Review & Pay ${title ? `· ${title} ` : ""}| QAFNEST`;

  const metaDescription =
    lang === "ar"
      ? "راجع تفاصيل إقامتك وتواريخ الحجز ومعلومات الضيوف مع خيارات دفع آمنة وتقسيط تابي وتمارا."
      : "Review your dates, guest details and reservation total with secure payment options and installment plans.";

  return {
    title: metaTitle,
    description: metaDescription,
    alternates,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      locale: lang === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
  };
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#08070D]" />}>
      <PropertyRouteLoader reservation />
    </Suspense>
  );
}

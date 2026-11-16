import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import PropertyRouteLoader from "@/components/property/PropertyRouteLoader";
import {
  getSeoAlternates,
  getLocalizedPropertyTitle,
  getLocalizedPropertyLocation,
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
  let property:
    | Pick<Property, "id" | "title" | "titleAr" | "city" | "cityName" | "district" | "districtAr">
    | null = null;
  try {
    const supabase = await createClient();
    type MetadataPropertyRow = {
      id: string;
      title: string;
      title_ar?: string | null;
      city: string;
      city_name?: string | null;
      district?: string | null;
      district_ar?: string | null;
      external_host_id?: string | null;
    };

    const initial = await supabase
      .from("properties")
      .select("id, title, title_ar, city, city_name, district, district_ar, external_host_id")
      .eq(isUuid ? "id" : "slug", propertyId)
      .maybeSingle();

    let data = initial.data as MetadataPropertyRow | null;
    const error = initial.error;

    if (error && isMissingBilingualColumnError(error)) {
      const retry = await supabase
        .from("properties")
        .select("id, title, city, city_name, district, external_host_id")
        .eq(isUuid ? "id" : "slug", propertyId)
        .maybeSingle();
      data = retry.data as MetadataPropertyRow | null;
    }

    if (data) {
      const localized = extractBilingualPropertyFields(data as Record<string, unknown>);
      property = {
        id: data.id,
        title: data.title,
        titleAr: localized.title_ar || undefined,
        city: data.city,
        cityName: data.city_name || data.city,
        district: data.district || undefined,
        districtAr: localized.district_ar || undefined,
      };
    }
  } catch {}
  const { alternates, canonical } = getSeoAlternates(`/property/${params.id}`, lang);

  const title = property
    ? getLocalizedPropertyTitle(property, lang)
    : lang === "ar"
    ? "تفاصيل الإقامة"
    : "Stay Details";

  const { location } = property
    ? getLocalizedPropertyLocation(property, lang)
    : { location: lang === "ar" ? "المملكة العربية السعودية" : "Saudi Arabia" };

  const metaTitle =
    lang === "ar"
      ? `${title} · ${location} | قاف نست`
      : `${title} in ${location} | QAFNEST`;

  const metaDescription =
    lang === "ar"
      ? `احجز ${title} في ${location} عبر منصة قاف نست. استمتع بإقامة فاخرة، دخول ذاتي ذكي، وتقسيط ميسر بدون فوائد.`
      : `Book ${title} in ${location} on QAFNEST. Enjoy premium vacation stays, smart-lock check-in, and interest-free installments.`;

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

export default function PropertyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#08070D]" />}>
      <PropertyRouteLoader />
    </Suspense>
  );
}

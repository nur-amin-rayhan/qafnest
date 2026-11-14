"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useHostAuth } from "@/context/HostAuthContext";
import { HostNavbar } from "@/components/landing/HostNavbar";
import { HostHero } from "@/components/landing/HostHero";
import { HostWhyUs } from "@/components/landing/HostWhyUs";
import { EarningsCalculator } from "@/components/landing/EarningsCalculator";
import { HostSteps } from "@/components/landing/HostSteps";
import { HostProtection } from "@/components/landing/HostProtection";
import { HostCtaBanner } from "@/components/landing/HostCtaBanner";
import { HostFooter } from "@/components/landing/HostFooter";
import {
  PropertyCalcType,
  CityCalcKey,
  EARNINGS_MATRIX,
  PROPERTY_TYPE_LABELS,
  CITY_LABELS,
} from "@/components/landing/types";

function HostAuthRequiredHandler() {
  const searchParams = useSearchParams();
  const { openHostAuthModal, user, loading } = useHostAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.sessionStorage.getItem("qafnest_host_is_logging_out") === "1") {
        window.sessionStorage.removeItem("qafnest_host_is_logging_out");
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("auth");
          url.searchParams.delete("returnUrl");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        } catch {}
        return;
      }
    }
    if (loading) return;
    const authRequired = searchParams.get("auth");
    const returnUrl = searchParams.get("returnUrl") || "/app";
    if (authRequired === "required" && !user && !handledRef.current) {
      handledRef.current = true;
      openHostAuthModal("signin", returnUrl);
    }
  }, [searchParams, user, loading, openHostAuthModal]);

  return null;
}

export default function BusinessLandingPage() {
  const router = useRouter();
  const { user, profile, signOut, openHostAuthModal, lang, setLang, t } = useHostAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculator state (matching Gathern's 1- Property Type, 2- City, 3- Expected SAR/month)
  const [calcType, setCalcType] = useState<PropertyCalcType>("chalet");
  const [calcCity, setCalcCity] = useState<CityCalcKey>("riyadh");
  const [calcModal, setCalcModal] = useState<"type" | "city" | null>(null);
  const [howCalculatedOpen, setHowCalculatedOpen] = useState(false);

  const expectedMonthlySar = EARNINGS_MATRIX[calcCity][calcType];
  const selectedTypeObj = PROPERTY_TYPE_LABELS.find((item) => item.id === calcType)!;
  const selectedCityObj = CITY_LABELS.find((item) => item.id === calcCity)!;

  const hostUrl =
    process.env.NEXT_PUBLIC_HOST_URL ||
    process.env.NEXT_PUBLIC_HOST_PORTAL_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://business.qafnest.com"
      : "http://localhost:3001");
  const canonicalUrl = `${hostUrl}/?lang=${lang}`;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-white text-slate-900 font-body selection:bg-violet-200"
    >
      {/* Dynamic Canonical & Hreflang Tags for Host View */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="ar" href={`${hostUrl}/?lang=ar`} />
      <link rel="alternate" hrefLang="en" href={`${hostUrl}/?lang=en`} />
      <link rel="alternate" hrefLang="x-default" href={`${hostUrl}/`} />

      {/* 1. Header Navigation */}
      <HostNavbar
        lang={lang}
        setLang={setLang}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        mounted={mounted}
        user={user}
        profile={profile}
        signOut={signOut}
        openHostAuthModal={openHostAuthModal}
        t={t}
      />

      {/* 2. Hero Section */}
      <HostHero
        t={t}
        user={user}
        router={router}
        openHostAuthModal={openHostAuthModal}
      />

      {/* 3. Core Host Benefits */}
      <HostWhyUs t={t} lang={lang} />

      {/* 4. Interactive Monthly Earnings Calculator */}
      <EarningsCalculator
        lang={lang}
        t={t}
        calcType={calcType}
        setCalcType={setCalcType}
        calcCity={calcCity}
        setCalcCity={setCalcCity}
        calcModal={calcModal}
        setCalcModal={setCalcModal}
        howCalculatedOpen={howCalculatedOpen}
        setHowCalculatedOpen={setHowCalculatedOpen}
        expectedMonthlySar={expectedMonthlySar}
        selectedTypeObj={selectedTypeObj}
        selectedCityObj={selectedCityObj}
      />

      {/* 5. How to Host Steps */}
      <HostSteps t={t} lang={lang} />

      {/* 6. Host Protection Program */}
      <HostProtection t={t} />

      {/* 7. Mobile App & Dashboard Showcase */}
      <HostCtaBanner t={t} lang={lang} />

      {/* 8. Footer */}
      <HostFooter t={t} />

      {/* URL Parameter Auth Trigger Handler (?auth=required) */}
      <Suspense fallback={null}>
        <HostAuthRequiredHandler />
      </Suspense>
    </div>
  );
}

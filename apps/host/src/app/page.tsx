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
import { localizeHostPath } from "@/lib/hostLocale";

function HostAuthRequiredHandler() {
  const searchParams = useSearchParams();
  const { openHostAuthModal, user, loading, lang } = useHostAuth();
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
    const returnUrl = searchParams.get("returnUrl") || localizeHostPath("/app", lang);
    if (authRequired === "required" && !user && !handledRef.current) {
      handledRef.current = true;
      openHostAuthModal("signin", returnUrl);
    }
  }, [searchParams, user, loading, openHostAuthModal, lang]);

  return null;
}

export default function BusinessLandingPage() {
  const router = useRouter();
  const { user, profile, signOut, openHostAuthModal, lang, setLang, t, theme, toggleTheme } = useHostAuth();
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

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-white dark:bg-[#0b0c16] text-slate-900 dark:text-slate-100 font-body transition-colors selection:bg-[#4F2396]/20"
    >
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
        theme={theme}
        toggleTheme={toggleTheme}
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

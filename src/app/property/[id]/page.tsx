import type { Metadata } from "next";
import { Suspense } from "react";
import PropertyRouteLoader from "@/components/property/PropertyRouteLoader";

export const metadata: Metadata = {
  title: "Stay details | QAFNEST",
  description: "Explore your Saudi stay, amenities, dates and booking details.",
};

export default function PropertyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#08070D]" />}>
      <PropertyRouteLoader />
    </Suspense>
  );
}

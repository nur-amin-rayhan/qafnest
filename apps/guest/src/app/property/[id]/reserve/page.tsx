import type { Metadata } from "next";
import { Suspense } from "react";
import PropertyRouteLoader from "@/components/property/PropertyRouteLoader";

export const metadata: Metadata = {
  title: "Review & Pay | QAFNEST",
  description: "Review your dates, guest details and reservation total.",
};

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#08070D]" />}>
      <PropertyRouteLoader reservation />
    </Suspense>
  );
}

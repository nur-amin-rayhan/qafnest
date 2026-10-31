import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ReservationReview from "@/components/property/ReservationReview";
import { PROPERTIES } from "@/data/properties";

interface ReservationPageProps {
  params: { id: string };
}

export function generateMetadata({ params }: ReservationPageProps): Metadata {
  const property = PROPERTIES.find((item) => item.id === decodeURIComponent(params.id));
  if (!property) return { title: "Stay not found | QAFNEST" };

  return {
    title: `Review & Pay · ${property.title} | QAFNEST`,
    description: `Review your dates, guest details and reservation total for ${property.title}.`,
  };
}

export default function ReservationPage({ params }: ReservationPageProps) {
  const property = PROPERTIES.find((item) => item.id === decodeURIComponent(params.id));
  if (!property) notFound();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#08070D]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        </div>
      }
    >
      <ReservationReview property={property} />
    </Suspense>
  );
}

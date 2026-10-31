"use client";

import { useParams } from "next/navigation";
import { useProperties } from "@/hooks/useProperties";
import PropertyDetail from "@/components/property/PropertyDetail";
import ReservationReview from "@/components/property/ReservationReview";

export default function PropertyRouteLoader({ reservation = false }: { reservation?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { properties, loading } = useProperties();
  const property = properties.find((item) => item.id === id);

  if (property) return reservation ? <ReservationReview property={property} /> : <PropertyDetail property={property} />;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#08070D]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center dark:bg-[#08070D]">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Stay not found</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">This property may have been removed or is not available.</p>
      <a href="/search" className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white">Back to search</a>
    </main>
  );
}

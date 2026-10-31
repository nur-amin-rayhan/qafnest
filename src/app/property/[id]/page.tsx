import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PropertyDetail from "@/components/property/PropertyDetail";
import { PROPERTIES } from "@/data/properties";

interface PropertyPageProps {
  params: { id: string };
}

export function generateMetadata({ params }: PropertyPageProps): Metadata {
  const property = PROPERTIES.find((item) => item.id === decodeURIComponent(params.id));
  if (!property) return { title: "Stay not found | QAFNEST" };

  const location = property.district || property.cityName;
  return {
    title: `${property.title} | QAFNEST`,
    description: `${property.categoryName} in ${location}. Rated ${property.rating} from ${property.reviewsCount} guest reviews.`,
  };
}

export default function PropertyPage({ params }: PropertyPageProps) {
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
      <PropertyDetail property={property} />
    </Suspense>
  );
}

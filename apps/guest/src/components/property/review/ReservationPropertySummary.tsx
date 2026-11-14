import React from "react";
import Image from "next/image";
import { MapPin, Star, Users } from "lucide-react";
import type { Property } from "@/data/properties";

interface ReservationPropertySummaryProps {
  property: Property;
  title: string;
  category: string;
  location: string;
  capacity: number;
  label: (en: string, ar: string) => string;
}

export function ReservationPropertySummary({
  property,
  title,
  category,
  location,
  capacity,
  label,
}: ReservationPropertySummaryProps) {
  return (
    <section className="rounded-3xl border border-violet-200/85 bg-white p-5 shadow-[0_12px_35px_rgba(109,40,217,0.06)] dark:border-violet-500/20 dark:bg-[#12101a] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-28 sm:w-40">
          <Image
            src={
              property.image ||
              "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"
            }
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 160px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
            {category}
          </span>
          <h2 className="mt-1 text-lg font-bold text-gray-950 dark:text-white">
            {title}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              {property.rating > 0 ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {property.rating.toFixed(1)} / 10 ({property.reviewsCount}{" "}
                  {label("reviews", "تقييم")})
                </>
              ) : (
                label("No ratings yet", "لا توجد تقييمات بعد")
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-violet-500" />
              {location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-violet-500" />
              {label("Up to", "حتى")} {capacity} {label("guests", "ضيوف")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}


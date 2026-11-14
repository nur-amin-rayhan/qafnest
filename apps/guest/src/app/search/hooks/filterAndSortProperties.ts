import type { Property } from "@/data/properties";
import { getPropertyCapacity, normalizeCityId } from "@/data/properties";
import { isPropertyAvailable } from "@/lib/services/availability";

export interface PropertyFilterCriteria {
  searchQuery?: string;
  activeCity: string;
  selectedCategory: string;
  selectedDistrict: string;
  selectedDirection: string;
  dealsOnly: boolean;
  minRating: number;
  priceRange: "all" | "under500" | "500to1000" | "above1000";
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  instantOnly: boolean;
  poolOnly: boolean;
  selfCheckinOnly: boolean;
  guestsCount: number;
  checkinDate?: string;
  checkoutDate?: string;
}

export function filterProperties(
  properties: Property[],
  criteria: PropertyFilterCriteria
): Property[] {
  return properties.filter((p) => {
    // 0. Search Query (Title, TitleAr, District, DistrictAr, Address, City, Description, DescriptionAr)
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim();
      const titleMatch = (p.title || "").toLowerCase().includes(q);
      const titleArMatch = (p.titleAr || "").toLowerCase().includes(q);
      const distMatch = (p.district || "").toLowerCase().includes(q);
      const distArMatch = (p.districtAr || "").toLowerCase().includes(q);
      const addrMatch =
        (p.address || "").toLowerCase().includes(q) ||
        (p.addressAr || "").toLowerCase().includes(q);
      const cityMatch = (p.city || "").toLowerCase().includes(q);
      const descMatch =
        (p.description || "").toLowerCase().includes(q) ||
        (p.descriptionAr || "").toLowerCase().includes(q);
      if (!titleMatch && !titleArMatch && !distMatch && !distArMatch && !addrMatch && !cityMatch && !descMatch) {
        return false;
      }
    }

    // 1. City match
    if (criteria.activeCity !== "all" && normalizeCityId(p.city) !== criteria.activeCity) {
      return false;
    }

    // 2. Category match
    if (criteria.selectedCategory !== "all") {
      if (
        criteria.selectedCategory === "villa" ||
        criteria.selectedCategory === "apartments" ||
        criteria.selectedCategory === "villa-apartment"
      ) {
        if (p.category !== "villa" && p.category !== "penthouse") return false;
      } else if (p.category !== criteria.selectedCategory) {
        return false;
      }
    }

    // 3. District match
    if (criteria.selectedDistrict !== "all") {
      const needle = criteria.selectedDistrict.toLowerCase();
      const distEn = (p.district || "").toLowerCase();
      const distAr = (p.districtAr || "").toLowerCase();
      if (!distEn.includes(needle) && !distAr.includes(needle)) return false;
    }

    // 4. Direction match
    if (criteria.selectedDirection !== "all" && p.direction !== criteria.selectedDirection) {
      return false;
    }

    // 5. Deals Only
    if (criteria.dealsOnly && (!p.discountPercentage || p.discountPercentage <= 0)) {
      return false;
    }

    // 6. Rating match
    if (criteria.minRating > 0 && p.rating < criteria.minRating) return false;

    // 7. Price range
    if (criteria.priceRange === "under500" && p.basePrice >= 500) return false;
    if (
      criteria.priceRange === "500to1000" &&
      (p.basePrice < 500 || p.basePrice > 1000)
    ) {
      return false;
    }
    if (criteria.priceRange === "above1000" && p.basePrice <= 1000) return false;

    if (p.basePrice < criteria.minPrice || p.basePrice > criteria.maxPrice) return false;

    // 8. Bedrooms
    if (criteria.bedrooms > 0 && (p.bedroomsCount ?? 0) < criteria.bedrooms) return false;

    // 9. Instant / Pool / Self-checkin
    if (criteria.instantOnly && !p.instantBook) return false;
    if (criteria.poolOnly && !p.hasPool) return false;
    if (criteria.selfCheckinOnly && !p.selfCheckin) return false;
    if (getPropertyCapacity(p) < criteria.guestsCount) return false;

    // 10. Date Availability
    if (
      criteria.checkinDate &&
      criteria.checkoutDate &&
      !isPropertyAvailable(p.id, criteria.checkinDate, criteria.checkoutDate)
    ) {
      return false;
    }

    return true;
  });
}

export function sortProperties(
  properties: Property[],
  sortBy: "recommended" | "price-low" | "price-high" | "rating" | "reviews"
): Property[] {
  if (sortBy === "recommended") return properties;
  return [...properties].sort((a, b) => {
    if (sortBy === "price-low" || sortBy === "price-high") {
      const priceA = a.basePrice;
      const priceB = b.basePrice;
      return sortBy === "price-low" ? priceA - priceB : priceB - priceA;
    }
    if (sortBy === "rating") return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
    return b.reviewsCount - a.reviewsCount || b.rating - a.rating;
  });
}


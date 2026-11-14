import {
  calculateGranularStayRate,
  normalizeSaudiCityId,
  type GranularWeeklyPricing,
} from "@qafnest/shared";

export interface Property {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  titleAr?: string;
  descriptionAr?: string;
  city: string;
  cityName: string;
  district?: string;
  districtAr?: string;
  address?: string;
  addressAr?: string;
  street?: string;
  streetAr?: string;
  postalCode?: string;
  state?: string;
  stateAr?: string;
  googleMapsUrl?: string;
  category: 'chalet' | 'villa' | 'farm' | 'camp' | 'penthouse';
  categoryName: string;
  rating: number;
  reviewsCount: number;
  specs: string;
  image: string;
  images?: string[];
  features: string[];
  basePrice: number; // in SAR
  weekdayPrice?: number;
  weekendPrice?: number;
  customDayPricing?: GranularWeeklyPricing;
  sundayPrice?: number;
  mondayPrice?: number;
  tuesdayPrice?: number;
  wednesdayPrice?: number;
  thursdayPrice?: number;
  fridayPrice?: number;
  saturdayPrice?: number;
  dateOverrides?: Record<string, number>;
  originalPrice?: number;
  discountPercentage?: number;
  isLicensed?: boolean;
  instantBook?: boolean;
  hasPool?: boolean;
  selfCheckin?: boolean;
  isApproved?: boolean;
  status?: "approved" | "pending" | "rejected";
  section?: 'kidia' | 'sea' | 'fog' | 'roses' | 'deals' | 'general' | 'search';
  areaSqm?: number;
  capacity?: number;
  bedroomsCount?: number;
  bathroomsCount?: number;
  livingRoomsCount?: number;
  chaletForAr?: string;
  amenities?: string[];
  poolDetails?: {
    type?: 'outdoor' | 'indoor' | 'none';
    hasBarrier?: boolean;
    dimensions?: string;
    depth?: string;
  };
  majlisDetails?: {
    mainMajlisCapacity?: number;
    outdoorSeatingCapacity?: number;
  };
  checkinTime?: string;
  checkoutTime?: string;
  direction?: 'north' | 'south' | 'east' | 'west';
  lat?: number;
  lng?: number;
  /** Public-facing unit reference when supplied by the listing source. */
  unitCode?: string;
  tourismLicenseNumber?: string;
  guestPolicy?: string;
  amenityGroups?: Array<{ name: string; items: string[] }>;
  bookingConditions?: string[];
  cancellationPolicy?: string;
  hostId?: string;
  host?: {
    id?: string;
    name: string;
    nameAr?: string;
    avatar?: string;
    reviewsCount?: number;
    propertiesCount?: number;
    profileHref?: string;
    badge?: string;
    badgeAr?: string;
    about?: string;
    aboutAr?: string;
    responseRate?: string;
    responseTime?: string;
    rating?: number;
    verified?: boolean;
    memberSince?: string;
  };
  reviewBreakdown?: Array<{ label: string; score: number }>;
  guestReviews?: Array<{
    author: string;
    date: string;
    rating: number;
    comment: string;
    hostReply?: string;
  }>;
  videos?: string[];
}

/** Normalize legacy/public destination IDs to the IDs used by property data. */
export function normalizeCityId(city: string): string {
  if (!city || city === "all") return city;
  return normalizeSaudiCityId(city) || city.toLowerCase();
}

/** Read capacity from structured data first, then from the legacy specs string. */
export function getPropertyCapacity(
  property: Pick<Property, "capacity" | "specs">
): number {
  if (typeof property.capacity === "number") return property.capacity;

  const match = property.specs.match(/(?:up\s*to\s*)?(\d+)\s*guests?\b/i);
  return match ? Number(match[1]) : 4;
}

/** Granular 7-day pricing & date override resolution with master base price fallback. */
export function getStayTotal(
  property: Pick<Property, "basePrice"> & Partial<Property>,
  checkinDate: string,
  nights: number,
  options?: { dateOverrides?: Record<string, number> }
) {
  if (!checkinDate || !Number.isFinite(nights) || nights <= 0) {
    return property.basePrice || 0;
  }
  const weeklyPricing = property.customDayPricing || {
    sunday: property.sundayPrice,
    monday: property.mondayPrice,
    tuesday: property.tuesdayPrice,
    wednesday: property.wednesdayPrice,
    thursday: property.thursdayPrice,
    friday: property.fridayPrice,
    saturday: property.saturdayPrice,
  };
  const dateOverrides = options?.dateOverrides || property.dateOverrides || null;
  const { totalStayRate } = calculateGranularStayRate(checkinDate, nights, {
    masterBasePrice: property.basePrice,
    weeklyPricing,
    weekdayPrice: property.weekdayPrice,
    weekendPrice: property.weekendPrice,
    dateOverrides,
  });
  return totalStayRate;
}

export interface Deal {
  id: string;
  title: string;
  location: string;
  categoryName: string;
  rating: number;
  reviewsCount: number;
  description: string;
  amenities: string[];
  image: string;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  savings: number;
}

export interface Destination {
  id: string;
  city: string;
  name: string;
  subtitle: string;
  count: number;
  image: string;
  isMonthly?: boolean;
}

export interface LifestyleCollection {
  id: string;
  type: 'chalet' | 'villa' | 'farm' | 'camp';
  title: string;
  subtitle: string;
  countTag: string;
  description: string;
  image: string;
  icon: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ReviewItem {
  quote: string;
  author: string;
  location: string;
  avatar: string;
}

export interface StoryItem {
  id: string;
  title: string;
  tag: string;
  readTime: string;
  summary: string;
  author: string;
  image: string;
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'monthly',
    city: 'all',
    name: 'Monthly Stays',
    subtitle: 'Save up to 35% on extended bookings',
    count: 0,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&fit=crop',
    isMonthly: true,
  },
  {
    id: 'riyadh',
    city: 'riyadh',
    name: 'Riyadh',
    subtitle: 'Al-Ammariyah & Diriyah Chalets',
    count: 0,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&fit=crop',
  },
  {
    id: 'jeddah',
    city: 'jeddah',
    name: 'Jeddah',
    subtitle: 'Obhur Waterfront Villas',
    count: 0,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&fit=crop',
  },
  {
    id: 'khobar',
    city: 'khobar',
    name: 'Al Khobar',
    subtitle: 'Eastern Province Seaside Retreats',
    count: 0,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&fit=crop',
  },
  {
    id: 'abha',
    city: 'abha',
    name: 'Abha',
    subtitle: 'Al-Soudah Misty Mountain Chalets',
    count: 0,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&fit=crop',
  },
  {
    id: 'alula',
    city: 'alula',
    name: 'AlUla',
    subtitle: 'Desert & Stargazing Glamping',
    count: 0,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&fit=crop',
  },
  {
    id: 'taif',
    city: 'taif',
    name: 'Taif',
    subtitle: 'Al Hada & Rose Valley Retreats',
    count: 0,
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&fit=crop',
  },
  {
    id: 'mecca',
    city: 'mecca',
    name: 'Mecca',
    subtitle: 'Holy City Luxury Accommodations',
    count: 0,
    image: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=400&fit=crop',
  },
  {
    id: 'dammam',
    city: 'dammam',
    name: 'Dammam',
    subtitle: 'Arabian Gulf Shoreline Chalets',
    count: 0,
    image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&fit=crop',
  },
  {
    id: 'alhafuf',
    city: 'alhafuf',
    name: 'Alhafuf',
    subtitle: 'Al-Ahsa Oasis Heritage Farms',
    count: 0,
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&fit=crop',
  },
  {
    id: 'tabuk',
    city: 'tabuk',
    name: 'Tabuk',
    subtitle: 'Red Sea Shoreline & Desert Lodges',
    count: 0,
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=400&fit=crop',
  },
  {
    id: 'buraidah',
    city: 'buraidah',
    name: 'Buraidah',
    subtitle: 'Al-Qassim Date Palm Ranches',
    count: 0,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&fit=crop',
  },
];

export const PROPERTIES: Property[] = [];

export const DEALS: Deal[] = [];

export const LIFESTYLE_COLLECTIONS: LifestyleCollection[] = [];

export const FAQS: FaqItem[] = [
  {
    question: 'What is the QafNest platform and how is it licensed in Saudi Arabia?',
    answer: 'QafNest is an authorized peer-to-peer vacation rental and hospitality platform, officially licensed and supervised by the Saudi Ministry of Tourism (License No. 73102999). We directly connect travelers with verified chalets, private villas, heritage farms, and luxury glamping sanctuaries across the Kingdom with full consumer protection and guaranteed reservation security.',
  },
  {
    question: 'How does Self Check-in with Digital Smart Locks work?',
    answer: 'Properties with the "Self Check-in" badge offer contactless access. Once your reservation is confirmed, your host manually configures your personal smart lock PIN and shares it on your "My Bookings" page and via WhatsApp before arrival.',
  },
  {
    question: 'Can I split my reservation payment in 4 installments with Tabby or Tamara?',
    answer: 'Yes! During checkout, select either Tabby or Tamara as your payment method. Your total booking amount will be divided into 4 equal monthly installments with 0% interest and 0 hidden fees. First installment is paid at booking confirmation, and the remaining 3 are automatically deducted monthly. All installments are Sharia-compliant and approved by SAMA.',
  },
  {
    question: 'What is the cancellation and refund policy?',
    answer: 'The reservation cannot be cancelled or postponed.',
  },
  {
    question: 'Can I host a large family banquet or celebration at a chalet or farm?',
    answer: 'Absolutely. Most of our chalets, villas, and farms are custom-architected for Saudi social culture, featuring separate expansive men’s and women’s majlis, outdoor barbecue facilities, children’s splash zones, and catering kitchens. Please check each property’s "Guest Capacity" spec on the booking card before finalizing your date.',
  },
  {
    question: 'How do I list my property as a host and what are the earnings?',
    answer: 'Listing your chalet, farm, or villa takes only 2 minutes via our Host Portal with automated calendar synchronization and prompt direct bank transfers.',
  },
];

export const REVIEWS: ReviewItem[] = [];

export const STORIES: StoryItem[] = [
  {
    id: 'story-1',
    title: 'Al-Ammariyah: The Modern Riyadh Retreat for Heated Pool Chalets',
    tag: 'Riyadh Getaway',
    readTime: '4 min read',
    summary: 'Why this serene valley north of Diriyah has become Saudi Arabia’s favorite destination for private family weekends away from city lights.',
    author: 'QafNest Editorial Team',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&fit=crop',
  },
  {
    id: 'story-2',
    title: 'Obhur Waterfront: Private Villas with Direct Sea Access & Yacht Docks',
    tag: 'Jeddah Coast',
    readTime: '5 min read',
    summary: 'Everything you need to know about booking private coastal residences along Obhur Creek for jet-skiing, boat rentals, and coastal serenity.',
    author: 'Red Sea Living',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&fit=crop',
  },
  {
    id: 'story-3',
    title: 'AlUla After Dark: Glamping Under Celestial Skies & Ancient Canyons',
    tag: 'Heritage & Desert',
    readTime: '3 min read',
    summary: 'Step inside architecturally breathtaking geodesic domes nestled between 2,000-year-old sandstone cliffs and unpolluted starry nights.',
    author: 'Heritage Explorers',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&fit=crop',
  },
];

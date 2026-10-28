export interface Property {
  id: string;
  title: string;
  city: 'riyadh' | 'jeddah' | 'alula' | 'khobar' | 'abha';
  cityName: string;
  category: 'chalet' | 'villa' | 'farm' | 'camp' | 'penthouse';
  categoryName: string;
  rating: number;
  reviewsCount: number;
  specs: string;
  image: string;
  features: string[];
  basePrice: number; // in SAR
  isLicensed?: boolean;
  instantBook?: boolean;
  hasPool?: boolean;
  selfCheckin?: boolean;
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
  city: 'riyadh' | 'jeddah' | 'alula' | 'khobar' | 'abha';
  name: string;
  subtitle: string;
  count: number;
  image: string;
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
    id: 'riyadh',
    city: 'riyadh',
    name: 'Riyadh (الرياض)',
    subtitle: 'Al-Ammariyah & Diriyah Chalets',
    count: 245,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop',
  },
  {
    id: 'jeddah',
    city: 'jeddah',
    name: 'Jeddah (جدة)',
    subtitle: 'Obhur Waterfront Villas',
    count: 180,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop',
  },
  {
    id: 'alula',
    city: 'alula',
    name: 'AlUla (العلا)',
    subtitle: 'Desert & Stargazing Glamping',
    count: 94,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&fit=crop',
  },
  {
    id: 'khobar',
    city: 'khobar',
    name: 'Al Khobar (الخبر)',
    subtitle: 'Eastern Province Seaside Retreats',
    count: 112,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop',
  },
  {
    id: 'abha',
    city: 'abha',
    name: 'Abha & Asir (أبها)',
    subtitle: 'Misty Mountain Havens',
    count: 76,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&fit=crop',
  },
];

export const PROPERTIES: Property[] = [
  {
    id: 'ammariyah-royal',
    title: 'Al-Ammariyah Royal Chalet',
    city: 'riyadh',
    cityName: 'Riyadh · Al-Ammariyah',
    category: 'chalet',
    categoryName: 'Chalet & Resort',
    rating: 4.98,
    reviewsCount: 64,
    specs: '6 Guests · 3 Bedrooms · Heated Pool',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop',
    features: ['🏊 Heated Pool', '🔑 Self Check-in', '🍖 BBQ Majlis'],
    basePrice: 1850,
    isLicensed: true,
    instantBook: true,
    hasPool: true,
    selfCheckin: true,
  },
  {
    id: 'obhur-waterfront',
    title: 'Obhur Waterfront Seaside Villa',
    city: 'jeddah',
    cityName: 'Jeddah · Obhur Creek',
    category: 'villa',
    categoryName: 'Private Villa',
    rating: 4.97,
    reviewsCount: 52,
    specs: '10 Guests · 5 Bedrooms · Private Marina',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&fit=crop',
    features: ['🌊 Boat Mooring', '🏊 Infinity Pool', '🛡️ Full Privacy'],
    basePrice: 3200,
    isLicensed: true,
    instantBook: true,
    hasPool: true,
    selfCheckin: true,
  },
  {
    id: 'alula-stargazing',
    title: 'AlUla Sky-Dome Desert Sanctuary',
    city: 'alula',
    cityName: 'AlUla · Sharaan Valley',
    category: 'camp',
    categoryName: 'Luxury Desert Camp',
    rating: 4.99,
    reviewsCount: 78,
    specs: '4 Guests · 2 Skylight Domes · Fire Pit',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&fit=crop',
    features: ['✨ Glass Ceiling', '🔥 Desert Fire Pit', '🔭 Telescope'],
    basePrice: 1650,
    isLicensed: true,
    instantBook: true,
    hasPool: false,
    selfCheckin: true,
  },
  {
    id: 'diriyah-heritage',
    title: 'Diriyah Oasis Heritage Farm',
    city: 'riyadh',
    cityName: 'Riyadh · Historical Diriyah',
    category: 'farm',
    categoryName: 'Country Farm',
    rating: 4.95,
    reviewsCount: 41,
    specs: '16 Guests · 4 Suites · Date Orchards',
    image: 'https://images.unsplash.com/photo-1595828456208-d2e8e3d81b29?w=800&fit=crop',
    features: ['🌴 Palm Grove', '🏇 Equestrian Pad', '☕ Arabic Majlis'],
    basePrice: 2400,
    isLicensed: true,
    instantBook: true,
    hasPool: true,
    selfCheckin: false,
  },
  {
    id: 'khobar-azure',
    title: 'Corniche Sky Penthouse & Jacuzzi',
    city: 'khobar',
    cityName: 'Al Khobar · Prince Turki Coast',
    category: 'penthouse',
    categoryName: 'Sky Penthouse',
    rating: 4.96,
    reviewsCount: 39,
    specs: '6 Guests · 3 Suites · Rooftop Spa',
    image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&fit=crop',
    features: ['🌇 Panoramic Bay', '🛁 Jacuzzi Terrace', '🔑 Digital Entry'],
    basePrice: 2750,
    isLicensed: true,
    instantBook: true,
    hasPool: false,
    selfCheckin: true,
  },
  {
    id: 'abha-mountain',
    title: 'Asir Cloud Vista Pine Chalet',
    city: 'abha',
    cityName: 'Abha · Al-Soudah Heights',
    category: 'chalet',
    categoryName: 'Mountain Chalet',
    rating: 4.94,
    reviewsCount: 33,
    specs: '8 Guests · 4 Bedrooms · Misty Balcony',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&fit=crop',
    features: ['🌲 Cloud Forest', '🔥 Wood Stove', '☕ Fog Terraces'],
    basePrice: 1550,
    isLicensed: true,
    instantBook: true,
    hasPool: false,
    selfCheckin: true,
  },
  {
    id: 'najd-palace',
    title: 'Najd Sovereign Private Estate',
    city: 'riyadh',
    cityName: 'Riyadh · Al-Malqa District',
    category: 'villa',
    categoryName: 'Private Villa',
    rating: 4.99,
    reviewsCount: 57,
    specs: '14 Guests · 6 Master Suites · Indoor Pool',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop',
    features: ['🏊 Olympic Pool', '🎬 Private Cinema', '🍽️ Butler Staff'],
    basePrice: 4800,
    isLicensed: true,
    instantBook: true,
    hasPool: true,
    selfCheckin: true,
  },
  {
    id: 'azure-lagoon',
    title: 'The Azure Overwater Lagoon Pavilion',
    city: 'jeddah',
    cityName: 'Jeddah · South Obhur Bay',
    category: 'villa',
    categoryName: 'Waterfront Villa',
    rating: 4.98,
    reviewsCount: 68,
    specs: '8 Guests · 4 Suites · Overwater Deck',
    image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&fit=crop',
    features: ['🌊 Sea Sunsets', '🏊 Heated Plunge', '🔑 Instant Key'],
    basePrice: 3400,
    isLicensed: true,
    instantBook: true,
    hasPool: true,
    selfCheckin: true,
  },
];

export const DEALS: Deal[] = [
  {
    id: 'deal-ammariyah',
    title: 'Al-Ammariyah Sunset Oasis Chalet',
    location: 'Riyadh · Al-Ammariyah',
    categoryName: 'Private Chalet & Resort',
    rating: 4.96,
    reviewsCount: 42,
    description: 'Heated infinity pool, cinema room, lush palm garden, and separate family majlis with smart digital lock.',
    amenities: ['🏊 Heated Pool', '🔑 Self Check-in', '🍖 BBQ Terrace'],
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop',
    originalPrice: 2800,
    discountPrice: 1680,
    discountPercentage: 40,
    savings: 1120,
  },
  {
    id: 'deal-obhur',
    title: 'Obhur North Marine Residence',
    location: 'Jeddah · Obhur North',
    categoryName: 'Waterfront Villa',
    rating: 4.98,
    reviewsCount: 38,
    description: 'Private sea pier, panoramic Red Sea views, private infinity pool, and expansive rooftop deck for sunset dinners.',
    amenities: ['🌊 Sea Pier', '🏊 Infinity Pool', '🛡️ 100% Privacy'],
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&fit=crop',
    originalPrice: 3500,
    discountPrice: 2450,
    discountPercentage: 30,
    savings: 1050,
  },
  {
    id: 'deal-alula',
    title: 'AlUla Sharaan Stargazing Dome',
    location: 'AlUla · Sharaan',
    categoryName: 'Desert Camp & Dome',
    rating: 4.99,
    reviewsCount: 51,
    description: 'Transparent stargazing ceiling, sunken outdoor fire majlis, astronomy telescope, and heated plunge pool.',
    amenities: ['✨ Stargazing Dome', '🔥 Fire Majlis', '🔭 Telescope'],
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&fit=crop',
    originalPrice: 2200,
    discountPrice: 1540,
    discountPercentage: 30,
    savings: 660,
  },
];

export const LIFESTYLE_COLLECTIONS: LifestyleCollection[] = [
  {
    id: 'col-pool',
    type: 'chalet',
    title: 'Heated Pools & Water Games',
    subtitle: 'Year-Round Warmth',
    countTag: '120+ Stays',
    description: 'Temperature-regulated private indoor and outdoor pools with absolute privacy for family swimming.',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&fit=crop',
    icon: 'waves',
  },
  {
    id: 'col-villa',
    type: 'villa',
    title: 'Family Privacy & Majlis',
    subtitle: 'Full Seclusion',
    countTag: '85+ Estates',
    description: "High perimeter walls, separate men's and women's modern majlis, and private servant suites.",
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&fit=crop',
    icon: 'shield-check',
  },
  {
    id: 'col-farm',
    type: 'farm',
    title: 'Country Farms & Orchards',
    subtitle: 'Nature & Fresh Air',
    countTag: '64+ Farms',
    description: 'Lush date palm groves, horse paddocks, open-air barbecue terraces, and wide lawns for banquets.',
    image: 'https://images.unsplash.com/photo-1595828456208-d2e8e3d81b29?w=600&fit=crop',
    icon: 'trees',
  },
  {
    id: 'col-camp',
    type: 'camp',
    title: 'Stargazing Domes & Camps',
    subtitle: 'Celestial Nights',
    countTag: '42+ Camps',
    description: 'Geodesic transparent domes, heated desert majlis, and astronomical telescopes in AlUla and Riyadh.',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&fit=crop',
    icon: 'tent',
  },
];

export const FAQS: FaqItem[] = [
  {
    question: 'What is the QafNest platform and how is it licensed in Saudi Arabia?',
    answer: 'QafNest is an authorized peer-to-peer vacation rental and hospitality platform, officially licensed and supervised by the Saudi Ministry of Tourism (License No. 73102999). We directly connect travelers with verified chalets, private villas, heritage farms, and luxury glamping sanctuaries across the Kingdom with full consumer protection and guaranteed reservation security.',
  },
  {
    question: 'How does Self Check-in with Digital Smart Locks work?',
    answer: 'Properties with the "Self Check-in" badge offer 100% contactless access. Once your reservation is confirmed and your national ID (or Iqama/passport) is verified, an encrypted digital access PIN is generated in your QafNest App and sent to your WhatsApp. The PIN automatically activates at the scheduled check-in hour (typically 3:00 PM) for secure keyless entry.',
  },
  {
    question: 'Can I split my reservation payment in 4 installments with Tabby or Tamara?',
    answer: 'Yes! During checkout, select either Tabby or Tamara as your payment method. Your total booking amount will be divided into 4 equal monthly installments with 0% interest and 0 hidden fees. First installment is paid at booking confirmation, and the remaining 3 are automatically deducted monthly. All installments are Sharia-compliant and approved by SAMA.',
  },
  {
    question: 'What is the cancellation, refund, and security deposit policy?',
    answer: 'Each property listing displays its clear cancellation tier (Flexible, Moderate, or Strict). Eligible cancellations are refunded directly to your original card within 3–5 business days. For properties that require an on-site security deposit, the amount is held and automatically released upon check-out inspection, guaranteed under our Host-Guest Fair Resolution Policy.',
  },
  {
    question: 'Can I host a large family banquet or celebration at a chalet or farm?',
    answer: 'Absolutely. Most of our chalets, villas, and farms are custom-architected for Saudi social culture, featuring separate expansive men’s and women’s majlis, outdoor barbecue facilities, children’s splash zones, and catering kitchens. Please check each property’s "Guest Capacity" spec on the booking card before finalizing your date.',
  },
  {
    question: 'How do I list my property as a host and what are the earnings?',
    answer: 'Listing your chalet, farm, or villa takes only 2 minutes via our Host Portal. Hosts on QafNest earn between 18,000 SAR and 45,000 SAR monthly with our 1,000,000 SAR host property damage guarantee, automated calendar synchronization, and prompt bi-weekly direct bank transfers.',
  },
];

export const REVIEWS: ReviewItem[] = [
  {
    quote: '"Booking our Riyadh weekend chalet through QafNest was effortless. The instant check-in, spotless pool, and Tabby installment option made it the best family getaway."',
    author: 'Tariq Al-Mansoor',
    location: 'Riyadh · Stayed at Al-Ammariyah Chalet',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&crop=face',
  },
  {
    quote: '"The Obhur seaside villa was completely private and clean. Having the Ministry of Tourism guarantee gives true peace of mind. Outstanding customer care!"',
    author: 'Nouf Al-Harbi',
    location: 'Jeddah · Stayed at Red Sea Shoreline Villa',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&crop=face',
  },
  {
    quote: '"Our glamping pavilion in AlUla was out of this world. Stargazing by the firepit while enjoying private dinner service was truly exceptional."',
    author: 'Elena Rostova',
    location: 'Dubai · Stayed at AlUla Desert Camp',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&fit=crop&crop=face',
  },
];

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

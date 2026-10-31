import React from "react";
import {
  Waves,
  ShieldCheck,
  Flame,
  Baby,
  Bath,
  ShowerHead,
  Sofa,
  Home,
  Utensils,
  BedDouble,
  Bed,
  Maximize2,
  Sparkles,
  UtensilsCrossed,
  Refrigerator,
  Microwave,
  Coffee,
  Trees,
  Gamepad2,
  Car,
  Wind,
  Wifi,
  Tv,
  Volume2,
  Tv2,
  AirVent,
  Key,
  Camera,
  Users,
  Check,
  LucideProps,
} from "lucide-react";

export type AmenityCategory =
  | "pools"
  | "majlis"
  | "bedrooms"
  | "kitchen"
  | "outdoor"
  | "bathrooms"
  | "entertainment"
  | "safety";

export interface AmenityDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  category: AmenityCategory;
  iconName: string;
  badge?: boolean; // If true, eligible to appear on compact card badges
}

export interface AmenityCategoryMeta {
  id: AmenityCategory;
  titleEn: string;
  titleAr: string;
  iconName: string;
}

export const AMENITY_CATEGORIES: AmenityCategoryMeta[] = [
  {
    id: "pools",
    titleEn: "Swimming Pools & Water Fun",
    titleAr: "المسابح والترفيه المائي",
    iconName: "Waves",
  },
  {
    id: "majlis",
    titleEn: "Living Rooms & Majlis",
    titleAr: "المجالس والجلسات",
    iconName: "Sofa",
  },
  {
    id: "bedrooms",
    titleEn: "Bedrooms & Beds",
    titleAr: "غرف النوم والأسرّة",
    iconName: "BedDouble",
  },
  {
    id: "kitchen",
    titleEn: "Kitchen & Dining",
    titleAr: "مرافق المطبخ وركن التحضير",
    iconName: "UtensilsCrossed",
  },
  {
    id: "outdoor",
    titleEn: "Outdoor Facilities & Garden",
    titleAr: "المرافق الخارجية والحديقة",
    iconName: "Trees",
  },
  {
    id: "entertainment",
    titleEn: "Entertainment & Tech",
    titleAr: "الترفيه والتكنولوجيا",
    iconName: "Tv",
  },
  {
    id: "bathrooms",
    titleEn: "Bathrooms & Toiletries",
    titleAr: "دورات المياه ومستلزماتها",
    iconName: "Bath",
  },
  {
    id: "safety",
    titleEn: "Safety & Security",
    titleAr: "الأمان والسلامة",
    iconName: "ShieldCheck",
  },
];

export const AMENITIES_CATALOG: Record<string, AmenityDefinition> = {
  // 1. Pools
  private_pool: {
    id: "private_pool",
    nameEn: "Private Swimming Pool",
    nameAr: "مسبح خاص",
    category: "pools",
    iconName: "Waves",
    badge: true,
  },
  outdoor_pool: {
    id: "outdoor_pool",
    nameEn: "Outdoor Pool",
    nameAr: "مسبح خارجي",
    category: "pools",
    iconName: "Waves",
    badge: true,
  },
  indoor_pool: {
    id: "indoor_pool",
    nameEn: "Indoor Pool",
    nameAr: "مسبح داخلي",
    category: "pools",
    iconName: "Waves",
    badge: true,
  },
  pool_barrier: {
    id: "pool_barrier",
    nameEn: "Pool Child Safety Barrier",
    nameAr: "حاجز أمان للمسبح للأطفال",
    category: "pools",
    iconName: "ShieldCheck",
  },
  heated_pool: {
    id: "heated_pool",
    nameEn: "Heated Swimming Pool",
    nameAr: "مسبح دافئ (مسخن)",
    category: "pools",
    iconName: "Flame",
    badge: true,
  },
  kids_pool: {
    id: "kids_pool",
    nameEn: "Kids Pool & Water Games",
    nameAr: "مسبح أطفال وألعاب مائية",
    category: "pools",
    iconName: "Baby",
    badge: true,
  },
  jacuzzi: {
    id: "jacuzzi",
    nameEn: "Private Jacuzzi",
    nameAr: "جاكوزي خاص ساخن",
    category: "pools",
    iconName: "Bath",
    badge: true,
  },

  // 2. Living Rooms & Majlis
  main_majlis: {
    id: "main_majlis",
    nameEn: "Main Majlis",
    nameAr: "مجلس رئيسي واسع",
    category: "majlis",
    iconName: "Sofa",
    badge: true,
  },
  outdoor_seating: {
    id: "outdoor_seating",
    nameEn: "Outdoor Patio Seating",
    nameAr: "جلسة خارجية مجهزة",
    category: "majlis",
    iconName: "Trees",
    badge: true,
  },
  annex_majlis: {
    id: "annex_majlis",
    nameEn: "Outdoor Annex / Tent",
    nameAr: "ملحق خارجي / بيت شعر",
    category: "majlis",
    iconName: "Home",
  },
  dining_table: {
    id: "dining_table",
    nameEn: "Dining Table & Chairs",
    nameAr: "طاولة طعام متكاملة",
    category: "majlis",
    iconName: "Utensils",
  },
  wood_fireplace: {
    id: "wood_fireplace",
    nameEn: "Indoor Fireplace / Mashab",
    nameAr: "مشب نار داخلي",
    category: "majlis",
    iconName: "Flame",
  },

  // 3. Bedrooms & Beds
  master_bedroom: {
    id: "master_bedroom",
    nameEn: "Master Bedroom (King Bed)",
    nameAr: "غرفة نوم ماستر (سرير كينج)",
    category: "bedrooms",
    iconName: "BedDouble",
    badge: true,
  },
  single_beds: {
    id: "single_beds",
    nameEn: "Single Beds",
    nameAr: "أسرّة نوم مفردة",
    category: "bedrooms",
    iconName: "Bed",
  },
  sofa_bed: {
    id: "sofa_bed",
    nameEn: "Convertible Sofa Bed",
    nameAr: "أريكة سرير إضافية",
    category: "bedrooms",
    iconName: "Sofa",
  },
  wardrobe: {
    id: "wardrobe",
    nameEn: "Wardrobe & Hangers",
    nameAr: "خزانة ملابس وشماعات",
    category: "bedrooms",
    iconName: "Maximize2",
  },
  extra_linens: {
    id: "extra_linens",
    nameEn: "Hotel-grade Linens & Pillows",
    nameAr: "مفارش وبياضات فندقية فاخرة",
    category: "bedrooms",
    iconName: "Sparkles",
  },

  // 4. Kitchen & Dining
  equipped_kitchen: {
    id: "equipped_kitchen",
    nameEn: "Fully Equipped Kitchen",
    nameAr: "مطبخ مجهز بالكامل",
    category: "kitchen",
    iconName: "UtensilsCrossed",
    badge: true,
  },
  refrigerator: {
    id: "refrigerator",
    nameEn: "Refrigerator & Freezer",
    nameAr: "ثلاجة وفريزر",
    category: "kitchen",
    iconName: "Refrigerator",
  },
  oven_stove: {
    id: "oven_stove",
    nameEn: "Oven & Electric/Gas Stove",
    nameAr: "فرن وموقد طهي",
    category: "kitchen",
    iconName: "Flame",
  },
  microwave: {
    id: "microwave",
    nameEn: "Microwave",
    nameAr: "مايكرويف",
    category: "kitchen",
    iconName: "Microwave",
  },
  electric_kettle: {
    id: "electric_kettle",
    nameEn: "Electric Kettle",
    nameAr: "غلاية ماء كهربائية",
    category: "kitchen",
    iconName: "Coffee",
  },
  coffee_machine: {
    id: "coffee_machine",
    nameEn: "Coffee Machine / Nespresso",
    nameAr: "آلة تحضير قهوة إسبريسو",
    category: "kitchen",
    iconName: "Coffee",
    badge: true,
  },
  cookware_dishes: {
    id: "cookware_dishes",
    nameEn: "Cookware, Pots & Tableware",
    nameAr: "أواني طبخ وصحون تقديم",
    category: "kitchen",
    iconName: "Utensils",
  },

  // 5. Outdoor Facilities & Garden
  green_lawn: {
    id: "green_lawn",
    nameEn: "Natural Green Lawn / Garden",
    nameAr: "مسطحات خضراء وحديقة واسعة",
    category: "outdoor",
    iconName: "Trees",
    badge: true,
  },
  bbq_facility: {
    id: "bbq_facility",
    nameEn: "Outdoor BBQ Grill Area",
    nameAr: "ركن شواء ومعدات باربيكيو",
    category: "outdoor",
    iconName: "Flame",
    badge: true,
  },
  outdoor_firepit: {
    id: "outdoor_firepit",
    nameEn: "Outdoor Fire Pit & Seating",
    nameAr: "موقد حطب خارجي وجلسة نار",
    category: "outdoor",
    iconName: "Flame",
  },
  kids_playground: {
    id: "kids_playground",
    nameEn: "Kids Playground & Trampoline",
    nameAr: "ألعاب أطفال ونطيطة",
    category: "outdoor",
    iconName: "Gamepad2",
    badge: true,
  },
  private_parking: {
    id: "private_parking",
    nameEn: "Private Shaded Parking",
    nameAr: "موقف سيارات خاص ومظلل",
    category: "outdoor",
    iconName: "Car",
    badge: true,
  },
  outdoor_misting: {
    id: "outdoor_misting",
    nameEn: "Outdoor Misting Cooling System",
    nameAr: "رذاذ تبريد مائي للحديقة",
    category: "outdoor",
    iconName: "Wind",
  },

  // 6. Entertainment & Tech
  wifi: {
    id: "wifi",
    nameEn: "High-speed WiFi",
    nameAr: "واي فاي سريع مجاني",
    category: "entertainment",
    iconName: "Wifi",
    badge: true,
  },
  smart_tv: {
    id: "smart_tv",
    nameEn: "Smart TV with Streaming",
    nameAr: "شاشة تلفزيون ذكية مع يوتيوب ونتفلكس",
    category: "entertainment",
    iconName: "Tv",
    badge: true,
  },
  sound_system: {
    id: "sound_system",
    nameEn: "Bluetooth Sound System",
    nameAr: "سماعات صوتية متطورة (بلوتوث)",
    category: "entertainment",
    iconName: "Volume2",
  },
  cinema_projector: {
    id: "cinema_projector",
    nameEn: "HD Cinema Projector",
    nameAr: "بروجكتر سينمائي عالي الدقة",
    category: "entertainment",
    iconName: "Tv2",
    badge: true,
  },
  billiards_games: {
    id: "billiards_games",
    nameEn: "Billiards / Foosball Table",
    nameAr: "طاولة بلياردو وفرفيرة",
    category: "entertainment",
    iconName: "Gamepad2",
    badge: true,
  },
  air_conditioning: {
    id: "air_conditioning",
    nameEn: "Central / Split Air Conditioning",
    nameAr: "تكييف ممتاز (مركزي / سبليت)",
    category: "entertainment",
    iconName: "AirVent",
    badge: true,
  },
  self_checkin: {
    id: "self_checkin",
    nameEn: "Smart Self Check-in",
    nameAr: "دخول ذاتي ذكي برقم سري",
    category: "entertainment",
    iconName: "Key",
    badge: true,
  },

  // 7. Bathrooms & Toiletries
  bathrooms: {
    id: "bathrooms",
    nameEn: "Private Bathrooms",
    nameAr: "دورات مياه متكاملة",
    category: "bathrooms",
    iconName: "Bath",
    badge: true,
  },
  walk_in_shower: {
    id: "walk_in_shower",
    nameEn: "Walk-in Rain Shower",
    nameAr: "دش شاور حديث",
    category: "bathrooms",
    iconName: "ShowerHead",
  },
  toiletries: {
    id: "toiletries",
    nameEn: "Soaps, Shampoos & Essentials",
    nameAr: "صابون وشامبو ومستلزمات نظافة",
    category: "bathrooms",
    iconName: "Sparkles",
  },
  cotton_towels: {
    id: "cotton_towels",
    nameEn: "Clean Cotton Towels",
    nameAr: "مناشف قطنية معقمة",
    category: "bathrooms",
    iconName: "Sparkles",
  },
  hair_dryer: {
    id: "hair_dryer",
    nameEn: "Hair Dryer",
    nameAr: "مجفف شعر كهربائي",
    category: "bathrooms",
    iconName: "Wind",
  },

  // 8. Safety & Security
  security_cameras: {
    id: "security_cameras",
    nameEn: "Outdoor Security Cameras",
    nameAr: "كاميرات مراقبة خارجية للمواقف",
    category: "safety",
    iconName: "Camera",
  },
  smoke_detector: {
    id: "smoke_detector",
    nameEn: "Smoke & Fire Detector",
    nameAr: "كاشف دخان وإنذار حريق",
    category: "safety",
    iconName: "ShieldCheck",
  },
  first_aid_kit: {
    id: "first_aid_kit",
    nameEn: "First Aid Kit",
    nameAr: "حقيبة إسعافات أولية",
    category: "safety",
    iconName: "ShieldCheck",
  },
  fire_extinguisher: {
    id: "fire_extinguisher",
    nameEn: "Fire Extinguisher",
    nameAr: "طفاية حريق معتمدة",
    category: "safety",
    iconName: "ShieldCheck",
  },
};

/**
 * Universal Amenity Icon Component
 */
export function AmenityIcon({
  name,
  className = "w-4 h-4",
  ...props
}: { name: string; className?: string } & LucideProps) {
  switch (name) {
    case "Waves":
      return <Waves className={className} {...props} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} {...props} />;
    case "Flame":
      return <Flame className={className} {...props} />;
    case "Baby":
      return <Baby className={className} {...props} />;
    case "Bath":
      return <Bath className={className} {...props} />;
    case "ShowerHead":
      return <ShowerHead className={className} {...props} />;
    case "Sofa":
      return <Sofa className={className} {...props} />;
    case "Home":
      return <Home className={className} {...props} />;
    case "Utensils":
      return <Utensils className={className} {...props} />;
    case "BedDouble":
      return <BedDouble className={className} {...props} />;
    case "Bed":
      return <Bed className={className} {...props} />;
    case "Maximize2":
      return <Maximize2 className={className} {...props} />;
    case "Sparkles":
      return <Sparkles className={className} {...props} />;
    case "UtensilsCrossed":
      return <UtensilsCrossed className={className} {...props} />;
    case "Refrigerator":
      return <Refrigerator className={className} {...props} />;
    case "Microwave":
      return <Microwave className={className} {...props} />;
    case "Coffee":
      return <Coffee className={className} {...props} />;
    case "Trees":
      return <Trees className={className} {...props} />;
    case "Gamepad2":
      return <Gamepad2 className={className} {...props} />;
    case "Car":
      return <Car className={className} {...props} />;
    case "Wind":
      return <Wind className={className} {...props} />;
    case "Wifi":
      return <Wifi className={className} {...props} />;
    case "Tv":
      return <Tv className={className} {...props} />;
    case "Volume2":
      return <Volume2 className={className} {...props} />;
    case "Tv2":
      return <Tv2 className={className} {...props} />;
    case "AirVent":
      return <AirVent className={className} {...props} />;
    case "Key":
      return <Key className={className} {...props} />;
    case "Camera":
      return <Camera className={className} {...props} />;
    case "Users":
      return <Users className={className} {...props} />;
    default:
      return <Check className={className} {...props} />;
  }
}

/**
 * Maps any feature string (legacy or modern) to an AmenityDefinition
 */
export function resolveAmenity(featureTextOrId: string): AmenityDefinition {
  const normalized = featureTextOrId.toLowerCase().trim();

  // 1. Direct catalog lookup by ID
  if (AMENITIES_CATALOG[normalized]) {
    return AMENITIES_CATALOG[normalized];
  }

  // 2. Fuzzy matching based on keywords in Arabic or English
  if (normalized.includes("pool") || normalized.includes("مسبح")) {
    if (normalized.includes("heated") || normalized.includes("دافئ") || normalized.includes("مسخن")) {
      return AMENITIES_CATALOG.heated_pool;
    }
    if (normalized.includes("indoor") || normalized.includes("داخلي")) {
      return AMENITIES_CATALOG.indoor_pool;
    }
    if (normalized.includes("kid") || normalized.includes("أطفال") || normalized.includes("مائية")) {
      return AMENITIES_CATALOG.kids_pool;
    }
    return AMENITIES_CATALOG.private_pool;
  }

  if (normalized.includes("jacuzzi") || normalized.includes("جاكوزي")) {
    return AMENITIES_CATALOG.jacuzzi;
  }

  if (normalized.includes("wifi") || normalized.includes("واي فاي") || normalized.includes("انترنت")) {
    return AMENITIES_CATALOG.wifi;
  }

  if (
    normalized.includes("self") ||
    normalized.includes("checkin") ||
    normalized.includes("check-in") ||
    normalized.includes("دخول ذاتي")
  ) {
    return AMENITIES_CATALOG.self_checkin;
  }

  if (normalized.includes("majlis") || normalized.includes("مجلس") || normalized.includes("صالة")) {
    return AMENITIES_CATALOG.main_majlis;
  }

  if (normalized.includes("outdoor") || normalized.includes("جلسة") || normalized.includes("جلسات")) {
    return AMENITIES_CATALOG.outdoor_seating;
  }

  if (normalized.includes("bbq") || normalized.includes("شواء") || normalized.includes("باربيكيو")) {
    return AMENITIES_CATALOG.bbq_facility;
  }

  if (normalized.includes("fire") || normalized.includes("مشب") || normalized.includes("حطب")) {
    return AMENITIES_CATALOG.outdoor_firepit;
  }

  if (
    normalized.includes("kitchen") ||
    normalized.includes("مطبخ") ||
    normalized.includes("طهي")
  ) {
    return AMENITIES_CATALOG.equipped_kitchen;
  }

  if (normalized.includes("play") || normalized.includes("ألعاب") || normalized.includes("نطيطة")) {
    return AMENITIES_CATALOG.kids_playground;
  }

  if (normalized.includes("cinema") || normalized.includes("سينما") || normalized.includes("بروجكتر")) {
    return AMENITIES_CATALOG.cinema_projector;
  }

  if (normalized.includes("tv") || normalized.includes("شاشة") || normalized.includes("تلفزيون")) {
    return AMENITIES_CATALOG.smart_tv;
  }

  if (normalized.includes("sound") || normalized.includes("سماعات") || normalized.includes("موسيقى")) {
    return AMENITIES_CATALOG.sound_system;
  }

  if (normalized.includes("coffee") || normalized.includes("قهوة") || normalized.includes("نسبريسو")) {
    return AMENITIES_CATALOG.coffee_machine;
  }

  if (normalized.includes("park") || normalized.includes("موقف") || normalized.includes("سيارة")) {
    return AMENITIES_CATALOG.private_parking;
  }

  if (normalized.includes("green") || normalized.includes("حديقة") || normalized.includes("مسطح")) {
    return AMENITIES_CATALOG.green_lawn;
  }

  if (normalized.includes("bath") || normalized.includes("دورة مياه") || normalized.includes("حمام")) {
    return AMENITIES_CATALOG.bathrooms;
  }

  if (normalized.includes("bed") || normalized.includes("سرير") || normalized.includes("غرفة نوم")) {
    return AMENITIES_CATALOG.master_bedroom;
  }

  if (normalized.includes("ac") || normalized.includes("تكييف") || normalized.includes("سبليت")) {
    return AMENITIES_CATALOG.air_conditioning;
  }

  // Fallback dynamic item
  // Strip emoji if present
  const firstToken = featureTextOrId.split(" ")[0] || "";
  const hasEmojiPrefix = firstToken.charCodeAt(0) >= 0xd800;
  const cleanLabel = hasEmojiPrefix ? featureTextOrId.slice(firstToken.length).trim() : featureTextOrId;

  return {
    id: normalized.replace(/\s+/g, "_"),
    nameEn: cleanLabel,
    nameAr: cleanLabel,
    category: "entertainment",
    iconName: "Check",
    badge: false,
  };
}

/**
 * Group amenities by category for the Property Detail page
 */
export function groupAmenitiesByCategory(amenityKeysOrFeatures: string[]) {
  const grouped: Record<AmenityCategory, AmenityDefinition[]> = {
    pools: [],
    majlis: [],
    bedrooms: [],
    kitchen: [],
    outdoor: [],
    entertainment: [],
    bathrooms: [],
    safety: [],
  };

  const seen = new Set<string>();

  for (const item of amenityKeysOrFeatures) {
    const amenity = resolveAmenity(item);
    if (!seen.has(amenity.id)) {
      seen.add(amenity.id);
      grouped[amenity.category].push(amenity);
    }
  }

  return AMENITY_CATEGORIES.map((cat) => ({
    ...cat,
    amenities: grouped[cat.id],
  })).filter((cat) => cat.amenities.length > 0);
}

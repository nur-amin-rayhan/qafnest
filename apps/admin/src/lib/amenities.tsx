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
  AirVent,
  Key,
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
}

export interface AmenityCategoryMeta {
  id: AmenityCategory;
  titleEn: string;
  titleAr: string;
  iconName: string;
  amenities: AmenityDefinition[];
}

export const AMENITY_DEFINITIONS: AmenityDefinition[] = [
  // Pools
  { id: "pool_outdoor", nameEn: "Private Outdoor Pool", nameAr: "مسبح خارجي خاص", category: "pools", iconName: "Waves" },
  { id: "pool_indoor", nameEn: "Heated Indoor Pool", nameAr: "مسبح داخلي دافئ", category: "pools", iconName: "Waves" },
  { id: "pool_barrier", nameEn: "Child Safety Barrier", nameAr: "حاجز حماية للأطفال", category: "pools", iconName: "ShieldCheck" },
  { id: "jacuzzi", nameEn: "Heated Jacuzzi", nameAr: "جاكوزي دافئ", category: "pools", iconName: "Bath" },

  // Majlis
  { id: "majlis_main", nameEn: "Main Guest Majlis", nameAr: "مجلس ضيوف رئيسي", category: "majlis", iconName: "Sofa" },
  { id: "living_dining", nameEn: "Dining Hall", nameAr: "صالة طعام متكاملة", category: "majlis", iconName: "Home" },
  { id: "ac", nameEn: "Central Climate Control", nameAr: "تكييف مركزي متكامل", category: "majlis", iconName: "AirVent" },

  // Bedrooms
  { id: "master_suite", nameEn: "Master King Suite", nameAr: "جناح نوم رئيسي ماستر", category: "bedrooms", iconName: "Home" },
  { id: "linens", nameEn: "Luxury Hotel Linens", nameAr: "مفارش فندقية فاخرة", category: "bedrooms", iconName: "Check" },

  // Kitchen
  { id: "refrigerator", nameEn: "Full Refrigerator", nameAr: "ثلاجة كبيرة", category: "kitchen", iconName: "Refrigerator" },
  { id: "microwave", nameEn: "Microwave & Oven", nameAr: "مايكرويف وفرن", category: "kitchen", iconName: "Microwave" },
  { id: "coffee_maker", nameEn: "Arabic & Espresso Coffee Bar", nameAr: "ركن قهوة عربية وإسبريسو", category: "kitchen", iconName: "Coffee" },
  { id: "cookware", nameEn: "Cookware & Dining Set", nameAr: "أدوات طبخ وضيافة كاملة", category: "kitchen", iconName: "UtensilsCrossed" },

  // Outdoor
  { id: "bbq", nameEn: "BBQ & Grill Station", nameAr: "شواية ومنطقة شواء", category: "outdoor", iconName: "Flame" },
  { id: "garden", nameEn: "Lush Private Lawn", nameAr: "مسطحات خضراء وجلسات خارجية", category: "outdoor", iconName: "Trees" },
  { id: "parking", nameEn: "Private Gated Parking", nameAr: "موقف سيارات خاص ومظلل", category: "outdoor", iconName: "Car" },

  // Entertainment
  { id: "smart_tv", nameEn: "Smart 4K TV & Streaming", nameAr: "شاشة ذكية 4K واشتراكات", category: "entertainment", iconName: "Tv" },
  { id: "wifi", nameEn: "High-Speed Wi-Fi 6", nameAr: "إنترنت عالي السرعة فايبر", category: "entertainment", iconName: "Wifi" },
  { id: "sound_system", nameEn: "Surround Sound System", nameAr: "نظام صوتي وسماعات", category: "entertainment", iconName: "Gamepad2" },

  // Bathrooms
  { id: "shower", nameEn: "Walk-in Rain Shower", nameAr: "دش مطري عصري", category: "bathrooms", iconName: "ShowerHead" },
  { id: "toiletries", nameEn: "Premium Toiletries", nameAr: "مستلزمات عناية ونظافة شخصية", category: "bathrooms", iconName: "Bath" },

  // Safety
  { id: "self_checkin", nameEn: "Smart Keypad Self Check-in", nameAr: "دخول ذاتي بقفل ذكي", category: "safety", iconName: "Key" },
  { id: "cctv", nameEn: "External Security Cameras", nameAr: "كاميرات أمنية خارجية للمحيط", category: "safety", iconName: "ShieldCheck" },
];

export const CATEGORY_INFO: Record<AmenityCategory, { titleEn: string; titleAr: string; iconName: string }> = {
  pools: { titleEn: "Swimming Pools & Water Fun", titleAr: "المسابح والترفيه المائي", iconName: "Waves" },
  majlis: { titleEn: "Living Rooms & Majlis", titleAr: "المجالس والجلسات", iconName: "Sofa" },
  bedrooms: { titleEn: "Bedrooms & Beds", titleAr: "غرف النوم والأسرّة", iconName: "Home" },
  kitchen: { titleEn: "Kitchen & Dining", titleAr: "مرافق المطبخ والضيافة", iconName: "UtensilsCrossed" },
  outdoor: { titleEn: "Outdoor Facilities & Garden", titleAr: "المرافق الخارجية والحديقة", iconName: "Trees" },
  entertainment: { titleEn: "Entertainment & Tech", titleAr: "الترفيه والتكنولوجيا", iconName: "Tv" },
  bathrooms: { titleEn: "Bathrooms & Grooming", titleAr: "دورات المياه والعناية", iconName: "Bath" },
  safety: { titleEn: "Safety & Privacy", titleAr: "الأمان والخصوصية", iconName: "ShieldCheck" },
};

export function AmenityIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const props: LucideProps = { className };
  switch (name) {
    case "Waves": return <Waves {...props} />;
    case "ShieldCheck": return <ShieldCheck {...props} />;
    case "Flame": return <Flame {...props} />;
    case "Baby": return <Baby {...props} />;
    case "Bath": return <Bath {...props} />;
    case "ShowerHead": return <ShowerHead {...props} />;
    case "Sofa": return <Sofa {...props} />;
    case "Home": return <Home {...props} />;
    case "UtensilsCrossed": return <UtensilsCrossed {...props} />;
    case "Refrigerator": return <Refrigerator {...props} />;
    case "Microwave": return <Microwave {...props} />;
    case "Coffee": return <Coffee {...props} />;
    case "Trees": return <Trees {...props} />;
    case "Gamepad2": return <Gamepad2 {...props} />;
    case "Car": return <Car {...props} />;
    case "Wind": return <Wind {...props} />;
    case "Wifi": return <Wifi {...props} />;
    case "Tv": return <Tv {...props} />;
    case "AirVent": return <AirVent {...props} />;
    case "Key": return <Key {...props} />;
    case "Users": return <Users {...props} />;
    default: return <Check {...props} />;
  }
}

export function groupAmenities(features: string[] = [], hasPool = false): AmenityCategoryMeta[] {
  const normFeatures = features.map((f) => f.toLowerCase().trim());
  const matched = new Set<string>();

  const HOST_TO_ADMIN_MAP: Array<[string[], string]> = [
    [["جاكوزي", "jacuzzi"], "jacuzzi"],
    [["ساونا", "sauna"], "jacuzzi"],
    [["بانيو", "bathtub", "دش", "shower"], "shower"],
    [["رداء حمام", "سليبر", "شامبو", "صابون", "مناديل"], "toiletries"],
    [["مجلس", "قسمين", "ملحق خارجي", "صالة"], "majlis_main"],
    [["صالة طعام", "dining"], "living_dining"],
    [["غرفة نوم", "سرير", "ماستر"], "master_suite"],
    [["مسبح", "pool"], "pool_outdoor"],
    [["مطبخ", "kitchen"], "cookware"],
    [["ركن شواء", "شواء", "bbq", "موقد حطب", "ألعاب أطفال", "بلكونة"], "bbq"],
    [["اطلالة على الجبل", "اطلالة على الحديقة", "اطلالة على البحر", "شاطئ خاص", "شلال على الجبل"], "garden"],
    [["موقف", "parking"], "parking"],
    [["تلفزيون", "tv", "سينما", "بروجكتر", "بلايستيشن"], "smart_tv"],
    [["انترنت", "wifi"], "wifi"],
    [["سماعات", "sound", "كرسي مساج", "إضاءة إضافية"], "sound_system"],
    [["دخول ذاتي", "self"], "self_checkin"],
    [["مكتب امن", "كاميرات", "مصعد"], "cctv"],
  ];

  normFeatures.forEach((feat) => {
    for (const [keywords, targetId] of HOST_TO_ADMIN_MAP) {
      if (keywords.some((kw) => feat.includes(kw))) {
        matched.add(targetId);
      }
    }
  });

  AMENITY_DEFINITIONS.forEach((def) => {
    const textEn = def.nameEn.toLowerCase();
    const textAr = def.nameAr.toLowerCase();
    const isDirectMatch = normFeatures.some(
      (feat) => feat.includes(textEn) || textEn.includes(feat) || feat.includes(textAr) || textAr.includes(feat)
    );
    if (isDirectMatch) matched.add(def.id);
  });

  // If hasPool is true, guarantee outdoor pool
  if (hasPool || normFeatures.some((f) => f.includes("pool") || f.includes("مسبح"))) {
    matched.add("pool_outdoor");
  }

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

  matched.forEach((id) => {
    const item = AMENITY_DEFINITIONS.find((d) => d.id === id);
    if (item) {
      grouped[item.category].push(item);
    }
  });

  const categoriesOrder: AmenityCategory[] = [
    "pools",
    "majlis",
    "outdoor",
    "kitchen",
    "entertainment",
    "bedrooms",
    "bathrooms",
    "safety",
  ];

  return categoriesOrder
    .filter((cat) => grouped[cat].length > 0)
    .map((cat) => ({
      id: cat,
      titleEn: CATEGORY_INFO[cat].titleEn,
      titleAr: CATEGORY_INFO[cat].titleAr,
      iconName: CATEGORY_INFO[cat].iconName,
      amenities: grouped[cat],
    }));
}

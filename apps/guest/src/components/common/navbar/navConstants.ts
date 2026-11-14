import {
  localizePath,
  stripLocaleFromPathname,
  Locale,
} from "@/lib/localization/localeHelper";

export interface NavMenuItem {
  id: string;
  labelEn: string;
  labelAr: string;
  href: string;
  type: string | null;
  isActive: boolean;
}

export function getNavMenuItems(
  pathname: string,
  selectedCategory: string,
  locale: Locale = "ar"
): NavMenuItem[] {
  const cleanPath = stripLocaleFromPathname(pathname);

  return [
    {
      id: "apartments",
      labelEn: "Villas & Apartments",
      labelAr: "شقق وفلل",
      href: localizePath("/apartments", locale),
      type: "villa",
      isActive:
        cleanPath === "/apartments" ||
        (cleanPath === "/search" &&
          (selectedCategory === "villa" || selectedCategory === "penthouse")),
    },
    {
      id: "chalets",
      labelEn: "Chalets & Resorts",
      labelAr: "شاليهات ومنتجعات",
      href: localizePath("/chalets", locale),
      type: "chalet",
      isActive:
        cleanPath === "/chalets" ||
        (cleanPath === "/search" && selectedCategory === "chalet"),
    },
    {
      id: "farms",
      labelEn: "Farms",
      labelAr: "مزارع",
      href: localizePath("/farms", locale),
      type: "farm",
      isActive:
        cleanPath === "/farms" ||
        (cleanPath === "/search" && selectedCategory === "farm"),
    },
    {
      id: "camps",
      labelEn: "Camps",
      labelAr: "مخيّمات",
      href: localizePath("/camps", locale),
      type: "camp",
      isActive:
        cleanPath === "/camps" ||
        (cleanPath === "/search" && selectedCategory === "camp"),
    },
    {
      id: "blog",
      labelEn: "Blog",
      labelAr: "المدونة",
      href: localizePath("/blog", locale),
      type: null,
      isActive: cleanPath === "/blog",
    },
  ];
}

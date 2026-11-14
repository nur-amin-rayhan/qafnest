import type { NavTab } from "@/components/dashboard/types";

export const ADMIN_TAB_SLUGS: Record<NavTab, string> = {
  "dashboard-overview": "overview",
  "properties-management": "properties",
  "bookings-and-reservations": "bookings",
  "helpline-booking": "helpline",
  "user-management": "users",
  "promotions-and-coupons": "promotions",
  "loyalty-and-rewards": "loyalty",
  "financials-and-payouts": "financials",
  "guest-reviews": "reviews",
  settings: "settings",
};

const SLUG_TO_TAB: Record<string, NavTab> = Object.fromEntries(
  Object.entries(ADMIN_TAB_SLUGS).map(([tab, slug]) => [slug, tab as NavTab])
);

export function getAdminTabHref(tab: NavTab): string {
  return `/${ADMIN_TAB_SLUGS[tab] || "overview"}`;
}

export function resolveAdminSlugToTab(slug: string | undefined): NavTab | null {
  if (!slug) return "dashboard-overview";
  const normalized = slug.toLowerCase();
  if (normalized in SLUG_TO_TAB) {
    return SLUG_TO_TAB[normalized];
  }
  if (normalized in ADMIN_TAB_SLUGS) {
    return normalized as NavTab;
  }
  return null;
}

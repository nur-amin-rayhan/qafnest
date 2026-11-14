import type { Metadata } from "next";
import HostWorkspace from "../HostWorkspace";

export const dynamic = "force-dynamic";

const TAB_TITLES: Record<string, string> = {
  overview: "Overview · QafNest Host Dashboard",
  properties: "Properties · QafNest Host Dashboard",
  reservations: "Reservations · QafNest Host Dashboard",
  calendar: "Calendar & Rates · QafNest Host Dashboard",
  pricing: "Calendar & Rates · QafNest Host Dashboard",
  analytics: "Sales & Analytics · QafNest Host Dashboard",
  reviews: "Guest Reviews · QafNest Host Dashboard",
  finance: "Financials & Remittances · QafNest Host Dashboard",
  settings: "Host Settings · QafNest Host Dashboard",
};

export async function generateMetadata({
  params,
}: {
  params: { tab: string };
}): Promise<Metadata> {
  const tab = params.tab?.toLowerCase();
  const title = (tab && TAB_TITLES[tab]) || "Host Dashboard · QafNest Business";

  return {
    title,
    description: "Manage your property listings, bookings, calendar, rates, and financials on QafNest Host Partner portal.",
  };
}

export default function HostWorkspaceTabPage({
  params,
}: {
  params: { tab: string };
}) {
  return <HostWorkspace initialTab={params.tab} />;
}

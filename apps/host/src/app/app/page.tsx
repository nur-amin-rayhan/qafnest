import type { Metadata } from "next";
import HostWorkspace from "./HostWorkspace";

export const metadata: Metadata = {
  title: "Host Dashboard · QafNest Business",
  description: "Manage your property listings, bookings, calendar, rates, and financials on QafNest Host Partner portal.",
};

export default function HostWorkspacePage() {
  return <HostWorkspace />;
}

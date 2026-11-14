import React from "react";
import { notFound } from "next/navigation";
import { AdminDashboardShell } from "@/components/dashboard/AdminDashboardShell";
import { resolveAdminSlugToTab } from "@/lib/adminRoutes";

export default function AdminSectionPage({
  params,
}: {
  params: { tab?: string };
}) {
  const tab = resolveAdminSlugToTab(params?.tab);
  if (!tab) {
    notFound();
  }
  return <AdminDashboardShell initialTab={tab} />;
}

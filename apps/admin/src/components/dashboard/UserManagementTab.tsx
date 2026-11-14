"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type {
  ManagedGuestUser,
  ManagedHostUser,
  UserActivityFeedItem,
} from "@/app/api/admin/users/route";

import { adminPath } from "@/lib/adminUrl";
interface UserManagementTabProps {
  triggerToast: (msg: string) => void;
}

interface UsersApiPayload {
  summary: {
    totalGuests: number;
    verifiedGuests: number;
    suspendedGuests: number;
    totalHosts: number;
    verifiedHosts: number;
    suspendedHosts: number;
    totalActivities: number;
    activitiesLast24h: number;
  };
  guests: ManagedGuestUser[];
  hosts: ManagedHostUser[];
  activities: UserActivityFeedItem[];
  securityAlertsCount: number;
}

type SelectedUserTarget =
  | { role: "guest"; user: ManagedGuestUser }
  | { role: "host"; user: ManagedHostUser };

const CATEGORY_BADGE_MAP: Record<string, string> = {
  booking: "bg-primary/10 text-primary",
  payment: "bg-amber-100 text-amber-800",
  property: "bg-indigo-100 text-indigo-800",
  review: "bg-cyan-100 text-cyan-800",
  favorite: "bg-pink-100 text-pink-700",
  auth: "bg-slate-100 text-slate-700",
  security: "bg-rose-100 text-rose-700",
  governance: "bg-status-emerald/15 text-status-emerald",
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserManagementTab({ triggerToast }: UserManagementTabProps) {
  const { dir, t } = useAdminAuth();

  const [subTab, setSubTab] = useState<"guests" | "hosts" | "activity">("guests");
  const [data, setData] = useState<UsersApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [guestStatusFilter, setGuestStatusFilter] = useState<
    "all" | "verified" | "unverified" | "helpline" | "suspended"
  >("all");
  const [hostStatusFilter, setHostStatusFilter] = useState<
    "all" | "verified" | "pending" | "suspended"
  >("all");
  const [activityRoleFilter, setActivityRoleFilter] = useState<"all" | "guest" | "host" | "system">(
    "all"
  );
  const [activityCatFilter, setActivityCatFilter] = useState<string>("all");

  // Slide-over inspection drawer
  const [selectedTarget, setSelectedTarget] = useState<SelectedUserTarget | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadUsersData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(adminPath("/api/admin/users"), { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Failed to load user management data.");
        return;
      }
      setData(json as UsersApiPayload);

      // Keep selected drawer synced after refresh
      setSelectedTarget((prev) => {
        if (!prev) return null;
        if (prev.role === "guest") {
          const fresh = (json.guests as ManagedGuestUser[]).find((g) => g.id === prev.user.id);
          return fresh ? { role: "guest", user: fresh } : prev;
        }
        const fresh = (json.hosts as ManagedHostUser[]).find((h) => h.id === prev.user.id);
        return fresh ? { role: "host", user: fresh } : prev;
      });
    } catch {
      setErrorMsg("Network error loading user directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsersData();
  }, [loadUsersData]);

  const filteredGuests = useMemo(() => {
    const list = data?.guests || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((g) => {
      if (guestStatusFilter === "verified" && !g.isVerified) return false;
      if (guestStatusFilter === "unverified" && g.isVerified) return false;
      if (guestStatusFilter === "helpline" && g.accountSource !== "helpline_guest") return false;
      if (guestStatusFilter === "suspended" && !g.isSuspended) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q) ||
        (g.lastIp || "").toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, guestStatusFilter]);

  const filteredHosts = useMemo(() => {
    const list = data?.hosts || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((h) => {
      if (hostStatusFilter === "verified" && !h.isVerified) return false;
      if (hostStatusFilter === "pending" && h.isVerified) return false;
      if (hostStatusFilter === "suspended" && !h.isSuspended) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.businessName.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q) ||
        h.phone.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, hostStatusFilter]);

  const filteredActivities = useMemo(() => {
    const list = data?.activities || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((a) => {
      if (activityRoleFilter !== "all" && a.role !== activityRoleFilter) return false;
      if (activityCatFilter !== "all" && a.category !== activityCatFilter) return false;
      if (!q) return true;
      return (
        a.userName.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.details.toLowerCase().includes(q) ||
        a.userId.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, activityRoleFilter, activityCatFilter]);

  const selectedUserTimeline = useMemo(() => {
    if (!selectedTarget || !data) return [];
    const uid = selectedTarget.user.id;
    const phone = selectedTarget.user.phone;
    return data.activities.filter(
      (a) =>
        a.userId === uid ||
        (selectedTarget.role === "guest" &&
          selectedTarget.user.accountSource === "helpline_guest" &&
          phone &&
          a.userId.includes(phone))
    );
  }, [selectedTarget, data]);

  const handleGovernanceAction = async (
    userId: string,
    userName: string,
    role: "guest" | "host",
    action: "suspend_user" | "activate_user" | "verify_user" | "unverify_user" | "add_note",
    extra?: { note?: string; reason?: string }
  ) => {
    setActionBusy(true);
    try {
      const res = await fetch(adminPath("/api/admin/users"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          role,
          action,
          note: extra?.note,
          reason: extra?.reason,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        triggerToast(json.message || "Failed to execute action.");
        return;
      }
      triggerToast(json.message || "User updated.");
      if (action === "add_note") setNoteInput("");
      await loadUsersData();
    } catch {
      triggerToast("Network error updating user.");
    } finally {
      setActionBusy(false);
    }
  };

  const summary = data?.summary;

  return (
    <div dir={dir} data-testid="user-management-section" className="flex flex-col w-full gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest rounded-2xl border border-surface-container p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-outline text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>{t("Platform Governance", "حوكمة المنصة")}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">{t("User Management & Activity", "إدارة المستخدمين والنشاط")}</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </span>
            <span>{t("User Management — Guests, Hosts & Live Activity", "إدارة المستخدمين — الضيوف والمضيفين والنشاط")}</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t(
              "Inspect verified Guests & Host partners, track every booking, review, wishlist, IP signup, and manage verification or suspensions.",
              "إدارة حسابات الضيوف والمضيفين، متابعة الحجوزات والتقييمات والنشاط المباشر، وتوثيق أو إيقاف الحسابات."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsersData}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
            sync
          </span>
          <span>{t("Refresh Activity", "تحديث النشاط")}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-outline uppercase">
            <span>{t("Total Guests", "إجمالي الضيوف")}</span>
            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
          </div>
          <div className="text-2xl font-black text-on-surface mt-2">
            {summary ? summary.totalGuests : "—"}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            {summary
              ? `${summary.verifiedGuests} ${t("verified", "موثق")} · ${summary.suspendedGuests} ${t("suspended", "موقوف")}`
              : t("Loading...", "جاري التحميل...")}
          </div>
        </div>

        <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-outline uppercase">
            <span>{t("Total Hosts", "إجمالي المضيفين")}</span>
            <span className="material-symbols-outlined text-[18px] text-indigo-600">real_estate_agent</span>
          </div>
          <div className="text-2xl font-black text-on-surface mt-2">
            {summary ? summary.totalHosts : "—"}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            {summary
              ? `${summary.verifiedHosts} ${t("verified", "موثق")} · ${summary.suspendedHosts} ${t("suspended", "موقوف")}`
              : t("Loading...", "جاري التحميل...")}
          </div>
        </div>

        <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-outline uppercase">
            <span>{t("Activities (24h)", "نشاط آخر ٢٤ ساعة")}</span>
            <span className="material-symbols-outlined text-[18px] text-status-emerald">monitoring</span>
          </div>
          <div className="text-2xl font-black text-status-emerald mt-2">
            {summary ? summary.activitiesLast24h : "—"}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            {summary ? `${summary.totalActivities} ${t("total indexed events", "إجمالي الأحداث")}` : t("Loading...", "جاري التحميل...")}
          </div>
        </div>

        <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-outline uppercase">
            <span>{t("Security Flags", "تنبيهات الأمان")}</span>
            <span className="material-symbols-outlined text-[18px] text-rose-600">shield</span>
          </div>
          <div className="text-2xl font-black text-on-surface mt-2">
            {data ? data.securityAlertsCount : "—"}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            {t("Duplicate IP / device signup checks", "فحوصات الأجهزة وعناوين IP")}
          </div>
        </div>
      </div>

      {/* Main Sub-Tab Switcher & Search Ribbon */}
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="inline-flex rounded-xl bg-surface-container-low p-1 border border-surface-container">
            <button
              type="button"
              data-testid="users-tab-guests"
              onClick={() => setSubTab("guests")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                subTab === "guests"
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>{t("Guest Management", "إدارة الضيوف")} ({data?.guests.length || 0})</span>
            </button>

            <button
              type="button"
              data-testid="users-tab-hosts"
              onClick={() => setSubTab("hosts")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                subTab === "hosts"
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">real_estate_agent</span>
              <span>{t("Host Management", "إدارة المضيفين")} ({data?.hosts.length || 0})</span>
            </button>

            <button
              type="button"
              data-testid="users-tab-activity"
              onClick={() => setSubTab("activity")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                subTab === "activity"
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">timeline</span>
              <span>{t("Live Activity Log", "سجل النشاط المباشر")} ({data?.activities.length || 0})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
              search
            </span>
            <input
              type="text"
              data-testid="users-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search name, email, phone, IP, event...", "ابحث بالاسم، البريد، الجوال، الحدث...")}
              className="w-full h-10 ps-9 pe-3 rounded-xl border border-surface-container bg-surface-container-low text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white"
            />
          </div>
        </div>

        {/* Sub-Tab Filter Pills */}
        {subTab === "guests" && (
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: t("All Guests", "الكل") },
                { id: "verified", label: t("Verified (KYC/Nafath)", "موثق") },
                { id: "unverified", label: t("Unverified", "غير موثق") },
                { id: "helpline", label: t("Helpline Callers", "عملاء الهاتف") },
                { id: "suspended", label: t("Suspended", "موقوف") },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setGuestStatusFilter(pill.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition ${
                  guestStatusFilter === pill.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-container-low border-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {subTab === "hosts" && (
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: t("All Hosts", "كل المضيفين") },
                { id: "verified", label: t("Verified Partners", "موثقون") },
                { id: "pending", label: t("Needs Verification", "بانتظار التوثيق") },
                { id: "suspended", label: t("Suspended", "موقوف") },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setHostStatusFilter(pill.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition ${
                  hostStatusFilter === pill.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-container-low border-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {subTab === "activity" && (
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "guest", "host", "system"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActivityRoleFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer capitalize ${
                  activityRoleFilter === r
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-container-low border-surface-container text-on-surface-variant"
                }`}
              >
                {r === "all" ? t("All Roles", "الكل") : r}
              </button>
            ))}

            <select
              aria-label="Filter activity category"
              value={activityCatFilter}
              onChange={(e) => setActivityCatFilter(e.target.value)}
              className="h-8 px-3 rounded-full border border-surface-container bg-surface-container-low text-xs font-bold text-on-surface"
            >
              <option value="all">{t("All Categories", "كل الأنشطة")}</option>
              <option value="booking">{t("Bookings", "الحجوزات")}</option>
              <option value="payment">{t("Payments & SADAD", "المدفوعات")}</option>
              <option value="property">{t("Properties", "العقارات")}</option>
              <option value="review">{t("Reviews & Replies", "التقييمات")}</option>
              <option value="favorite">{t("Wishlists", "المفضلة")}</option>
              <option value="auth">{t("Logins & Signups", "الدخول والتسجيل")}</option>
              <option value="security">{t("Security & IPs", "الأمان")}</option>
              <option value="governance">{t("Admin Governance", "إجراءات الإدارة")}</option>
            </select>
          </div>
        )}

        {/* TABLE 1: GUEST MANAGEMENT */}
        {subTab === "guests" && (
          <div className="overflow-x-auto">
            {filteredGuests.length === 0 ? (
              <div className="p-8 text-center text-sm text-outline bg-surface-container-low rounded-xl">
                {loading ? t("Loading guests...", "جاري تحميل الضيوف...") : t("No guest accounts match your filters.", "لا يوجد ضيوف مطابقين.")}
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-xs uppercase text-outline font-bold">
                    <th className="py-3 px-3 text-start">{t("Guest", "الضيف")}</th>
                    <th className="py-3 px-3 text-start">{t("Contact & City", "التواصل والمدينة")}</th>
                    <th className="py-3 px-3 text-start">{t("KYC / Device", "الهوية والأمان")}</th>
                    <th className="py-3 px-3 text-start">{t("Bookings & Spend", "الحجوزات والإنفاق")}</th>
                    <th className="py-3 px-3 text-start">{t("Last Activity", "آخر نشاط")}</th>
                    <th className="py-3 px-3 text-start">{t("Status", "الحالة")}</th>
                    <th className="py-3 px-3 text-end">{t("Actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-surface-container-low/60 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-on-surface">{guest.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              guest.accountSource === "helpline_guest"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {guest.accountSource === "helpline_guest" ? "Helpline Caller" : "Registered"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="font-mono text-on-surface">{guest.phone}</div>
                        <div className="text-on-surface-variant truncate max-w-[180px]">{guest.email}</div>
                        <div className="text-[11px] text-outline">{guest.city}</div>
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              guest.isVerified
                                ? "bg-status-emerald/15 text-status-emerald"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {guest.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-outline mt-1">
                          {guest.idType}: {guest.idNumberMasked}
                        </div>
                        {guest.lastIp && (
                          <div className="text-[10px] font-mono text-outline">IP: {guest.lastIp}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="font-black text-on-surface">
                          SAR {guest.totalSpendSar.toFixed(2)}
                        </div>
                        <div className="text-on-surface-variant mt-0.5">
                          {guest.totalBookings} stays ({guest.confirmedBookings} confirmed ·{" "}
                          {guest.pendingSadadBookings} hold)
                        </div>
                        <div className="text-[11px] text-outline">
                          {guest.reviewsCount} reviews · {guest.favoritesCount} saved
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-on-surface-variant font-mono">
                        {formatDateTime(guest.lastActivityAt)}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            guest.isSuspended
                              ? "bg-rose-100 text-rose-700"
                              : "bg-status-emerald/15 text-status-emerald"
                          }`}
                        >
                          {guest.isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-end">
                        <button
                          type="button"
                          data-testid={`inspect-guest-${guest.id}`}
                          onClick={() => setSelectedTarget({ role: "guest", user: guest })}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold cursor-pointer transition"
                        >
                          {t("Track & Manage", "متابعة وإدارة")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLE 2: HOST MANAGEMENT */}
        {subTab === "hosts" && (
          <div className="overflow-x-auto">
            {filteredHosts.length === 0 ? (
              <div className="p-8 text-center text-sm text-outline bg-surface-container-low rounded-xl">
                {loading ? t("Loading hosts...", "جاري تحميل المضيفين...") : t("No host accounts match your filters.", "لا يوجد مضيفون مطابقون.")}
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-xs uppercase text-outline font-bold">
                    <th className="py-3 px-3 text-start">{t("Host Partner", "المضيف")}</th>
                    <th className="py-3 px-3 text-start">{t("Contact & City", "التواصل والمدينة")}</th>
                    <th className="py-3 px-3 text-start">{t("Listings Portfolio", "العقارات")}</th>
                    <th className="py-3 px-3 text-start">{t("Bookings & Earnings", "الحجوزات والأرباح")}</th>
                    <th className="py-3 px-3 text-start">{t("Last Activity", "آخر نشاط")}</th>
                    <th className="py-3 px-3 text-start">{t("Status", "الحالة")}</th>
                    <th className="py-3 px-3 text-end">{t("Actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredHosts.map((host) => (
                    <tr key={host.id} className="hover:bg-surface-container-low/60 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-on-surface">{host.name}</div>
                        <div className="text-xs text-on-surface-variant">{host.businessName}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            host.isVerified
                              ? "bg-status-emerald/15 text-status-emerald"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {host.isVerified ? "Verified Partner" : "Unverified"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="font-mono text-on-surface">{host.phone}</div>
                        <div className="text-on-surface-variant truncate max-w-[180px]">{host.email}</div>
                        <div className="text-[11px] text-outline">{host.city}</div>
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="font-black text-on-surface">
                          {host.totalProperties} {t("units", "عقار")}
                        </div>
                        <div className="text-[11px] text-on-surface-variant mt-0.5">
                          <span className="text-status-emerald font-bold">{host.approvedProperties} live</span> ·{" "}
                          <span className="text-amber-700 font-bold">{host.pendingProperties} pending</span> ·{" "}
                          <span className="text-rose-600">{host.rejectedProperties} rejected</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="font-black text-primary">
                          Net SAR {host.netEarningsSar.toFixed(2)}
                        </div>
                        <div className="text-on-surface-variant">
                          Gross SAR {host.grossRevenueSar.toFixed(2)} ({host.totalBookings} stays)
                        </div>
                        <div className="text-[11px] text-outline">
                          {host.reviewsReceived} reviews ({host.repliesPosted} host replies)
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-on-surface-variant font-mono">
                        {formatDateTime(host.lastActivityAt)}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            host.isSuspended
                              ? "bg-rose-100 text-rose-700"
                              : "bg-status-emerald/15 text-status-emerald"
                          }`}
                        >
                          {host.isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-end">
                        <button
                          type="button"
                          data-testid={`inspect-host-${host.id}`}
                          onClick={() => setSelectedTarget({ role: "host", user: host })}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold cursor-pointer transition"
                        >
                          {t("Track & Manage", "متابعة وإدارة")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLE 3: LIVE ACTIVITY LOG */}
        {subTab === "activity" && (
          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pe-1">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-sm text-outline bg-surface-container-low rounded-xl">
                {loading ? t("Loading activity feed...", "جاري التحميل...") : t("No user activities match this filter.", "لا يوجد نشاط مطابق.")}
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-surface-container bg-white hover:bg-surface-container-low/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        CATEGORY_BADGE_MAP[act.category] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {act.category}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-on-surface">{act.title}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold uppercase text-on-surface-variant">
                          {act.role}: {act.userName}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 break-words">{act.details}</p>
                    </div>
                  </div>

                  <div className="text-end shrink-0 text-xs">
                    <div className="font-mono text-on-surface-variant">{formatDateTime(act.timestamp)}</div>
                    {act.actor && <div className="text-[11px] text-outline">via {act.actor}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* SLIDE-OVER USER INSPECTION, GOVERNANCE & ACTIVITY TIMELINE DRAWER */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
          <div
            data-testid="user-detail-drawer"
            className="w-full max-w-2xl bg-surface-container-lowest h-full shadow-2xl border-s border-surface-container flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-surface-container flex items-start justify-between gap-4 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary">
                    {selectedTarget.role === "host" ? "Host Partner" : "Guest Account"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedTarget.user.isSuspended
                        ? "bg-rose-100 text-rose-700"
                        : "bg-status-emerald/15 text-status-emerald"
                    }`}
                  >
                    {selectedTarget.user.isSuspended ? "Suspended" : "Active"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedTarget.user.isVerified
                        ? "bg-status-emerald/15 text-status-emerald"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedTarget.user.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <h2 className="text-xl font-black text-on-surface mt-1.5">
                  {selectedTarget.user.name}
                </h2>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  {selectedTarget.user.email} · {selectedTarget.user.phone} · ID: {selectedTarget.user.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="p-2 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Summary Stats */}
              {selectedTarget.role === "guest" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <div className="text-outline">{t("Total Spend", "الإنفاق")}</div>
                    <div className="font-black text-base text-primary mt-0.5">
                      SAR {selectedTarget.user.totalSpendSar.toFixed(0)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <div className="text-outline">{t("Bookings", "الحجوزات")}</div>
                    <div className="font-black text-base text-on-surface mt-0.5">
                      {selectedTarget.user.totalBookings}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <div className="text-outline">{t("Reviews / Saves", "التقييمات")}</div>
                    <div className="font-black text-base text-on-surface mt-0.5">
                      {selectedTarget.user.reviewsCount} / {selectedTarget.user.favoritesCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <div className="text-outline">{t("Last IP", "آخر IP")}</div>
                    <div className="font-mono font-bold text-on-surface mt-1 truncate">
                      {selectedTarget.user.lastIp || "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface-container-low">
                      <div className="text-outline">{t("Host Net Share", "صافي المضيف")}</div>
                      <div className="font-black text-base text-status-emerald mt-0.5">
                        SAR {selectedTarget.user.netEarningsSar.toFixed(0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low">
                      <div className="text-outline">{t("Gross Bookings", "إجمالي الحجوزات")}</div>
                      <div className="font-black text-base text-on-surface mt-0.5">
                        SAR {selectedTarget.user.grossRevenueSar.toFixed(0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low">
                      <div className="text-outline">{t("Properties", "العقارات")}</div>
                      <div className="font-black text-base text-on-surface mt-0.5">
                        {selectedTarget.user.approvedProperties}/{selectedTarget.user.totalProperties} {t("Live", "مباشر")}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low">
                      <div className="text-outline">{t("Host Replies", "ردود المضيف")}</div>
                      <div className="font-black text-base text-on-surface mt-0.5">
                        {selectedTarget.user.repliesPosted}/{selectedTarget.user.reviewsReceived}
                      </div>
                    </div>
                  </div>

                  {/* Host Properties Portfolio */}
                  <div className="rounded-xl border border-surface-container p-3.5 bg-white space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-outline">
                      {t("Managed Properties Portfolio", "عقارات المضيف")}
                    </h3>
                    {selectedTarget.user.properties.length === 0 ? (
                      <p className="text-xs text-outline">{t("No listings registered yet.", "لا توجد عقارات مسجلة حتى الآن.")}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedTarget.user.properties.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low"
                          >
                            <span className="font-bold text-on-surface truncate">
                              {p.title} ({p.city})
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-bold">{t("SAR", "ر.س")} {p.basePrice}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  p.status === "approved"
                                    ? "bg-status-emerald/15 text-status-emerald"
                                    : p.status === "rejected"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Governance Action Controls */}
              <div className="rounded-xl border border-surface-container p-4 bg-white space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-outline">
                  {t("Admin Governance Controls", "أدوات التحكم والحوكمة")}
                </h3>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="drawer-toggle-verify-btn"
                    disabled={actionBusy}
                    onClick={() =>
                      handleGovernanceAction(
                        selectedTarget.user.id,
                        selectedTarget.user.name,
                        selectedTarget.role,
                        selectedTarget.user.isVerified ? "unverify_user" : "verify_user"
                      )
                    }
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-50 ${
                      selectedTarget.user.isVerified
                        ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "bg-status-emerald text-white hover:bg-emerald-700"
                    }`}
                  >
                    {selectedTarget.user.isVerified
                      ? t("Revoke Verification", "إلغاء التوثيق")
                      : t("Verify Identity / KYC", "توثيق الحساب")}
                  </button>

                  <button
                    type="button"
                    data-testid="drawer-toggle-suspend-btn"
                    disabled={actionBusy}
                    onClick={() =>
                      handleGovernanceAction(
                        selectedTarget.user.id,
                        selectedTarget.user.name,
                        selectedTarget.role,
                        selectedTarget.user.isSuspended ? "activate_user" : "suspend_user"
                      )
                    }
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-50 ${
                      selectedTarget.user.isSuspended
                        ? "bg-primary-container text-on-primary hover:bg-primary"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }`}
                  >
                    {selectedTarget.user.isSuspended
                      ? t("Reactivate Account", "إعادة تفعيل الحساب")
                      : t("Suspend Account", "إيقاف الحساب مؤقتاً")}
                  </button>
                </div>

                {selectedTarget.user.adminNote && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>{t("Pinned Note:", "ملاحظة:")}</strong> {selectedTarget.user.adminNote}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={t("Add internal compliance note to timeline...", "أضف ملاحظة داخلية لسجل النشاط...")}
                    className="flex-1 h-9 px-3 rounded-xl border border-surface-container bg-surface-container-low text-xs text-on-surface"
                  />
                  <button
                    type="button"
                    disabled={actionBusy || !noteInput.trim()}
                    onClick={() =>
                      handleGovernanceAction(
                        selectedTarget.user.id,
                        selectedTarget.user.name,
                        selectedTarget.role,
                        "add_note",
                        { note: noteInput }
                      )
                    }
                    className="h-9 px-3.5 rounded-xl bg-on-surface text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {t("Log Note", "حفظ")}
                  </button>
                </div>
              </div>

              {/* Per-User Chronological Activity Timeline */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-outline">
                  {t("User Activity Timeline", "الجدول الزمني لنشاط المستخدم")} ({selectedUserTimeline.length})
                </h3>

                {selectedUserTimeline.length === 0 ? (
                  <div className="p-5 rounded-xl bg-surface-container-low text-xs text-outline text-center">
                    {t("No tracked events recorded for this account yet.", "لا توجد أنشطة مسجلة لهذا الحساب بعد.")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUserTimeline.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border border-surface-container bg-white flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                CATEGORY_BADGE_MAP[ev.category] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {ev.category}
                            </span>
                            <span className="text-xs font-black text-on-surface">{ev.title}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">{ev.details}</p>
                        </div>
                        <span className="text-[11px] font-mono text-outline shrink-0">
                          {formatDateTime(ev.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

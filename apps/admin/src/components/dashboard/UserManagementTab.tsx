"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  CreditCard,
  Activity,
  Search,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type {
  AdminSavedCardRecord,
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
    totalSavedCards?: number;
  };
  guests: ManagedGuestUser[];
  hosts: ManagedHostUser[];
  savedCards?: AdminSavedCardRecord[];
  activities: UserActivityFeedItem[];
  securityAlertsCount: number;
}

type SelectedUserTarget =
  | { role: "guest"; user: ManagedGuestUser }
  | { role: "host"; user: ManagedHostUser };

const CATEGORY_BADGE_MAP: Record<string, string> = {
  booking: "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/60",
  payment: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
  property: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60",
  review: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60",
  favorite: "bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60",
  auth: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  security: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
  governance: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
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

// In-memory SWR cache for instant user management view switching
let cachedUserData: UsersApiPayload | null = null;

export function UserManagementTab({ triggerToast }: UserManagementTabProps) {
  const { dir, t } = useAdminAuth();

  const [subTab, setSubTab] = useState<"guests" | "hosts" | "cards" | "activity">("guests");
  const [data, setData] = useState<UsersApiPayload | null>(() => cachedUserData);
  const [loading, setLoading] = useState(!cachedUserData);
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
    if (!cachedUserData) {
      setLoading(true);
    }
    setErrorMsg(null);
    try {
      const res = await fetch(adminPath("/api/admin/users"), { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Failed to load user management data.");
        return;
      }
      cachedUserData = json as UsersApiPayload;
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">
            <span>{t("Platform Governance", "حوكمة المنصة")}</span>
            <ChevronRight size={13} />
            <span className="text-[#4F2396] dark:text-purple-300 font-semibold">{t("User Management & Activity", "إدارة المستخدمين والنشاط")}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/50">
              <Users size={18} />
            </span>
            <span>{t("User Management — Guests, Hosts & Live Activity", "إدارة المستخدمين — الضيوف والمضيفين والنشاط")}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
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
          className="h-8 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>{t("Refresh Activity", "تحديث النشاط")}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>{t("Total Guests", "إجمالي الضيوف")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[#4F2396] dark:text-purple-300">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
            {summary ? summary.totalGuests : "—"}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {summary
              ? `${summary.verifiedGuests} ${t("verified", "موثق")} · ${summary.suspendedGuests} ${t("suspended", "موقوف")}`
              : t("Loading...", "جاري التحميل...")}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>{t("Total Hosts", "إجمالي المضيفين")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
            {summary ? summary.totalHosts : "—"}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {summary
              ? `${summary.verifiedHosts} ${t("verified", "موثق")} · ${summary.suspendedHosts} ${t("suspended", "موقوف")}`
              : t("Loading...", "جاري التحميل...")}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>{t("Activities (24h)", "نشاط آخر ٢٤ ساعة")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
            {summary ? summary.activitiesLast24h : "—"}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {summary ? `${summary.totalActivities} ${t("total indexed events", "إجمالي الأحداث")}` : t("Loading...", "جاري التحميل...")}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>{t("Security Flags", "تنبيهات الأمان")}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
            {data ? data.securityAlertsCount : "—"}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t("Duplicate IP / device signup checks", "فحوصات الأجهزة وعناوين IP")}
          </div>
        </div>
      </div>

      {/* Main Sub-Tab Switcher & Search Ribbon */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1">
            <button
              type="button"
              data-testid="users-tab-guests"
              onClick={() => setSubTab("guests")}
              className={`h-8 px-3 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                subTab === "guests"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Users size={15} strokeWidth={1.5} />
              <span>{t("Guest Management", "إدارة الضيوف")} ({data?.guests.length || 0})</span>
            </button>

            <button
              type="button"
              data-testid="users-tab-hosts"
              onClick={() => setSubTab("hosts")}
              className={`h-8 px-3 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                subTab === "hosts"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Building2 size={14} strokeWidth={1.5} />
              <span>{t("Host Management", "إدارة المضيفين")} ({data?.hosts.length || 0})</span>
            </button>

            <button
              type="button"
              data-testid="users-tab-cards"
              onClick={() => setSubTab("cards")}
              className={`h-8 px-3 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                subTab === "cards"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <CreditCard size={14} strokeWidth={1.5} />
              <span>{t("Saved Cards", "البطاقات المحفوظة")} ({data?.savedCards?.length || 0})</span>
            </button>

            <button
              type="button"
              data-testid="users-tab-activity"
              onClick={() => setSubTab("activity")}
              className={`h-8 px-3 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                subTab === "activity"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Activity size={14} strokeWidth={1.5} />
              <span>{t("Live Activity Log", "سجل النشاط المباشر")} ({data?.activities.length || 0})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              data-testid="users-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search name, email, phone, IP, event...", "ابحث بالاسم، البريد، الجوال، الحدث...")}
              className="w-full h-8 ps-8 pe-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
            />
          </div>
        </div>

        {/* Sub-Tab Filter Pills */}
        {subTab === "guests" && (
          <div className="flex flex-wrap items-center gap-1.5">
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
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                  guestStatusFilter === pill.id
                    ? "bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-[#4F2396] dark:text-purple-300 font-semibold"
                    : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {subTab === "hosts" && (
          <div className="flex flex-wrap items-center gap-1.5">
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
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                  hostStatusFilter === pill.id
                    ? "bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-[#4F2396] dark:text-purple-300 font-semibold"
                    : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer capitalize transition ${
                  activityRoleFilter === r
                    ? "bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-[#4F2396] dark:text-purple-300 font-semibold"
                    : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {r === "all" ? t("All Roles", "الكل") : r}
              </button>
            ))}

            <select
              aria-label="Filter activity category"
              value={activityCatFilter}
              onChange={(e) => setActivityCatFilter(e.target.value)}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
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
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800">
            {filteredGuests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40">
                {loading ? t("Loading guests...", "جاري تحميل الضيوف...") : t("No guest accounts match your filters.", "لا يوجد ضيوف مطابقين.")}
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-start border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 select-none">
                    <th className="py-2.5 px-3 text-start">{t("Guest", "الضيف")}</th>
                    <th className="py-2.5 px-3 text-start">{t("Contact & City", "التواصل والمدينة")}</th>
                    <th className="py-2.5 px-3 text-start">{t("KYC / Device", "الهوية والأمان")}</th>
                    <th className="py-2.5 px-3 text-start">{t("Bookings & Spend", "الحجوزات والإنفاق")}</th>
                    <th className="py-2.5 px-3 text-start">{t("Last Activity", "آخر نشاط")}</th>
                    <th className="py-2.5 px-3 text-start">{t("Status", "الحالة")}</th>
                    <th className="py-2.5 px-3 text-end">{t("Actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{guest.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                              guest.accountSource === "helpline_guest"
                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                                : "bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50"
                            }`}
                          >
                            {guest.accountSource === "helpline_guest" ? "Helpline Caller" : "Registered"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs sm:text-sm">
                        <div className="font-mono font-medium text-slate-900 dark:text-slate-100">{guest.phone}</div>
                        <div className="text-slate-500 dark:text-slate-400 truncate max-w-[180px] text-xs">{guest.email}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{guest.city}</div>
                      </td>

                      <td className="py-3 px-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              guest.isVerified
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {guest.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1">
                          {guest.idType}: {guest.idNumberMasked}
                        </div>
                        {guest.lastIp && (
                          <div className="text-xs font-mono text-slate-400 dark:text-slate-500">IP: {guest.lastIp}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-xs sm:text-sm">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          SAR {guest.totalSpendSar.toFixed(2)}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                          {guest.totalBookings} stays ({guest.confirmedBookings} confirmed ·{" "}
                          {guest.pendingSadadBookings} hold)
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {guest.reviewsCount} reviews · {guest.favoritesCount} saved
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDateTime(guest.lastActivityAt)}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            guest.isSuspended
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
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
                          className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-medium cursor-pointer transition border border-purple-200 dark:border-purple-800/50 shadow-2xs"
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
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800">
            {filteredHosts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40">
                {loading ? t("Loading hosts...", "جاري تحميل المضيفين...") : t("No host accounts match your filters.", "لا يوجد مضيفون مطابقون.")}
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none">
                    <th className="py-2.5 px-3 text-start font-medium">{t("Host Partner", "المضيف")}</th>
                    <th className="py-2.5 px-3 text-start font-medium">{t("Contact & City", "التواصل والمدينة")}</th>
                    <th className="py-2.5 px-3 text-start font-medium">{t("Listings Portfolio", "العقارات")}</th>
                    <th className="py-2.5 px-3 text-start font-medium">{t("Bookings & Earnings", "الحجوزات والأرباح")}</th>
                    <th className="py-2.5 px-3 text-start font-medium">{t("Last Activity", "آخر نشاط")}</th>
                    <th className="py-2.5 px-3 text-start font-medium">{t("Status", "الحالة")}</th>
                    <th className="py-2.5 px-3 text-end font-medium">{t("Actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredHosts.map((host) => (
                    <tr key={host.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{host.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{host.businessName}</div>
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            host.isVerified
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                          }`}
                        >
                          {host.isVerified ? "Verified Partner" : "Unverified"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-xs sm:text-sm">
                        <div className="font-mono text-slate-900 dark:text-slate-100">{host.phone}</div>
                        <div className="text-slate-500 dark:text-slate-400 truncate max-w-[180px] text-xs">{host.email}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{host.city}</div>
                      </td>

                      <td className="py-3 px-3 text-xs sm:text-sm">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {host.totalProperties} {t("units", "عقار")}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{host.approvedProperties} live</span> ·{" "}
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">{host.pendingProperties} pending</span> ·{" "}
                          <span className="text-rose-600 dark:text-rose-400">{host.rejectedProperties} rejected</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs sm:text-sm">
                        <div className="font-mono font-bold text-[#4F2396] dark:text-purple-300 tabular-nums">
                          Net SAR {host.netEarningsSar.toFixed(2)}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">
                          Gross SAR {host.grossRevenueSar.toFixed(2)} ({host.totalBookings} stays)
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {host.reviewsReceived} reviews ({host.repliesPosted} host replies)
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDateTime(host.lastActivityAt)}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            host.isSuspended
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
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
                          className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-medium cursor-pointer transition border border-purple-200 dark:border-purple-800/50 shadow-2xs"
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

        {/* TABLE 3: SAVED GUEST CARDS (PCI-DSS MASKED) */}
        {subTab === "cards" && (() => {
          const q = searchQuery.trim().toLowerCase();
          const cardsList = (data?.savedCards || []).filter((c) => {
            if (!q) return true;
            return (
              c.guestName.toLowerCase().includes(q) ||
              c.guestEmail.toLowerCase().includes(q) ||
              c.guestPhone.toLowerCase().includes(q) ||
              c.cardholderName.toLowerCase().includes(q) ||
              c.brand.toLowerCase().includes(q) ||
              c.last4.includes(q)
            );
          });
          return (
            <div className="space-y-3">
              <div className="rounded-xl border border-purple-200/80 dark:border-purple-800/50 bg-purple-50/70 dark:bg-purple-950/40 px-4 py-2.5 text-xs text-[#4F2396] dark:text-purple-300 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#4F2396] dark:text-purple-400 shrink-0" />
                <span>
                  {t(
                    "PCI-DSS Compliant Vault View: Only masked card numbers (last 4 digits), brand, cardholder name, and expiry are displayed. Full PAN & CVV remain encrypted.",
                    "عرض متوافق مع PCI-DSS: يتم عرض آخر 4 أرقام فقط مع نوع البطاقة واسم الحامل وتاريخ الانتهاء، وتبقى الأرقام الكاملة ورمز CVV مشفرة."
                  )}
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800">
                {cardsList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40">
                    {loading
                      ? t("Loading saved cards...", "جاري تحميل البطاقات...")
                      : t("No saved guest cards found.", "لا توجد بطاقات محفوظة للضيوف.")}
                  </div>
                ) : (
                  <table className="w-full text-start border-collapse min-w-[760px] text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none">
                        <th className="py-2.5 px-4 text-start font-medium">{t("Guest", "الضيف")}</th>
                        <th className="py-2.5 px-4 text-start font-medium">{t("Cardholder Name", "اسم حامل البطاقة")}</th>
                        <th className="py-2.5 px-4 text-start font-medium">{t("Card Brand & Masked Number", "البطاقة (مشفرة)")}</th>
                        <th className="py-2.5 px-4 text-start font-medium">{t("Expiry", "الانتهاء")}</th>
                        <th className="py-2.5 px-4 text-start font-medium">{t("Status", "الحالة")}</th>
                        <th className="py-2.5 px-4 text-end font-medium">{t("Saved At", "تاريخ الحفظ")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {cardsList.map((card) => (
                        <tr key={`${card.userId}-${card.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{card.guestName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{card.guestEmail}</div>
                            {card.guestPhone && card.guestPhone !== "—" && (
                              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{card.guestPhone}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{card.cardholderName}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 font-mono text-[10px] font-medium uppercase border border-purple-200/60 dark:border-purple-800/50">
                                {card.brand}
                              </span>
                              <span className="font-mono font-medium text-slate-900 dark:text-slate-100" dir="ltr">
                                {card.maskedNumber}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {card.expiryMonth}/{card.expiryYear}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {card.isDefault && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-medium">
                                  {t("Default", "افتراضية")}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  card.supportsDirectCharge
                                    ? "bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                {card.supportsDirectCharge
                                  ? t("1-Click Vault", "محفظة فورية")
                                  : t("Gateway Ref", "مرجع بوابة")}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-end font-mono text-slate-500 dark:text-slate-400">
                            {formatDateTime(card.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* TABLE 4: LIVE ACTIVITY LOG */}
        {subTab === "activity" && (
          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pe-1">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl">
                {loading ? t("Loading activity feed...", "جاري التحميل...") : t("No user activities match this filter.", "لا يوجد نشاط مطابق.")}
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        CATEGORY_BADGE_MAP[act.category] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {act.category}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{act.title}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium uppercase text-slate-600 dark:text-slate-400">
                          {act.role}: {act.userName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">{act.details}</p>
                    </div>
                  </div>

                  <div className="text-end shrink-0 text-xs">
                    <div className="font-mono text-slate-500 dark:text-slate-400">{formatDateTime(act.timestamp)}</div>
                    {act.actor && <div className="text-[10px] text-slate-400 dark:text-slate-500">via {act.actor}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* SLIDE-OVER USER INSPECTION, GOVERNANCE & ACTIVITY TIMELINE DRAWER */}
      {selectedTarget && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/45 backdrop-blur-xs">
          <div
            data-testid="user-detail-drawer"
            className="w-full max-w-2xl bg-white dark:bg-[#0E0D16] h-full shadow-2xl border-s border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                    {selectedTarget.role === "host" ? "Host Partner" : "Guest Account"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                      selectedTarget.user.isSuspended
                        ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                    }`}
                  >
                    {selectedTarget.user.isSuspended ? "Suspended" : "Active"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                      selectedTarget.user.isVerified
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                    }`}
                  >
                    {selectedTarget.user.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {selectedTarget.user.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {selectedTarget.user.email} · {selectedTarget.user.phone} · ID: {selectedTarget.user.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Summary Stats */}
              {selectedTarget.role === "guest" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Total Spend", "الإنفاق")}</div>
                    <div className="font-mono font-semibold text-base text-[#4F2396] dark:text-purple-300 mt-0.5 tabular-nums">
                      SAR {selectedTarget.user.totalSpendSar.toFixed(0)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Bookings", "الحجوزات")}</div>
                    <div className="font-semibold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedTarget.user.totalBookings}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Reviews / Saves", "التقييمات")}</div>
                    <div className="font-semibold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedTarget.user.reviewsCount} / {selectedTarget.user.favoritesCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Last IP", "آخر IP")}</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300 text-xs mt-1 truncate">
                      {selectedTarget.user.lastIp || "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Host Net Share", "صافي المضيف")}</div>
                      <div className="font-mono font-semibold text-base text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                        SAR {selectedTarget.user.netEarningsSar.toFixed(0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Gross Bookings", "إجمالي الحجوزات")}</div>
                      <div className="font-mono font-semibold text-base text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                        SAR {selectedTarget.user.grossRevenueSar.toFixed(0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Properties", "العقارات")}</div>
                      <div className="font-semibold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                        {selectedTarget.user.approvedProperties}/{selectedTarget.user.totalProperties} {t("Live", "مباشر")}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t("Host Replies", "ردود المضيف")}</div>
                      <div className="font-semibold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                        {selectedTarget.user.repliesPosted}/{selectedTarget.user.reviewsReceived}
                      </div>
                    </div>
                  </div>

                  {/* Host Properties Portfolio */}
                  <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 bg-white dark:bg-[#0E0D16] space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("Managed Properties Portfolio", "عقارات المضيف")}
                    </h3>
                    {selectedTarget.user.properties.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">{t("No listings registered yet.", "لا توجد عقارات مسجلة حتى الآن.")}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedTarget.user.properties.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {p.title} ({p.city})
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">{t("SAR", "ر.س")} {p.basePrice}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                                  p.status === "approved"
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                                    : p.status === "rejected"
                                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
                                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
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
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                    className={`h-8 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition shadow-xs disabled:opacity-50 ${
                      selectedTarget.user.isVerified
                        ? "border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    className={`h-8 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition shadow-xs disabled:opacity-50 ${
                      selectedTarget.user.isSuspended
                        ? "bg-[#4F2396] hover:bg-[#3d1a75] text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}
                  >
                    {selectedTarget.user.isSuspended
                      ? t("Reactivate Account", "إعادة تفعيل الحساب")
                      : t("Suspend Account", "إيقاف الحساب مؤقتاً")}
                  </button>
                </div>

                {selectedTarget.user.adminNote && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                    <strong>{t("Pinned Note:", "ملاحظة:")}</strong> {selectedTarget.user.adminNote}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={t("Add internal compliance note to timeline...", "أضف ملاحظة داخلية لسجل النشاط...")}
                    className="flex-1 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
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
                    className="h-8 px-3.5 rounded-lg bg-[#4F2396] hover:bg-[#3d1a75] text-white text-xs font-medium cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {t("Log Note", "حفظ")}
                  </button>
                </div>
              </div>

              {/* Per-User Chronological Activity Timeline */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("User Activity Timeline", "الجدول الزمني لنشاط المستخدم")} ({selectedUserTimeline.length})
                </h3>

                {selectedUserTimeline.length === 0 ? (
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-400 dark:text-slate-500 text-center border border-slate-200/80 dark:border-slate-800">
                    {t("No tracked events recorded for this account yet.", "لا توجد أنشطة مسجلة لهذا الحساب بعد.")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUserTimeline.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                                CATEGORY_BADGE_MAP[ev.category] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {ev.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{ev.title}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ev.details}</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
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

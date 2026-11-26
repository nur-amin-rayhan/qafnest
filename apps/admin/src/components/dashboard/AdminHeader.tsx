"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Menu,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Globe,
  Clock,
  RefreshCw,
  Sun,
  Moon,
  Bell,
  BellRing,
  CheckCircle2,
  LogOut,
  Building2,
  Calendar,
  Compass,
  Headphones,
  WalletCards,
  Users,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getNumericUnitCode, matchesPropertySearchQuery } from "@qafnest/shared";
import type { SharedHostPayoutRecord } from "@qafnest/shared/hostPayoutConfig";
import {
  buildSelectedBookingDetail,
  type AdminMetrics,
  type AdminPropertyDeletionRequest,
  type PropertyItem,
  type BookingItem,
  type SelectedBookingDetail,
  type NavTab,
} from "./types";

type PayoutQueueItem = SharedHostPayoutRecord & {
  sla?: {
    isOverdue?: boolean;
    isUrgent?: boolean;
    countdownLabel?: string;
    countdownLabelAr?: string;
  };
};

interface AdminNotificationItem {
  id: string;
  kind: "property" | "payout" | "booking";
  title: string;
  subtitle: string;
  badge: string;
  tone: "rose" | "amber" | "violet" | "emerald";
  icon: string;
  onSelect: () => void;
}

const READ_NOTIF_STORAGE_KEY = "qafnest_admin_read_notifications_v1";

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  metrics: AdminMetrics;
  loading: boolean;
  onRefresh: () => void;
  triggerToast: (msg: string) => void;
  userEmail?: string;
  onSignOut: () => void;
  properties?: PropertyItem[];
  bookings?: BookingItem[];
  urgentPayoutQueue?: PayoutQueueItem[];
  deletionRequests?: AdminPropertyDeletionRequest[];
  onSelectProperty?: (prop: PropertyItem) => void;
  onSelectBooking?: (booking: SelectedBookingDetail) => void;
  onNavigateTab?: (tab: NavTab) => void;
  onOpenNotificationTarget?: (
    tab: NavTab,
    target: { bookingId?: string; propertyId?: string; payoutId?: string }
  ) => void;
}

export default function AdminHeader({
  searchQuery,
  setSearchQuery,
  metrics,
  loading,
  onRefresh,
  triggerToast,
  userEmail,
  onSignOut,
  properties = [],
  bookings = [],
  urgentPayoutQueue = [],
  deletionRequests = [],
  onSelectProperty,
  onSelectBooking,
  onNavigateTab,
  onOpenNotificationTarget,
}: AdminHeaderProps) {
  const { lang, toggleLang, dir, t, setMobileSidebarOpen, isDark, toggleTheme } = useAdminAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [submittingSearch, setSubmittingSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const notificationsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(READ_NOTIF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setReadIds(parsed.map(String));
      }
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  // Close search/notification dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = searchContainerRef.current?.contains(target);
      const inMobile = mobileSearchContainerRef.current?.contains(target);
      const inNotifications = notificationsContainerRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setDropdownOpen(false);
      }
      if (!inNotifications) {
        setNotificationsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const q = searchQuery.toLowerCase().trim();

  // Filter properties (including numeric Unit Number #, QN-/LIC- refs, host & location)
  const matchingProperties = q
    ? properties.filter((p) => matchesPropertySearchQuery(p, q)).slice(0, 5)
    : [];

  // Filter bookings
  const matchingBookings = q
    ? bookings
        .filter(
          (b) =>
            (b.booking_reference || "").toLowerCase().includes(q) ||
            (b.id || "").toLowerCase().includes(q) ||
            (b.guest_name || "").toLowerCase().includes(q) ||
            (b.guest_phone || "").includes(q) ||
            (b.property_title || "").toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  // Quick navigation shortcuts
  const NAV_SHORTCUTS: Array<{ tab: NavTab; labelEn: string; labelAr: string; icon: string }> = [
    { tab: "helpline-booking", labelEn: "Helpline Booking & Hold Queue", labelAr: "الحجز الهاتفي والدعم", icon: "support_agent" },
    { tab: "properties-management", labelEn: "Properties & Chalet Approvals", labelAr: "العقارات والشاليهات", icon: "villa" },
    { tab: "bookings-and-reservations", labelEn: "Bookings Ledger & Calendar", labelAr: "الحجوزات والجدول", icon: "calendar_month" },
    { tab: "financials-and-payouts", labelEn: "Financials, Payouts & ZATCA", labelAr: "المالية والمدفوعات", icon: "payments" },
    { tab: "user-management", labelEn: "User & Host Governance", labelAr: "إدارة المستخدمين", icon: "manage_accounts" },
  ];

  const matchingShortcuts = q
    ? NAV_SHORTCUTS.filter(
        (s) => s.labelEn.toLowerCase().includes(q) || s.labelAr.includes(q) || s.tab.includes(q)
      )
    : [];

  const hasResults = matchingProperties.length > 0 || matchingBookings.length > 0 || matchingShortcuts.length > 0;

  const toBookingDetail = (b: BookingItem): SelectedBookingDetail =>
    buildSelectedBookingDetail(b, t);

  const persistReadIds = (next: string[]) => {
    setReadIds(next);
    try {
      localStorage.setItem(READ_NOTIF_STORAGE_KEY, JSON.stringify(next.slice(-100)));
    } catch {
      // Ignore storage limits
    }
  };

  const markNotificationRead = (id: string) => {
    if (!readIds.includes(id)) {
      persistReadIds([...readIds, id]);
    }
  };

  const notifications = useMemo<AdminNotificationItem[]>(() => {
    const list: AdminNotificationItem[] = [];

    // 1. Overdue & Urgent 24h Host Payouts
    for (const p of urgentPayoutQueue.slice(0, 4)) {
      const isOverdue = Boolean(p.sla?.isOverdue);
      const slaText = lang === "ar" ? p.sla?.countdownLabelAr : p.sla?.countdownLabel;
      list.push({
        id: `payout:${p.id}:${p.status}`,
        kind: "payout",
        title: isOverdue
          ? t(`Overdue Host Payout · ${p.hostName}`, `تأخير تحويل لمضيف · ${p.hostName}`)
          : t(`Host Payout Due · ${p.hostName}`, `تحويل مستحق · ${p.hostName}`),
        subtitle: `${p.reference} · ${Number(p.netPayoutAmount || 0).toFixed(0)} ${t("SAR", "ر.س")}${
          slaText ? ` (${slaText})` : ""
        }`,
        badge: isOverdue ? t("Overdue", "متأخر") : t("24h SLA", "مهلة ٢٤س"),
        tone: isOverdue ? "rose" : "amber",
        icon: "payments",
        onSelect: () => {
          if (onOpenNotificationTarget) {
            onOpenNotificationTarget("financials-and-payouts", { payoutId: p.id });
          } else {
            onNavigateTab?.("financials-and-payouts");
          }
        },
      });
    }

    // 2. Pending Property Deletion Requests
    const pendingDeletions = deletionRequests.filter((r) => r.status === "pending");
    for (const delReq of pendingDeletions.slice(0, 4)) {
      list.push({
        id: `delreq:${delReq.id}:${delReq.requestedAt}`,
        kind: "property",
        title: t(
          `Removal Request: ${delReq.propertyTitle}`,
          `طلب حذف عقار: ${delReq.propertyTitleAr || delReq.propertyTitle}`
        ),
        subtitle: `${t(delReq.reasonLabelEn, delReq.reasonLabelAr)} · ${
          delReq.activeBookingsCount > 0
            ? t(
                `Blocked (${delReq.activeBookingsCount} active res.)`,
                `محظور (${delReq.activeBookingsCount} حجوزات نشطة)`
              )
            : t("0 active reservations", "0 حجوزات نشطة")
        }`,
        badge: t("Removal Req", "طلب حذف"),
        tone: delReq.activeBookingsCount > 0 ? "rose" : "amber",
        icon: "delete_sweep",
        onSelect: () => {
          onNavigateTab?.("properties-management");
        },
      });
    }

    // 2. Pending Property Approvals
    const pendingProps = properties.filter(
      (p) =>
        p.status === "pending" ||
        (!p.is_approved && p.status !== "rejected" && (p.status as string) !== "suspended")
    );
    for (const prop of pendingProps.slice(0, 4)) {
      list.push({
        id: `prop:${prop.id}:${prop.status}`,
        kind: "property",
        title: t(`Property Review: ${prop.title}`, `مراجعة عقار: ${prop.title}`),
        subtitle: `${prop.city || t("Saudi Arabia", "السعودية")} · ${
          prop.host_name || t("Host Partner", "شريك مضيف")
        }`,
        badge: t("Pending Review", "قيد المراجعة"),
        tone: "amber",
        icon: "villa",
        onSelect: () => {
          if (onOpenNotificationTarget) {
            onOpenNotificationTarget("properties-management", { propertyId: prop.id });
          } else if (onSelectProperty) {
            onSelectProperty(prop);
          } else {
            onNavigateTab?.("properties-management");
          }
        },
      });
    }

    // 3. Actionable Bookings (Refunds / Pending SADAD / Bank Transfers) + Latest Confirmed
    const actionBookings = bookings.filter(
      (b) =>
        b.status === "refund_requested" ||
        b.status === "pending" ||
        b.status === "pending_sadad" ||
        Boolean(b.transferClaim)
    );
    const otherRecentBookings = bookings
      .filter((b) => !actionBookings.some((ab) => ab.id === b.id))
      .slice(0, 3);

    for (const b of [...actionBookings.slice(0, 4), ...otherRecentBookings]) {
      const ref = b.booking_reference || b.id.slice(0, 8).toUpperCase();
      const isRefund = b.status === "refund_requested";
      const isHold = b.status === "pending" || b.status === "pending_sadad";
      list.push({
        id: `booking:${b.id}:${b.status}`,
        kind: "booking",
        title: isRefund
          ? t(`Refund Request · #${ref}`, `طلب استرداد · #${ref}`)
          : b.transferClaim
          ? t(`Bank Transfer Claim · #${ref}`, `إشعار تحويل بنكي · #${ref}`)
          : isHold
          ? t(`Pending SADAD Hold · #${ref}`, `حجز بانتظار السداد · #${ref}`)
          : t(`New Reservation · #${ref}`, `حجز جديد · #${ref}`),
        subtitle: `${b.guest_name || t("Guest", "ضيف")} · ${
          b.property_title || t("Property", "عقار")
        } · ${Number(b.total_price || 0).toLocaleString()} ${t("SAR", "ر.س")}`,
        badge: isRefund
          ? t("Refund", "استرداد")
          : isHold
          ? t("Action Req", "معلق")
          : t("Confirmed", "مؤكد"),
        tone: isRefund ? "rose" : isHold || b.transferClaim ? "violet" : "emerald",
        icon: "calendar_month",
        onSelect: () => {
          if (onOpenNotificationTarget) {
            onOpenNotificationTarget("bookings-and-reservations", { bookingId: b.id });
          } else if (onSelectBooking) {
            onSelectBooking(buildSelectedBookingDetail(b, t));
          } else {
            onNavigateTab?.("bookings-and-reservations");
          }
        },
      });
    }

    return list;
  }, [urgentPayoutQueue, deletionRequests, properties, bookings, lang, t, onNavigateTab, onSelectProperty, onSelectBooking, onOpenNotificationTarget]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllNotificationsRead = () => {
    const merged = Array.from(new Set([...readIds, ...notifications.map((n) => n.id)]));
    persistReadIds(merged);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q || submittingSearch) return;
    setSubmittingSearch(true);

    try {
      if (matchingBookings.length > 0 && onSelectBooking) {
        const selected = toBookingDetail(matchingBookings[0]);
        onSelectBooking(selected);
        setDropdownOpen(false);
        setMobileSearchOpen(false);
        triggerToast(t(`Opened Booking #${selected.id}`, `تم فتح الحجز #${selected.id}`));
      } else if (matchingProperties.length > 0 && onSelectProperty) {
        onSelectProperty(matchingProperties[0]);
        setDropdownOpen(false);
        setMobileSearchOpen(false);
        triggerToast(t(`Opened Property ${matchingProperties[0].title}`, `تم فتح العقار ${matchingProperties[0].title}`));
      } else if (matchingShortcuts.length > 0 && onNavigateTab) {
        onNavigateTab(matchingShortcuts[0].tab);
        setDropdownOpen(false);
        setMobileSearchOpen(false);
      } else {
        setDropdownOpen(true);
      }
    } finally {
      setSubmittingSearch(false);
    }
  };

  const renderDropdown = () => {
    if (!dropdownOpen || !q) return null;
    return (
      <div
        className="absolute top-full mt-1.5 start-0 end-0 z-50 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] shadow-2xl p-3 max-h-96 overflow-y-auto space-y-3"
        dir={dir}
      >
        {hasResults ? (
          <>
            {matchingBookings.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-[#4F2396] dark:text-purple-300 shrink-0" />
                  <span>{t("Reservations", "الحجوزات")} ({matchingBookings.length})</span>
                </div>
                <div className="space-y-1">
                  {matchingBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        if (onSelectBooking) onSelectBooking(toBookingDetail(b));
                        setDropdownOpen(false);
                        setMobileSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start text-xs transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <span className="font-mono text-[#4F2396] dark:text-purple-300 font-semibold shrink-0">#{b.booking_reference || b.id.slice(0, 8)}</span>
                          <span>·</span>
                          <span className="truncate">{b.guest_name || t("Guest", "ضيف")}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {b.property_title} ({b.guest_phone || "—"})
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-[#4F2396] dark:text-purple-300 shrink-0 tabular-nums">
                        {b.total_price} {t("SAR", "ر.س")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {matchingProperties.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1 flex items-center gap-1">
                  <Building2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("Properties & Chalets", "العقارات والشاليهات")} ({matchingProperties.length})</span>
                </div>
                <div className="space-y-1">
                  {matchingProperties.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (onSelectProperty) onSelectProperty(p);
                        setDropdownOpen(false);
                        setMobileSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start text-xs transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 shrink-0 border border-purple-200 dark:border-purple-800/50">
                            #{getNumericUnitCode(p.id)}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{p.title}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {p.city} · {p.district || p.category_name || t("Chalet", "شاليه")}
                          {p.tourism_license_number ? ` · LIC-${p.tourism_license_number}` : ""}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                        {p.status === "approved"
                          ? t("Approved", "معتمد")
                          : p.status === "pending"
                          ? t("Pending", "قيد المراجعة")
                          : p.status === "rejected"
                          ? t("Rejected", "مرفوض")
                          : p.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {matchingShortcuts.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1 flex items-center gap-1">
                  <Compass size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span>{t("Go to Tab", "الانتقال السريع")}</span>
                </div>
                <div className="space-y-1">
                  {matchingShortcuts.map((s) => {
                    const ShortcutIcon =
                      s.tab === "helpline-booking"
                        ? Headphones
                        : s.tab === "properties-management"
                        ? Building2
                        : s.tab === "bookings-and-reservations"
                        ? Calendar
                        : s.tab === "financials-and-payouts"
                        ? WalletCards
                        : s.tab === "user-management"
                        ? Users
                        : Compass;
                    return (
                      <button
                        key={s.tab}
                        type="button"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab(s.tab);
                          setDropdownOpen(false);
                          setMobileSearchOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-start text-xs font-semibold text-[#4F2396] dark:text-purple-300 transition cursor-pointer"
                      >
                        <ShortcutIcon size={15} className="shrink-0" />
                        <span className="truncate">{t(s.labelEn, s.labelAr)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
            {t("No matches found for your search.", "لا توجد نتائج مطابقة لبحثك.")}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header
        dir={dir}
        className="fixed top-0 start-0 lg:start-64 end-0 h-16 bg-white/95 dark:bg-[#0E0D16]/95 backdrop-blur-xl z-30 border-b border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between px-3 sm:px-5 lg:px-6 transition-all duration-300 gap-2 sm:gap-3"
      >
        {/* Start: Mobile Hamburger + Mobile Search Trigger + Desktop/Tablet Flex Search Bar */}
        <div ref={searchContainerRef} className="relative flex items-center gap-2 flex-1 min-w-0 max-w-sm xl:max-w-lg">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            title={t("Open Menu", "فتح القائمة")}
          >
            <Menu size={18} />
          </button>

          {/* Mobile Search Toggle (< sm screens) */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className={`sm:hidden w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
              mobileSearchOpen
                ? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
            title={t("Search", "بحث")}
          >
            {mobileSearchOpen ? <X size={16} /> : <Search size={16} />}
          </button>

          {/* Flexbox Search Form (sm+ screens - quiet, human-designed) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex items-center w-full h-9 px-3 gap-2 bg-slate-50/80 dark:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 focus-within:border-slate-300 dark:focus-within:border-slate-700 focus-within:ring-1 focus-within:ring-slate-300 dark:focus-within:ring-slate-700 transition-all min-w-0"
          >
            <Search size={15} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none" />
            <input
              className="flex-1 min-w-0 bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 rounded px-1"
              placeholder={t("Search reservations, units, hosts, phones...", "ابحث برقم الحجز، العقار، المضيف، الجوال...")}
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (q) setDropdownOpen(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDropdownOpen(false);
                }}
                className="w-5 h-5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
                title={t("Clear", "مسح")}
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            )}
          </form>

          {/* Desktop/Tablet Popover */}
          <div className="hidden sm:block">{renderDropdown()}</div>
        </div>

        {/* End: Tools & Operations Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer shrink-0 shadow-2xs"
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe size={14} strokeWidth={1.5} className="shrink-0 text-slate-500 dark:text-slate-400" />
            <span className="text-[11px] sm:text-xs">{lang === "ar" ? "English" : "العربية"}</span>
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={isDark ? t("Switch to light mode", "التبديل إلى الوضع النهاري") : t("Switch to dark mode", "التبديل إلى الوضع الليلي")}
            aria-label={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={15} strokeWidth={1.5} className="text-amber-400" /> : <Moon size={15} strokeWidth={1.5} />}
          </button>

          {/* Pending Review Verification Badge (Clickable on md+) */}
          {metrics.pendingVerification > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab?.("properties-management")}
              title={t("Open pending property reviews", "فتح العقارات قيد المراجعة")}
              className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/80 text-xs font-medium text-amber-800 dark:text-amber-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Clock size={13} strokeWidth={1.5} className="shrink-0" />
              <span className="font-mono tabular-nums">{metrics.pendingVerification}</span>
              <span className="hidden xl:inline">{t("in review", "قيد المراجعة")}</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t("Refresh data", "تحديث البيانات")}
          >
            <RefreshCw size={14} strokeWidth={1.5} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Notification Center Trigger */}
          <div ref={notificationsContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setDropdownOpen(false);
              }}
              aria-expanded={notificationsOpen}
              aria-label={t("Alerts & notifications", "التنبيهات والإشعارات")}
              className={`relative w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                notificationsOpen
                  ? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
              title={t("Alerts & notifications", "التنبيهات والإشعارات")}
            >
              <Bell size={15} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9.5px] font-mono tabular-nums font-semibold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                dir={dir}
                className="fixed sm:absolute top-16 sm:top-full sm:mt-2 inset-x-3 sm:inset-x-auto sm:end-0 sm:w-96 z-50 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] shadow-2xl overflow-hidden animate-in fade-in duration-150"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <BellRing size={16} className="text-[#4F2396] dark:text-purple-300 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t("Operations Notification Center", "مركز تنبيهات العمليات")}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-bold text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer shrink-0"
                    >
                      {t("Mark all read", "تحديد الكل كمقروء")}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center space-y-1.5">
                      <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 block mx-auto" />
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t("All Caught Up", "لا توجد تنبيهات معلقة حالياً")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {t(
                          "No pending property reviews, overdue payouts, or booking holds.",
                          "لا توجد مراجعات عقارية أو تحويلات متأخرة أو حجوزات معلقة."
                        )}
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isRead = readIds.includes(n.id);
                      const toneBadgeClass =
                        n.tone === "rose"
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
                          : n.tone === "amber"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                          : n.tone === "violet"
                          ? "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60";
                      const iconBgClass =
                        n.tone === "rose"
                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                          : n.tone === "amber"
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                          : n.tone === "violet"
                          ? "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400";

                      const ItemIcon =
                        n.kind === "property"
                          ? Building2
                          : n.kind === "payout"
                          ? WalletCards
                          : Calendar;

                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotificationsOpen(false);
                            n.onSelect();
                          }}
                          className={`w-full p-3 text-start flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                            isRead ? "opacity-70" : "bg-purple-50/20 dark:bg-purple-950/10"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBgClass}`}
                          >
                            <ItemIcon size={16} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                {n.title}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold border ${toneBadgeClass}`}
                                >
                                  {n.badge}
                                </span>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {n.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.("properties-management");
                    }}
                    className="text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
                  >
                    {t("Properties Queue", "قائمة العقارات")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh();
                      triggerToast(t("Refreshing live notifications...", "جاري تحديث التنبيهات..."));
                    }}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {t("Refresh", "تحديث")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.("financials-and-payouts");
                    }}
                    className="text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
                  >
                    {t("24h Payouts", "المدفوعات")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 ps-1.5 sm:ps-2 border-s border-slate-200 dark:border-slate-800 shrink-0">
            <div className="text-start hidden xl:flex flex-col">
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                {userEmail?.split("@")[0] || t("Admin", "المدير")}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {t("Operations", "العمليات")}
              </span>
            </div>

            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-medium text-[11px] shrink-0">
              {(userEmail?.split("@")[0] || "AD").slice(0, 2).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={onSignOut}
              title={t("Sign out", "تسجيل الخروج")}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Expandable Full-Width Mobile Search Drawer (Zero Overlap on 320px-639px viewports) */}
      {mobileSearchOpen && (
        <div
          ref={mobileSearchContainerRef}
          dir={dir}
          className="sm:hidden fixed top-16 start-0 end-0 z-30 bg-white/98 dark:bg-[#0E0D16]/98 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800 px-3 py-2.5 shadow-lg"
        >
          <div className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full h-10 px-2.5 gap-2 bg-slate-50 dark:bg-slate-900 focus-within:bg-white dark:focus-within:bg-[#0E0D16] rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-[#4F2396] dark:focus-within:border-purple-400"
            >
              <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onFocus={() => {
                  if (q) setDropdownOpen(true);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                placeholder={t("Search reservations, chalets, guests...", "ابحث بالحجز، العقار، الضيف...")}
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDropdownOpen(false);
                  }}
                  className="w-6 h-6 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
                  title={t("Clear", "مسح")}
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                disabled={submittingSearch}
                className="w-7 h-7 rounded-lg bg-[#4F2396] hover:bg-[#431D82] disabled:opacity-50 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title={t("Search", "بحث")}
              >
                {submittingSearch ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : dir === "rtl" ? (
                  <ArrowLeft size={14} />
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            </form>
            {renderDropdown()}
          </div>
        </div>
      )}
    </>
  );
}

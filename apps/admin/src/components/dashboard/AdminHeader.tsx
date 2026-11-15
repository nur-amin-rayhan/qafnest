"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  const { lang, toggleLang, dir, t, setMobileSidebarOpen } = useAdminAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    const pendingProps = properties.filter((p) => !p.is_approved || p.status === "pending");
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
  }, [urgentPayoutQueue, deletionRequests, properties, bookings, lang, t, onNavigateTab, onSelectProperty, onSelectBooking]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllNotificationsRead = () => {
    const merged = Array.from(new Set([...readIds, ...notifications.map((n) => n.id)]));
    persistReadIds(merged);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q) return;

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
  };

  const renderDropdown = () => {
    if (!dropdownOpen || !q) return null;
    return (
      <div
        className="absolute top-full mt-1.5 start-0 end-0 z-50 rounded-2xl border border-surface-container bg-surface-container-lowest shadow-2xl p-3 max-h-96 overflow-y-auto space-y-3"
        dir={dir}
      >
        {hasResults ? (
          <>
            {matchingBookings.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-outline uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-primary">calendar_month</span>
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
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-surface-container-low text-start text-xs transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-on-surface flex items-center gap-1.5 truncate">
                          <span className="font-mono text-primary font-black shrink-0">#{b.booking_reference || b.id.slice(0, 8)}</span>
                          <span>·</span>
                          <span className="truncate">{b.guest_name || t("Guest", "ضيف")}</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant truncate">
                          {b.property_title} ({b.guest_phone || "—"})
                        </div>
                      </div>
                      <span className="font-mono font-bold text-primary shrink-0">
                        {b.total_price} {t("SAR", "ر.س")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {matchingProperties.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-outline uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-status-emerald">villa</span>
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
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-surface-container-low text-start text-xs transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                            #{getNumericUnitCode(p.id)}
                          </span>
                          <span className="font-bold text-on-surface truncate">{p.title}</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant truncate mt-0.5">
                          {p.city} · {p.district || p.category_name || t("Chalet", "شاليه")}
                          {p.tourism_license_number ? ` · LIC-${p.tourism_license_number}` : ""}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface shrink-0">
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
                <div className="text-[10px] font-bold text-outline uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">alt_route</span>
                  <span>{t("Go to Tab", "الانتقال السريع")}</span>
                </div>
                <div className="space-y-1">
                  {matchingShortcuts.map((s) => (
                    <button
                      key={s.tab}
                      type="button"
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab(s.tab);
                        setDropdownOpen(false);
                        setMobileSearchOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-primary/10 text-start text-xs font-bold text-primary transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] shrink-0">{s.icon}</span>
                      <span className="truncate">{t(s.labelEn, s.labelAr)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-xs text-outline">
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
        className="fixed top-0 start-0 lg:start-64 xl:start-72 end-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl z-30 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container flex items-center justify-between px-3 sm:px-5 lg:px-6 transition-all duration-300 gap-2 sm:gap-3"
      >
        {/* Start: Mobile Hamburger + Mobile Search Trigger + Desktop/Tablet Flex Search Bar */}
        <div ref={searchContainerRef} className="relative flex items-center gap-2 flex-1 min-w-0 max-w-sm xl:max-w-lg">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            title={t("Open Menu", "فتح القائمة")}
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          {/* Mobile Search Toggle (< sm screens) */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className={`sm:hidden w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
              mobileSearchOpen
                ? "border-primary bg-primary text-on-primary"
                : "border-surface-container bg-surface-container-low hover:bg-surface-container text-on-surface"
            }`}
            title={t("Search", "بحث")}
          >
            <span className="material-symbols-outlined text-[19px]">
              {mobileSearchOpen ? "close" : "search"}
            </span>
          </button>

          {/* Flexbox Search Form (sm+ screens - zero absolute overlap) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex items-center w-full h-10 px-2.5 gap-2 bg-surface-container-low focus-within:bg-surface-container-lowest rounded-xl border border-transparent focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 transition-all min-w-0"
          >
            <span className="material-symbols-outlined text-outline text-[18px] shrink-0 pointer-events-none">
              search
            </span>
            <input
              className="flex-1 min-w-0 bg-transparent font-body-sm text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none"
              placeholder={t("Search reservations, chalets, guests, phones...", "ابحث برقم الحجز، العقار، الضيف، الجوال...")}
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
                className="w-6 h-6 rounded-lg text-outline hover:text-on-surface flex items-center justify-center shrink-0 cursor-pointer"
                title={t("Clear", "مسح")}
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}

            <button
              type="submit"
              className="w-7 h-7 rounded-lg bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition"
              title={t("Execute Search", "بحث فوري")}
            >
              <span className="material-symbols-outlined text-[16px]">
                {dir === "rtl" ? "arrow_back" : "arrow_forward"}
              </span>
            </button>
          </form>

          {/* Desktop/Tablet Popover */}
          <div className="hidden sm:block">{renderDropdown()}</div>
        </div>

        {/* End: Centralized Tools & Operations Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Switcher Button (Preserves RTL/LTR) */}
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1 sm:gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">translate</span>
            <span className="text-[11px] sm:text-[12px]">{lang === "ar" ? "English" : "العربية"}</span>
          </button>

          {/* Centralized Operations Status Pill (Visible on large screens) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container text-xs font-semibold text-on-surface">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-emerald"></span>
            </span>
            <span className="whitespace-nowrap">{t("Centralized Mode", "الوضع المركزي")}</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-container text-primary">
              v1.0.0
            </span>
          </div>

          {/* Pending Review Verification Pill (Clickable shortcut on md+) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.("properties-management")}
            title={t("Open Pending Property Reviews", "فتح العقارات قيد المراجعة")}
            className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-status-sand/15 hover:bg-status-sand/25 border border-status-sand/30 text-xs font-bold text-status-sand whitespace-nowrap cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">pending_actions</span>
            <span>{metrics.pendingVerification}</span>
            <span className="hidden xl:inline">{t("Pending Review", "قيد المراجعة")}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="w-9 h-9 rounded-xl border border-surface-container-high/60 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t("Refresh Operational Live Data", "تحديث البيانات الحية")}
          >
            <span className={`material-symbols-outlined text-[19px] ${loading ? "animate-spin" : ""}`}>
              sync
            </span>
          </button>

          {/* Actionable Notification Center Dropdown */}
          <div ref={notificationsContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setDropdownOpen(false);
              }}
              aria-expanded={notificationsOpen}
              aria-label={t("Alerts & Notifications", "التنبيهات والإشعارات")}
              className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                notificationsOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-surface-container-high/60 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
              title={t("Alerts & Notifications", "التنبيهات والإشعارات")}
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-accent-coral text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                dir={dir}
                className="fixed sm:absolute top-16 sm:top-full sm:mt-2 inset-x-3 sm:inset-x-auto sm:end-0 sm:w-96 z-50 rounded-2xl border border-surface-container bg-surface-container-lowest shadow-2xl overflow-hidden animate-in fade-in duration-150"
              >
                <div className="px-4 py-3 border-b border-surface-container flex items-center justify-between gap-2 bg-surface-container-low/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                      notifications_active
                    </span>
                    <span className="font-title-sm text-xs font-black text-on-surface truncate">
                      {t("Operations Notification Center", "مركز تنبيهات العمليات")}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer shrink-0"
                    >
                      {t("Mark all read", "تحديد الكل كمقروء")}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-surface-container-low">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center space-y-1.5">
                      <span className="material-symbols-outlined text-[28px] text-status-emerald block">
                        check_circle
                      </span>
                      <p className="text-xs font-bold text-on-surface">
                        {t("All Caught Up", "لا توجد تنبيهات معلقة حالياً")}
                      </p>
                      <p className="text-[11px] text-outline">
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
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : n.tone === "amber"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : n.tone === "violet"
                          ? "bg-violet-50 text-primary border-violet-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200";
                      const iconBgClass =
                        n.tone === "rose"
                          ? "bg-rose-100 text-rose-700"
                          : n.tone === "amber"
                          ? "bg-amber-100 text-amber-800"
                          : n.tone === "violet"
                          ? "bg-primary/10 text-primary"
                          : "bg-emerald-100 text-emerald-700";

                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotificationsOpen(false);
                            n.onSelect();
                          }}
                          className={`w-full p-3 text-start flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-surface-container-low ${
                            isRead ? "opacity-70" : "bg-primary/[0.02]"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBgClass}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">{n.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-on-surface line-clamp-1">
                                {n.title}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold border ${toneBadgeClass}`}
                                >
                                  {n.badge}
                                </span>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-brand-accent-coral shrink-0" />
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-on-surface-variant line-clamp-2">
                              {n.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="px-3 py-2.5 border-t border-surface-container bg-surface-container-low/60 flex items-center justify-between gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.("properties-management");
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {t("Properties Queue", "قائمة العقارات")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh();
                      triggerToast(t("Refreshing live notifications...", "جاري تحديث التنبيهات..."));
                    }}
                    className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    {t("Refresh", "تحديث")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.("financials-and-payouts");
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {t("24h Payouts", "المدفوعات")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Sign Out Strip */}
          <div className="flex items-center gap-1.5 sm:gap-2 ps-1.5 sm:ps-2 border-s border-surface-container-high shrink-0">
            <div className="text-start hidden xl:flex flex-col">
              <span className="font-title-sm text-xs text-on-surface leading-tight font-bold truncate max-w-[120px]">
                {userEmail?.split("@")[0] || t("Admin", "المدير")}
              </span>
              <span className="font-label-sm text-[10px] text-outline">
                {t("Operations", "العمليات")}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-2xs border border-primary/20 shrink-0">
              {(userEmail?.split("@")[0] || "AD").slice(0, 2).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={onSignOut}
              title={t("Sign out of Admin Operations", "تسجيل الخروج")}
              className="w-8 h-8 rounded-xl text-outline hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Expandable Full-Width Mobile Search Drawer (Zero Overlap on 320px-639px viewports) */}
      {mobileSearchOpen && (
        <div
          ref={mobileSearchContainerRef}
          dir={dir}
          className="sm:hidden fixed top-16 start-0 end-0 z-30 bg-surface-container-lowest/98 backdrop-blur-xl border-b border-surface-container px-3 py-2.5 shadow-lg"
        >
          <div className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full h-10 px-2.5 gap-2 bg-surface-container-low focus-within:bg-surface-container-lowest rounded-xl border border-surface-container-high focus-within:border-primary/40"
            >
              <span className="material-symbols-outlined text-outline text-[18px] shrink-0 pointer-events-none">
                search
              </span>
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
                className="flex-1 min-w-0 bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDropdownOpen(false);
                  }}
                  className="w-6 h-6 rounded-lg text-outline hover:text-on-surface flex items-center justify-center shrink-0 cursor-pointer"
                  title={t("Clear", "مسح")}
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
              <button
                type="submit"
                className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 cursor-pointer"
                title={t("Search", "بحث")}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {dir === "rtl" ? "arrow_back" : "arrow_forward"}
                </span>
              </button>
            </form>
            {renderDropdown()}
          </div>
        </div>
      )}
    </>
  );
}

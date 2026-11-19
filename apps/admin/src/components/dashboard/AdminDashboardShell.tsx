"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getAdminTabHref } from "@/lib/adminRoutes";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import AdminHeader from "@/components/dashboard/AdminHeader";
import BookingDrawer from "@/components/dashboard/BookingDrawer";
import { PropertyDetailDrawer } from "@/components/dashboard/PropertyDetailDrawer";
import { PropertyReviewModal } from "@/components/dashboard/PropertyReviewModal";
import { DashboardOverviewTab } from "@/components/dashboard/DashboardOverviewTab";
import { PropertiesManagementTab } from "@/components/dashboard/PropertiesManagementTab";
import { BookingsTab } from "@/components/dashboard/BookingsTab";
import { HelplineBookingTab } from "@/components/dashboard/HelplineBookingTab";
import { UserManagementTab } from "@/components/dashboard/UserManagementTab";
import { FinancialsTab } from "@/components/dashboard/FinancialsTab";
import { GuestReviewsTab } from "@/components/dashboard/GuestReviewsTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import PromotionsTab from "@/components/dashboard/PromotionsTab";
import LoyaltyTab from "@/components/dashboard/LoyaltyTab";
import { useAdminDashboardData } from "@/components/dashboard/hooks/useAdminDashboardData";
import {
  buildSelectedBookingDetail,
  type NavTab,
  type PropertyItem,
  type SelectedBookingDetail,
} from "@/components/dashboard/types";

interface AdminDashboardShellProps {
  initialTab?: NavTab;
}

export function AdminDashboardShell({ initialTab = "dashboard-overview" }: AdminDashboardShellProps) {
  const router = useRouter();
  const { user, signOut, dir, t } = useAdminAuth();
  const [activeTab, setActiveTabState] = useState<NavTab>(initialTab);

  useEffect(() => {
    setActiveTabState(initialTab);
  }, [initialTab]);

  const setActiveTab = useCallback(
    (nextTab: NavTab) => {
      setActiveTabState(nextTab);
      router.push(getAdminTabHref(nextTab));
    },
    [router]
  );

  const [selectedBooking, setSelectedBooking] = useState<SelectedBookingDetail | null>(null);
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<PropertyItem | null>(null);
  const [propertyReviewModalTarget, setPropertyReviewModalTarget] = useState<PropertyItem | null>(null);

  const {
    loading,
    errorMsg,
    searchQuery,
    setSearchQuery,
    propertyStatusFilter,
    setPropertyStatusFilter,
    propertyCityFilter,
    setPropertyCityFilter,
    propertyTypeFilter,
    setPropertyTypeFilter,
    bookingStatusFilter,
    setBookingStatusFilter,
    bookingSearch,
    setBookingSearch,
    selectedPropertyIds,
    setSelectedPropertyIds,
    showBatchMenu,
    setShowBatchMenu,
    toastMsg,
    triggerToast,
    liveAlerts,
    dismissLiveAlert,
    metrics,
    properties,
    bookings,
    payoutReminders,
    urgentPayoutQueue,
    deletionRequests,
    reviewDeletionRequest,
    quickDisbursePayout,
    sendOverviewPayoutReminders,
    loadLiveAdminData,
    updatePropertyStatus,
    handleBulkPublish,
    handleBulkSuspend,
    filteredProperties,
    filteredBookings,
    selectAllProps,
    togglePropSelection,
  } = useAdminDashboardData();

  const handleUpdatePropertyStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending",
    feedback?: string
  ) => {
    await updatePropertyStatus(id, status, feedback);
    if (selectedPropertyForDetail && selectedPropertyForDetail.id === id) {
      setSelectedPropertyForDetail((prev) =>
        prev
          ? {
              ...prev,
              status,
              is_approved: status === "approved",
              admin_feedback: feedback || (status === "approved" ? "" : prev.admin_feedback),
              rejection_reason: feedback || (status === "approved" ? "" : prev.rejection_reason),
            }
          : null
      );
    }
  };

  const clearUrlQueryParam = useCallback((paramKey: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has(paramKey)) {
      url.searchParams.delete(paramKey);
      const nextHref = `${url.pathname}${url.search ? url.search : ""}`;
      window.history.replaceState(null, "", nextHref);
    }
  }, []);

  const handleOpenNotificationTarget = useCallback(
    (
      tab: NavTab,
      target: { bookingId?: string; propertyId?: string; payoutId?: string }
    ) => {
      const baseHref = getAdminTabHref(tab);
      const params = new URLSearchParams();
      if (target.bookingId) {
        params.set("bookingId", target.bookingId);
        const match = bookings.find((b) => b.id === target.bookingId);
        if (match) {
          setSelectedBooking(buildSelectedBookingDetail(match, t));
        }
      }
      if (target.propertyId) {
        params.set("propertyId", target.propertyId);
        const match = properties.find((p) => p.id === target.propertyId);
        if (match) {
          setSelectedPropertyForDetail(match);
        }
      }
      if (target.payoutId) {
        params.set("payoutId", target.payoutId);
      }

      const qs = params.toString();
      const targetHref = qs ? `${baseHref}?${qs}` : baseHref;
      setActiveTabState(tab);
      router.push(targetHref);
    },
    [bookings, properties, router, t]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const targetBookingId = params.get("bookingId");
    const targetPropertyId = params.get("propertyId");

    if (targetBookingId && bookings.length > 0 && selectedBooking?.dbId !== targetBookingId) {
      const match = bookings.find((b) => b.id === targetBookingId);
      if (match) {
        setSelectedBooking(buildSelectedBookingDetail(match, t));
      }
    }

    if (targetPropertyId && properties.length > 0 && selectedPropertyForDetail?.id !== targetPropertyId) {
      const match = properties.find((p) => p.id === targetPropertyId);
      if (match) {
        setSelectedPropertyForDetail(match);
      }
    }
  }, [activeTab, bookings, properties, selectedBooking?.dbId, selectedPropertyForDetail?.id, t]);

  return (
    <div dir={dir} className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 end-6 transform transition-all duration-300 pointer-events-none z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 ${
          toastMsg ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
      >
        <span className="material-symbols-outlined text-[20px] text-status-emerald">info</span>
        <span className="font-body-sm text-body-sm font-medium">{toastMsg}</span>
      </div>

      {/* Clickable Slide-In Side Realtime Notification Popups */}
      {liveAlerts.length > 0 && (
        <div className="fixed top-20 end-5 z-50 flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)]">
          {liveAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-[#E5E7EB] bg-white shadow-xl p-3.5 flex items-start gap-3 transition-all hover:border-[#2563EB]"
            >
              <button
                type="button"
                onClick={() => {
                  if (alert.kind === "booking") {
                    handleOpenNotificationTarget("bookings-and-reservations", {
                      bookingId: alert.bookingId,
                    });
                  } else {
                    handleOpenNotificationTarget("properties-management", {
                      propertyId: alert.propertyId,
                    });
                  }
                  dismissLiveAlert(alert.id);
                }}
                className="flex-1 flex items-start gap-2.5 text-start cursor-pointer min-w-0"
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.kind === "booking"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-[#2563EB]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {alert.kind === "booking" ? "calendar_check" : "villa"}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#111827] truncate">{alert.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{alert.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 truncate">{alert.subtitle}</p>
                  <span className="inline-block text-[10px] font-semibold text-[#2563EB] mt-1">
                    {t("Click to open →", "اضغط للفتح ←")}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => dismissLiveAlert(alert.id)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0 cursor-pointer"
                title={t("Dismiss", "إغلاق")}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Property Detail Drawer */}
      <PropertyDetailDrawer
        property={selectedPropertyForDetail}
        isOpen={Boolean(selectedPropertyForDetail)}
        onClose={() => {
          setSelectedPropertyForDetail(null);
          clearUrlQueryParam("propertyId");
        }}
        onApprove={async (id) => {
          await handleUpdatePropertyStatus(id, "approved");
          setSelectedPropertyForDetail(null);
          clearUrlQueryParam("propertyId");
        }}
        onRequestRevisions={(prop) => {
          setPropertyReviewModalTarget(prop);
        }}
        onReviewDeletionRequest={async (params) => {
          const res = await reviewDeletionRequest(params);
          if (res.ok && params.action === "approve") {
            setSelectedPropertyForDetail(null);
            clearUrlQueryParam("propertyId");
          }
          return res;
        }}
      />

      {/* Property Review & Reject Feedback Modal */}
      <PropertyReviewModal
        property={propertyReviewModalTarget}
        isOpen={Boolean(propertyReviewModalTarget)}
        onClose={() => setPropertyReviewModalTarget(null)}
        onSubmitFeedback={async (id, feedback) => {
          await handleUpdatePropertyStatus(id, "rejected", feedback);
          setPropertyReviewModalTarget(null);
        }}
      />

      {/* Aside Nav (Fixed Start 72 on Desktop, Slide-over on Mobile) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingPayoutsCount={metrics.pendingPayoutsCount}
        overduePayoutsCount={metrics.overduePayoutsCount}
        onNavItemClick={() => {
          setSelectedBooking(null);
          setSelectedPropertyForDetail(null);
          clearUrlQueryParam("bookingId");
          clearUrlQueryParam("propertyId");
        }}
      />

      {/* Main Content Area */}
      <div className="lg:ps-64 flex flex-col min-h-screen w-full min-w-0 max-w-full transition-all duration-300">
        {/* Header */}
        <AdminHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          metrics={metrics}
          loading={loading}
          onRefresh={loadLiveAdminData}
          triggerToast={triggerToast}
          userEmail={user?.email}
          onSignOut={signOut}
          properties={properties}
          bookings={bookings}
          urgentPayoutQueue={urgentPayoutQueue}
          deletionRequests={deletionRequests}
          onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
          onSelectBooking={(b) => setSelectedBooking(b)}
          onNavigateTab={setActiveTab}
          onOpenNotificationTarget={handleOpenNotificationTarget}
        />

        {/* Main Canvas */}
        <main className="w-full min-w-0 max-w-full min-h-screen pt-20 sm:pt-24 pb-12 flex-1 bg-[#F8F9FA] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col w-full max-w-[1600px] mx-auto space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {selectedBooking ? (
              <BookingDrawer
                selectedBooking={selectedBooking}
                onClose={() => {
                  setSelectedBooking(null);
                  clearUrlQueryParam("bookingId");
                }}
                onRefresh={loadLiveAdminData}
                onOpenFinancials={() =>
                  selectedBooking?.payoutSummary?.id
                    ? handleOpenNotificationTarget("financials-and-payouts", {
                        payoutId: selectedBooking.payoutSummary.id,
                      })
                    : setActiveTab("financials-and-payouts")
                }
                onInspectProperty={(propertyId) => {
                  setSelectedBooking(null);
                  clearUrlQueryParam("bookingId");
                  const match = properties.find((p) => p.id === propertyId);
                  if (match) {
                    setSelectedPropertyForDetail(match);
                  } else {
                    handleOpenNotificationTarget("properties-management", { propertyId });
                    triggerToast(t("Opening property record...", "جاري فتح سجل العقار..."));
                  }
                }}
                triggerToast={triggerToast}
              />
            ) : (
              <>
                {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard-overview" && (
              <DashboardOverviewTab
                metrics={metrics}
                properties={properties}
                bookings={bookings}
                payoutReminders={payoutReminders}
                urgentPayoutQueue={urgentPayoutQueue}
                onInspectPayout={(payoutId) =>
                  handleOpenNotificationTarget("financials-and-payouts", { payoutId })
                }
                onQuickDisbursePayout={quickDisbursePayout}
                onSendPayoutReminders={sendOverviewPayoutReminders}
                updatePropertyStatus={handleUpdatePropertyStatus}
                setActiveTab={setActiveTab}
                setSelectedBooking={setSelectedBooking}
                onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
                onRequestReject={(prop) => setPropertyReviewModalTarget(prop)}
              />
            )}

            {/* TAB 2: PROPERTIES & CHALETS */}
            {activeTab === "properties-management" && (
              <PropertiesManagementTab
                properties={properties}
                filteredProperties={filteredProperties}
                propertyStatusFilter={propertyStatusFilter}
                setPropertyStatusFilter={setPropertyStatusFilter}
                propertyCityFilter={propertyCityFilter}
                setPropertyCityFilter={setPropertyCityFilter}
                propertyTypeFilter={propertyTypeFilter}
                setPropertyTypeFilter={setPropertyTypeFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedPropertyIds={selectedPropertyIds}
                togglePropSelection={togglePropSelection}
                selectAllProps={selectAllProps}
                showBatchMenu={showBatchMenu}
                setShowBatchMenu={setShowBatchMenu}
                handleBulkPublish={handleBulkPublish}
                handleBulkSuspend={handleBulkSuspend}
                setSelectedPropertyIds={setSelectedPropertyIds}
                updatePropertyStatus={handleUpdatePropertyStatus}
                triggerToast={triggerToast}
                onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
                onRequestReject={(prop) => setPropertyReviewModalTarget(prop)}
                deletionRequests={deletionRequests}
                onReviewDeletionRequest={reviewDeletionRequest}
              />
            )}

            {/* TAB 3: BOOKINGS & SCHEDULE */}
            {activeTab === "bookings-and-reservations" && (
              <BookingsTab
                bookings={bookings}
                filteredBookings={filteredBookings}
                properties={properties}
                bookingStatusFilter={bookingStatusFilter}
                setBookingStatusFilter={setBookingStatusFilter}
                bookingSearch={bookingSearch}
                setBookingSearch={setBookingSearch}
                setSelectedBooking={setSelectedBooking}
                onRefresh={loadLiveAdminData}
                triggerToast={triggerToast}
              />
            )}

            {/* TAB 3B: DEDICATED HELPLINE BOOKING WORKSPACE */}
            {activeTab === "helpline-booking" && (
              <HelplineBookingTab
                properties={properties}
                bookings={bookings}
                onRefresh={loadLiveAdminData}
                setSelectedBooking={setSelectedBooking}
                onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
                triggerToast={triggerToast}
              />
            )}

            {/* TAB 3C: USER MANAGEMENT (GUESTS, HOSTS & ACTIVITY) */}
            {activeTab === "user-management" && (
              <UserManagementTab triggerToast={triggerToast} />
            )}

            {/* TAB: PROMOTIONS & COUPONS */}
            {activeTab === "promotions-and-coupons" && (
              <PromotionsTab triggerToast={triggerToast} />
            )}

            {/* TAB: LOYALTY & REWARDS */}
            {activeTab === "loyalty-and-rewards" && (
              <LoyaltyTab triggerToast={triggerToast} />
            )}

            {/* TAB 4: FINANCIALS & PAYOUTS */}
            {activeTab === "financials-and-payouts" && <FinancialsTab metrics={metrics} />}

            {/* TAB 5: GUEST REVIEWS */}
            {activeTab === "guest-reviews" && <GuestReviewsTab triggerToast={triggerToast} />}

            {/* TAB 6: SETTINGS */}
            {activeTab === "settings" && <SettingsTab />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

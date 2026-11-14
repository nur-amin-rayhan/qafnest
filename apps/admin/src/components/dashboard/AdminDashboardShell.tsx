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
import type {
  NavTab,
  PropertyItem,
  SelectedBookingDetail,
} from "@/components/dashboard/types";

interface AdminDashboardShellProps {
  initialTab?: NavTab;
}

export function AdminDashboardShell({ initialTab = "dashboard-overview" }: AdminDashboardShellProps) {
  const router = useRouter();
  const { user, signOut, dir } = useAdminAuth();
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
    metrics,
    properties,
    bookings,
    payoutReminders,
    urgentPayoutQueue,
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

      {/* Slide-over Booking Details Drawer */}
      <BookingDrawer
        selectedBooking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onRefresh={loadLiveAdminData}
        triggerToast={triggerToast}
      />

      {/* Property Detail Drawer */}
      <PropertyDetailDrawer
        property={selectedPropertyForDetail}
        isOpen={Boolean(selectedPropertyForDetail)}
        onClose={() => setSelectedPropertyForDetail(null)}
        onApprove={async (id) => {
          await handleUpdatePropertyStatus(id, "approved");
          setSelectedPropertyForDetail(null);
        }}
        onRequestRevisions={(prop) => {
          setPropertyReviewModalTarget(prop);
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
      />

      {/* Main Content Area */}
      <div className="lg:ps-72 flex flex-col min-h-screen w-full min-w-0 max-w-full transition-all duration-300">
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
          onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
          onSelectBooking={(b) => setSelectedBooking(b)}
          onNavigateTab={setActiveTab}
        />

        {/* Main Canvas */}
        <main className="w-full min-w-0 max-w-full min-h-screen pt-24 sm:pt-28 pb-12 flex-1 bg-surface-desert-sand px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col w-full max-w-[1600px] mx-auto space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard-overview" && (
              <DashboardOverviewTab
                metrics={metrics}
                properties={properties}
                bookings={bookings}
                payoutReminders={payoutReminders}
                urgentPayoutQueue={urgentPayoutQueue}
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
          </div>
        </main>
      </div>
    </div>
  );
}

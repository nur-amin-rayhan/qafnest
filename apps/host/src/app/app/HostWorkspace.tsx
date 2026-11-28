"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHostAuth } from "@/context/HostAuthContext";
import { CheckCircle2, X } from "lucide-react";
import HostTopNav, { type HostNotification, type Module } from "@/components/dashboard/HostTopNav";
import { HostSidebar } from "@/components/dashboard/nav/HostSidebar";
import { HostMobileBottomBar } from "@/components/dashboard/nav/HostMobileBottomBar";
import {
  HostNotificationDetailModal,
  type NotificationDestination,
} from "@/components/dashboard/nav/HostNotificationDetailModal";
import HostBookingsManagement from "@/components/dashboard/HostBookingsManagement";
import HostReviewsManagement from "@/components/dashboard/HostReviewsManagement";
import HostAnalyticsDashboard from "@/components/dashboard/HostAnalyticsDashboard";
import HostOverviewHub from "@/components/dashboard/HostOverviewHub";
import HostPropertiesHub from "@/components/dashboard/HostPropertiesHub";
import HostCalendarPricingHub from "@/components/dashboard/HostCalendarPricingHub";
import HostFinancialsHub from "@/components/dashboard/HostFinancialsHub";
import HostSettingsView from "@/components/dashboard/HostSettingsView";
import HostRealtimeAlerts from "@/components/dashboard/HostRealtimeAlerts";
import { DeletePropertyModal } from "@/components/dashboard/properties/DeletePropertyModal";
import { useHostWorkspaceData } from "./hooks/useHostWorkspaceData";
import { useHostTabRouting } from "./hooks/useHostTabRouting";
import { localizeHostPath } from "@/lib/hostLocale";

interface HostWorkspaceProps {
  initialTab?: string;
}

export default function HostWorkspace({ initialTab }: HostWorkspaceProps) {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut, openHostAuthModal, lang, setLang, theme, toggleTheme } = useHostAuth();
  const { activeTab, setActiveTab } = useHostTabRouting(initialTab, lang);

  const [selectedNotification, setSelectedNotification] = useState<HostNotification | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const {
    submittedProperties,
    liveBookings,
    reviews,
    reviewStats,
    notifications,
    bannerNotice,
    setBannerNotice,
    loadDashboardData,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    deleteTarget,
    deletingPropertyId,
    deleteError,
    requestDeleteProperty,
    cancelDeleteProperty,
    confirmDeleteProperty,
    realtimeAlerts,
    isRealtimeConnected,
    dismissAlert,
  } = useHostWorkspaceData(user?.id, lang);

  // Authentication check (Redirect to landing and open modal if unauthenticated)
  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl =
        typeof window !== "undefined" ? window.location.pathname : localizeHostPath("/app", lang);
      router.replace(`${localizeHostPath("/", lang)}?auth=required&returnUrl=${encodeURIComponent(returnUrl)}`);
      openHostAuthModal("signin", returnUrl);
    }
  }, [authLoading, user, router, openHostAuthModal, lang]);

  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  if (authLoading || !user) {
    return (
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-[#f3f3f7]"
      >
        <div className="flex flex-col items-center gap-3 text-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-200 border-t-[#4F2396]" />
          <p className="text-sm font-bold text-slate-700">
            {t("Verifying host credentials...", "جارٍ التحقق من تسجيل دخول المضيف والتحويل...")}
          </p>
        </div>
      </div>
    );
  }

  const handleSelectNotification = (notif: HostNotification) => {
    setSelectedNotification(notif);
    if (!notif.is_read) {
      void handleMarkNotificationRead(notif.id);
    }
  };

  const handleNavigateFromNotification = (dest: NotificationDestination) => {
    setActiveTab(dest.module);
    if (typeof window !== "undefined") {
      const targetPath = localizeHostPath(`/app/${dest.module}`, lang);
      const qs = dest.bookingId ? `?bookingId=${encodeURIComponent(dest.bookingId)}` : "";
      router.replace(`${targetPath}${qs}`);
    }
  };

  const hasPropertyIssues = submittedProperties.some(
    (p) => p.status === "rejected" || Boolean(p.adminFeedback)
  );

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f3f3f7] dark:bg-[#06060b] text-slate-900 dark:text-slate-100 flex font-body transition-colors"
    >
      {/* Desktop Sidebar (hidden on tablet and mobile) */}
      <HostSidebar
        active={activeTab}
        setActive={setActiveTab}
        lang={lang}
        setLang={setLang}
        t={t}
        user={user}
        profile={profile}
        signOut={signOut}
        submittedPropertiesCount={submittedProperties.length}
        hasPropertyIssues={hasPropertyIssues}
        bookingsCount={liveBookings.length}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 xl:pb-10">
        {/* Top Header */}
        <HostTopNav
          active={activeTab}
          setActive={setActiveTab}
          lang={lang}
          setLang={setLang}
          t={t}
          user={user}
          profile={profile}
          signOut={signOut}
          submittedPropertiesCount={submittedProperties.length}
          hasPropertyIssues={hasPropertyIssues}
          bookingsCount={liveBookings.length}
          notifications={notifications}
          onSelectNotification={handleSelectNotification}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          theme={theme}
          toggleTheme={toggleTheme}
        />

      <HostNotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onNavigateDestination={handleNavigateFromNotification}
        lang={lang}
        t={t}
      />

      {/* Dynamic Toast / Notice for property submission / resubmission */}
      {bannerNotice && (
        <div className="mx-auto mt-4 w-full max-w-[1640px] px-4 sm:px-8">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-xs sm:text-sm font-bold text-emerald-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{bannerNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Submodule Tab Views */}
      {activeTab === "overview" && (
        <HostOverviewHub
          properties={submittedProperties}
          bookings={liveBookings}
          reviews={reviews}
          reviewStats={reviewStats}
          hostName={
            profile?.full_name ||
            user?.user_metadata?.name ||
            user?.email?.split("@")[0] ||
            ""
          }
          hostPhone={profile?.phone || user?.phone || ""}
          lang={lang}
          t={t}
          onNavigateTab={(tab) => setActiveTab(tab as Module)}
          onDeleteProperty={requestDeleteProperty}
        />
      )}

      {activeTab === "properties" && (
        <HostPropertiesHub
          properties={submittedProperties}
          lang={lang}
          t={t}
          onNavigateTab={(tab) => setActiveTab(tab as Module)}
          onRefresh={loadDashboardData}
          onDeleteProperty={requestDeleteProperty}
        />
      )}

      {activeTab === "finance" && <HostFinancialsHub lang={lang} t={t} />}

      {(activeTab === "calendar" || activeTab === "pricing") && (
        <HostCalendarPricingHub
          properties={submittedProperties}
          lang={lang}
          t={t}
          userId={user?.id}
        />
      )}

      {activeTab === "reservations" && (
        <HostBookingsManagement lang={lang} t={t} isRealtimeConnected={isRealtimeConnected} />
      )}

      {activeTab === "analytics" && <HostAnalyticsDashboard lang={lang} t={t} />}

      {activeTab === "reviews" && <HostReviewsManagement lang={lang} t={t} />}

      {activeTab === "settings" && (
        <HostSettingsView lang={lang} t={t} onBack={() => setActiveTab("overview")} />
      )}

      {/* Floating Real-time Alerts Banner */}
      <HostRealtimeAlerts alerts={realtimeAlerts} lang={lang} onDismiss={dismissAlert} />
      </div>

      {/* Sticky Mobile / Tablet Bottom Navigation Bar */}
      <HostMobileBottomBar
        active={activeTab}
        setActive={(tab) => setActiveTab(tab as Module)}
        onOpenMenu={() => setMobileNavOpen(true)}
        lang={lang}
        t={t}
        propertiesCount={submittedProperties.length}
        bookingsCount={liveBookings.length}
        hasPropertyIssues={hasPropertyIssues}
      />

      {/* Property Delete Confirmation Modal */}
      <DeletePropertyModal
        property={deleteTarget}
        userId={user?.id}
        busy={Boolean(deletingPropertyId)}
        error={deleteError}
        lang={lang}
        t={t}
        onCancel={cancelDeleteProperty}
        onConfirm={confirmDeleteProperty}
        onWithdrawn={async () => {
          await loadDashboardData();
        }}
      />
    </div>
  );
}


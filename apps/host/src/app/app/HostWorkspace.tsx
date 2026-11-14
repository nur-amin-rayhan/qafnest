"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHostAuth } from "@/context/HostAuthContext";
import { CheckCircle2, X } from "lucide-react";
import HostTopNav, { type Module } from "@/components/dashboard/HostTopNav";
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

interface HostWorkspaceProps {
  initialTab?: string;
}

export default function HostWorkspace({ initialTab }: HostWorkspaceProps) {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut, openHostAuthModal, lang, setLang } = useHostAuth();
  const { activeTab, setActiveTab } = useHostTabRouting(initialTab);

  const {
    submittedProperties,
    liveBookings,
    reviews,
    reviewStats,
    notifications,
    bannerNotice,
    setBannerNotice,
    loadDashboardData,
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
      const returnUrl = typeof window !== "undefined" ? window.location.pathname : "/app";
      router.replace(`/?auth=required&returnUrl=${encodeURIComponent(returnUrl)}`);
      openHostAuthModal("signin", returnUrl);
    }
  }, [authLoading, user, router, openHostAuthModal]);

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

  const hasPropertyIssues = submittedProperties.some(
    (p) => p.status === "rejected" || Boolean(p.adminFeedback)
  );

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f3f3f7] text-slate-900 flex flex-col font-body"
    >
      {/* Top Navigation Bar with tabs, profile, notifications */}
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
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
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

      {/* Property Delete Confirmation Modal */}
      <DeletePropertyModal
        property={deleteTarget}
        busy={Boolean(deletingPropertyId)}
        error={deleteError}
        lang={lang}
        t={t}
        onCancel={cancelDeleteProperty}
        onConfirm={confirmDeleteProperty}
      />
    </div>
  );
}


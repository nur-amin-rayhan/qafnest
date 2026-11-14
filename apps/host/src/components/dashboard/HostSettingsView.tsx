"use client";

import React from "react";
import { ArrowLeft, Settings, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { useHostAuth } from "@/context/HostAuthContext";
import { useHostSettings } from "./settings/useHostSettings";
import { SettingsTabsNav } from "./settings/SettingsTabsNav";
import { PersonalInformationTab } from "./settings/PersonalInformationTab";
import { PayoutMethodsTab } from "./settings/PayoutMethodsTab";
import { NotificationPreferencesTab } from "./settings/NotificationPreferencesTab";
import { SecuritySettingsTab } from "./settings/SecuritySettingsTab";

interface HostSettingsViewProps {
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onBack: () => void;
}

export default function HostSettingsView({
  lang,
  t,
  onBack,
}: HostSettingsViewProps) {
  const { user, refreshProfile } = useHostAuth();
  const {
    activeTab,
    setActiveTab,
    isLoading,
    isSaving,
    feedback,
    dismissFeedback,
    profileForm,
    saveProfile,
    payoutForm,
    savePayout,
    notificationsForm,
    saveNotifications,
    securityData,
    updatePassword,
    signOutOtherSessions,
  } = useHostSettings(user?.id, lang, () => {
    void refreshProfile();
  });

  return (
    <div className="flex-1 bg-[#f3f3f7] pb-16">
      {/* 1. View Header with Back button */}
      <div className="border-b border-slate-200/90 bg-white">
        <div className="mx-auto flex max-w-[1640px] flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              title={t("Back to Overview", "العودة للرئيسية")}
            >
              <ArrowLeft size={18} className="rtl:rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-[#4F2396]" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {t("Host Account Settings", "إعدادات حساب المضيف")}
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {t(
                  "Manage personal profile, bank payout methods, alert preferences, and account security.",
                  "إدارة الملف الشخصي، حسابات استلام الأرباح البنكية، تنبيهات الإشعارات، وكلمات المرور."
                )}
              </p>
            </div>
          </div>
          <a
            href="tel:+966576707709"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 py-2 text-xs font-extrabold text-[#4F2396] hover:bg-violet-100 transition"
          >
            <span>{t("Host Support:", "دعم المضيفين:")}</span>
            <span dir="ltr">0576707709</span>
          </a>
        </div>

        {/* 2. Top Settings Navigation Tabs */}
        <SettingsTabsNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lang={lang}
        />
      </div>

      {/* Feedback Toast / Alert Banner */}
      {feedback && (
        <div className="mx-auto mt-4 w-full max-w-[1640px] px-4 sm:px-8">
          <div
            className={`flex items-center justify-between rounded-2xl border px-5 py-3.5 text-xs sm:text-sm font-bold shadow-xs ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={dismissFeedback}
              className="p-1 hover:opacity-75 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Content Body */}
      <main className="mx-auto mt-6 w-full max-w-[1640px] px-4 sm:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <Loader2 size={32} className="animate-spin text-[#4F2396]" />
            <p className="mt-3 text-xs font-bold text-slate-500">
              {t("Loading host settings...", "جارٍ تحميل إعدادات الحساب...")}
            </p>
          </div>
        ) : (
          <div>
            {activeTab === "profile" && (
              <PersonalInformationTab
                profile={profileForm}
                onSave={saveProfile}
                lang={lang}
                t={t}
                isSaving={isSaving}
              />
            )}

            {activeTab === "payout" && (
              <PayoutMethodsTab
                payout={payoutForm}
                onSave={savePayout}
                lang={lang}
                t={t}
                isSaving={isSaving}
              />
            )}

            {activeTab === "notifications" && (
              <NotificationPreferencesTab
                notifications={notificationsForm}
                onSave={saveNotifications}
                lang={lang}
                t={t}
                isSaving={isSaving}
              />
            )}

            {activeTab === "security" && (
              <SecuritySettingsTab
                security={securityData}
                onUpdatePassword={updatePassword}
                onSignOutOtherSessions={signOutOtherSessions}
                lang={lang}
                t={t}
                isSaving={isSaving}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

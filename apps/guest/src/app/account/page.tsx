"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";

import type { TabId } from "./components/types";
import type { WalletTransaction, LoyaltyOffer } from "@/lib/services/walletService";
import AccountHeroBanner from "./components/AccountHeroBanner";
import AccountStatsRow from "./components/AccountStatsRow";
import AccountSidebar from "./components/AccountSidebar";
import ProfileTab from "./components/ProfileTab";
import WalletTab from "./components/WalletTab";
import PaymentMethodsTab from "./components/PaymentMethodsTab";
import InviteFriendsTab from "./components/InviteFriendsTab";
import RateAppTab from "./components/RateAppTab";

import { useAccountBookings } from "./hooks/useAccountBookings";
import { useAccountProfile } from "./hooks/useAccountProfile";

function GuestAccountPageContent() {
  const searchParams = useSearchParams();
  const { user, session, profile, openAuthModal, signOut, refreshProfile } = useAuth();
  const { language } = useApp();
  const [supabase] = useState(() => createClient());

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0.0);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [loyaltyTier, setLoyaltyTier] = useState<string>("Bronze");
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loyaltyOffers, setLoyaltyOffers] = useState<LoyaltyOffer[]>([]);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState("speed");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const isRtl = language === "ar";
  const t = useCallback(
    (en: string, ar: string) => (language === "ar" ? ar : en),
    [language]
  );

  const sessionToken = session?.access_token;
  const fetchWalletData = useCallback(async () => {
    try {
      const headers = await getGuestAuthorizationHeaders(sessionToken ? session : null);
      const res = await fetch(`/api/wallet?t=${Date.now()}`, { headers, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          setWalletBalance(Number(data.wallet.balance) || 0);
          setLoyaltyPoints(Number(data.wallet.loyaltyPoints) || 0);
          setLoyaltyTier(data.wallet.loyaltyTier || "Bronze");
          setWalletTransactions(data.wallet.transactions || []);
        }
        if (Array.isArray(data.offers)) {
          setLoyaltyOffers(data.offers);
        }
      }
    } catch (err) {
      console.warn("Could not fetch wallet data:", err);
    }
  }, [sessionToken, session]);

  useEffect(() => {
    fetchWalletData();
    const onWalletUpdated = () => {
      void fetchWalletData();
    };
    window.addEventListener("qafnest:wallet-updated", onWalletUpdated);
    return () => window.removeEventListener("qafnest:wallet-updated", onWalletUpdated);
  }, [fetchWalletData, user?.id]);

  const { bookingsCount } = useAccountBookings(supabase, user, session);
  const profileState = useAccountProfile({
    user,
    session,
    profile,
    language,
    supabase,
    refreshProfile,
  });

  const isIdentityVerified =
    profileState.nationalIdVerified || profileState.iqamaVerified;

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabId | null;
    if (tabParam) {
      const validTabs: TabId[] = ["profile", "wallet", "payments", "invite", "rate"];
      if (validTabs.includes(tabParam)) setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleCopyInviteCode = () => {
    const referralCode = `QAF-${user?.id ? user.id.slice(0, 6).toUpperCase() : "GUEST"}`;
    navigator.clipboard?.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const referralCode = `QAF-${user?.id ? user.id.slice(0, 6).toUpperCase() : "GUEST"}`;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://qafnest.com";
    const link = `${origin}/?ref=${referralCode}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:
            (profile?.full_name as string | undefined) ||
            user?.email?.split("@")[0] ||
            "QafNest Guest",
          phone: (profile?.phone as string | undefined) || user?.phone || "",
          email: user?.email || undefined,
          subject: `account_feedback:${feedbackCategory}`,
          message: `[rating:${ratingScore}/5] [${feedbackCategory}] ${feedbackText.trim()}`,
          source: "account_support",
          locale: language === "ar" ? "ar" : "en",
        }),
      });
      if (!res.ok) return;
      setFeedbackSubmitted(true);
      setFeedbackText("");
      setTimeout(() => {
        setFeedbackSubmitted(false);
      }, 4000);
    } catch (err) {
      console.warn("Could not send feedback:", err);
    }
  };

  const handlePhoneVerified = (newPhone: string, identityResetRequired: boolean) => {
    profileState.setEditPhone(newPhone);
    if (identityResetRequired) {
      profileState.setIdVerificationMsg({
        type: "error",
        text: t(
          "Mobile changed. Re-verify your National ID or Iqama to match the new number.",
          "تم تغيير الجوال. يرجى إعادة توثيق الهوية أو الإقامة لمطابقتها مع الرقم الجديد."
        ),
      });
    } else {
      profileState.setIdVerificationMsg({
        type: "success",
        text: t("Mobile number verified and updated.", "تم تحديث وتوثيق رقم الجوال."),
      });
    }
    void refreshProfile();
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F7F5FC] dark:bg-[#06060B] text-slate-900 dark:text-white flex flex-col font-body"
    >
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <AccountHeroBanner
          displayName={profileState.displayName}
          userInitial={profileState.userInitial}
          editPhone={profileState.editPhone}
          editEmail={profileState.editEmail}
          isIdentityVerified={isIdentityVerified}
          t={t}
        />

        <AccountStatsRow
          bookingsCount={bookingsCount}
          walletBalance={walletBalance}
          setActiveTab={setActiveTab}
          t={t}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <AccountSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            walletBalance={walletBalance}
            isIdentityVerified={isIdentityVerified}
            language={language}
            user={user}
            openAuthModal={openAuthModal}
            signOut={signOut}
            t={t}
          />

          <div className="lg:col-span-8 bg-white dark:bg-[#0E0E1A] rounded-2xl border border-[#E4DFF0] dark:border-white/[0.08] shadow-xs p-6 sm:p-8 min-h-[520px]">
            {activeTab === "profile" && (
              <ProfileTab
                session={session}
                nationalIdVerified={profileState.nationalIdVerified}
                iqamaVerified={profileState.iqamaVerified}
                emailVerified={profileState.emailVerified}
                verifyingNationalId={profileState.verifyingNationalId}
                verifyingIqama={profileState.verifyingIqama}
                verifyingEmail={profileState.verifyingEmail}
                savingProfile={profileState.savingProfile}
                profileSavedMsg={profileState.profileSavedMsg}
                idVerificationMsg={profileState.idVerificationMsg}
                fieldErrors={profileState.fieldErrors}
                primaryIdType={profileState.primaryIdType}
                setPrimaryIdType={profileState.setPrimaryIdType}
                editNationalId={profileState.editNationalId}
                setEditNationalId={profileState.setEditNationalId}
                editIqama={profileState.editIqama}
                setEditIqama={profileState.setEditIqama}
                editEmail={profileState.editEmail}
                setEditEmail={profileState.setEditEmail}
                editPhone={profileState.editPhone}
                onPhoneVerified={handlePhoneVerified}
                editFullName={profileState.editFullName}
                setEditFullName={profileState.setEditFullName}
                editCity={profileState.editCity}
                setEditCity={profileState.setEditCity}
                setFieldErrors={profileState.setFieldErrors}
                handleVerifyNationalId={profileState.handleVerifyNationalId}
                handleVerifyIqama={profileState.handleVerifyIqama}
                handleVerifyEmail={profileState.handleVerifyEmail}
                emailOtpSent={profileState.emailOtpSent}
                emailOtpCode={profileState.emailOtpCode}
                emailDevCode={profileState.emailDevCode}
                setEmailOtpCode={profileState.setEmailOtpCode}
                handleConfirmEmailOtp={profileState.handleConfirmEmailOtp}
                handleSaveProfile={profileState.handleSaveProfile}
                language={language}
                t={t}
              />
            )}

            {activeTab === "wallet" && (
              <WalletTab
                walletBalance={walletBalance}
                loyaltyPoints={loyaltyPoints}
                loyaltyTier={loyaltyTier}
                transactions={walletTransactions}
                offers={loyaltyOffers}
                displayName={profileState.displayName}
                onRefreshWallet={fetchWalletData}
                t={t}
              />
            )}

            {activeTab === "payments" && <PaymentMethodsTab t={t} />}

            {activeTab === "invite" && (
              <InviteFriendsTab
                userId={user?.id}
                copiedCode={copiedCode}
                copiedLink={copiedLink}
                handleCopyInviteCode={handleCopyInviteCode}
                handleCopyInviteLink={handleCopyInviteLink}
                t={t}
              />
            )}

            {activeTab === "rate" && (
              <RateAppTab
                feedbackSubmitted={feedbackSubmitted}
                ratingScore={ratingScore}
                setRatingScore={setRatingScore}
                feedbackCategory={feedbackCategory}
                setFeedbackCategory={setFeedbackCategory}
                feedbackText={feedbackText}
                setFeedbackText={setFeedbackText}
                handleSendFeedback={handleSendFeedback}
                language={language}
                t={t}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
      <AuthModal />
    </div>
  );
}

export default function GuestAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0B10] flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#4F2396]" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <GuestAccountPageContent />
    </Suspense>
  );
}

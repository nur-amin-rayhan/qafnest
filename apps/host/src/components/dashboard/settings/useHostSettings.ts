"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SettingsTab,
  HostProfileSettings,
  HostPayoutSettings,
  HostNotificationSettings,
  HostSecuritySettings,
} from "./types";

const INITIAL_PROFILE: HostProfileSettings = {
  fullName: "",
  phone: "",
  email: "",
  city: "الرياض",
  nationalId: "",
  idType: "national_id",
  bio: "",
  avatarUrl: "",
  isVerified: false,
};

const INITIAL_PAYOUT: HostPayoutSettings = {
  iban: "",
  formattedIban: "",
  bankNameEn: "",
  bankNameAr: "",
  accountHolder: "",
  isVerified: false,
  verifiedAt: "",
  payoutSchedule: "instant",
  minimumPayoutThreshold: 100,
  autoDisburse: true,
};

const INITIAL_NOTIFICATIONS: HostNotificationSettings = {
  smsAlerts: true,
  emailAlerts: true,
  pushAlerts: true,
  whatsappAlerts: true,
  newBookingAlert: true,
  guestMessageAlert: true,
  payoutAlert: true,
  reviewAlert: true,
  pricingReminderAlert: false,
  marketingAlert: false,
};

const INITIAL_SECURITY: HostSecuritySettings = {
  twoFactorEnabled: true,
  twoFactorMethod: "sms",
  lastPasswordChange: "",
  activeSessionsCount: 1,
  currentDevice: "",
  loginLocation: "",
};

export function useHostSettings(
  hostId?: string,
  lang: "ar" | "en" = "ar",
  onProfileUpdated?: () => void
) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [profileForm, setProfileForm] = useState<HostProfileSettings>(INITIAL_PROFILE);
  const [payoutForm, setPayoutForm] = useState<HostPayoutSettings>(INITIAL_PAYOUT);
  const [notificationsForm, setNotificationsForm] = useState<HostNotificationSettings>(INITIAL_NOTIFICATIONS);
  const [securityData, setSecurityData] = useState<HostSecuritySettings>(INITIAL_SECURITY);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/host/settings", {
        headers: hostId ? { "x-dev-host-id": hostId } : {},
      });
      if (!res.ok) throw new Error("Failed to load settings.");
      const json = await res.json();
      if (json.settings) {
        setProfileForm(json.settings.profile);
        setPayoutForm(json.settings.payout);
        setNotificationsForm(json.settings.notifications);
        setSecurityData(json.settings.security);
      }
    } catch (err: unknown) {
      console.warn("Notice: settings load fallback:", err);
    } finally {
      setIsLoading(false);
    }
  }, [hostId]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveProfile = async (data: Partial<HostProfileSettings>) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/host/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(hostId ? { "x-dev-host-id": hostId } : {}),
        },
        body: JSON.stringify({ section: "profile", data }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not save profile details");
      }
      setProfileForm((prev) => ({ ...prev, ...data }));
      onProfileUpdated?.();
      showToast(
        "success",
        lang === "ar"
          ? "تم حفظ وتحديث المعلومات الشخصية بنجاح."
          : "Personal profile details updated successfully."
      );
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update profile details."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const savePayout = async (data: {
    iban?: string;
    accountHolder?: string;
    payoutSchedule?: "instant" | "weekly" | "monthly";
    minimumPayoutThreshold?: number;
    autoDisburse?: boolean;
  }) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/host/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(hostId ? { "x-dev-host-id": hostId } : {}),
        },
        body: JSON.stringify({ section: "payout", data }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update payout settings");
      }
      if (json.payout) setPayoutForm(json.payout);
      showToast(
        "success",
        lang === "ar"
          ? "تم تحديث الحساب البنكي وخيارات الاستلام بنجاح ومطابقتها عبر سريع."
          : "Bank account and payout preferences updated successfully."
      );
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update payout settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async (data: Partial<HostNotificationSettings>) => {
    setIsSaving(true);
    try {
      const updated = { ...notificationsForm, ...data };
      const res = await fetch("/api/host/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(hostId ? { "x-dev-host-id": hostId } : {}),
        },
        body: JSON.stringify({ section: "notifications", data: updated }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save notifications");
      }
      setNotificationsForm(updated);
      showToast(
        "success",
        lang === "ar"
          ? "تم حفظ تفضيلات وقنوات الإشعارات بنجاح."
          : "Notification preferences saved successfully."
      );
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to save notifications."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updatePassword = async (password: string) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/host/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(hostId ? { "x-dev-host-id": hostId } : {}),
        },
        body: JSON.stringify({
          section: "security",
          data: { action: "update_password", password },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update password");
      }
      setSecurityData((prev) => ({
        ...prev,
        lastPasswordChange: new Date().toISOString(),
      }));
      showToast(
        "success",
        lang === "ar"
          ? "تم تحديث كلمة المرور بنجاح وحماية الحساب."
          : "Password updated successfully."
      );
      return true;
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update password."
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const signOutOtherSessions = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/host/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(hostId ? { "x-dev-host-id": hostId } : {}),
        },
        body: JSON.stringify({
          section: "security",
          data: { action: "terminate_sessions" },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to terminate sessions");
      }
      setSecurityData((prev) => ({ ...prev, activeSessionsCount: 1 }));
      showToast(
        "success",
        lang === "ar"
          ? "تم إنهاء كافة الجلسات الأخرى وتسجيل الخروج منها بنجاح."
          : "Signed out of all other sessions successfully."
      );
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to terminate sessions."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    isLoading,
    isSaving,
    feedback,
    dismissFeedback: () => setFeedback(null),
    profileForm,
    setProfileForm,
    saveProfile,
    payoutForm,
    setPayoutForm,
    savePayout,
    notificationsForm,
    setNotificationsForm,
    saveNotifications,
    securityData,
    updatePassword,
    signOutOtherSessions,
    refresh: loadSettings,
  };
}


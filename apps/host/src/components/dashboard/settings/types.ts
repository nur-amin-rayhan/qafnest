import type {
  HostProfileSettings,
  HostPayoutSettings,
  HostNotificationSettings,
  HostSecuritySettings,
  HostAllSettings,
} from "@/lib/services/hostSettingsService";

export type SettingsTab = "profile" | "payout" | "notifications" | "security";

export interface SettingsTabItem {
  id: SettingsTab;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export type {
  HostProfileSettings,
  HostPayoutSettings,
  HostNotificationSettings,
  HostSecuritySettings,
  HostAllSettings,
};

export interface BaseTabProps {
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  isSaving: boolean;
}


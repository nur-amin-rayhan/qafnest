import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  getHostFinancialData,
  updateHostIban,
  updateSettlementSettings,
  type HostPayoutIban,
  type HostSettlementSettings,
} from "./hostFinancialsService";
import { hydrateHostPayoutStore } from "@qafnest/shared/hostPayoutStore";
import { hydratePlatformFeeConfig } from "@qafnest/shared/platformFeeStore";

export interface HostProfileSettings {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  nationalId: string;
  idType: "national_id" | "iqama" | "commercial_registration";
  bio: string;
  avatarUrl: string;
  isVerified: boolean;
}

export interface HostPayoutSettings extends HostPayoutIban {
  payoutSchedule: "instant" | "weekly" | "monthly";
  minimumPayoutThreshold: number;
  autoDisburse: boolean;
}

export interface HostNotificationSettings {
  smsAlerts: boolean;
  emailAlerts: boolean;
  pushAlerts: boolean;
  whatsappAlerts: boolean;
  newBookingAlert: boolean;
  guestMessageAlert: boolean;
  payoutAlert: boolean;
  reviewAlert: boolean;
  pricingReminderAlert: boolean;
  marketingAlert: boolean;
}

export interface HostSecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: "sms" | "app";
  lastPasswordChange: string;
  activeSessionsCount: number;
  currentDevice: string;
  loginLocation: string;
}

export interface HostAllSettings {
  profile: HostProfileSettings;
  payout: HostPayoutSettings;
  notifications: HostNotificationSettings;
  security: HostSecuritySettings;
}

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// In-memory host settings store for per-host notification and security preferences
const customProfiles: Record<string, Partial<HostProfileSettings>> = {};
const customNotifications: Record<string, HostNotificationSettings> = {};
const customSecurity: Record<string, HostSecuritySettings> = {};

const DEFAULT_NOTIFICATIONS: HostNotificationSettings = {
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

const DEFAULT_SECURITY: HostSecuritySettings = {
  twoFactorEnabled: false,
  twoFactorMethod: "sms",
  lastPasswordChange: "",
  activeSessionsCount: 1,
  currentDevice: "Current Browser Session",
  loginLocation: "Saudi Arabia",
};

export async function getHostSettings(hostId: string): Promise<HostAllSettings> {
  const supabase = getAdminClient();
  const financialData = await getHostFinancialData(hostId);

  let profileFromDb: Partial<HostProfileSettings> = {};
  if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hostId)) {
    try {
      const [{ data }, authUserRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone, national_id, avatar_url")
          .eq("id", hostId)
          .maybeSingle(),
        supabase.auth.admin.getUserById(hostId),
      ]);

      const authUser = authUserRes?.data?.user;
      const meta = (authUser?.user_metadata || {}) as Record<string, unknown>;

      if (data || authUser) {
        profileFromDb = {
          fullName: data?.full_name || String(meta.full_name || meta.name || ""),
          phone: data?.phone || authUser?.phone || "",
          email: authUser?.email || "",
          city: String(meta.city || ""),
          nationalId: data?.national_id || String(meta.national_id || ""),
          idType: (meta.id_type as HostProfileSettings["idType"]) || "national_id",
          bio: String(meta.bio || ""),
          avatarUrl: data?.avatar_url || String(meta.avatar_url || ""),
          isVerified: Boolean(meta.is_verified || meta.nafath_verified),
        };
      }
    } catch (e) {
      console.warn("Notice: DB profile lookup fallback:", e);
    }
  }

  const cachedProfile = customProfiles[hostId] || {};
  const profile: HostProfileSettings = {
    fullName: cachedProfile.fullName ?? profileFromDb.fullName ?? "",
    phone: cachedProfile.phone ?? profileFromDb.phone ?? "",
    email: cachedProfile.email ?? profileFromDb.email ?? "",
    city: cachedProfile.city ?? profileFromDb.city ?? "",
    nationalId: cachedProfile.nationalId ?? profileFromDb.nationalId ?? "",
    idType: cachedProfile.idType || profileFromDb.idType || "national_id",
    bio: cachedProfile.bio || profileFromDb.bio || "",
    avatarUrl: cachedProfile.avatarUrl || profileFromDb.avatarUrl || "",
    isVerified: cachedProfile.isVerified ?? profileFromDb.isVerified ?? false,
  };

  const settlement = financialData.settlement?.settings;
  const payoutSchedule: "instant" | "weekly" | "monthly" =
    settlement?.payoutFrequency === "weekly" || settlement?.payoutFrequency === "monthly"
      ? settlement.payoutFrequency
      : "instant";

  const payout: HostPayoutSettings = {
    ...financialData.iban,
    payoutSchedule,
    minimumPayoutThreshold: settlement?.minPayoutThreshold || 100,
    autoDisburse: settlement?.autoReleaseAfterCheckin ?? true,
  };

  const notifications: HostNotificationSettings = {
    ...DEFAULT_NOTIFICATIONS,
    ...(customNotifications[hostId] || {}),
  };

  const security: HostSecuritySettings = {
    ...DEFAULT_SECURITY,
    ...(customSecurity[hostId] || {}),
  };

  return {
    profile,
    payout,
    notifications,
    security,
  };
}

export async function updateHostProfileSettings(
  hostId: string,
  update: Partial<HostProfileSettings>
): Promise<HostProfileSettings> {
  // Never let a host self-grant verified KYC status or overwrite verified phone/email directly
  const sanitizedUpdate: Partial<HostProfileSettings> = {
    ...(update.fullName !== undefined ? { fullName: update.fullName } : {}),
    ...(update.city !== undefined ? { city: update.city } : {}),
    ...(update.nationalId !== undefined ? { nationalId: update.nationalId } : {}),
    ...(update.idType !== undefined ? { idType: update.idType } : {}),
    ...(update.bio !== undefined ? { bio: update.bio } : {}),
    ...(update.avatarUrl !== undefined ? { avatarUrl: update.avatarUrl } : {}),
  };

  customProfiles[hostId] = {
    ...(customProfiles[hostId] || {}),
    ...sanitizedUpdate,
  };

  const supabase = getAdminClient();
  if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hostId)) {
    const dbPayload: Record<string, unknown> = {
      id: hostId,
      updated_at: new Date().toISOString(),
    };
    if (sanitizedUpdate.fullName !== undefined) dbPayload.full_name = sanitizedUpdate.fullName;
    if (sanitizedUpdate.nationalId !== undefined) dbPayload.national_id = sanitizedUpdate.nationalId;
    if (sanitizedUpdate.avatarUrl !== undefined) dbPayload.avatar_url = sanitizedUpdate.avatarUrl;

    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert(dbPayload, { onConflict: "id" });
    if (upsertErr) {
      throw new Error(`Profile update failed: ${upsertErr.message}`);
    }

    const { data: existingAuth, error: authReadErr } = await supabase.auth.admin.getUserById(hostId);
    if (authReadErr) {
      throw new Error(`Could not load host auth profile: ${authReadErr.message}`);
    }
    const prevMeta = (existingAuth?.user?.user_metadata || {}) as Record<string, unknown>;
    const nextMeta: Record<string, unknown> = { ...prevMeta };
    if (sanitizedUpdate.fullName !== undefined) nextMeta.full_name = sanitizedUpdate.fullName;
    if (sanitizedUpdate.city !== undefined) nextMeta.city = sanitizedUpdate.city;
    if (sanitizedUpdate.nationalId !== undefined) nextMeta.national_id = sanitizedUpdate.nationalId;
    if (sanitizedUpdate.idType !== undefined) nextMeta.id_type = sanitizedUpdate.idType;
    if (sanitizedUpdate.bio !== undefined) nextMeta.bio = sanitizedUpdate.bio;
    if (sanitizedUpdate.avatarUrl !== undefined) nextMeta.avatar_url = sanitizedUpdate.avatarUrl;

    const { error: authUpdErr } = await supabase.auth.admin.updateUserById(hostId, {
      user_metadata: nextMeta,
    });
    if (authUpdErr) {
      throw new Error(`Host metadata update failed: ${authUpdErr.message}`);
    }
  }

  const all = await getHostSettings(hostId);
  return all.profile;
}

export async function updateHostPayoutSettings(
  hostId: string,
  update: {
    iban?: string;
    accountHolder?: string;
    payoutSchedule?: "instant" | "weekly" | "monthly";
    minimumPayoutThreshold?: number;
    autoDisburse?: boolean;
  }
): Promise<HostPayoutSettings> {
  await Promise.all([hydrateHostPayoutStore(), hydratePlatformFeeConfig()]);
  if (update.iban && update.accountHolder) {
    updateHostIban(hostId, update.iban, update.accountHolder);
  }

  const settlementUpdate: Partial<HostSettlementSettings> = {};
  if (update.payoutSchedule) {
    settlementUpdate.payoutFrequency =
      update.payoutSchedule === "instant" ? "manual" : (update.payoutSchedule as any);
  }
  if (update.minimumPayoutThreshold !== undefined) {
    settlementUpdate.minPayoutThreshold = update.minimumPayoutThreshold;
  }
  if (update.autoDisburse !== undefined) {
    settlementUpdate.autoReleaseAfterCheckin = update.autoDisburse;
  }

  updateSettlementSettings(hostId, settlementUpdate);

  const all = await getHostSettings(hostId);
  return all.payout;
}

export async function updateHostNotificationSettings(
  hostId: string,
  update: Partial<HostNotificationSettings>
): Promise<HostNotificationSettings> {
  customNotifications[hostId] = {
    ...DEFAULT_NOTIFICATIONS,
    ...(customNotifications[hostId] || {}),
    ...update,
  };
  return customNotifications[hostId];
}

export async function updateHostPassword(
  hostId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hostId)) {
    throw new Error(
      "Phone-verified Firebase host accounts sign in with SMS OTP and do not use a Supabase password."
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    throw new Error("Authentication service is currently unavailable.");
  }

  const { error } = await supabase.auth.admin.updateUserById(hostId, {
    password: newPassword,
  });
  if (error) {
    throw new Error(error.message || "Failed to update account password.");
  }

  customSecurity[hostId] = {
    ...DEFAULT_SECURITY,
    ...(customSecurity[hostId] || {}),
    lastPasswordChange: new Date().toISOString(),
  };

  return {
    success: true,
    message: "Password updated successfully.",
  };
}

export async function terminateOtherSessions(
  hostId: string
): Promise<{ success: boolean; activeSessionsCount: number }> {
  customSecurity[hostId] = {
    ...DEFAULT_SECURITY,
    ...(customSecurity[hostId] || {}),
    activeSessionsCount: 1,
  };
  return {
    success: true,
    activeSessionsCount: 1,
  };
}

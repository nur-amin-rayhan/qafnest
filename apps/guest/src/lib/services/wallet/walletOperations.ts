import { getServiceRoleClient } from "@/lib/supabase/service";
import {
  commitUserWallet,
  determineTier,
  isSupabaseUuid,
  loadCloudUserWallet,
  loadWalletStore,
  saveWalletStore,
} from "./walletStore";
import {
  DEFAULT_LOYALTY_SETTINGS,
  type LoyaltyOffer,
  type LoyaltySettings,
  type UserWalletData,
  type WalletTransaction,
} from "./walletTypes";

const METHOD_LABELS_AR: Record<string, string> = {
  apple: "Apple Pay",
  google: "Google Pay",
  stcpay: "STC Pay",
  samsung: "Samsung Pay",
  mada: "مدى",
  card: "البطاقة",
};

/** Retrieves the user wallet data reconciled across cloud private storage and Supabase user_metadata. */
export async function getUserWallet(userId: string): Promise<UserWalletData> {
  const store = loadWalletStore();
  const localWallet = store.wallets[userId];

  let metadataBalance: number | undefined;
  let metadataPoints: number | undefined;
  let metadataWelcomeCredited: boolean | undefined;
  let metadataWelcomeBalance: number | undefined;

  const [cloudWallet, supabaseMeta] = await Promise.all([
    loadCloudUserWallet(userId),
    isSupabaseUuid(userId)
      ? (async () => {
          try {
            const admin = getServiceRoleClient();
            const { data: userRes } = await admin.auth.admin.getUserById(userId);
            return userRes?.user?.user_metadata || null;
          } catch {
            return null;
          }
        })()
      : Promise.resolve(null),
  ]);

  if (supabaseMeta) {
    if (typeof supabaseMeta.wallet_balance === "number") metadataBalance = supabaseMeta.wallet_balance;
    if (typeof supabaseMeta.loyalty_points === "number") metadataPoints = supabaseMeta.loyalty_points;
    if (typeof supabaseMeta.welcome_bonus_credited === "boolean") metadataWelcomeCredited = supabaseMeta.welcome_bonus_credited;
    if (typeof supabaseMeta.welcome_bonus_balance === "number") metadataWelcomeBalance = supabaseMeta.welcome_bonus_balance;
  }

  let userWallet = cloudWallet || localWallet;
  let dirty = Boolean(cloudWallet);

  if (!userWallet) {
    const balance = metadataBalance ?? 0;
    const points = metadataPoints ?? 0;
    userWallet = {
      userId,
      balance,
      loyaltyPoints: points,
      loyaltyTier: determineTier(points),
      transactions: [],
      welcomeBonusCredited: metadataWelcomeCredited ?? false,
      welcomeBonusBalance: metadataWelcomeBalance ?? 0,
    };
    if (balance > 0 || points > 0 || metadataWelcomeCredited) {
      await commitUserWallet(userWallet);
    }
    return userWallet;
  }

  if (metadataBalance !== undefined && metadataBalance !== userWallet.balance) {
    userWallet.balance = metadataBalance;
    dirty = true;
  }
  if (metadataWelcomeCredited && !userWallet.welcomeBonusCredited) {
    userWallet.welcomeBonusCredited = true;
    dirty = true;
  }
  if (metadataWelcomeBalance !== undefined && userWallet.welcomeBonusBalance === undefined) {
    userWallet.welcomeBonusBalance = metadataWelcomeBalance;
    dirty = true;
  }
  if (metadataPoints !== undefined && metadataPoints !== userWallet.loyaltyPoints) {
    userWallet.loyaltyPoints = metadataPoints;
    userWallet.loyaltyTier = determineTier(metadataPoints);
    dirty = true;
  }

  if (dirty) {
    store.wallets[userId] = userWallet;
    saveWalletStore(store);
    if (!cloudWallet) {
      await commitUserWallet(userWallet);
    }
  }
  return userWallet;
}

export async function topUpWallet({
  userId,
  amount,
  paymentMethod,
  reference,
}: {
  userId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
}): Promise<UserWalletData> {
  const store = loadWalletStore();
  const wallet = await getUserWallet(userId);
  const roundedAmount = Math.round(amount * 100) / 100;
  const newBalance = Math.round((wallet.balance + roundedAmount) * 100) / 100;

  const topUpOffer = store.activeOffers.find(
    (o) => o.isActive && o.id === "offer-topup-bonus" && roundedAmount >= 500
  );
  const bonusPoints = topUpOffer?.bonusPoints || 0;
  const newPoints = wallet.loyaltyPoints + bonusPoints;

  wallet.balance = newBalance;
  wallet.loyaltyPoints = newPoints;
  wallet.loyaltyTier = determineTier(newPoints);
  wallet.transactions.unshift({
    id: `tx-topup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type: "topup",
    amount: roundedAmount,
    points: bonusPoints > 0 ? bonusPoints : undefined,
    status: "completed",
    reference,
    paymentMethod,
    titleEn: `Wallet Top-up via ${paymentMethod.toUpperCase()} (Ref: ${reference})`,
    titleAr: `شحن رصيد المحفظة عبر ${METHOD_LABELS_AR[paymentMethod] || "البطاقة"} (مرجع: ${reference})`,
    createdAt: new Date().toISOString(),
  });

  await commitUserWallet(wallet, {
    wallet_balance: newBalance,
    loyalty_points: newPoints,
    loyalty_tier: wallet.loyaltyTier,
  });
  return wallet;
}

export async function awardWelcomeBonus({
  userId,
  amount = 50,
  deviceId,
  ip,
}: {
  userId: string;
  amount?: number;
  deviceId?: string;
  ip?: string;
}): Promise<{ awarded: boolean; alreadyCredited: boolean; amountCredited: number; wallet: UserWalletData }> {
  const wallet = await getUserWallet(userId);
  const cleanAmount = Math.round(Math.max(0, amount) * 100) / 100;

  if (wallet.welcomeBonusCredited || wallet.transactions.some((tx) => tx.reference?.startsWith("WELCOME-")) || cleanAmount <= 0) {
    return { awarded: false, alreadyCredited: true, amountCredited: 0, wallet };
  }

  const nowIso = new Date().toISOString();
  const newBalance = Math.round((wallet.balance + cleanAmount) * 100) / 100;
  const newWelcomeBalance = Math.round(((wallet.welcomeBonusBalance || 0) + cleanAmount) * 100) / 100;

  wallet.balance = newBalance;
  wallet.welcomeBonusCredited = true;
  wallet.welcomeBonusBalance = newWelcomeBalance;
  wallet.welcomeBonusTotalAwarded = cleanAmount;
  wallet.welcomeBonusAwardedAt = nowIso;
  if (deviceId) wallet.welcomeBonusDeviceId = deviceId;
  wallet.transactions.unshift({
    id: `tx-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type: "reward",
    amount: cleanAmount,
    status: "completed",
    reference: `WELCOME-${userId.slice(0, 8).toUpperCase()}`,
    paymentMethod: "welcome_bonus",
    titleEn: `New Guest Welcome Bonus (${cleanAmount.toFixed(2)} SAR Gift)`,
    titleAr: `مكافأة ترحيبية للتسجيل الجديد (${cleanAmount.toFixed(2)} ر.س)`,
    createdAt: nowIso,
  });

  await commitUserWallet(wallet, {
    wallet_balance: newBalance,
    welcome_bonus_credited: true,
    welcome_bonus_balance: newWelcomeBalance,
    welcome_bonus_awarded_at: nowIso,
    signup_device_id: deviceId || undefined,
    signup_ip: ip || undefined,
  });

  return { awarded: true, alreadyCredited: false, amountCredited: cleanAmount, wallet };
}

export async function deductWalletForBooking({
  userId,
  amount,
  bookingRef,
  propertyTitle,
}: {
  userId: string;
  amount: number;
  bookingRef: string;
  propertyTitle: string;
}): Promise<{ success: boolean; newBalance: number; welcomeBonusUsed: number; error?: string }> {
  const wallet = await getUserWallet(userId);
  const roundedAmount = Math.round(amount * 100) / 100;

  if (wallet.balance < roundedAmount) {
    return {
      success: false,
      newBalance: wallet.balance,
      welcomeBonusUsed: 0,
      error: `Insufficient wallet balance. Required: ${roundedAmount} SAR, Available: ${wallet.balance.toFixed(2)} SAR`,
    };
  }

  const availableWelcome = Math.max(0, Math.min(wallet.balance, Number(wallet.welcomeBonusBalance) || 0));
  const welcomeBonusUsed = Math.round(Math.min(availableWelcome, roundedAmount) * 100) / 100;
  const remainingWelcome = Math.round(Math.max(0, availableWelcome - welcomeBonusUsed) * 100) / 100;
  const newBalance = Math.round((wallet.balance - roundedAmount) * 100) / 100;

  wallet.balance = newBalance;
  wallet.welcomeBonusBalance = remainingWelcome;
  wallet.transactions.unshift({
    id: `tx-book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type: "booking_payment",
    amount: -roundedAmount,
    status: "completed",
    reference: bookingRef,
    paymentMethod: "wallet",
    titleEn: `Booking Payment: ${propertyTitle} (Ref: ${bookingRef})`,
    titleAr: `سداد حجز إقامة: ${propertyTitle} (رقم الحجز: ${bookingRef})`,
    createdAt: new Date().toISOString(),
  });

  await commitUserWallet(wallet, {
    wallet_balance: newBalance,
    welcome_bonus_balance: remainingWelcome,
  });

  return { success: true, newBalance, welcomeBonusUsed };
}

export function calculateEarnableLoyaltyPoints(
  amountSpent: number,
  isWalletPayment: boolean = false
): { points: number; multiplier: number; appliedOffer?: LoyaltyOffer } {
  const store = loadWalletStore();
  const settings = store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS;
  if (!settings.loyaltyEnabled) return { points: 0, multiplier: 0 };

  let multiplier = settings.standardEarnRate || 1;
  let appliedOffer: LoyaltyOffer | undefined;

  if (isWalletPayment) {
    multiplier = Math.max(multiplier, settings.walletPaymentMultiplier || 1.5);
    appliedOffer = store.activeOffers.find((o) => o.isActive && o.id === "offer-wallet-direct-discount");
  }

  const doubleOffer = store.activeOffers.find((o) => o.isActive && o.id === "offer-2x-points");
  if (doubleOffer && doubleOffer.multiplier > multiplier) {
    multiplier = doubleOffer.multiplier;
    appliedOffer = doubleOffer;
  }

  return { points: Math.round(amountSpent * multiplier), multiplier, appliedOffer };
}

export async function awardLoyaltyPoints({
  userId,
  amountSpent,
  bookingRef,
  isWalletPayment = false,
}: {
  userId: string;
  amountSpent: number;
  bookingRef: string;
  isWalletPayment?: boolean;
}): Promise<UserWalletData> {
  const wallet = await getUserWallet(userId);
  const { points, multiplier } = calculateEarnableLoyaltyPoints(amountSpent, isWalletPayment);
  if (points <= 0) return wallet;

  const newPoints = wallet.loyaltyPoints + points;
  const newTx: WalletTransaction = {
    id: `tx-reward-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type: "reward",
    amount: 0,
    points,
    status: "completed",
    reference: bookingRef,
    paymentMethod: "system",
    titleEn: `Reward Points Earned (${multiplier}X Rate) on Booking ${bookingRef}`,
    titleAr: `نقاط مكافآت مكتسبة (${multiplier}X) على الحجز ${bookingRef}`,
    createdAt: new Date().toISOString(),
  };

  wallet.loyaltyPoints = newPoints;
  wallet.loyaltyTier = determineTier(newPoints);
  wallet.transactions.unshift(newTx);

  await commitUserWallet(wallet, { loyalty_points: newPoints, loyalty_tier: wallet.loyaltyTier });
  return wallet;
}

export async function redeemPointsForCredit({
  userId,
  pointsToRedeem,
}: {
  userId: string;
  pointsToRedeem: number;
}): Promise<{ success: boolean; wallet: UserWalletData; message?: string }> {
  if (pointsToRedeem < 100) {
    return { success: false, wallet: await getUserWallet(userId), message: "Minimum redemption is 100 points (10 SAR)" };
  }

  const wallet = await getUserWallet(userId);
  if (wallet.loyaltyPoints < pointsToRedeem) {
    return {
      success: false,
      wallet,
      message: `Insufficient loyalty points. Have: ${wallet.loyaltyPoints}, Requested: ${pointsToRedeem}`,
    };
  }

  const sarCredit = Math.floor(pointsToRedeem / 10);
  const exactPointsRedeemed = sarCredit * 10;
  const newPoints = wallet.loyaltyPoints - exactPointsRedeemed;
  const newBalance = Math.round((wallet.balance + sarCredit) * 100) / 100;

  wallet.balance = newBalance;
  wallet.loyaltyPoints = newPoints;
  wallet.loyaltyTier = determineTier(newPoints);
  wallet.transactions.unshift({
    id: `tx-redeem-${Date.now()}`,
    userId,
    type: "redemption",
    amount: sarCredit,
    points: -exactPointsRedeemed,
    status: "completed",
    reference: `RED-${Date.now()}`,
    paymentMethod: "system",
    titleEn: `Converted ${exactPointsRedeemed} Points to ${sarCredit} SAR Wallet Credit`,
    titleAr: `تحويل ${exactPointsRedeemed} نقطة إلى ${sarCredit} ر.س رصيد محفظة`,
    createdAt: new Date().toISOString(),
  });

  await commitUserWallet(wallet, {
    wallet_balance: newBalance,
    loyalty_points: newPoints,
    loyalty_tier: wallet.loyaltyTier,
  });

  return { success: true, wallet };
}

export function getActiveLoyaltyOffers(): LoyaltyOffer[] {
  return loadWalletStore().activeOffers.filter((o) => o.isActive);
}

export function getLoyaltySettings(): LoyaltySettings {
  return loadWalletStore().loyaltySettings || DEFAULT_LOYALTY_SETTINGS;
}

export function updateLoyaltySettings(settings: Partial<LoyaltySettings>): LoyaltySettings {
  const store = loadWalletStore();
  store.loyaltySettings = { ...(store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS), ...settings };
  saveWalletStore(store);
  return store.loyaltySettings;
}

export function getAllLoyaltyOffers(): LoyaltyOffer[] {
  return loadWalletStore().activeOffers;
}

export function updateLoyaltyOffers(offers: LoyaltyOffer[]): LoyaltyOffer[] {
  const store = loadWalletStore();
  store.activeOffers = offers;
  saveWalletStore(store);
  return store.activeOffers;
}

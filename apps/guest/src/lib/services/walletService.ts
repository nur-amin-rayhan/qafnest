import crypto from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/service";
import { detectCardBrand, type CardBrand } from "@/lib/services/cardBrand";
import { readRootJsonFile, writeRootJsonFile } from "@qafnest/shared/serverJsonStore";

export { detectCardBrand, type CardBrand };

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "topup" | "booking_payment" | "refund" | "reward" | "redemption";
  amount: number; // In SAR (+ for credit, - for debit)
  points?: number; // Loyalty points awarded/redeemed
  status: "completed" | "pending" | "failed";
  reference: string; // e.g. TOPUP-84920, QAF-8201
  paymentMethod?: string; // "card", "apple", "mada", "wallet", "system"
  titleEn: string;
  titleAr: string;
  createdAt: string;
}

export interface LoyaltyOffer {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  multiplier: number; // e.g. 2 for 2x points
  bonusPoints?: number;
  badgeEn: string;
  badgeAr: string;
  validUntil: string;
  isActive: boolean;
}

export interface SavedCard {
  id: string;
  userId: string;
  cardholderName: string;
  brand: CardBrand;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
  cardToken?: string;
}

export interface LoyaltySettings {
  loyaltyEnabled: boolean;
  standardEarnRate: number; // Points per 1 SAR (default: 1)
  walletPaymentMultiplier: number; // default: 1.5
  redemptionRatePoints: number; // default: 100
  redemptionRateSAR: number; // default: 10
}

export interface UserWalletData {
  userId: string;
  balance: number;
  loyaltyPoints: number;
  loyaltyTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  transactions: WalletTransaction[];
  savedCards?: SavedCard[];
  welcomeBonusCredited?: boolean;
  welcomeBonusBalance?: number;
  welcomeBonusTotalAwarded?: number;
  welcomeBonusAwardedAt?: string;
  welcomeBonusDeviceId?: string;
}

export interface PendingWalletSplit {
  bookingRef: string;
  userId: string;
  walletAmount: number;
  welcomeBonusAmount?: number;
  gatewayAmount: number;
  totalAmount: number;
  gatewayMethod: string;
  propertyTitle: string;
  settled: boolean;
  createdAt: string;
}

export interface WalletStoreState {
  wallets: Record<string, UserWalletData>;
  activeOffers: LoyaltyOffer[];
  loyaltySettings?: LoyaltySettings;
  pendingSplits?: Record<string, PendingWalletSplit>;
}

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  loyaltyEnabled: true,
  standardEarnRate: 1,
  walletPaymentMultiplier: 1.5,
  redemptionRatePoints: 100,
  redemptionRateSAR: 10,
};

const DEFAULT_OFFERS: LoyaltyOffer[] = [];

const WALLET_STORE_FILE = ".qafnest-wallets.json";

function defaultWalletStoreState(): WalletStoreState {
  return {
    wallets: {},
    activeOffers: DEFAULT_OFFERS,
    loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
    pendingSplits: {},
  };
}

function loadStore(): WalletStoreState {
  return readRootJsonFile<WalletStoreState>(
    WALLET_STORE_FILE,
    defaultWalletStoreState,
    (parsed) => {
      const candidate = parsed as Partial<WalletStoreState> | null;
      if (candidate && typeof candidate.wallets === "object" && candidate.wallets !== null) {
        return {
          wallets: candidate.wallets || {},
          activeOffers: Array.isArray(candidate.activeOffers) ? candidate.activeOffers : [],
          loyaltySettings: candidate.loyaltySettings || DEFAULT_LOYALTY_SETTINGS,
          pendingSplits:
            candidate.pendingSplits && typeof candidate.pendingSplits === "object"
              ? candidate.pendingSplits
              : {},
        };
      }
      return defaultWalletStoreState();
    }
  );
}

function saveStore(state: WalletStoreState): void {
  writeRootJsonFile(WALLET_STORE_FILE, state);
}

export function determineTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" {
  if (points >= 5000) return "Platinum";
  if (points >= 2000) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

/**
 * Retrieves the user wallet data with fallback to Supabase user_metadata
 */
export async function getUserWallet(userId: string): Promise<UserWalletData> {
  const store = loadStore();
  let userWallet = store.wallets[userId];

  // Try to sync with Supabase user_metadata if available
  let metadataBalance: number | undefined;
  let metadataPoints: number | undefined;
  let metadataWelcomeCredited: boolean | undefined;
  let metadataWelcomeBalance: number | undefined;

  try {
    const admin = getServiceRoleClient();
    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const meta = userRes?.user?.user_metadata;
    if (meta) {
      if (typeof meta.wallet_balance === "number") metadataBalance = meta.wallet_balance;
      if (typeof meta.loyalty_points === "number") metadataPoints = meta.loyalty_points;
      if (typeof meta.welcome_bonus_credited === "boolean") metadataWelcomeCredited = meta.welcome_bonus_credited;
      if (typeof meta.welcome_bonus_balance === "number") metadataWelcomeBalance = meta.welcome_bonus_balance;
    }
  } catch {}

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
      store.wallets[userId] = userWallet;
      saveStore(store);
    }
  } else {
    // Reconcile if metadata is updated
    let dirty = false;
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
      saveStore(store);
    }
  }

  return userWallet;
}

/**
 * Top up the user wallet with payment gateway reference
 */
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
  const store = loadStore();
  const wallet = await getUserWallet(userId);

  const roundedAmount = Math.round(amount * 100) / 100;
  const newBalance = Math.round((wallet.balance + roundedAmount) * 100) / 100;

  // Check top-up offers (e.g. +250 points for >= 500 SAR)
  let bonusPoints = 0;
  const topUpOffer = store.activeOffers.find(
    (o) => o.isActive && o.id === "offer-topup-bonus" && roundedAmount >= 500
  );
  if (topUpOffer && topUpOffer.bonusPoints) {
    bonusPoints = topUpOffer.bonusPoints;
  }

  const newPoints = wallet.loyaltyPoints + bonusPoints;

  const methodLabelArMap: Record<string, string> = {
    apple: "Apple Pay",
    google: "Google Pay",
    stcpay: "STC Pay",
    samsung: "Samsung Pay",
    mada: "مدى",
    card: "البطاقة",
  };
  const methodLabelAr = methodLabelArMap[paymentMethod] || "البطاقة";

  const newTx: WalletTransaction = {
    id: `tx-topup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type: "topup",
    amount: roundedAmount,
    points: bonusPoints > 0 ? bonusPoints : undefined,
    status: "completed",
    reference,
    paymentMethod,
    titleEn: `Wallet Top-up via ${paymentMethod.toUpperCase()} (Ref: ${reference})`,
    titleAr: `شحن رصيد المحفظة عبر ${methodLabelAr} (مرجع: ${reference})`,
    createdAt: new Date().toISOString(),
  };

  wallet.balance = newBalance;
  wallet.loyaltyPoints = newPoints;
  wallet.loyaltyTier = determineTier(newPoints);
  wallet.transactions.unshift(newTx);

  store.wallets[userId] = wallet;
  saveStore(store);

  // Sync to Supabase auth metadata
  try {
    const admin = getServiceRoleClient();
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        wallet_balance: newBalance,
        loyalty_points: newPoints,
        loyalty_tier: wallet.loyaltyTier,
      },
    });
  } catch (err) {
    console.warn("Notice: Could not sync user metadata in Supabase:", err);
  }

  return wallet;
}

/**
 * Credits one-time new-user Welcome Bonus (default 50 SAR) into Guest Wallet.
 * Welcome Bonus spending is absorbed 100% by QafNest Platform and never deducted from Host payouts.
 */
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
  const store = loadStore();
  const wallet = await getUserWallet(userId);
  const cleanAmount = Math.round(Math.max(0, amount) * 100) / 100;

  const hasExistingWelcomeTx = wallet.transactions.some(
    (tx) => tx.reference?.startsWith("WELCOME-")
  );
  if (wallet.welcomeBonusCredited || hasExistingWelcomeTx || cleanAmount <= 0) {
    return {
      awarded: false,
      alreadyCredited: true,
      amountCredited: 0,
      wallet,
    };
  }

  const nowIso = new Date().toISOString();
  const refCode = `WELCOME-${userId.slice(0, 8).toUpperCase()}`;
  const newBalance = Math.round((wallet.balance + cleanAmount) * 100) / 100;
  const newWelcomeBalance = Math.round(((wallet.welcomeBonusBalance || 0) + cleanAmount) * 100) / 100;

  const newTx: WalletTransaction = {
    id: `tx-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type: "reward",
    amount: cleanAmount,
    status: "completed",
    reference: refCode,
    paymentMethod: "welcome_bonus",
    titleEn: `New Guest Welcome Bonus (${cleanAmount.toFixed(2)} SAR Gift)`,
    titleAr: `مكافأة ترحيبية للتسجيل الجديد (${cleanAmount.toFixed(2)} ر.س)`,
    createdAt: nowIso,
  };

  wallet.balance = newBalance;
  wallet.welcomeBonusCredited = true;
  wallet.welcomeBonusBalance = newWelcomeBalance;
  wallet.welcomeBonusTotalAwarded = cleanAmount;
  wallet.welcomeBonusAwardedAt = nowIso;
  if (deviceId) wallet.welcomeBonusDeviceId = deviceId;
  wallet.transactions.unshift(newTx);

  store.wallets[userId] = wallet;
  saveStore(store);

  try {
    const admin = getServiceRoleClient();
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        wallet_balance: newBalance,
        welcome_bonus_credited: true,
        welcome_bonus_balance: newWelcomeBalance,
        welcome_bonus_awarded_at: nowIso,
        signup_device_id: deviceId || undefined,
        signup_ip: ip || undefined,
      },
    });
  } catch (err) {
    console.warn("Notice: Could not sync welcome bonus metadata in Supabase:", err);
  }

  return {
    awarded: true,
    alreadyCredited: false,
    amountCredited: cleanAmount,
    wallet,
  };
}

/**
 * Deduct wallet balance for booking purchase
 */
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
  const store = loadStore();
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

  const newTx: WalletTransaction = {
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
  };

  wallet.balance = newBalance;
  wallet.welcomeBonusBalance = remainingWelcome;
  wallet.transactions.unshift(newTx);

  store.wallets[userId] = wallet;
  saveStore(store);

  // Sync to Supabase auth metadata
  try {
    const admin = getServiceRoleClient();
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        wallet_balance: newBalance,
        welcome_bonus_balance: remainingWelcome,
      },
    });
  } catch (err) {
    console.warn("Notice: Could not sync user metadata in Supabase:", err);
  }

  return { success: true, newBalance, welcomeBonusUsed };
}

/**
 * Calculate loyalty points earned based on active offers
 */
export function calculateEarnableLoyaltyPoints(
  amountSpent: number,
  isWalletPayment: boolean = false
): { points: number; multiplier: number; appliedOffer?: LoyaltyOffer } {
  const store = loadStore();
  const settings = store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS;
  if (!settings.loyaltyEnabled) {
    return { points: 0, multiplier: 0 };
  }

  let multiplier = settings.standardEarnRate || 1; // Base rate from admin config
  let appliedOffer: LoyaltyOffer | undefined;

  if (isWalletPayment) {
    multiplier = Math.max(multiplier, settings.walletPaymentMultiplier || 1.5);
    const walletOffer = store.activeOffers.find(
      (o) => o.isActive && o.id === "offer-wallet-direct-discount"
    );
    if (walletOffer) appliedOffer = walletOffer;
  }

  const doubleOffer = store.activeOffers.find(
    (o) => o.isActive && o.id === "offer-2x-points"
  );
  if (doubleOffer && doubleOffer.multiplier > multiplier) {
    multiplier = doubleOffer.multiplier;
    appliedOffer = doubleOffer;
  }

  const points = Math.round(amountSpent * multiplier);
  return { points, multiplier, appliedOffer };
}

/**
 * Award loyalty points upon completed booking
 */
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
  const store = loadStore();
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

  store.wallets[userId] = wallet;
  saveStore(store);

  // Sync to Supabase auth metadata
  try {
    const admin = getServiceRoleClient();
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        loyalty_points: newPoints,
        loyalty_tier: wallet.loyaltyTier,
      },
    });
  } catch (err) {
    console.warn("Notice: Could not sync user metadata in Supabase:", err);
  }

  return wallet;
}

/**
 * Redeem loyalty points into wallet balance
 * Rate: 100 points = 10 SAR
 */
export async function redeemPointsForCredit({
  userId,
  pointsToRedeem,
}: {
  userId: string;
  pointsToRedeem: number;
}): Promise<{ success: boolean; wallet: UserWalletData; message?: string }> {
  if (pointsToRedeem < 100) {
    const current = await getUserWallet(userId);
    return { success: false, wallet: current, message: "Minimum redemption is 100 points (10 SAR)" };
  }

  const store = loadStore();
  const wallet = await getUserWallet(userId);

  if (wallet.loyaltyPoints < pointsToRedeem) {
    return {
      success: false,
      wallet,
      message: `Insufficient loyalty points. Have: ${wallet.loyaltyPoints}, Requested: ${pointsToRedeem}`,
    };
  }

  const sarCredit = Math.floor(pointsToRedeem / 10); // 100 pts -> 10 SAR
  const exactPointsRedeemed = sarCredit * 10;

  const newPoints = wallet.loyaltyPoints - exactPointsRedeemed;
  const newBalance = Math.round((wallet.balance + sarCredit) * 100) / 100;

  const newTx: WalletTransaction = {
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
  };

  wallet.balance = newBalance;
  wallet.loyaltyPoints = newPoints;
  wallet.loyaltyTier = determineTier(newPoints);
  wallet.transactions.unshift(newTx);

  store.wallets[userId] = wallet;
  saveStore(store);

  // Sync to Supabase auth metadata
  try {
    const admin = getServiceRoleClient();
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        wallet_balance: newBalance,
        loyalty_points: newPoints,
        loyalty_tier: wallet.loyaltyTier,
      },
    });
  } catch (err) {
    console.warn("Notice: Could not sync user metadata in Supabase:", err);
  }

  return { success: true, wallet };
}

export function getActiveLoyaltyOffers(): LoyaltyOffer[] {
  const store = loadStore();
  return store.activeOffers.filter((o) => o.isActive);
}

export function encryptCardNumber(num: string): string {
  const secretKey = crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY || "qafnest-pci-vault-secret-2026").digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv);
  let encrypted = cipher.update(num, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptCardNumber(token: string): string {
  try {
    const [ivHex, encHex] = token.split(":");
    if (!ivHex || !encHex) return "";
    const secretKey = crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY || "qafnest-pci-vault-secret-2026").digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, Buffer.from(ivHex, "hex"));
    let decrypted = decipher.update(encHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

export async function getUserSavedCards(userId: string): Promise<SavedCard[]> {
  const wallet = await getUserWallet(userId);
  return wallet.savedCards || [];
}

export async function saveUserCard(
  userId: string,
  cardInput: {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    brand?: CardBrand;
    isDefault?: boolean;
  }
): Promise<SavedCard> {
  const store = loadStore();
  const wallet = await getUserWallet(userId);
  const cards = wallet.savedCards || [];

  const cleanNumber = cardInput.cardNumber.replace(/\D/g, "");
  const last4 = cleanNumber.slice(-4) || "0000";
  const brand = cardInput.brand || detectCardBrand(cleanNumber);
  const cardToken = cleanNumber ? encryptCardNumber(cleanNumber) : undefined;

  const shouldBeDefault = cardInput.isDefault || cards.length === 0;

  if (shouldBeDefault) {
    cards.forEach((c) => (c.isDefault = false));
  }

  const newCard: SavedCard = {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    cardholderName: cardInput.cardholderName.trim(),
    brand,
    last4,
    expiryMonth: cardInput.expiryMonth.padStart(2, "0"),
    expiryYear: cardInput.expiryYear.slice(-2),
    isDefault: shouldBeDefault,
    createdAt: new Date().toISOString(),
    cardToken,
  };

  cards.push(newCard);
  wallet.savedCards = cards;
  store.wallets[userId] = wallet;
  saveStore(store);

  return newCard;
}

/**
 * Auto-saves a tokenized card from a MyFatoorah invoice transaction only when actual
 * card digits are returned and the gateway is not a digital wallet (Apple/Google/STC/Samsung Pay).
 */
export async function autoSaveCardFromInvoiceTransaction(params: {
  userId: string;
  customerName?: string;
  gatewayName?: string;
  primaryTx?: Record<string, unknown>;
}): Promise<void> {
  const tx = params.primaryTx || {};
  const gw = String(tx.PaymentGateway || tx.CardType || params.gatewayName || "").toLowerCase();
  if (
    gw.includes("apple") ||
    gw.includes("google") ||
    gw.includes("stc") ||
    gw.includes("samsung")
  ) {
    return;
  }

  const rawCardNum = String(tx.CardNumber || "");
  const cleanDigits = rawCardNum.replace(/\D/g, "");
  if (cleanDigits.length < 4) {
    return;
  }

  const last4 = cleanDigits.slice(-4);
  const brand: CardBrand = gw.includes("amex")
    ? "amex"
    : gw.includes("visa")
    ? "visa"
    : gw.includes("master")
    ? "mastercard"
    : "mada";

  const currentCards = await getUserSavedCards(params.userId);
  const alreadyExists = currentCards.some((c) => c.last4 === last4 && c.brand === brand);
  if (alreadyExists) return;

  await saveUserCard(params.userId, {
    cardholderName: params.customerName || "Guest Cardholder",
    cardNumber:
      cleanDigits.length >= 12
        ? cleanDigits
        : brand === "amex"
        ? `34000000000${last4}`
        : brand === "visa"
        ? `411111111111${last4}`
        : brand === "mastercard"
        ? `555555555555${last4}`
        : `588845000000${last4}`,
    expiryMonth: "12",
    expiryYear: "29",
    brand,
    isDefault: currentCards.length === 0,
  });
}

export async function deleteUserCard(userId: string, cardId: string): Promise<boolean> {
  const store = loadStore();
  const wallet = await getUserWallet(userId);
  if (!wallet.savedCards) return false;

  const initialLen = wallet.savedCards.length;
  wallet.savedCards = wallet.savedCards.filter((c) => c.id !== cardId);

  if (wallet.savedCards.length > 0 && !wallet.savedCards.some((c) => c.isDefault)) {
    wallet.savedCards[0].isDefault = true;
  }

  store.wallets[userId] = wallet;
  saveStore(store);
  return wallet.savedCards.length < initialLen;
}

export function getLoyaltySettings(): LoyaltySettings {
  const store = loadStore();
  return store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS;
}

export function updateLoyaltySettings(settings: Partial<LoyaltySettings>): LoyaltySettings {
  const store = loadStore();
  store.loyaltySettings = {
    ...(store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS),
    ...settings,
  };
  saveStore(store);
  return store.loyaltySettings;
}

export function getAllLoyaltyOffers(): LoyaltyOffer[] {
  const store = loadStore();
  return store.activeOffers;
}

export function updateLoyaltyOffers(offers: LoyaltyOffer[]): LoyaltyOffer[] {
  const store = loadStore();
  store.activeOffers = offers;
  saveStore(store);
  return store.activeOffers;
}

export function registerPendingWalletSplit(
  split: Omit<PendingWalletSplit, "settled" | "createdAt">
): PendingWalletSplit {
  const store = loadStore();
  const splits = store.pendingSplits || {};
  const record: PendingWalletSplit = {
    ...split,
    walletAmount: Math.round(split.walletAmount * 100) / 100,
    welcomeBonusAmount: Math.round((split.welcomeBonusAmount || 0) * 100) / 100,
    gatewayAmount: Math.round(split.gatewayAmount * 100) / 100,
    totalAmount: Math.round(split.totalAmount * 100) / 100,
    settled: false,
    createdAt: new Date().toISOString(),
  };
  splits[split.bookingRef] = record;
  store.pendingSplits = splits;
  saveStore(store);
  return record;
}

export function getPendingWalletSplit(bookingRef: string): PendingWalletSplit | null {
  if (!bookingRef) return null;
  const store = loadStore();
  return store.pendingSplits?.[bookingRef] || null;
}

export function clearPendingWalletSplit(bookingRef: string): void {
  if (!bookingRef) return;
  const store = loadStore();
  if (store.pendingSplits && store.pendingSplits[bookingRef] && !store.pendingSplits[bookingRef].settled) {
    delete store.pendingSplits[bookingRef];
    saveStore(store);
  }
}

export async function settlePendingWalletSplit(
  bookingRef: string
): Promise<{ settled: boolean; walletAmount: number; welcomeBonusUsed: number; error?: string }> {
  const split = getPendingWalletSplit(bookingRef);
  if (!split) {
    return { settled: false, walletAmount: 0, welcomeBonusUsed: 0, error: "split_not_found" };
  }
  if (split.settled) {
    return { settled: true, walletAmount: split.walletAmount, welcomeBonusUsed: split.welcomeBonusAmount || 0 };
  }

  const deduct = await deductWalletForBooking({
    userId: split.userId,
    amount: split.walletAmount,
    bookingRef: split.bookingRef,
    propertyTitle: `${split.propertyTitle} (Wallet Split)`,
  });

  if (!deduct.success) {
    return { settled: false, walletAmount: 0, welcomeBonusUsed: 0, error: deduct.error || "wallet_deduction_failed" };
  }

  const freshStore = loadStore();
  if (freshStore.pendingSplits && freshStore.pendingSplits[bookingRef]) {
    freshStore.pendingSplits[bookingRef].settled = true;
    freshStore.pendingSplits[bookingRef].welcomeBonusAmount = deduct.welcomeBonusUsed;
    saveStore(freshStore);
  }

  return { settled: true, walletAmount: split.walletAmount, welcomeBonusUsed: deduct.welcomeBonusUsed };
}

/**
 * Validates gateway paid amount against either full booking total or pending wallet+gateway split.
 * Settles the wallet deduction atomically when a split checkout succeeds.
 */
export async function verifyAndSettleBookingPaymentAmount(params: {
  bookingRef: string;
  expectedBookingTotal: number;
  gatewayPaidAmount: number;
  gatewayName: string;
}): Promise<
  | { ok: true; totalConfirmedAmount: number; effectiveGatewayLabel: string; isSplit: boolean }
  | { ok: false; code: "amount_mismatch" | "wallet_split_failed"; message: string }
> {
  const split = getPendingWalletSplit(params.bookingRef);
  if (!split) {
    if (Math.abs(params.expectedBookingTotal - params.gatewayPaidAmount) > 0.05) {
      return {
        ok: false,
        code: "amount_mismatch",
        message: `Payment amount mismatch: expected ${params.expectedBookingTotal} SAR, received ${params.gatewayPaidAmount}.`,
      };
    }
    return {
      ok: true,
      totalConfirmedAmount: params.gatewayPaidAmount,
      effectiveGatewayLabel: params.gatewayName,
      isSplit: false,
    };
  }

  // Verify the gateway collected the exact remaining amount and wallet + gateway equals booking total
  const expectedCombined = Math.round((split.walletAmount + params.gatewayPaidAmount) * 100) / 100;
  if (
    Math.abs(split.gatewayAmount - params.gatewayPaidAmount) > 0.05 ||
    Math.abs(params.expectedBookingTotal - expectedCombined) > 0.05
  ) {
    return {
      ok: false,
      code: "amount_mismatch",
      message: `Split payment amount mismatch: expected ${split.gatewayAmount} SAR via gateway (plus ${split.walletAmount} SAR wallet), received ${params.gatewayPaidAmount}.`,
    };
  }

  const settlement = await settlePendingWalletSplit(params.bookingRef);
  if (!settlement.settled) {
    return {
      ok: false,
      code: "wallet_split_failed",
      message: settlement.error || "Could not settle wallet portion of split payment.",
    };
  }

  return {
    ok: true,
    totalConfirmedAmount: params.expectedBookingTotal,
    effectiveGatewayLabel: `wallet+${params.gatewayName}`,
    isSplit: true,
  };
}

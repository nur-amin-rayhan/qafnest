import crypto from "crypto";
import { detectCardBrand, type CardBrand } from "@/lib/services/cardBrand";
import { loadWalletStore, saveWalletStore } from "./walletStore";
import { getUserWallet } from "./walletOperations";
import type { SavedCard } from "./walletTypes";

function getVaultKey(): Buffer {
  return crypto
    .createHash("sha256")
    .update(process.env.ENCRYPTION_KEY || "qafnest-pci-vault-secret-2026")
    .digest();
}

export function encryptCardNumber(num: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getVaultKey(), iv);
  return `${iv.toString("hex")}:${cipher.update(num, "utf8", "hex")}${cipher.final("hex")}`;
}

export function decryptCardNumber(token: string): string {
  try {
    const [ivHex, encHex] = token.split(":");
    if (!ivHex || !encHex) return "";
    const decipher = crypto.createDecipheriv("aes-256-cbc", getVaultKey(), Buffer.from(ivHex, "hex"));
    return `${decipher.update(encHex, "hex", "utf8")}${decipher.final("utf8")}`;
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
  const store = loadWalletStore();
  const wallet = await getUserWallet(userId);
  const cards = wallet.savedCards || [];

  const cleanNumber = cardInput.cardNumber.replace(/\D/g, "");
  const last4 = cleanNumber.slice(-4) || "0000";
  const brand = cardInput.brand || detectCardBrand(cleanNumber);
  const shouldBeDefault = cardInput.isDefault || cards.length === 0;
  if (shouldBeDefault) cards.forEach((c) => (c.isDefault = false));

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
    cardToken: cleanNumber ? encryptCardNumber(cleanNumber) : undefined,
  };

  cards.push(newCard);
  wallet.savedCards = cards;
  store.wallets[userId] = wallet;
  saveWalletStore(store);
  return newCard;
}

/** Auto-saves tokenized card from MyFatoorah transaction unless settled via digital wallet. */
export async function autoSaveCardFromInvoiceTransaction(params: {
  userId: string;
  customerName?: string;
  gatewayName?: string;
  primaryTx?: Record<string, unknown>;
}): Promise<void> {
  const tx = params.primaryTx || {};
  const gw = String(tx.PaymentGateway || tx.CardType || params.gatewayName || "").toLowerCase();
  if (/apple|google|stc|samsung/.test(gw)) return;

  const cleanDigits = String(tx.CardNumber || "").replace(/\D/g, "");
  if (cleanDigits.length < 4) return;

  const last4 = cleanDigits.slice(-4);
  const brand: CardBrand = gw.includes("amex")
    ? "amex"
    : gw.includes("visa")
    ? "visa"
    : gw.includes("master")
    ? "mastercard"
    : "mada";

  const currentCards = await getUserSavedCards(params.userId);
  if (currentCards.some((c) => c.last4 === last4 && c.brand === brand)) return;

  const fallbackBin: Record<CardBrand, string> = {
    amex: `34000000000${last4}`,
    visa: `411111111111${last4}`,
    mastercard: `555555555555${last4}`,
    mada: `588845000000${last4}`,
  };

  await saveUserCard(params.userId, {
    cardholderName: params.customerName || "Guest Cardholder",
    cardNumber: cleanDigits.length >= 12 ? cleanDigits : fallbackBin[brand],
    expiryMonth: "12",
    expiryYear: "29",
    brand,
    isDefault: currentCards.length === 0,
  });
}

export async function deleteUserCard(userId: string, cardId: string): Promise<boolean> {
  const store = loadWalletStore();
  const wallet = await getUserWallet(userId);
  if (!wallet.savedCards) return false;

  const initialLen = wallet.savedCards.length;
  wallet.savedCards = wallet.savedCards.filter((c) => c.id !== cardId);
  if (wallet.savedCards.length > 0 && !wallet.savedCards.some((c) => c.isDefault)) {
    wallet.savedCards[0].isDefault = true;
  }

  store.wallets[userId] = wallet;
  saveWalletStore(store);
  return wallet.savedCards.length < initialLen;
}

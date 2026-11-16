import crypto from "crypto";
import { detectCardBrand, type CardBrand } from "@/lib/services/cardBrand";
import { commitUserWallet } from "./walletStore";
import { getUserWallet } from "./walletOperations";
import type { SavedCard } from "./walletTypes";

function getVaultKey(): Buffer {
  const configured = process.env.ENCRYPTION_KEY?.trim();
  if (configured) {
    return crypto.createHash("sha256").update(configured).digest();
  }
  const serverSecret =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.ADMIN_SECRET_KEY?.trim();
  if (serverSecret) {
    return crypto
      .createHmac("sha256", serverSecret)
      .update("qafnest-card-vault-v2")
      .digest();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required in production.");
  }
  return crypto.createHash("sha256").update("qafnest-dev-vault-key-local-only").digest();
}

function getLegacyVaultKey(): Buffer {
  return crypto
    .createHash("sha256")
    .update(process.env.ENCRYPTION_KEY || "qafnest-pci-vault-secret-2026")
    .digest();
}

export function encryptCardNumber(num: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getVaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(num, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptCardNumber(token: string): string {
  try {
    if (token.startsWith("gcm:")) {
      const [, ivHex, tagHex, encHex] = token.split(":");
      if (!ivHex || !tagHex || !encHex) return "";
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getVaultKey(),
        Buffer.from(ivHex, "hex")
      );
      decipher.setAuthTag(Buffer.from(tagHex, "hex"));
      return `${decipher.update(encHex, "hex", "utf8")}${decipher.final("utf8")}`;
    }

    // Legacy AES-256-CBC backwards-compatibility for pre-migration records
    const [ivHex, encHex] = token.split(":");
    if (!ivHex || !encHex) return "";
    for (const candidateKey of [getVaultKey(), getLegacyVaultKey()]) {
      try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", candidateKey, Buffer.from(ivHex, "hex"));
        return `${decipher.update(encHex, "hex", "utf8")}${decipher.final("utf8")}`;
      } catch {
        // try legacy key
      }
    }
    return "";
  } catch {
    return "";
  }
}

export function toPublicSavedCard(card: SavedCard): SavedCard {
  const publicCard: SavedCard = {
    id: card.id,
    userId: card.userId,
    cardholderName: card.cardholderName,
    brand: card.brand,
    last4: card.last4,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    isDefault: card.isDefault,
    createdAt: card.createdAt,
    maskedPan: card.maskedPan,
    hasSavedCvv: Boolean(card.cvvToken || card.hasSavedCvv),
    supportsDirectCharge: Boolean(card.supportsDirectCharge ?? (card.gatewayToken || card.cardToken)),
  };
  return publicCard;
}

export async function getUserSavedCards(userId: string): Promise<SavedCard[]> {
  const wallet = await getUserWallet(userId);
  return wallet.savedCards || [];
}

function resolveCardBrandFromMetadata(rawBrand: string, rawGateway: string, rawNumber: string): CardBrand {
  const combined = `${rawBrand} ${rawGateway}`.toLowerCase();
  if (combined.includes("amex") || combined.includes("american express")) return "amex";
  if (combined.includes("mada") || combined.includes("مدى")) return "mada";
  if (combined.includes("master")) return "mastercard";
  if (combined.includes("visa")) return "visa";
  return detectCardBrand(rawNumber);
}

export async function saveUserCard(
  userId: string,
  cardInput: {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv?: string;
    brand?: CardBrand;
    isDefault?: boolean;
    gatewayToken?: string;
    panHash?: string;
    maskedPan?: string;
  }
): Promise<SavedCard> {
  const wallet = await getUserWallet(userId);
  const cards = [...(wallet.savedCards || [])];

  const rawNumber = String(cardInput.cardNumber || "");
  const isMasked = /[x*]/i.test(rawNumber);
  const cleanNumber = rawNumber.replace(/\D/g, "");
  const last4 = cleanNumber.slice(-4) || "0000";
  const brand = cardInput.brand || detectCardBrand(cleanNumber);
  const shouldBeDefault = cardInput.isDefault || cards.length === 0;
  if (shouldBeDefault) cards.forEach((c) => (c.isDefault = false));

  const hasFullPan = !isMasked && cleanNumber.length >= 15;
  const cleanGatewayToken = cardInput.gatewayToken?.trim() || "";
  const cleanCvv = String(cardInput.cvv || "").replace(/\D/g, "");
  const hasValidCvv = /^\d{3,4}$/.test(cleanCvv);

  const newCard: SavedCard = {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    cardholderName: cardInput.cardholderName.trim() || "Guest Cardholder",
    brand,
    last4,
    expiryMonth: cardInput.expiryMonth.replace(/\D/g, "").slice(-2).padStart(2, "0") || "12",
    expiryYear: cardInput.expiryYear.replace(/\D/g, "").slice(-2) || "29",
    isDefault: shouldBeDefault,
    createdAt: new Date().toISOString(),
    cardToken: hasFullPan ? encryptCardNumber(cleanNumber) : undefined,
    cvvToken: hasValidCvv ? encryptCardNumber(cleanCvv) : undefined,
    hasSavedCvv: hasValidCvv,
    gatewayToken: cleanGatewayToken ? encryptCardNumber(cleanGatewayToken) : undefined,
    panHash: cardInput.panHash?.trim() || undefined,
    maskedPan: cardInput.maskedPan?.trim() || (isMasked ? rawNumber.trim() : undefined),
    supportsDirectCharge: Boolean(hasFullPan || cleanGatewayToken),
  };

  cards.push(newCard);
  wallet.savedCards = cards;
  await commitUserWallet(wallet);
  return newCard;
}

/** Auto-saves tokenized/display card metadata from MyFatoorah transaction unless settled via digital wallet. */
export async function autoSaveCardFromInvoiceTransaction(params: {
  userId: string;
  customerName?: string;
  gatewayName?: string;
  primaryTx?: Record<string, unknown>;
  cvv?: string;
}): Promise<void> {
  const tx = params.primaryTx || {};
  const cardObj =
    tx.Card && typeof tx.Card === "object" ? (tx.Card as Record<string, unknown>) : undefined;
  const gw = String(tx.PaymentGateway || tx.CardType || params.gatewayName || "").toLowerCase();
  if (/apple|google|stc|samsung/.test(gw)) return;

  const rawCardNumber = String(cardObj?.Number || tx.CardNumber || "").trim();
  const cleanDigits = rawCardNumber.replace(/\D/g, "");
  if (cleanDigits.length < 4) return;

  const last4 = cleanDigits.slice(-4);
  const brand = resolveCardBrandFromMetadata(
    String(cardObj?.Brand || ""),
    gw,
    cleanDigits
  );
  const expiryMonth =
    String(cardObj?.ExpiryMonth || "").replace(/\D/g, "").slice(-2).padStart(2, "0") || "12";
  const expiryYear =
    String(cardObj?.ExpiryYear || "").replace(/\D/g, "").slice(-2) || "29";
  const cardholderName =
    String(cardObj?.NameOnCard || "").trim() ||
    String(params.customerName || "").trim() ||
    "Guest Cardholder";
  const panHash =
    typeof cardObj?.PanHash === "string" && cardObj.PanHash.trim()
      ? cardObj.PanHash.trim()
      : undefined;
  const gatewayToken =
    typeof cardObj?.Token === "string" && cardObj.Token.trim()
      ? cardObj.Token.trim()
      : typeof tx.Token === "string" && tx.Token.trim()
      ? tx.Token.trim()
      : undefined;

  const wallet = await getUserWallet(params.userId);
  const currentCards = [...(wallet.savedCards || [])];
  const existing = currentCards.find(
    (c) => (panHash && c.panHash === panHash) || (c.last4 === last4 && c.brand === brand)
  );

  if (existing) {
    let changed = false;
    if (panHash && !existing.panHash) {
      existing.panHash = panHash;
      changed = true;
    }
    if (cardObj?.ExpiryMonth && existing.expiryMonth !== expiryMonth) {
      existing.expiryMonth = expiryMonth;
      changed = true;
    }
    if (cardObj?.ExpiryYear && existing.expiryYear !== expiryYear) {
      existing.expiryYear = expiryYear;
      changed = true;
    }
    if (gatewayToken && !existing.gatewayToken) {
      existing.gatewayToken = encryptCardNumber(gatewayToken);
      existing.supportsDirectCharge = true;
      changed = true;
    }
    if (params.cvv && /^\d{3,4}$/.test(params.cvv) && !existing.cvvToken) {
      existing.cvvToken = encryptCardNumber(params.cvv);
      existing.hasSavedCvv = true;
      changed = true;
    }
    if (changed) {
      wallet.savedCards = currentCards;
      await commitUserWallet(wallet);
    }
    return;
  }

  await saveUserCard(params.userId, {
    cardholderName,
    cardNumber: rawCardNumber,
    expiryMonth,
    expiryYear,
    cvv: params.cvv,
    brand,
    isDefault: currentCards.length === 0,
    gatewayToken,
    panHash,
    maskedPan: rawCardNumber,
  });
}

export async function deleteUserCard(userId: string, cardId: string): Promise<boolean> {
  const wallet = await getUserWallet(userId);
  if (!wallet.savedCards) return false;

  const initialLen = wallet.savedCards.length;
  wallet.savedCards = wallet.savedCards.filter((c) => c.id !== cardId);
  if (wallet.savedCards.length > 0 && !wallet.savedCards.some((c) => c.isDefault)) {
    wallet.savedCards[0].isDefault = true;
  }

  const removed = wallet.savedCards.length < initialLen;
  if (removed) {
    await commitUserWallet(wallet);
  }
  return removed;
}

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

  const cleanMonth = cardInput.expiryMonth.replace(/\D/g, "").slice(-2).padStart(2, "0") || "12";
  const cleanYear = cardInput.expiryYear.replace(/\D/g, "").slice(-2) || "29";

  // Deduplicate if the same card (last4 + brand + expiry) is already saved
  const duplicate = cards.find(
    (c) =>
      c.last4 === last4 &&
      c.brand === brand &&
      c.expiryMonth === cleanMonth &&
      c.expiryYear === cleanYear
  );
  if (duplicate) {
    duplicate.cardholderName = cardInput.cardholderName.trim() || duplicate.cardholderName;
    if (shouldBeDefault) {
      cards.forEach((c) => (c.isDefault = false));
      duplicate.isDefault = true;
    }
    if (hasFullPan) duplicate.cardToken = encryptCardNumber(cleanNumber);
    if (hasValidCvv) {
      duplicate.cvvToken = encryptCardNumber(cleanCvv);
      duplicate.hasSavedCvv = true;
    }
    if (cleanGatewayToken) duplicate.gatewayToken = encryptCardNumber(cleanGatewayToken);
    if (cardInput.panHash?.trim()) duplicate.panHash = cardInput.panHash.trim();
    if (cardInput.maskedPan?.trim()) duplicate.maskedPan = cardInput.maskedPan.trim();
    duplicate.supportsDirectCharge = Boolean(
      duplicate.cardToken || duplicate.gatewayToken || hasFullPan || cleanGatewayToken
    );
    wallet.savedCards = cards;
    await commitUserWallet(wallet);
    return duplicate;
  }

  const newCard: SavedCard = {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    cardholderName: cardInput.cardholderName.trim() || "Guest Cardholder",
    brand,
    last4,
    expiryMonth: cleanMonth,
    expiryYear: cleanYear,
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

export async function setDefaultUserCard(
  userId: string,
  cardId: string
): Promise<{ updated: boolean; cards: SavedCard[] }> {
  const wallet = await getUserWallet(userId);
  const cards = [...(wallet.savedCards || [])];
  const exists = cards.some((c) => c.id === cardId);
  if (!exists) {
    return { updated: false, cards };
  }
  for (const c of cards) {
    c.isDefault = c.id === cardId;
  }
  wallet.savedCards = cards;
  await commitUserWallet(wallet);
  return { updated: true, cards };
}

export async function attachGatewayTokenToCard(
  userId: string,
  cardId: string,
  gatewayToken: string
): Promise<void> {
  const clean = gatewayToken.trim();
  if (!userId || !cardId || !clean) return;
  const wallet = await getUserWallet(userId);
  const cards = [...(wallet.savedCards || [])];
  const target = cards.find((c) => c.id === cardId);
  if (!target) return;
  target.gatewayToken = encryptCardNumber(clean);
  target.supportsDirectCharge = true;
  wallet.savedCards = cards;
  await commitUserWallet(wallet);
}

export interface DeleteCardResult {
  removed: boolean;
  errorCode?: "default_card_required" | "cannot_delete_default_card" | "not_found";
  message?: string;
  messageAr?: string;
  cards: SavedCard[];
}

export async function deleteUserCard(
  userId: string,
  cardId: string
): Promise<DeleteCardResult> {
  const wallet = await getUserWallet(userId);
  const cards = [...(wallet.savedCards || [])];
  const target = cards.find((c) => c.id === cardId);

  if (!target) {
    return {
      removed: false,
      errorCode: "not_found",
      message: "Card not found.",
      messageAr: "البطاقة غير موجودة.",
      cards,
    };
  }

  // Enforce mandatory default card policy: at least one default card must remain saved
  if (cards.length <= 1) {
    return {
      removed: false,
      errorCode: "default_card_required",
      message: "You must keep at least one default card saved. Add another card before deleting this one.",
      messageAr: "يجب الإبقاء على بطاقة افتراضية واحدة على الأقل. أضف بطاقة أخرى قبل حذف هذه البطاقة.",
      cards,
    };
  }

  if (target.isDefault) {
    return {
      removed: false,
      errorCode: "cannot_delete_default_card",
      message: "Set another saved card as your default card before deleting this default card.",
      messageAr: "عيّن بطاقة أخرى كبطاقة افتراضية أولاً قبل حذف البطاقة الافتراضية الحالية.",
      cards,
    };
  }

  wallet.savedCards = cards.filter((c) => c.id !== cardId);
  if (wallet.savedCards.length > 0 && !wallet.savedCards.some((c) => c.isDefault)) {
    wallet.savedCards[0].isDefault = true;
  }

  await commitUserWallet(wallet);
  return {
    removed: true,
    cards: wallet.savedCards,
  };
}

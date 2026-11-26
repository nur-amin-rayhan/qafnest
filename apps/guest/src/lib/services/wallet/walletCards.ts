import crypto from "crypto";
import os from "os";
import { detectCardBrand, type CardBrand } from "@/lib/services/cardBrand";
import { commitUserWallet } from "./walletStore";
import { getUserWallet, withWalletLock } from "./walletOperations";
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
  // Ephemeral-per-host local fallback without hardcoded static secrets
  return crypto
    .createHmac("sha256", `${os.hostname()}:${process.cwd()}`)
    .update("qafnest-local-dev-token-vault")
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

    const [ivHex, encHex] = token.split(":");
    if (!ivHex || !encHex) return "";
    const decipher = crypto.createDecipheriv("aes-256-cbc", getVaultKey(), Buffer.from(ivHex, "hex"));
    return `${decipher.update(encHex, "hex", "utf8")}${decipher.final("utf8")}`;
  } catch {
    return "";
  }
}

export function toPublicSavedCard(card: SavedCard): SavedCard {
  return {
    id: card.id,
    userId: card.userId,
    cardholderName: card.cardholderName,
    brand: card.brand,
    last4: card.last4,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    isDefault: card.isDefault,
    createdAt: card.createdAt,
    maskedPan: card.maskedPan || `**** **** **** ${card.last4}`,
    supportsDirectCharge: Boolean(card.gatewayToken || card.supportsDirectCharge),
  };
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
    cardNumber?: string;
    last4?: string;
    expiryMonth: string;
    expiryYear: string;
    brand?: CardBrand;
    isDefault?: boolean;
    gatewayToken?: string;
    panHash?: string;
    maskedPan?: string;
  }
): Promise<SavedCard> {
  return withWalletLock(userId, async () => {
    const wallet = await getUserWallet(userId);
    const cards = [...(wallet.savedCards || [])];

    const rawNumber = String(cardInput.cardNumber || "");
    const cleanDigits = rawNumber.replace(/\D/g, "");
    const last4 =
      (cardInput.last4 && /^\d{4}$/.test(cardInput.last4) ? cardInput.last4 : cleanDigits.slice(-4)) ||
      "0000";
    const brand = cardInput.brand || detectCardBrand(cleanDigits || last4);
    const shouldBeDefault = cardInput.isDefault || cards.length === 0;
    if (shouldBeDefault) cards.forEach((c) => (c.isDefault = false));

    const cleanGatewayToken = cardInput.gatewayToken?.trim() || "";
    const maskedPan =
      cardInput.maskedPan?.trim() ||
      (cleanDigits.length >= 6
        ? `${cleanDigits.slice(0, 6).replace(/(\d{4})(\d{2})/, "$1 $2")}** **** ${last4}`
        : `**** **** **** ${last4}`);

    const cleanMonth = cardInput.expiryMonth.replace(/\D/g, "").slice(-2).padStart(2, "0") || "12";
    const cleanYear = cardInput.expiryYear.replace(/\D/g, "").slice(-2) || "29";

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
      if (cleanGatewayToken) duplicate.gatewayToken = encryptCardNumber(cleanGatewayToken);
      if (cardInput.panHash?.trim()) duplicate.panHash = cardInput.panHash.trim();
      duplicate.maskedPan = maskedPan;
      duplicate.supportsDirectCharge = Boolean(duplicate.gatewayToken || cleanGatewayToken);
      // Strip any legacy raw card/cvv fields on mutation
      delete (duplicate as unknown as Record<string, unknown>).cardToken;
      delete (duplicate as unknown as Record<string, unknown>).cvvToken;
      delete (duplicate as unknown as Record<string, unknown>).hasSavedCvv;

      wallet.savedCards = cards;
      await commitUserWallet(wallet);
      return duplicate;
    }

    const newCard: SavedCard = {
      id: `card-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      userId,
      cardholderName: cardInput.cardholderName.trim() || "Guest Cardholder",
      brand,
      last4,
      expiryMonth: cleanMonth,
      expiryYear: cleanYear,
      isDefault: shouldBeDefault,
      createdAt: new Date().toISOString(),
      gatewayToken: cleanGatewayToken ? encryptCardNumber(cleanGatewayToken) : undefined,
      panHash: cardInput.panHash?.trim() || undefined,
      maskedPan,
      supportsDirectCharge: Boolean(cleanGatewayToken),
    };

    cards.push(newCard);
    wallet.savedCards = cards;
    await commitUserWallet(wallet);
    return newCard;
  });
}

/** Auto-saves tokenized/display card metadata from MyFatoorah transaction unless settled via digital wallet. */
export async function autoSaveCardFromInvoiceTransaction(params: {
  userId: string;
  customerName?: string;
  gatewayName?: string;
  primaryTx?: Record<string, unknown>;
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

  const didUpdateExisting = await withWalletLock(params.userId, async () => {
    const wallet = await getUserWallet(params.userId);
    const currentCards = [...(wallet.savedCards || [])];
    const existing = currentCards.find(
      (c) => (panHash && c.panHash === panHash) || (c.last4 === last4 && c.brand === brand)
    );
    if (!existing) return false;

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
    if (changed) {
      wallet.savedCards = currentCards;
      await commitUserWallet(wallet);
    }
    return true;
  });

  if (didUpdateExisting) return;

  await saveUserCard(params.userId, {
    cardholderName,
    last4,
    expiryMonth,
    expiryYear,
    brand,
    isDefault: false,
    gatewayToken,
    panHash,
    maskedPan: `**** **** **** ${last4}`,
  });
}

export async function setDefaultUserCard(
  userId: string,
  cardId: string
): Promise<{ updated: boolean; cards: SavedCard[] }> {
  return withWalletLock(userId, async () => {
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
  });
}

export async function attachGatewayTokenToCard(
  userId: string,
  cardId: string,
  gatewayToken: string
): Promise<void> {
  const clean = gatewayToken.trim();
  if (!userId || !cardId || !clean) return;
  await withWalletLock(userId, async () => {
    const wallet = await getUserWallet(userId);
    const cards = [...(wallet.savedCards || [])];
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;
    target.gatewayToken = encryptCardNumber(clean);
    target.supportsDirectCharge = true;
    wallet.savedCards = cards;
    await commitUserWallet(wallet);
  });
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
  return withWalletLock(userId, async () => {
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
  });
}

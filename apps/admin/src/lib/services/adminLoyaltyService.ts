import fs from "fs";
import path from "path";

export interface LoyaltySettings {
  loyaltyEnabled: boolean;
  standardEarnRate: number; // Points per 1 SAR (default: 1)
  walletPaymentMultiplier: number; // default: 1.5
  redemptionRatePoints: number; // default: 100
  redemptionRateSAR: number; // default: 10
}

export interface LoyaltyOffer {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  multiplier: number;
  bonusPoints?: number;
  badgeEn: string;
  badgeAr: string;
  validUntil: string;
  isActive: boolean;
}

export interface LoyaltyStoreState {
  wallets: Record<string, unknown>;
  activeOffers: LoyaltyOffer[];
  loyaltySettings?: LoyaltySettings;
}

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  loyaltyEnabled: true,
  standardEarnRate: 1,
  walletPaymentMultiplier: 1.5,
  redemptionRatePoints: 100,
  redemptionRateSAR: 10,
};

const DEFAULT_OFFERS: LoyaltyOffer[] = [];

function getStoreFilePath(): string {
  const candidates = [
    path.resolve(process.cwd(), ".qafnest-wallets.json"),
    path.resolve(process.cwd(), "..", "..", ".qafnest-wallets.json"),
    path.resolve("d:/qafnest-next/.qafnest-wallets.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[candidates.length - 1];
}

function loadStore(): LoyaltyStoreState {
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.wallets === "object") {
        return {
          wallets: parsed.wallets || {},
          activeOffers: Array.isArray(parsed.activeOffers) ? parsed.activeOffers : [],
          loyaltySettings: parsed.loyaltySettings || DEFAULT_LOYALTY_SETTINGS,
        };
      }
    }
  } catch (err) {
    console.warn("Notice: Error reading wallet store in admin:", err);
  }
  return {
    wallets: {},
    activeOffers: DEFAULT_OFFERS,
    loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
  };
}

function saveStore(state: LoyaltyStoreState): void {
  try {
    const filePath = getStoreFilePath();
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: Error saving wallet store in admin:", err);
  }
}

export function getAdminLoyaltyConfig() {
  const store = loadStore();
  const walletsList = Object.values(store.wallets || {}) as Array<{
    balance?: number;
    loyaltyPoints?: number;
    savedCards?: unknown[];
  }>;

  const totalWallets = walletsList.length;
  const totalBalance = walletsList.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  const totalPoints = walletsList.reduce((sum, w) => sum + (Number(w.loyaltyPoints) || 0), 0);
  const totalCards = walletsList.reduce((sum, w) => sum + (Array.isArray(w.savedCards) ? w.savedCards.length : 0), 0);

  return {
    settings: store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS,
    offers: store.activeOffers || DEFAULT_OFFERS,
    stats: {
      totalWallets,
      totalBalance: Math.round(totalBalance * 100) / 100,
      totalPoints,
      totalCards,
    },
  };
}

export function updateAdminLoyaltySettings(settings: Partial<LoyaltySettings>): LoyaltySettings {
  const store = loadStore();
  store.loyaltySettings = {
    ...(store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS),
    ...settings,
  };
  saveStore(store);
  return store.loyaltySettings;
}

export function toggleAdminLoyaltyOffer(offerId: string, isActive: boolean): LoyaltyOffer[] {
  const store = loadStore();
  store.activeOffers = store.activeOffers.map((o) =>
    o.id === offerId ? { ...o, isActive } : o
  );
  saveStore(store);
  return store.activeOffers;
}

export function saveAdminLoyaltyOffer(offer: Partial<LoyaltyOffer> & { id?: string }): LoyaltyOffer[] {
  const store = loadStore();
  const id = offer.id || `offer-${Date.now()}`;
  const existingIdx = store.activeOffers.findIndex((o) => o.id === id);

  const fullOffer: LoyaltyOffer = {
    id,
    titleEn: offer.titleEn || "Special Campaign",
    titleAr: offer.titleAr || "حملة ترويجية خاصة",
    descriptionEn: offer.descriptionEn || "Enjoy bonus loyalty points.",
    descriptionAr: offer.descriptionAr || "استمتع بنقاط ولاء إضافية.",
    multiplier: Number(offer.multiplier) || 1,
    bonusPoints: offer.bonusPoints ? Number(offer.bonusPoints) : undefined,
    badgeEn: offer.badgeEn || "Promo",
    badgeAr: offer.badgeAr || "عرض",
    validUntil: offer.validUntil || "2026-12-31T23:59:59Z",
    isActive: offer.isActive !== undefined ? offer.isActive : true,
  };

  if (existingIdx >= 0) {
    store.activeOffers[existingIdx] = fullOffer;
  } else {
    store.activeOffers.push(fullOffer);
  }

  saveStore(store);
  return store.activeOffers;
}

export function deleteAdminLoyaltyOffer(offerId: string): LoyaltyOffer[] {
  const store = loadStore();
  store.activeOffers = store.activeOffers.filter((o) => o.id !== offerId);
  saveStore(store);
  return store.activeOffers;
}

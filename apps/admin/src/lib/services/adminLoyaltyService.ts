import { readRootJsonFile, writeRootJsonFile } from "@qafnest/shared/serverJsonStore";

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

const WALLET_STORE_FILE = ".qafnest-wallets.json";

function defaultLoyaltyStoreState(): LoyaltyStoreState {
  return {
    wallets: {},
    activeOffers: DEFAULT_OFFERS,
    loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
  };
}

function loadStore(): LoyaltyStoreState {
  return readRootJsonFile<LoyaltyStoreState>(
    WALLET_STORE_FILE,
    defaultLoyaltyStoreState,
    (parsed) => {
      const candidate = parsed as Partial<LoyaltyStoreState> | null;
      if (candidate && typeof candidate.wallets === "object" && candidate.wallets !== null) {
        return {
          wallets: candidate.wallets || {},
          activeOffers: Array.isArray(candidate.activeOffers) ? candidate.activeOffers : [],
          loyaltySettings: candidate.loyaltySettings || DEFAULT_LOYALTY_SETTINGS,
        };
      }
      return defaultLoyaltyStoreState();
    }
  );
}

function saveStore(state: LoyaltyStoreState): void {
  writeRootJsonFile(WALLET_STORE_FILE, state);
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

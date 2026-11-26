import {
  hydrateRootJsonFile,
  persistRootJsonFile,
  readRootJsonFile,
  writeRootJsonFile,
} from "@qafnest/shared/serverJsonStore";

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
  pendingSplits?: Record<string, unknown>;
  pendingTopUps?: Record<string, unknown>;
  processedTopUpPaymentIds?: string[];
}

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  loyaltyEnabled: true,
  standardEarnRate: 1,
  walletPaymentMultiplier: 1.5,
  redemptionRatePoints: 100,
  redemptionRateSAR: 10,
};

const DEFAULT_OFFERS: LoyaltyOffer[] = [
  {
    id: "camp-riyadh-season-2x",
    titleEn: "Riyadh Season Double Points",
    titleAr: "موسم الرياض - نقاط مضاعفة 2x",
    descriptionEn: "Earn 2x loyalty points on all luxury chalets and private villas in Riyadh.",
    descriptionAr: "احصل على ضعف نقاط الولاء (2x) عند حجز الشاليهات والفلل الفاخرة في الرياض.",
    multiplier: 2.0,
    bonusPoints: 100,
    badgeEn: "2x Points",
    badgeAr: "نقاط مضاعفة 2x",
    validUntil: "2027-03-31T23:59:59.000Z",
    isActive: true,
  },
];

const WALLET_STORE_FILE = ".qafnest-wallets.json";

function defaultLoyaltyStoreState(): LoyaltyStoreState {
  return {
    wallets: {},
    activeOffers: DEFAULT_OFFERS,
    loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
    pendingSplits: {},
    pendingTopUps: {},
    processedTopUpPaymentIds: [],
  };
}

function normalizeLoyaltyStoreState(parsed: unknown): LoyaltyStoreState {
  const candidate = parsed as Partial<LoyaltyStoreState> | null;
  if (candidate && typeof candidate.wallets === "object" && candidate.wallets !== null) {
    return {
      ...candidate,
      wallets: candidate.wallets || {},
      activeOffers:
        Array.isArray(candidate.activeOffers) && candidate.activeOffers.length > 0
          ? candidate.activeOffers
          : DEFAULT_OFFERS,
      loyaltySettings: candidate.loyaltySettings || DEFAULT_LOYALTY_SETTINGS,
      pendingSplits:
        candidate.pendingSplits && typeof candidate.pendingSplits === "object"
          ? candidate.pendingSplits
          : {},
      pendingTopUps:
        candidate.pendingTopUps && typeof candidate.pendingTopUps === "object"
          ? candidate.pendingTopUps
          : {},
      processedTopUpPaymentIds: Array.isArray(candidate.processedTopUpPaymentIds)
        ? candidate.processedTopUpPaymentIds
        : [],
    };
  }
  return defaultLoyaltyStoreState();
}

function loadStore(): LoyaltyStoreState {
  return readRootJsonFile<LoyaltyStoreState>(
    WALLET_STORE_FILE,
    defaultLoyaltyStoreState,
    normalizeLoyaltyStoreState
  );
}

export async function hydrateAdminLoyaltyStore(): Promise<LoyaltyStoreState> {
  return hydrateRootJsonFile<LoyaltyStoreState>(
    WALLET_STORE_FILE,
    defaultLoyaltyStoreState,
    normalizeLoyaltyStoreState
  );
}

async function saveStore(state: LoyaltyStoreState): Promise<void> {
  writeRootJsonFile(WALLET_STORE_FILE, state);
  await persistRootJsonFile(WALLET_STORE_FILE, state).catch(() => undefined);
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

export async function updateAdminLoyaltySettings(settings: Partial<LoyaltySettings>): Promise<LoyaltySettings> {
  await hydrateAdminLoyaltyStore();
  const store = loadStore();
  store.loyaltySettings = {
    ...(store.loyaltySettings || DEFAULT_LOYALTY_SETTINGS),
    ...settings,
  };
  await saveStore(store);
  return store.loyaltySettings;
}

export async function toggleAdminLoyaltyOffer(offerId: string, isActive: boolean): Promise<LoyaltyOffer[]> {
  await hydrateAdminLoyaltyStore();
  const store = loadStore();
  store.activeOffers = store.activeOffers.map((o) =>
    o.id === offerId ? { ...o, isActive } : o
  );
  await saveStore(store);
  return store.activeOffers;
}

export async function saveAdminLoyaltyOffer(offer: Partial<LoyaltyOffer> & { id?: string }): Promise<LoyaltyOffer[]> {
  await hydrateAdminLoyaltyStore();
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

  await saveStore(store);
  return store.activeOffers;
}

export async function deleteAdminLoyaltyOffer(offerId: string): Promise<LoyaltyOffer[]> {
  await hydrateAdminLoyaltyStore();
  const store = loadStore();
  store.activeOffers = store.activeOffers.filter((o) => o.id !== offerId);
  await saveStore(store);
  return store.activeOffers;
}

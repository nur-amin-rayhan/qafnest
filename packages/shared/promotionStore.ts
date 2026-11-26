import {
  readRootJsonFile,
  writeRootJsonFile,
  hydrateRootJsonFile,
  persistRootJsonFile,
} from "./serverJsonStore";

export interface StoredCoupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_spend?: number;
  max_discount?: number;
  min_nights?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  description_en: string;
  description_ar: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionState {
  promotionsEnabled: boolean;
  coupons: StoredCoupon[];
}

const PROMOTIONS_STORE_FILE = ".qafnest-promotions.json";

function normalizePromotionState(parsed: unknown): PromotionState {
  const candidate = parsed as Partial<PromotionState> | null;
  return {
    promotionsEnabled: candidate?.promotionsEnabled !== false,
    coupons: Array.isArray(candidate?.coupons) ? candidate.coupons : [],
  };
}

export function getPromotionState(): PromotionState {
  return readRootJsonFile<PromotionState>(
    PROMOTIONS_STORE_FILE,
    () => ({
      promotionsEnabled: true,
      coupons: [],
    }),
    normalizePromotionState
  );
}

export function savePromotionState(state: PromotionState): void {
  writeRootJsonFile(PROMOTIONS_STORE_FILE, state);
}

export async function hydratePromotionState(): Promise<PromotionState> {
  return hydrateRootJsonFile<PromotionState>(
    PROMOTIONS_STORE_FILE,
    () => ({
      promotionsEnabled: true,
      coupons: [],
    }),
    normalizePromotionState
  );
}

export async function persistPromotionState(state: PromotionState): Promise<boolean> {
  return persistRootJsonFile(PROMOTIONS_STORE_FILE, state);
}

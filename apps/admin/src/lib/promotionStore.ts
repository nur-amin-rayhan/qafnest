import fs from "fs";
import path from "path";

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

function getStoreFilePath(): string {
  const candidates = [
    path.resolve(process.cwd(), ".qafnest-promotions.json"),
    path.resolve(process.cwd(), "..", "..", ".qafnest-promotions.json"),
    path.resolve("d:/qafnest-next/.qafnest-promotions.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[candidates.length - 1];
}

export function getPromotionState(): PromotionState {
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Notice: Error reading local promotion store:", err);
  }
  return {
    promotionsEnabled: true,
    coupons: [],
  };
}

export function savePromotionState(state: PromotionState): void {
  try {
    const filePath = getStoreFilePath();
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: Error saving local promotion store:", err);
  }
}


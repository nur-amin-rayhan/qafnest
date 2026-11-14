import { StoredCoupon } from "@/lib/promotionStore";

export interface AdminCouponRecord extends StoredCoupon {
  starts_at?: string;
}

export const INITIAL_DEFAULT_COUPONS: AdminCouponRecord[] = [];

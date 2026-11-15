import {
  calculateBookingSettlement,
  getEffectiveGuestFeeConfig,
  getEffectiveHostCommissionPercent,
  type BookingSettlementBreakdown,
  type GuestFeeMode,
  type PlatformFeeConfig,
} from "./platformFee";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

export interface BookingFinancialSnapshot {
  bookingRef: string;
  bookingId?: string;
  listingAmountSar: number;
  guestServiceFeeSar: number;
  guestFeeMode: GuestFeeMode;
  guestServiceFeePercent: number;
  promoCode?: string | null;
  promoDiscountSar: number;
  taxableSubtotalSar: number;
  vatRatePercent: number;
  vatAmountSar: number;
  totalPriceSar: number;
  hostCommissionPercent: number;
  hostCommissionAmountSar: number;
  hostNetPayoutSar: number;
  walletAppliedSar: number;
  welcomeBonusUsedSar: number;
  gatewayPaidSar: number;
  platformGrossRevenueSar: number;
  platformNetRevenueSar: number;
  recordedAt: string;
}

interface SnapshotStoreDoc {
  snapshots: Record<string, BookingFinancialSnapshot>;
}

const FINANCIALS_STORE_FILE = "booking-financials.json";

function readDoc(): SnapshotStoreDoc {
  return readSharedJsonFile<SnapshotStoreDoc>(
    FINANCIALS_STORE_FILE,
    () => ({ snapshots: {} }),
    (parsed) => {
      const candidate = parsed as Partial<SnapshotStoreDoc>;
      return {
        snapshots:
          candidate?.snapshots && typeof candidate.snapshots === "object" ? candidate.snapshots : {},
      };
    }
  );
}

function writeDoc(doc: SnapshotStoreDoc): void {
  writeSharedJsonFile(FINANCIALS_STORE_FILE, doc);
}

export function saveBookingFinancialSnapshot(snapshot: BookingFinancialSnapshot): BookingFinancialSnapshot {
  const doc = readDoc();
  doc.snapshots[snapshot.bookingRef] = snapshot;
  if (snapshot.bookingId) {
    doc.snapshots[snapshot.bookingId] = snapshot;
  }
  writeDoc(doc);
  return snapshot;
}

export function getBookingFinancialSnapshot(refOrId?: string | null): BookingFinancialSnapshot | null {
  if (!refOrId) return null;
  const doc = readDoc();
  return doc.snapshots[refOrId] || null;
}

export function getAllBookingFinancialSnapshots(): BookingFinancialSnapshot[] {
  const doc = readDoc();
  const seen = new Set<string>();
  const unique: BookingFinancialSnapshot[] = [];
  for (const item of Object.values(doc.snapshots)) {
    if (!seen.has(item.bookingRef)) {
      seen.add(item.bookingRef);
      unique.push(item);
    }
  }
  return unique;
}

function round2(val: number): number {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

/**
 * Shared 4-party settlement resolver used across Guest, Host, and Admin apps.
 * Uses persisted checkout snapshot when present; otherwise reconstructs listing base,
 * guest fee, full ZATCA VAT, and host commission cleanly from booking/property metadata.
 */
export function resolveBookingSettlement(params: {
  bookingId?: string;
  bookingReference?: string | null;
  totalPricePaid: number;
  nights?: number | null;
  nightlyPrice?: number | null;
  category?: string;
  promoDiscount?: number | null;
  feeConfig: PlatformFeeConfig;
  zatcaTaxableAmount?: number | null;
  zatcaVatAmount?: number | null;
}): BookingSettlementBreakdown {
  const {
    bookingId,
    bookingReference,
    totalPricePaid,
    nights,
    nightlyPrice,
    category,
    promoDiscount,
    feeConfig,
    zatcaTaxableAmount,
    zatcaVatAmount,
  } = params;

  const snap = getBookingFinancialSnapshot(bookingReference) || getBookingFinancialSnapshot(bookingId);
  const defaultHostCommPercent = getEffectiveHostCommissionPercent(category, feeConfig);

  if (snap) {
    return calculateBookingSettlement({
      listingAmountSar: snap.listingAmountSar,
      guestServiceFeeSar: snap.guestServiceFeeSar,
      vatAmountSar: snap.vatAmountSar,
      promoDiscountSar: snap.promoDiscountSar,
      welcomeBonusUsedSar: snap.welcomeBonusUsedSar,
      hostCommissionPercent: snap.hostCommissionPercent ?? defaultHostCommPercent,
      vatRatePercent: snap.vatRatePercent ?? feeConfig.vatRatePercent,
    });
  }

  const grossPaid = round2(Math.max(0, Number(totalPricePaid) || 0));
  const vatPercent = feeConfig.vatRatePercent || 15;
  const vatRate = vatPercent / 100;
  const promo = round2(Math.max(0, Number(promoDiscount) || 0));

  const taxableSubtotal = round2(
    zatcaTaxableAmount && zatcaTaxableAmount > 0
      ? zatcaTaxableAmount
      : vatRate > 0
      ? grossPaid / (1 + vatRate)
      : grossPaid
  );
  const vatAmount = round2(
    zatcaVatAmount !== undefined && zatcaVatAmount !== null && zatcaVatAmount >= 0
      ? zatcaVatAmount
      : Math.max(0, grossPaid - taxableSubtotal)
  );

  const guestFeeCfg = getEffectiveGuestFeeConfig(category, feeConfig);
  const safeNights = Math.max(1, Number(nights) || 1);
  const propNightly = Number(nightlyPrice || 0);
  const expectedListingFromProp = propNightly > 0 ? round2(propNightly * safeNights) : 0;

  let listingAmountSar = 0;
  let guestServiceFeeSar = 0;

  if (expectedListingFromProp > 0 && expectedListingFromProp - promo <= taxableSubtotal + 0.05) {
    listingAmountSar = expectedListingFromProp;
    guestServiceFeeSar = round2(
      Math.max(0, taxableSubtotal - Math.max(0, expectedListingFromProp - promo))
    );
  } else if (
    guestFeeCfg.feeMode === "fixed_amount" &&
    guestFeeCfg.fixedFeeAmountSar >= 0 &&
    taxableSubtotal >= guestFeeCfg.fixedFeeAmountSar
  ) {
    guestServiceFeeSar = round2(guestFeeCfg.fixedFeeAmountSar);
    listingAmountSar = round2(Math.max(0, taxableSubtotal - guestServiceFeeSar + promo));
  } else {
    const feeRate = guestFeeCfg.serviceFeePercent > 0 ? guestFeeCfg.serviceFeePercent / 100 : 0.13;
    listingAmountSar = round2((taxableSubtotal + promo) / (1 + feeRate));
    guestServiceFeeSar = round2(
      Math.max(0, taxableSubtotal - Math.max(0, listingAmountSar - promo))
    );
  }

  return calculateBookingSettlement({
    listingAmountSar,
    guestServiceFeeSar,
    vatAmountSar: vatAmount,
    promoDiscountSar: promo,
    welcomeBonusUsedSar: 0,
    hostCommissionPercent: defaultHostCommPercent,
    vatRatePercent: vatPercent,
  });
}

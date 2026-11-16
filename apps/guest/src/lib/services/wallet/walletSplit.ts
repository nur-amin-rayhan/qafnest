import { loadWalletStore, saveWalletStore } from "./walletStore";
import { deductWalletForBooking } from "./walletOperations";
import type { PendingWalletSplit } from "./walletTypes";

export function registerPendingWalletSplit(
  split: Omit<PendingWalletSplit, "settled" | "createdAt">
): PendingWalletSplit {
  const store = loadWalletStore();
  const splits = store.pendingSplits || {};
  const record: PendingWalletSplit = {
    ...split,
    walletAmount: Math.round(split.walletAmount * 100) / 100,
    welcomeBonusAmount: Math.round((split.welcomeBonusAmount || 0) * 100) / 100,
    gatewayAmount: Math.round(split.gatewayAmount * 100) / 100,
    totalAmount: Math.round(split.totalAmount * 100) / 100,
    settled: false,
    createdAt: new Date().toISOString(),
  };
  splits[split.bookingRef] = record;
  store.pendingSplits = splits;
  saveWalletStore(store);
  return record;
}

export function getPendingWalletSplit(bookingRef: string): PendingWalletSplit | null {
  if (!bookingRef) return null;
  return loadWalletStore().pendingSplits?.[bookingRef] || null;
}

export function clearPendingWalletSplit(bookingRef: string): void {
  if (!bookingRef) return;
  const store = loadWalletStore();
  if (store.pendingSplits?.[bookingRef] && !store.pendingSplits[bookingRef].settled) {
    delete store.pendingSplits[bookingRef];
    saveWalletStore(store);
  }
}

export async function settlePendingWalletSplit(
  bookingRef: string
): Promise<{ settled: boolean; walletAmount: number; welcomeBonusUsed: number; error?: string }> {
  const split = getPendingWalletSplit(bookingRef);
  if (!split) {
    return { settled: false, walletAmount: 0, welcomeBonusUsed: 0, error: "split_not_found" };
  }
  if (split.settled) {
    return { settled: true, walletAmount: split.walletAmount, welcomeBonusUsed: split.welcomeBonusAmount || 0 };
  }

  const deduct = await deductWalletForBooking({
    userId: split.userId,
    amount: split.walletAmount,
    bookingRef: split.bookingRef,
    propertyTitle: `${split.propertyTitle} (Wallet Split)`,
  });
  if (!deduct.success) {
    return { settled: false, walletAmount: 0, welcomeBonusUsed: 0, error: deduct.error || "wallet_deduction_failed" };
  }

  const freshStore = loadWalletStore();
  if (freshStore.pendingSplits?.[bookingRef]) {
    freshStore.pendingSplits[bookingRef].settled = true;
    freshStore.pendingSplits[bookingRef].welcomeBonusAmount = deduct.welcomeBonusUsed;
    saveWalletStore(freshStore);
  }

  return { settled: true, walletAmount: split.walletAmount, welcomeBonusUsed: deduct.welcomeBonusUsed };
}

/** Validates gateway collected amount against booking total or pending wallet+gateway split. */
export async function verifyAndSettleBookingPaymentAmount(params: {
  bookingRef: string;
  expectedBookingTotal: number;
  gatewayPaidAmount: number;
  gatewayName: string;
}): Promise<
  | { ok: true; totalConfirmedAmount: number; effectiveGatewayLabel: string; isSplit: boolean }
  | { ok: false; code: "amount_mismatch" | "wallet_split_failed"; message: string }
> {
  const split = getPendingWalletSplit(params.bookingRef);
  if (!split) {
    if (Math.abs(params.expectedBookingTotal - params.gatewayPaidAmount) > 0.05) {
      return {
        ok: false,
        code: "amount_mismatch",
        message: `Payment amount mismatch: expected ${params.expectedBookingTotal} SAR, received ${params.gatewayPaidAmount}.`,
      };
    }
    return {
      ok: true,
      totalConfirmedAmount: params.gatewayPaidAmount,
      effectiveGatewayLabel: params.gatewayName,
      isSplit: false,
    };
  }

  const expectedCombined = Math.round((split.walletAmount + params.gatewayPaidAmount) * 100) / 100;
  if (
    Math.abs(split.gatewayAmount - params.gatewayPaidAmount) > 0.05 ||
    Math.abs(params.expectedBookingTotal - expectedCombined) > 0.05
  ) {
    return {
      ok: false,
      code: "amount_mismatch",
      message: `Split payment amount mismatch: expected ${split.gatewayAmount} SAR via gateway (plus ${split.walletAmount} SAR wallet), received ${params.gatewayPaidAmount}.`,
    };
  }

  const settlement = await settlePendingWalletSplit(params.bookingRef);
  if (!settlement.settled) {
    return {
      ok: false,
      code: "wallet_split_failed",
      message: settlement.error || "Could not settle wallet portion of split payment.",
    };
  }

  return {
    ok: true,
    totalConfirmedAmount: params.expectedBookingTotal,
    effectiveGatewayLabel: `wallet+${params.gatewayName}`,
    isSplit: true,
  };
}

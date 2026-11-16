import {
  deleteCloudPendingSplit,
  loadCloudPendingSplit,
  loadWalletStore,
  saveCloudPendingSplit,
  saveWalletStore,
} from "./walletStore";
import { deductWalletForBooking, refundWalletForBooking } from "./walletOperations";
import type { PendingWalletSplit } from "./walletTypes";

export async function registerPendingWalletSplit(
  split: Omit<PendingWalletSplit, "settled" | "createdAt">
): Promise<PendingWalletSplit> {
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
  await saveCloudPendingSplit(record);
  return record;
}

export async function getPendingWalletSplit(bookingRef: string): Promise<PendingWalletSplit | null> {
  if (!bookingRef) return null;
  const local = loadWalletStore().pendingSplits?.[bookingRef];
  if (local) return local;
  const cloud = await loadCloudPendingSplit(bookingRef);
  if (cloud) {
    const store = loadWalletStore();
    store.pendingSplits = { ...(store.pendingSplits || {}), [bookingRef]: cloud };
    saveWalletStore(store);
  }
  return cloud;
}

export async function clearPendingWalletSplit(bookingRef: string): Promise<void> {
  if (!bookingRef) return;
  const store = loadWalletStore();
  const current = store.pendingSplits?.[bookingRef] || (await loadCloudPendingSplit(bookingRef));
  if (current && !current.settled) {
    if (store.pendingSplits?.[bookingRef]) {
      delete store.pendingSplits[bookingRef];
      saveWalletStore(store);
    }
    await deleteCloudPendingSplit(bookingRef);
  }
}

export async function settlePendingWalletSplit(
  bookingRef: string
): Promise<{
  settled: boolean;
  userId?: string;
  walletAmount: number;
  welcomeBonusUsed: number;
  error?: string;
}> {
  const split = await getPendingWalletSplit(bookingRef);
  if (!split) {
    return { settled: false, walletAmount: 0, welcomeBonusUsed: 0, error: "split_not_found" };
  }
  if (split.settled) {
    return {
      settled: true,
      userId: split.userId,
      walletAmount: split.walletAmount,
      welcomeBonusUsed: split.welcomeBonusAmount || 0,
    };
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

  const settledSplit: PendingWalletSplit = {
    ...split,
    settled: true,
    welcomeBonusAmount: deduct.welcomeBonusUsed,
  };
  const freshStore = loadWalletStore();
  freshStore.pendingSplits = { ...(freshStore.pendingSplits || {}), [bookingRef]: settledSplit };
  saveWalletStore(freshStore);
  await saveCloudPendingSplit(settledSplit);

  return {
    settled: true,
    userId: split.userId,
    walletAmount: split.walletAmount,
    welcomeBonusUsed: deduct.welcomeBonusUsed,
  };
}

export async function refundSettledWalletSplit(bookingRef: string, reason = "Reservation overlap / confirmation failed"): Promise<void> {
  const split = await getPendingWalletSplit(bookingRef);
  if (!split || !split.settled || !split.userId || split.walletAmount <= 0) return;

  await refundWalletForBooking({
    userId: split.userId,
    amount: split.walletAmount,
    welcomeBonusRestore: split.welcomeBonusAmount || 0,
    bookingRef,
    reason,
  });

  const store = loadWalletStore();
  if (store.pendingSplits?.[bookingRef]) {
    delete store.pendingSplits[bookingRef];
    saveWalletStore(store);
  }
  await deleteCloudPendingSplit(bookingRef);
}

/** Validates gateway collected amount against booking total or pending wallet+gateway split. */
export async function verifyAndSettleBookingPaymentAmount(params: {
  bookingRef: string;
  expectedBookingTotal: number;
  gatewayPaidAmount: number;
  gatewayName: string;
}): Promise<
  | {
      ok: true;
      totalConfirmedAmount: number;
      effectiveGatewayLabel: string;
      isSplit: boolean;
      splitDeducted?: { userId: string; walletAmount: number; welcomeBonusUsed: number };
    }
  | { ok: false; code: "amount_mismatch" | "wallet_split_failed"; message: string }
> {
  const split = await getPendingWalletSplit(params.bookingRef);
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
    splitDeducted: settlement.userId
      ? {
          userId: settlement.userId,
          walletAmount: settlement.walletAmount,
          welcomeBonusUsed: settlement.welcomeBonusUsed,
        }
      : undefined,
  };
}

/**
 * Server-Only Shared 24-Hour Host Payout & IBAN Store
 * Synchronizes host bank accounts, instant payout requests, and confirmed bookings
 * across Admin Operations Hub (:3003) and Host Business Portal (:3001).
 */

import {
  DEFAULT_HOST_PAYOUT_POLICY,
  getCheckoutUnlockTimestampMs,
  isPayoutPostCheckoutEligible,
  validateLegalTransactionNumber,
  type HostPayoutPolicy,
  type PayoutStatus,
  type SharedHostPayoutRecord,
} from "./hostPayoutConfig";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";
import { type PlatformFeeConfig } from "./platformFee";
import { resolveBookingSettlement } from "./bookingFinancialsStore";
import { findZatcaInvoiceRecord } from "./zatcaStore";
import { getServerPlatformFeeConfig } from "./platformFeeStore";

export * from "./hostPayoutConfig";

export interface StoredHostBankInfo {
  hostId: string;
  iban: string;
  formattedIban: string;
  bankNameEn: string;
  bankNameAr: string;
  accountHolder: string;
  isVerified: boolean;
  verifiedAt?: string;
  supplierCode?: number;
}

export interface HostPayoutStoreData {
  policy: HostPayoutPolicy;
  payouts: SharedHostPayoutRecord[];
  hostIbans: Record<string, StoredHostBankInfo>;
}

const PAYOUT_STORE_FILE = "host-payouts.json";

function buildInitialBaselinePayouts(): SharedHostPayoutRecord[] {
  return [];
}

function readStore(): HostPayoutStoreData {
  return readSharedJsonFile<HostPayoutStoreData>(
    PAYOUT_STORE_FILE,
    () => ({
      policy: { ...DEFAULT_HOST_PAYOUT_POLICY, updatedAt: new Date().toISOString() },
      payouts: buildInitialBaselinePayouts(),
      hostIbans: {},
    }),
    (parsed) => {
      const candidate = (parsed || {}) as Partial<HostPayoutStoreData>;
      return {
        policy: { ...DEFAULT_HOST_PAYOUT_POLICY, ...(candidate.policy || {}) },
        payouts: Array.isArray(candidate.payouts) ? candidate.payouts : buildInitialBaselinePayouts(),
        hostIbans: candidate.hostIbans && typeof candidate.hostIbans === "object" ? candidate.hostIbans : {},
      };
    }
  );
}

function writeStore(data: HostPayoutStoreData): void {
  writeSharedJsonFile(PAYOUT_STORE_FILE, data);
}

export function getHostPayoutPolicy(): HostPayoutPolicy {
  return readStore().policy;
}

export function updateHostPayoutPolicy(updates: Partial<HostPayoutPolicy>): HostPayoutPolicy {
  const store = readStore();
  store.policy = {
    ...store.policy,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
  return store.policy;
}

export function getSharedHostIban(hostId: string): StoredHostBankInfo | null {
  const store = readStore();
  return store.hostIbans[hostId] || null;
}

export function setSharedHostIban(hostId: string, info: Omit<StoredHostBankInfo, "hostId">): StoredHostBankInfo {
  const store = readStore();
  const full: StoredHostBankInfo = { hostId, ...info };
  store.hostIbans[hostId] = full;

  // Propagate verified IBAN onto any open non-disbursed payouts for that host
  store.payouts = store.payouts.map((p) => {
    if (p.hostId === hostId && p.status !== "disbursed") {
      return {
        ...p,
        iban: full.iban,
        bankName: `${full.bankNameEn} / ${full.bankNameAr}`,
        hostName: full.accountHolder || p.hostName,
      };
    }
    return p;
  });

  writeStore(store);
  return full;
}

export function getAllStoredPayouts(): SharedHostPayoutRecord[] {
  return readStore().payouts;
}

/**
 * Reconciles confirmed, paid Supabase bookings into persistent Host Payouts with 24h SLA deadlines.
 * Avoids duplicating bookings already present in the payout ledger.
 */
export interface SyncBookingInput {
  id: string;
  booking_reference?: string | null;
  total_price: number | string;
  promo_discount?: number | string | null;
  coupon_discount?: number | string | null;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  total_nights?: number | null;
  created_at: string;
  guest_name?: string | null;
  property?: {
    id?: string;
    title?: string;
    category?: string;
    price_per_night?: number | string | null;
    host_id?: string | null;
    host_name?: string | null;
    host_phone?: string | null;
  } | null;
}

function resolveSettlementForLiveBooking(
  b: SyncBookingInput,
  bookingRef: string,
  nights: number,
  feeConfig: PlatformFeeConfig
) {
  const zatcaRec = findZatcaInvoiceRecord({ bookingReference: bookingRef });
  return resolveBookingSettlement({
    bookingId: b.id,
    bookingReference: bookingRef,
    totalPricePaid: Number(b.total_price) || 0,
    nights,
    nightlyPrice: Number(b.property?.price_per_night || 0) || null,
    category: b.property?.category,
    promoDiscount: Number(b.promo_discount ?? b.coupon_discount ?? 0) || 0,
    feeConfig,
    zatcaTaxableAmount: zatcaRec?.taxableAmount ?? null,
    zatcaVatAmount: zatcaRec?.vatAmount ?? null,
  });
}

/**
 * Reconciles confirmed, paid Supabase bookings into persistent Host Payouts with 24h SLA deadlines.
 * Uses 4-party accounting:
 *  - ZATCA VAT (15%) goes 100% to government
 *  - Host payout = listingAmount - (listingAmount * hostCommission%) - promoDiscount
 *  - Welcome Bonus is borne 100% by platform
 */
export function syncConfirmedBookingsToPayouts(liveBookings: SyncBookingInput[]): SharedHostPayoutRecord[] {
  const store = readStore();
  const policy = store.policy;
  const feeConfig = getServerPlatformFeeConfig();

  const payoutsByBookingKey = new Map<string, SharedHostPayoutRecord>();
  for (const p of store.payouts) {
    if (p.bookingId) payoutsByBookingKey.set(p.bookingId, p);
    if (p.bookings) {
      for (const b of p.bookings) {
        if (b.id) payoutsByBookingKey.set(b.id, p);
        if (b.reference) payoutsByBookingKey.set(b.reference, p);
      }
    }
  }

  let changed = false;

  for (const b of liveBookings) {
    const isPaid =
      (b.status === "confirmed" || b.status === "completed") &&
      (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid");
    const grossPaid = Math.round((Number(b.total_price) || 0) * 100) / 100;
    if (!isPaid || grossPaid <= 0) continue;

    const bookingRef = b.booking_reference || b.id.slice(0, 8).toUpperCase();
    const nights =
      b.total_nights ||
      Math.max(1, Math.round((Date.parse(b.check_out) - Date.parse(b.check_in)) / 86_400_000) || 1);

    const existing = payoutsByBookingKey.get(b.id) || payoutsByBookingKey.get(bookingRef);
    const settlement = resolveSettlementForLiveBooking(b, bookingRef, nights, feeConfig);

    if (existing) {
      // Upgrade legacy payouts or keep financial breakdown aligned with snapshot
      const needsUpgrade =
        existing.settlementVersion !== 2 ||
        Math.abs(existing.grossAmount - settlement.hostGrossEntitlementSar) > 0.01 ||
        Math.abs(existing.netPayoutAmount - settlement.hostNetPayoutSar) > 0.01 ||
        Math.abs(existing.vatAmount - settlement.governmentVatRemittanceSar) > 0.01;

      // Upgrade legacy payouts or keep financial breakdown & checkout escrow metadata aligned with live booking
      const needsCheckoutSync =
        existing.status !== "disbursed" &&
        (existing.checkOutDate !== b.check_out ||
          existing.checkInDate !== b.check_in ||
          existing.bookingStatus !== b.status);

      if ((needsUpgrade || needsCheckoutSync) && existing.source !== "host_request") {
        if (needsUpgrade) {
          existing.grossAmount = settlement.hostGrossEntitlementSar;
          existing.commissionRate = settlement.hostCommissionPercent / 100;
          existing.commissionAmount = settlement.hostCommissionAmountSar;
          existing.vatAmount = settlement.governmentVatRemittanceSar;
          existing.netPayoutAmount = settlement.hostNetPayoutSar;
          existing.guestPaidTotal = settlement.guestTotalCollectedSar;
          existing.guestServiceFeeAmount = settlement.guestServiceFeeSar;
          existing.promoDiscountAmount = settlement.promoDeductionFromHostSar;
          existing.welcomeBonusSubsidyAmount = settlement.platformWelcomeBonusSubsidySar;
          existing.platformNetRevenue = settlement.platformNetRevenueSar;
          existing.settlementVersion = 2;
        }
        existing.checkInDate = b.check_in;
        existing.checkOutDate = b.check_out;
        existing.bookingStatus = b.status;
        if (Array.isArray(existing.bookings) && existing.bookings[0]) {
          existing.bookings[0].checkIn = b.check_in;
          existing.bookings[0].checkOut = b.check_out;
        }
        if (existing.status !== "disbursed") {
          const checkOutMs = getCheckoutUnlockTimestampMs(b.check_out);
          const earnedMs =
            policy.slaTrigger === "check_out" && checkOutMs !== null
              ? checkOutMs
              : policy.slaTrigger === "check_in" && b.check_in
              ? Date.parse(`${b.check_in.slice(0, 10)}T15:00:00+03:00`) || Date.now()
              : Date.parse(b.created_at || "") || Date.now();
          const deadlineIso = new Date(earnedMs + (policy.slaHours || 24) * 3600_000).toISOString();
          existing.earnedAt = new Date(earnedMs).toISOString();
          existing.slaDeadlineAt = deadlineIso;
          existing.scheduledDate = deadlineIso.slice(0, 10);
        }
        changed = true;
      }
      continue;
    }

    const hostId = b.property?.host_id || "";
    const hostBank = hostId ? store.hostIbans[hostId] : undefined;

    // Compute 24h SLA start time based on configured trigger (defaults to post check-out escrow release)
    const checkOutMs = getCheckoutUnlockTimestampMs(b.check_out);
    const earnedMs =
      policy.slaTrigger === "check_out" && checkOutMs !== null
        ? checkOutMs
        : policy.slaTrigger === "check_in" && b.check_in
        ? Date.parse(`${b.check_in.slice(0, 10)}T15:00:00+03:00`) || Date.now()
        : Date.parse(b.created_at || "") || Date.now();
    const deadlineIso = new Date(earnedMs + (policy.slaHours || 24) * 3600_000).toISOString();

    const record: SharedHostPayoutRecord = {
      id: `pay-bk-${b.id.slice(0, 8)}`,
      reference: `SARIE-${bookingRef}`,
      bookingId: b.id,
      hostId: hostId || "unassigned",
      hostName: hostBank?.accountHolder || b.property?.host_name || "—",
      hostPhone: b.property?.host_phone || "",
      propertyTitle: b.property?.title || "—",
      bankName: hostBank
        ? `${hostBank.bankNameEn} / ${hostBank.bankNameAr}`
        : "Not Configured",
      iban: hostBank?.iban || "",
      staysCount: 1,
      grossAmount: settlement.hostGrossEntitlementSar,
      commissionRate: settlement.hostCommissionPercent / 100,
      commissionAmount: settlement.hostCommissionAmountSar,
      vatAmount: settlement.governmentVatRemittanceSar,
      netPayoutAmount: settlement.hostNetPayoutSar,
      guestPaidTotal: settlement.guestTotalCollectedSar,
      guestServiceFeeAmount: settlement.guestServiceFeeSar,
      promoDiscountAmount: settlement.promoDeductionFromHostSar,
      welcomeBonusSubsidyAmount: settlement.platformWelcomeBonusSubsidySar,
      platformNetRevenue: settlement.platformNetRevenueSar,
      settlementVersion: 2,
      status: "pending",
      earnedAt: new Date(earnedMs).toISOString(),
      slaDeadlineAt: deadlineIso,
      scheduledDate: deadlineIso.slice(0, 10),
      payoutRail: policy.payoutRail,
      checkInDate: b.check_in,
      checkOutDate: b.check_out,
      bookingStatus: b.status,
      payoutRequestStatus: "none",
      bookings: [
        {
          id: b.id,
          reference: bookingRef,
          guestName: b.guest_name || "Guest Booking",
          checkIn: b.check_in,
          checkOut: b.check_out,
          nights,
          total: settlement.hostGrossEntitlementSar,
        },
      ],
      source: "booking",
      created_at: b.created_at || new Date().toISOString(),
    };

    store.payouts.unshift(record);
    payoutsByBookingKey.set(b.id, record);
    payoutsByBookingKey.set(bookingRef, record);
    changed = true;
  }

  if (changed) {
    writeStore(store);
  }
  return store.payouts;
}

export function upsertHostPayoutRequest(params: {
  id: string;
  reference: string;
  hostId: string;
  hostName: string;
  hostPhone?: string;
  iban: string;
  bankName: string;
  amount: number;
  propertyTitle?: string;
}): SharedHostPayoutRecord {
  const store = readStore();
  const feeConfig = getServerPlatformFeeConfig();
  const now = new Date();
  const deadline = new Date(now.getTime() + (store.policy.slaHours || 24) * 3600_000);
  const netAmount = Math.round(params.amount * 100) / 100;
  const commRate = feeConfig.baseCommissionPercent / 100;
  const grossAmount =
    commRate < 1
      ? Math.round((netAmount / (1 - commRate)) * 100) / 100
      : netAmount;
  const approxCommission = Math.round(Math.max(0, grossAmount - netAmount) * 100) / 100;
  const approxVat = 0;

  const newRecord: SharedHostPayoutRecord = {
    id: params.id,
    reference: params.reference,
    hostId: params.hostId,
    hostName: params.hostName,
    hostPhone: params.hostPhone || "",
    propertyTitle: params.propertyTitle || "Instant Payout Request / سحب رصيد مستحق",
    bankName: params.bankName,
    iban: params.iban,
    staysCount: 1,
    grossAmount,
    commissionRate: commRate,
    commissionAmount: approxCommission,
    vatAmount: approxVat,
    netPayoutAmount: netAmount,
    settlementVersion: 2,
    status: "pending",
    payoutRequestStatus: "requested",
    requestedAt: now.toISOString(),
    earnedAt: now.toISOString(),
    slaDeadlineAt: deadline.toISOString(),
    scheduledDate: deadline.toISOString().slice(0, 10),
    payoutRail: store.policy.payoutRail,
    source: "host_request",
    created_at: now.toISOString(),
  };

  store.payouts.unshift(newRecord);
  writeStore(store);
  return newRecord;
}

export function reviewHostPayoutRequest(
  payoutId: string,
  decision: "approved" | "rejected",
  actorEmail?: string,
  reason?: string
): SharedHostPayoutRecord | undefined {
  const store = readStore();
  let updatedItem: SharedHostPayoutRecord | undefined;
  const nowIso = new Date().toISOString();

  store.payouts = store.payouts.map((p) => {
    if (p.id !== payoutId) return p;
    if (p.status === "disbursed") {
      throw new Error("Disbursed payouts cannot be modified.");
    }
    if (decision === "approved") {
      const checkoutCheck = isPayoutPostCheckoutEligible(p);
      if (!checkoutCheck.eligible) {
        throw new Error(checkoutCheck.reasonEn);
      }
      updatedItem = {
        ...p,
        status: "processing",
        payoutRequestStatus: "approved",
        approvedAt: nowIso,
        approvedBy: actorEmail || "Admin Operations",
        holdReason: undefined,
        rejectionReason: undefined,
      };
    } else {
      updatedItem = {
        ...p,
        status: "on_hold",
        payoutRequestStatus: "rejected",
        rejectionReason: reason?.trim() || "Declined by Admin Operations",
        holdReason: reason?.trim() || "Payout request declined pending review",
      };
    }
    return updatedItem;
  });

  if (updatedItem) {
    writeStore(store);
  }
  return updatedItem;
}

export function updateStoredPayoutStatus(
  payoutId: string,
  newStatus: PayoutStatus,
  holdReason?: string,
  externalTxnRef?: string
): SharedHostPayoutRecord | undefined {
  const store = readStore();
  const target = store.payouts.find((p) => p.id === payoutId);
  if (!target) return undefined;

  let verifiedTxnRef = target.sarieTxnId;
  if (newStatus === "disbursed") {
    const checkoutCheck = isPayoutPostCheckoutEligible(target);
    if (!checkoutCheck.eligible) {
      throw new Error(checkoutCheck.reasonEn);
    }
    if (target.payoutRequestStatus === "rejected") {
      throw new Error("Declined payout requests cannot be settled without re-approval.");
    }
    const txnCheck = validateLegalTransactionNumber(externalTxnRef || target.sarieTxnId);
    if (!txnCheck.valid) {
      throw new Error(txnCheck.errorEn || "Legal Bank / SARIE Transaction Number is mandatory before settlement.");
    }
    verifiedTxnRef = txnCheck.cleaned;
  }

  let updatedItem: SharedHostPayoutRecord | undefined;
  const nowIso = new Date().toISOString();

  store.payouts = store.payouts.map((p) => {
    if (p.id === payoutId) {
      updatedItem = {
        ...p,
        status: newStatus,
        disbursedAt: newStatus === "disbursed" ? nowIso : p.disbursedAt,
        sarieTxnId: newStatus === "disbursed" ? verifiedTxnRef : p.sarieTxnId,
        payoutRequestStatus:
          newStatus === "disbursed" && p.payoutRequestStatus === "requested"
            ? "approved"
            : p.payoutRequestStatus,
        approvedAt:
          newStatus === "disbursed" && p.payoutRequestStatus === "requested" && !p.approvedAt
            ? nowIso
            : p.approvedAt,
        holdReason:
          newStatus === "on_hold"
            ? holdReason || p.holdReason || "Administrative hold pending audit"
            : undefined,
      };
      return updatedItem;
    }
    return p;
  });

  if (updatedItem) {
    writeStore(store);
  }
  return updatedItem;
}

export function batchUpdateStoredPayoutStatus(
  payoutIds: string[],
  newStatus: PayoutStatus,
  batchTxnRef?: string
): { updated: SharedHostPayoutRecord[]; skippedEscrowCount: number } {
  const store = readStore();
  const updatedList: SharedHostPayoutRecord[] = [];
  let skippedEscrowCount = 0;

  let verifiedBatchTxn = "";
  if (newStatus === "disbursed") {
    const txnCheck = validateLegalTransactionNumber(batchTxnRef);
    if (!txnCheck.valid) {
      throw new Error(
        txnCheck.errorEn || "Legal Batch / SARIE Transaction Number is mandatory for batch settlement."
      );
    }
    verifiedBatchTxn = txnCheck.cleaned;
  }

  const nowIso = new Date().toISOString();

  store.payouts = store.payouts.map((p) => {
    if (payoutIds.includes(p.id)) {
      if (newStatus === "disbursed") {
        const checkoutCheck = isPayoutPostCheckoutEligible(p);
        if (!checkoutCheck.eligible || p.payoutRequestStatus === "rejected") {
          skippedEscrowCount++;
          return p;
        }
      }
      const next: SharedHostPayoutRecord = {
        ...p,
        status: newStatus,
        disbursedAt: newStatus === "disbursed" ? nowIso : p.disbursedAt,
        sarieTxnId:
          newStatus === "disbursed" ? p.sarieTxnId || verifiedBatchTxn : p.sarieTxnId,
        payoutRequestStatus:
          newStatus === "disbursed" && p.payoutRequestStatus === "requested"
            ? "approved"
            : p.payoutRequestStatus,
      };
      updatedList.push(next);
      return next;
    }
    return p;
  });

  if (newStatus === "disbursed" && updatedList.length === 0 && skippedEscrowCount > 0) {
    throw new Error(
      `Escrow Lock Active: All ${skippedEscrowCount} selected payout(s) are waiting for guest check-out before disbursement.`
    );
  }

  if (updatedList.length > 0) {
    writeStore(store);
  }
  return { updated: updatedList, skippedEscrowCount };
}

export function processStoredSarieBatch(batchTxnRef?: string) {
  const txnCheck = validateLegalTransactionNumber(batchTxnRef);
  if (!txnCheck.valid) {
    throw new Error(
      txnCheck.errorEn || "Legal Batch / SARIE Transaction Number is mandatory before settling payouts."
    );
  }

  const store = readStore();
  const settledIds: string[] = [];
  let skippedEscrowCount = 0;
  const nowIso = new Date().toISOString();

  store.payouts = store.payouts.map((p) => {
    if (p.status === "pending" || p.status === "processing") {
      const checkoutCheck = isPayoutPostCheckoutEligible(p);
      if (!checkoutCheck.eligible || p.payoutRequestStatus === "rejected") {
        skippedEscrowCount++;
        return p;
      }
      settledIds.push(p.id);
      return {
        ...p,
        status: "disbursed" as const,
        disbursedAt: nowIso,
        sarieTxnId: p.sarieTxnId || txnCheck.cleaned,
        payoutRequestStatus:
          p.payoutRequestStatus === "requested" ? "approved" : p.payoutRequestStatus,
      };
    }
    return p;
  });

  if (settledIds.length === 0 && skippedEscrowCount > 0) {
    throw new Error(
      `Escrow Lock Active: ${skippedEscrowCount} queued payout(s) cannot be settled until guests complete check-out.`
    );
  }

  if (settledIds.length > 0) {
    writeStore(store);
  }

  return {
    settledCount: settledIds.length,
    settledIds,
    skippedEscrowCount,
    transactionNumber: txnCheck.cleaned,
    timestamp: nowIso,
  };
}

export function recordPayoutReminderSent(payoutIds: string[]): SharedHostPayoutRecord[] {
  const store = readStore();
  const nowIso = new Date().toISOString();
  const targetSet = new Set(payoutIds);
  const updated: SharedHostPayoutRecord[] = [];

  store.payouts = store.payouts.map((p) => {
    if (targetSet.has(p.id)) {
      const next: SharedHostPayoutRecord = {
        ...p,
        remindedAt: nowIso,
        reminderCount: (p.reminderCount || 0) + 1,
      };
      updated.push(next);
      return next;
    }
    return p;
  });

  if (updated.length > 0) {
    writeStore(store);
  }
  return updated;
}

export function voidCancelledBookingPayout(bookingRef: string, refundPercent: number): boolean {
  const store = readStore();
  let changed = false;
  const refClean = bookingRef.trim().toUpperCase();

  store.payouts = store.payouts.map((p) => {
    const pRef = String(p.reference || "").toUpperCase();
    const hasBooking = pRef.includes(refClean) || (p.bookings && p.bookings.some((b) => String(b.reference || "").toUpperCase() === refClean));
    if (hasBooking) {
      if (p.status !== "disbursed") {
        changed = true;
        if (refundPercent >= 100) {
          return {
            ...p,
            status: "on_hold" as const,
            netPayoutAmount: 0,
            vatAmount: 0,
            commissionAmount: 0,
            holdReason: "Booking Cancelled (100% Refund)",
            remindedAt: new Date().toISOString(),
          };
        } else {
          // Partial refund: scale down remaining host net
          const hostMultiplier = Math.max(0, (100 - refundPercent) / 100);
          return {
            ...p,
            status: "on_hold" as const,
            netPayoutAmount: Math.round(p.netPayoutAmount * hostMultiplier),
            holdReason: `Booking Cancelled (${refundPercent}% Refund)`,
            remindedAt: new Date().toISOString(),
          };
        }
      }
    }
    return p;
  });

  if (changed) {
    writeStore(store);
  }
  return changed;
}


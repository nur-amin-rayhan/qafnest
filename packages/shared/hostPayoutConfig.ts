/**
 * QafNest 24-Hour Host Payout SLA & Settlement Specifications
 * Browser-safe types, constants, and pure SLA countdown helpers.
 */

export type PayoutRailMode = "sarie_bank" | "myfatoorah_split";
export type PayoutSlaTrigger = "payment_confirmed" | "check_in" | "check_out";
export type PayoutStatus = "disbursed" | "pending" | "processing" | "on_hold";
export type PayoutSlaTier = "overdue" | "urgent" | "on_track" | "on_hold" | "disbursed" | "escrow";
export type HostPayoutRequestStatus = "none" | "requested" | "approved" | "rejected";

export interface HostPayoutPolicy {
  payoutRail: PayoutRailMode;
  slaHours: number; // Default 24
  slaTrigger: PayoutSlaTrigger;
  reminderLeadHours: number; // Default 6 (alerts admin when <6h remaining)
  autoNotifyHostOnDisburse: boolean;
  updatedAt?: string;
}

export const DEFAULT_HOST_PAYOUT_POLICY: HostPayoutPolicy = {
  payoutRail: "sarie_bank",
  slaHours: 24,
  slaTrigger: "check_out",
  reminderLeadHours: 6,
  autoNotifyHostOnDisburse: true,
};

export interface PayoutBookingItem {
  id: string;
  reference: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
}

export interface SharedHostPayoutRecord {
  id: string;
  reference: string;
  bookingId?: string;
  hostId: string;
  hostName: string;
  hostPhone: string;
  hostEmail?: string;
  propertyTitle: string;
  bankName: string;
  iban: string;
  staysCount: number;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  vatAmount: number;
  netPayoutAmount: number;
  guestPaidTotal?: number;
  guestServiceFeeAmount?: number;
  promoDiscountAmount?: number;
  welcomeBonusSubsidyAmount?: number;
  platformNetRevenue?: number;
  settlementVersion?: number;
  status: PayoutStatus;
  earnedAt: string; // ISO timestamp when 24h SLA starts
  slaDeadlineAt: string; // ISO timestamp (earnedAt + 24h)
  scheduledDate: string;
  disbursedAt?: string;
  sarieTxnId?: string;
  supplierCode?: number;
  payoutRail?: PayoutRailMode;
  holdReason?: string;
  remindedAt?: string;
  reminderCount?: number;
  bookings?: PayoutBookingItem[];
  source?: "booking" | "host_request" | "ledger";
  checkInDate?: string;
  checkOutDate?: string;
  bookingStatus?: string;
  payoutRequestStatus?: HostPayoutRequestStatus;
  requestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  created_at: string;
}

export interface LegalTxnValidationResult {
  valid: boolean;
  cleaned: string;
  errorEn?: string;
  errorAr?: string;
}

const DISALLOWED_TXN_PLACEHOLDERS = new Set([
  "test",
  "testing",
  "none",
  "null",
  "undefined",
  "na",
  "n/a",
  "temp",
  "sample",
  "123456",
  "000000",
]);

/**
 * Validates that an admin-entered bank / SAMA SARIE receipt transaction number
 * is real and properly formatted before allowing settlement.
 */
export function validateLegalTransactionNumber(rawRef?: string | null): LegalTxnValidationResult {
  const cleaned = String(rawRef || "").trim();
  if (!cleaned) {
    return {
      valid: false,
      cleaned: "",
      errorEn: "Legal Bank / SARIE Transaction Number is required before settlement.",
      errorAr: "رقم العملية البنكية / سريع القانوني إلزامي قبل إتمام التسوية.",
    };
  }
  if (cleaned.length < 6 || cleaned.length > 64) {
    return {
      valid: false,
      cleaned,
      errorEn: "Transaction Number must be between 6 and 64 characters.",
      errorAr: "يجب أن يتراوح رقم العملية البنكية بين 6 و 64 خانة.",
    };
  }
  if (DISALLOWED_TXN_PLACEHOLDERS.has(cleaned.toLowerCase())) {
    return {
      valid: false,
      cleaned,
      errorEn: "Please enter a valid bank receipt or SARIE transaction reference.",
      errorAr: "يرجى إدخال رقم مرجعي صحيح من إيصال التحويل البنكي / سريع.",
    };
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9\-_\/.]{4,62}[A-Za-z0-9]$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      errorEn: "Use letters, numbers, '-', '_', '/' or '.' without spaces.",
      errorAr: "يرجى استخدام أحرف وأرقام أو (- / _ .) بدون مسافات.",
    };
  }
  if (!/\d{2,}/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      errorEn: "Transaction Number must include the receipt reference digits.",
      errorAr: "يجب أن يتضمن رقم العملية أرقام المرجع البنكي.",
    };
  }
  return { valid: true, cleaned };
}

export interface PayoutCheckoutEligibility {
  eligible: boolean;
  unlocksAtIso?: string;
  checkOutDate?: string;
  remainingMs: number;
  reasonEn: string;
  reasonAr: string;
}

/**
 * Parses a stay check-out date (YYYY-MM-DD or ISO) into standard Saudi checkout timestamp
 * (12:00 PM Asia/Riyadh = UTC+3 on check-out day).
 */
export function getCheckoutUnlockTimestampMs(checkOutRaw?: string | null): number | null {
  if (!checkOutRaw) return null;
  const trimmed = String(checkOutRaw).trim();
  if (!trimmed) return null;
  const dateOnly = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const ms = Date.parse(`${dateOnly}T12:00:00+03:00`);
    return Number.isFinite(ms) ? ms : null;
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Enforces post-checkout escrow protection:
 * Host funds remain locked until guest check-in & check-out day finishes (12:00 PM Riyadh)
 * or booking status is explicitly "completed" / "checked_out".
 */
export function isPayoutPostCheckoutEligible(
  payout: Pick<
    SharedHostPayoutRecord,
    "source" | "bookings" | "checkOutDate" | "bookingStatus"
  >,
  nowMs: number = Date.now()
): PayoutCheckoutEligibility {
  const statusLower = String(payout.bookingStatus || "").toLowerCase();
  if (statusLower === "completed" || statusLower === "checked_out") {
    return {
      eligible: true,
      checkOutDate: payout.checkOutDate?.slice(0, 10),
      remainingMs: 0,
      reasonEn: "Guest check-out completed. Eligible for settlement.",
      reasonAr: "تم تسجيل مغادرة الضيف. المستحق متاح للتسوية.",
    };
  }

  let latestUnlockMs: number | null = null;
  let latestDateStr: string | undefined;

  if (Array.isArray(payout.bookings) && payout.bookings.length > 0) {
    for (const bk of payout.bookings) {
      const ms = getCheckoutUnlockTimestampMs(bk.checkOut);
      if (ms !== null && (latestUnlockMs === null || ms > latestUnlockMs)) {
        latestUnlockMs = ms;
        latestDateStr = String(bk.checkOut).slice(0, 10);
      }
    }
  }

  if (latestUnlockMs === null && payout.checkOutDate) {
    latestUnlockMs = getCheckoutUnlockTimestampMs(payout.checkOutDate);
    latestDateStr = String(payout.checkOutDate).slice(0, 10);
  }

  if (latestUnlockMs === null) {
    // Explicit host withdrawal requests were already verified against unlocked post-checkout ledger
    if (payout.source === "host_request") {
      return {
        eligible: true,
        remainingMs: 0,
        reasonEn: "Post-checkout host withdrawal request verified.",
        reasonAr: "تم التحقق من استحقاق طلب السحب بعد المغادرة.",
      };
    }
    return {
      eligible: false,
      remainingMs: 0,
      reasonEn: "Escrowed: Check-out date verification pending.",
      reasonAr: "محجوز بالضمان: بانتظار التحقق من تاريخ مغادرة الضيف.",
    };
  }

  if (nowMs >= latestUnlockMs) {
    return {
      eligible: true,
      unlocksAtIso: new Date(latestUnlockMs).toISOString(),
      checkOutDate: latestDateStr,
      remainingMs: 0,
      reasonEn: `Guest check-out (${latestDateStr}) completed. Eligible for payout.`,
      reasonAr: `اكتملت مغادرة الضيف (${latestDateStr}). الدفعة مؤهلة للصرف.`,
    };
  }

  return {
    eligible: false,
    unlocksAtIso: new Date(latestUnlockMs).toISOString(),
    checkOutDate: latestDateStr,
    remainingMs: Math.max(0, latestUnlockMs - nowMs),
    reasonEn: `Escrow Lock: Releases after guest check-out on ${latestDateStr} (12:00 PM KSA).`,
    reasonAr: `محجوز بالضمان: يُتاح للصرف بعد مغادرة الضيف يوم ${latestDateStr} (١٢:٠٠ ظهراً).`,
  };
}

export interface PayoutSlaMetrics {
  tier: PayoutSlaTier;
  remainingMs: number;
  elapsedMs: number;
  isOverdue: boolean;
  isUrgent: boolean;
  countdownLabel: string;
  countdownLabelAr: string;
  progressPercent: number; // 0..100+ elapsed of 24h
  settledWithinSla?: boolean;
  settlementDurationLabel?: string;
}

function formatDurationHm(ms: number): { h: number; m: number; s: number } {
  const abs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return { h, m, s };
}

export function computePayoutSlaMetrics(
  payout: Pick<
    SharedHostPayoutRecord,
    | "status"
    | "earnedAt"
    | "slaDeadlineAt"
    | "disbursedAt"
    | "created_at"
    | "source"
    | "bookings"
    | "checkOutDate"
    | "bookingStatus"
  >,
  nowMs: number = Date.now(),
  urgentLeadHours: number = 6
): PayoutSlaMetrics {
  const earnedMs = Date.parse(payout.earnedAt || payout.created_at) || nowMs - 3600_000;
  const deadlineMs = Date.parse(payout.slaDeadlineAt) || earnedMs + 24 * 3600_000;
  const totalSlaMs = Math.max(3600_000, deadlineMs - earnedMs);

  if (payout.status === "disbursed") {
    const settledMs = (payout.disbursedAt ? Date.parse(payout.disbursedAt) : nowMs) || nowMs;
    const durationMs = Math.max(0, settledMs - earnedMs);
    const { h, m } = formatDurationHm(durationMs);
    const withinSla = settledMs <= deadlineMs;
    return {
      tier: "disbursed",
      remainingMs: 0,
      elapsedMs: durationMs,
      isOverdue: false,
      isUrgent: false,
      countdownLabel: withinSla ? `Paid in ${h}h ${m}m` : `Paid late (${h}h ${m}m)`,
      countdownLabelAr: withinSla ? `تم التحويل خلال ${h}س ${m}د` : `تحويل متأخر (${h}س ${m}د)`,
      progressPercent: 100,
      settledWithinSla: withinSla,
      settlementDurationLabel: `${h}h ${m}m`,
    };
  }

  if (payout.status === "on_hold") {
    const elapsedMs = Math.max(0, nowMs - earnedMs);
    return {
      tier: "on_hold",
      remainingMs: deadlineMs - nowMs,
      elapsedMs,
      isOverdue: false,
      isUrgent: false,
      countdownLabel: "Paused (On Hold)",
      countdownLabelAr: "معلق مؤقتاً",
      progressPercent: Math.min(100, Math.round((elapsedMs / totalSlaMs) * 100)),
    };
  }

  const checkoutGate = isPayoutPostCheckoutEligible(payout, nowMs);
  if (!checkoutGate.eligible) {
    return {
      tier: "escrow",
      remainingMs: checkoutGate.remainingMs,
      elapsedMs: 0,
      isOverdue: false,
      isUrgent: false,
      countdownLabel: checkoutGate.checkOutDate
        ? `Escrow · Out ${checkoutGate.checkOutDate}`
        : "Escrowed (Until Check-Out)",
      countdownLabelAr: checkoutGate.checkOutDate
        ? `بالضمان · مغادرة ${checkoutGate.checkOutDate}`
        : "محجوز بالضمان حتى المغادرة",
      progressPercent: 0,
    };
  }

  const remainingMs = deadlineMs - nowMs;
  const elapsedMs = Math.max(0, nowMs - earnedMs);
  const progressPercent = Math.min(150, Math.max(0, Math.round((elapsedMs / totalSlaMs) * 100)));

  if (remainingMs <= 0) {
    const overdue = formatDurationHm(Math.abs(remainingMs));
    return {
      tier: "overdue",
      remainingMs,
      elapsedMs,
      isOverdue: true,
      isUrgent: true,
      countdownLabel: `Overdue ${overdue.h}h ${overdue.m}m`,
      countdownLabelAr: `متأخر ${overdue.h}س ${overdue.m}د`,
      progressPercent: 100,
    };
  }

  const rem = formatDurationHm(remainingMs);
  const isUrgent = remainingMs <= urgentLeadHours * 3600_000;

  return {
    tier: isUrgent ? "urgent" : "on_track",
    remainingMs,
    elapsedMs,
    isOverdue: false,
    isUrgent,
    countdownLabel: `${rem.h}h ${rem.m}m left`,
    countdownLabelAr: `متبقي ${rem.h}س ${rem.m}د`,
    progressPercent,
  };
}

export interface PayoutReminderSummary {
  slaHours: number;
  overdueCount: number;
  overdueAmountSar: number;
  urgentCount: number;
  urgentAmountSar: number;
  onTrackCount: number;
  onTrackAmountSar: number;
  escrowCount: number;
  escrowAmountSar: number;
  dueWithin24hCount: number;
  dueWithin24hAmountSar: number;
  onHoldCount: number;
  disbursedWithinSlaCount: number;
  disbursedTotalCount: number;
  slaComplianceRate: number;
}

export function summarizePayoutReminders(
  payouts: SharedHostPayoutRecord[],
  nowMs: number = Date.now(),
  policy: HostPayoutPolicy = DEFAULT_HOST_PAYOUT_POLICY
): PayoutReminderSummary {
  let overdueCount = 0;
  let overdueAmountSar = 0;
  let urgentCount = 0;
  let urgentAmountSar = 0;
  let onTrackCount = 0;
  let onTrackAmountSar = 0;
  let escrowCount = 0;
  let escrowAmountSar = 0;
  let onHoldCount = 0;
  let disbursedWithinSlaCount = 0;
  let disbursedTotalCount = 0;

  for (const p of payouts) {
    const m = computePayoutSlaMetrics(p, nowMs, policy.reminderLeadHours);
    if (m.tier === "overdue") {
      overdueCount++;
      overdueAmountSar += p.netPayoutAmount;
    } else if (m.tier === "urgent") {
      urgentCount++;
      urgentAmountSar += p.netPayoutAmount;
    } else if (m.tier === "on_track") {
      onTrackCount++;
      onTrackAmountSar += p.netPayoutAmount;
    } else if (m.tier === "escrow") {
      escrowCount++;
      escrowAmountSar += p.netPayoutAmount;
    } else if (m.tier === "on_hold") {
      onHoldCount++;
    } else if (m.tier === "disbursed") {
      disbursedTotalCount++;
      if (m.settledWithinSla !== false) {
        disbursedWithinSlaCount++;
      }
    }
  }

  const dueWithin24hCount = overdueCount + urgentCount + onTrackCount;
  const dueWithin24hAmountSar =
    Math.round((overdueAmountSar + urgentAmountSar + onTrackAmountSar) * 100) / 100;

  const totalEvaluated = disbursedTotalCount + overdueCount;
  const slaComplianceRate =
    totalEvaluated > 0 ? Math.round((disbursedWithinSlaCount / totalEvaluated) * 100) : 100;

  return {
    slaHours: policy.slaHours,
    overdueCount,
    overdueAmountSar: Math.round(overdueAmountSar * 100) / 100,
    urgentCount,
    urgentAmountSar: Math.round(urgentAmountSar * 100) / 100,
    onTrackCount,
    onTrackAmountSar: Math.round(onTrackAmountSar * 100) / 100,
    escrowCount,
    escrowAmountSar: Math.round(escrowAmountSar * 100) / 100,
    dueWithin24hCount,
    dueWithin24hAmountSar,
    onHoldCount,
    disbursedWithinSlaCount,
    disbursedTotalCount,
    slaComplianceRate,
  };
}

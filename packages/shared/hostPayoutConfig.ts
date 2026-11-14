/**
 * QafNest 24-Hour Host Payout SLA & Settlement Specifications
 * Browser-safe types, constants, and pure SLA countdown helpers.
 */

export type PayoutRailMode = "sarie_bank" | "myfatoorah_split";
export type PayoutSlaTrigger = "payment_confirmed" | "check_in";
export type PayoutStatus = "disbursed" | "pending" | "processing" | "on_hold";
export type PayoutSlaTier = "overdue" | "urgent" | "on_track" | "on_hold" | "disbursed";

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
  slaTrigger: "payment_confirmed",
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
  created_at: string;
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
  payout: Pick<SharedHostPayoutRecord, "status" | "earnedAt" | "slaDeadlineAt" | "disbursedAt" | "created_at">,
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
    dueWithin24hCount,
    dueWithin24hAmountSar,
    onHoldCount,
    disbursedWithinSlaCount,
    disbursedTotalCount,
    slaComplianceRate,
  };
}

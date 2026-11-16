import fs from "fs";
import path from "path";
import { createAdminDataClient } from "@/lib/adminApi";
import { getServerPlatformFeeConfig, hydratePlatformFeeConfig } from "@qafnest/shared/platformFeeStore";
import { hydrateBookingFinancialsStore, resolveBookingSettlement } from "@qafnest/shared/bookingFinancialsStore";
import {
  getAllStoredPayouts,
  getHostPayoutPolicy,
  getSharedHostIban,
  hydrateHostPayoutStore,
  updateHostPayoutPolicy,
  syncConfirmedBookingsToPayouts,
  reviewHostPayoutRequest,
  updateStoredPayoutStatus,
  batchUpdateStoredPayoutStatus,
  processStoredSarieBatch,
  recordPayoutReminderSent,
  summarizePayoutReminders,
  type HostPayoutPolicy,
  type PayoutBookingItem,
  type PayoutStatus,
  type SharedHostPayoutRecord,
} from "@qafnest/shared/hostPayoutStore";

export type AdminPayoutRecord = SharedHostPayoutRecord;
export type { PayoutBookingItem, PayoutStatus, HostPayoutPolicy };

export interface AdminHostPropertyBreakdown {
  propertyId: string;
  propertyTitle: string;
  category: string;
  status: string;
  basePrice: number;
  bookingsCount: number;
  grossListingSar: number;
  hostCommissionSar: number;
  promoDiscountSar: number;
  hostNetEarningsSar: number;
  paidOutSar: number;
  dueSar: number;
}

export interface AdminHostTransactionItem {
  bookingId: string;
  bookingReference: string;
  propertyId: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestName: string;
  guestPaidTotalSar: number;
  guestServiceFeeSar: number;
  govZatcaVatSar: number;
  listingGrossSar: number;
  hostCommissionSar: number;
  promoDiscountSar: number;
  welcomeBonusSubsidySar: number;
  hostNetPayoutSar: number;
  platformNetRevenueSar: number;
  payoutId: string;
  payoutStatus: PayoutStatus;
  sarieTxnId?: string;
  createdAt: string;
}

export interface AdminHostLedger {
  hostId: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  joinedAt: string;
  iban: string;
  bankName: string;
  propertiesCount: number;
  bookingsCount: number;
  guestPaidTotal: number;
  grossListingEarnings: number;
  hostCommissionTotal: number;
  promoDiscountTotal: number;
  hostNetEarnings: number;
  totalPaidOut: number;
  pendingDueAmount: number;
  onHoldAmount: number;
  vatCollectedOnHostStays: number;
  platformNetFromHost: number;
  properties: AdminHostPropertyBreakdown[];
  transactions: AdminHostTransactionItem[];
  payouts: AdminPayoutRecord[];
}

export async function getAdminFinancialData() {
  await Promise.all([
    hydrateHostPayoutStore(),
    hydratePlatformFeeConfig(),
    hydrateBookingFinancialsStore(),
  ]);
  const supabase = createAdminDataClient();
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  let liveGrossVolume = 0;
  let payouts = getAllStoredPayouts();
  let allProperties: Array<{
    id: string;
    title: string;
    category?: string;
    status?: string;
    is_approved?: boolean;
    base_price?: number | null;
    host_id?: string | null;
    created_at?: string;
  }> = [];
  let confirmedBookings: any[] = [];
  const authHostMeta = new Map<
    string,
    { name?: string; email?: string; phone?: string; createdAt?: string }
  >();
  const profileMap = new Map<string, { full_name?: string; phone?: string }>();

  if (supabase) {
    try {
      const [bookingsRes, propertiesRes, authUsersRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, booking_reference, total_price, status, payment_status, check_in, check_out, total_nights, created_at, guest_id, auth_subject, property_id, properties(id, title, category, host_id, base_price)"
          )
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("properties")
          .select("id, title, category, status, is_approved, base_price, host_id, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.auth.admin.listUsers({ page: 1, perPage: 200 }).catch(() => ({ data: { users: [] } })),
      ]);

      if (bookingsRes.error) {
        console.warn("[adminFinancialsService] bookings query error:", bookingsRes.error.message);
      }
      if (!propertiesRes.error && propertiesRes.data) {
        allProperties = propertiesRes.data as typeof allProperties;
      }

      const authUsers = (authUsersRes as any)?.data?.users || [];
      for (const u of authUsers) {
        const uMeta = (u.user_metadata || {}) as Record<string, unknown>;
        const aMeta = (u.app_metadata || {}) as Record<string, unknown>;
        const role = String(uMeta.role || aMeta.role || "").toLowerCase();
        const emailLower = String(u.email || "").toLowerCase();
        if (role === "host" || emailLower === "host.dev@qafnest.com") {
          authHostMeta.set(u.id, {
            name: String(uMeta.full_name || uMeta.business_name || uMeta.name || ""),
            email: u.email || "",
            phone: u.phone || String(uMeta.phone || ""),
            createdAt: u.created_at || "",
          });
        }
      }

      const bookings = bookingsRes.data || [];
      if (bookings.length > 0) {
        confirmedBookings = bookings.filter(
          (b: any) =>
            (b.status === "confirmed" || b.status === "completed") &&
            (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid")
        );

        liveGrossVolume = confirmedBookings.reduce(
          (sum: number, b: any) => sum + (Number(b.total_price) || 0),
          0
        );
      }

      const profileIds = Array.from(
        new Set([
          ...Array.from(authHostMeta.keys()),
          ...allProperties.map((p) => p.host_id).filter(Boolean),
          ...confirmedBookings.map((b: any) => b.guest_id).filter(Boolean),
          ...payouts.map((p) => p.hostId).filter(Boolean),
        ])
      ) as string[];

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", profileIds);
        for (const prof of profiles || []) {
          profileMap.set(prof.id, prof);
        }
      }

      if (confirmedBookings.length > 0) {
        const mapped = confirmedBookings.map((b: any) => {
          const prop = Array.isArray(b.properties) ? b.properties[0] : b.properties;
          const guestProf = b.guest_id ? profileMap.get(b.guest_id) : undefined;
          const hostProf = prop?.host_id ? profileMap.get(prop.host_id) : undefined;
          const authHost = prop?.host_id ? authHostMeta.get(prop.host_id) : undefined;
          return {
            id: b.id,
            booking_reference: b.booking_reference,
            total_price: b.total_price,
            status: b.status,
            payment_status: b.payment_status,
            check_in: b.check_in,
            check_out: b.check_out,
            total_nights: b.total_nights,
            created_at: b.created_at,
            guest_name: guestProf?.full_name || b.auth_subject || "",
            property: prop
              ? {
                  ...prop,
                  price_per_night: prop.base_price,
                  host_name: hostProf?.full_name || authHost?.name || "",
                  host_phone: hostProf?.phone || authHost?.phone || "",
                }
              : null,
          };
        });

        payouts = syncConfirmedBookingsToPayouts(mapped);
      }
    } catch (err) {
      console.warn("[adminFinancialsService] booking sync fallback:", err);
    }
  }

  const feeCfg = getServerPlatformFeeConfig();
  const bookingPayouts = payouts.filter((p) => p.source !== "host_request");
  const payoutGrossSum = bookingPayouts.reduce((sum, p) => sum + p.grossAmount, 0);
  if (liveGrossVolume === 0) {
    liveGrossVolume = payoutGrossSum;
  }

  const commissionRatePct = feeCfg.baseCommissionPercent;
  const vatRatePct = feeCfg.vatRatePercent;
  const fallbackSettlement =
    bookingPayouts.length === 0 && liveGrossVolume > 0
      ? resolveBookingSettlement({
          bookingId: "live-gross-fallback",
          totalPricePaid: liveGrossVolume,
          feeConfig: feeCfg,
        })
      : null;
  const platformCommissionTotal =
    bookingPayouts.length > 0
      ? Math.round(
          bookingPayouts.reduce(
            (sum, p) =>
              sum +
              (p.platformNetRevenue !== undefined
                ? Number(p.platformNetRevenue)
                : (Number(p.commissionAmount) || 0) +
                  (Number(p.guestServiceFeeAmount) || 0) -
                  (Number(p.welcomeBonusSubsidyAmount) || 0)),
            0
          ) * 100
        ) / 100
      : fallbackSettlement?.platformNetRevenueSar ?? 0;
  const vatCollectedTotal =
    bookingPayouts.length > 0
      ? Math.round(bookingPayouts.reduce((sum, p) => sum + (Number(p.vatAmount) || 0), 0) * 100) / 100
      : fallbackSettlement?.governmentVatRemittanceSar ?? 0;

function computeDeduplicatedDisbursedTotal(records: SharedHostPayoutRecord[]): number {
  const disbursedBookingIds = new Set<string>();
  let bookingSum = 0;
  for (const p of records) {
    if (p.status !== "disbursed" || p.source === "host_request") continue;
    const key = p.bookingId || p.id;
    if (disbursedBookingIds.has(key)) continue;
    disbursedBookingIds.add(key);
    for (const bk of p.bookings || []) {
      if (bk.id) disbursedBookingIds.add(bk.id);
    }
    bookingSum += Number(p.netPayoutAmount) || 0;
  }

  let requestSum = 0;
  for (const p of records) {
    if (p.status !== "disbursed" || p.source !== "host_request") continue;
    const coveredByBookingRow =
      (p.bookingId && disbursedBookingIds.has(p.bookingId)) ||
      ((p.bookings || []).length > 0 &&
        (p.bookings || []).every((bk) => bk.id && disbursedBookingIds.has(bk.id)));
    if (coveredByBookingRow) continue;
    requestSum += Number(p.netPayoutAmount) || 0;
  }

  return Math.round((bookingSum + requestSum) * 100) / 100;
}

  const disbursedTotal = computeDeduplicatedDisbursedTotal(payouts);
  const pendingTotal =
    Math.round(
      payouts
        .filter((p) => p.status === "pending" || p.status === "processing")
        .reduce((sum, p) => sum + p.netPayoutAmount, 0) * 100
    ) / 100;

  const policy = getHostPayoutPolicy();
  const reminders = summarizePayoutReminders(payouts, Date.now(), policy);

  // Build automatic Host-Wise Ledgers across all registered/property/payout hosts
  const propById = new Map(allProperties.map((p) => [p.id, p]));
  const allHostIds = new Set<string>([
    ...Array.from(authHostMeta.keys()),
    ...allProperties.map((p) => p.host_id).filter((x): x is string => Boolean(x)),
    ...payouts.map((p) => p.hostId).filter(Boolean),
  ]);

  const payoutByBookingId = new Map<string, AdminPayoutRecord>();
  for (const p of payouts) {
    if (p.bookingId) payoutByBookingId.set(p.bookingId, p);
    for (const bk of p.bookings || []) {
      if (bk.id && !payoutByBookingId.has(bk.id)) {
        payoutByBookingId.set(bk.id, p);
      }
    }
  }

  const hostLedgers: AdminHostLedger[] = Array.from(allHostIds).map((hostId) => {
    const authInfo = authHostMeta.get(hostId);
    const profInfo = profileMap.get(hostId);
    const sharedIban = getSharedHostIban(hostId);
    const hostPayouts = payouts.filter((p) => p.hostId === hostId);
    const hostProps = allProperties.filter((p) => p.host_id === hostId);

    const firstPayoutWithMeta = hostPayouts.find(
      (p) => (p.hostName && p.hostName !== "—") || p.hostPhone
    );

    const hostName =
      profInfo?.full_name ||
      authInfo?.name ||
      firstPayoutWithMeta?.hostName ||
      (hostId === "00000000-0000-0000-0000-000000000002"
        ? "Dev Host Partner"
        : `Host ${hostId.slice(0, 8)}`);
    const hostEmail =
      authInfo?.email ||
      (hostId === "00000000-0000-0000-0000-000000000002" ? "host.dev@qafnest.com" : "");
    const hostPhone = profInfo?.phone || authInfo?.phone || firstPayoutWithMeta?.hostPhone || "";
    const iban =
      sharedIban?.iban || hostPayouts.find((p) => p.iban)?.iban || "";
    const bankName =
      (sharedIban ? `${sharedIban.bankNameEn}` : "") ||
      hostPayouts.find((p) => p.bankName && p.bankName !== "Not Configured")?.bankName ||
      "Not Configured";

    const propBucketMap = new Map<string, AdminHostPropertyBreakdown>();
    for (const prop of hostProps) {
      propBucketMap.set(prop.id, {
        propertyId: prop.id,
        propertyTitle: prop.title || "Property",
        category: prop.category || "property",
        status: prop.status || (prop.is_approved ? "approved" : "pending"),
        basePrice: Number(prop.base_price) || 0,
        bookingsCount: 0,
        grossListingSar: 0,
        hostCommissionSar: 0,
        promoDiscountSar: 0,
        hostNetEarningsSar: 0,
        paidOutSar: 0,
        dueSar: 0,
      });
    }

    const transactions: AdminHostTransactionItem[] = [];
    let guestPaidTotal = 0;
    let grossListingEarnings = 0;
    let hostCommissionTotal = 0;
    let promoDiscountTotal = 0;
    let hostNetEarnings = 0;
    let vatCollectedOnHostStays = 0;
    let platformNetFromHost = 0;

    const hostConfirmedBookings = confirmedBookings.filter((b: any) => {
      const prop = Array.isArray(b.properties) ? b.properties[0] : b.properties;
      const bHostId = prop?.host_id || payoutByBookingId.get(b.id)?.hostId;
      return bHostId === hostId;
    });

    for (const b of hostConfirmedBookings) {
      const prop = Array.isArray(b.properties) ? b.properties[0] : b.properties;
      const resolvedProp = prop || propById.get(b.property_id);
      const totalPaid = round2(Number(b.total_price) || 0);
      if (totalPaid <= 0) continue;

      const settlement = resolveBookingSettlement({
        bookingId: b.id,
        bookingReference: b.booking_reference,
        totalPricePaid: totalPaid,
        nights: b.total_nights,
        nightlyPrice: resolvedProp?.base_price,
        category: resolvedProp?.category,
        feeConfig: feeCfg,
      });

      const matchedPayout = payoutByBookingId.get(b.id);
      const payoutStatus: PayoutStatus = matchedPayout?.status || "pending";
      const guestProf = b.guest_id ? profileMap.get(b.guest_id) : undefined;

      guestPaidTotal = round2(guestPaidTotal + settlement.guestTotalCollectedSar);
      grossListingEarnings = round2(grossListingEarnings + settlement.hostGrossEntitlementSar);
      hostCommissionTotal = round2(hostCommissionTotal + settlement.hostCommissionAmountSar);
      promoDiscountTotal = round2(promoDiscountTotal + settlement.promoDeductionFromHostSar);
      hostNetEarnings = round2(hostNetEarnings + settlement.hostNetPayoutSar);
      vatCollectedOnHostStays = round2(
        vatCollectedOnHostStays + settlement.governmentVatRemittanceSar
      );
      platformNetFromHost = round2(platformNetFromHost + settlement.platformNetRevenueSar);

      const propId = b.property_id || resolvedProp?.id || "unknown";
      let pBucket = propBucketMap.get(propId);
      if (!pBucket) {
        pBucket = {
          propertyId: propId,
          propertyTitle: resolvedProp?.title || matchedPayout?.propertyTitle || "Property",
          category: resolvedProp?.category || "property",
          status: "active",
          basePrice: Number(resolvedProp?.base_price) || 0,
          bookingsCount: 0,
          grossListingSar: 0,
          hostCommissionSar: 0,
          promoDiscountSar: 0,
          hostNetEarningsSar: 0,
          paidOutSar: 0,
          dueSar: 0,
        };
        propBucketMap.set(propId, pBucket);
      }
      pBucket.bookingsCount += 1;
      pBucket.grossListingSar = round2(
        pBucket.grossListingSar + settlement.hostGrossEntitlementSar
      );
      pBucket.hostCommissionSar = round2(
        pBucket.hostCommissionSar + settlement.hostCommissionAmountSar
      );
      pBucket.promoDiscountSar = round2(
        pBucket.promoDiscountSar + settlement.promoDeductionFromHostSar
      );
      pBucket.hostNetEarningsSar = round2(
        pBucket.hostNetEarningsSar + settlement.hostNetPayoutSar
      );
      if (payoutStatus === "disbursed") {
        pBucket.paidOutSar = round2(pBucket.paidOutSar + settlement.hostNetPayoutSar);
      }

      transactions.push({
        bookingId: b.id,
        bookingReference: b.booking_reference || b.id.slice(0, 8).toUpperCase(),
        propertyId: propId,
        propertyTitle: pBucket.propertyTitle,
        checkIn: b.check_in || "",
        checkOut: b.check_out || "",
        nights: Number(b.total_nights) || 1,
        guestName: guestProf?.full_name || b.auth_subject || "Guest",
        guestPaidTotalSar: settlement.guestTotalCollectedSar,
        guestServiceFeeSar: settlement.guestServiceFeeSar,
        govZatcaVatSar: settlement.governmentVatRemittanceSar,
        listingGrossSar: settlement.hostGrossEntitlementSar,
        hostCommissionSar: settlement.hostCommissionAmountSar,
        promoDiscountSar: settlement.promoDeductionFromHostSar,
        welcomeBonusSubsidySar: settlement.platformWelcomeBonusSubsidySar,
        hostNetPayoutSar: settlement.hostNetPayoutSar,
        platformNetRevenueSar: settlement.platformNetRevenueSar,
        payoutId: matchedPayout?.id || "",
        payoutStatus,
        sarieTxnId: matchedPayout?.sarieTxnId,
        createdAt: b.created_at || new Date().toISOString(),
      });
    }

    for (const pb of Array.from(propBucketMap.values())) {
      pb.dueSar = Math.max(0, round2(pb.hostNetEarningsSar - pb.paidOutSar));
    }

    const totalPaidOut = computeDeduplicatedDisbursedTotal(hostPayouts);
    const onHoldAmount = round2(
      hostPayouts
        .filter((p) => p.status === "on_hold")
        .reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0)
    );
    const pendingDueAmount = round2(
      hostPayouts
        .filter((p) => p.status === "pending" || p.status === "processing")
        .reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0) ||
        Math.max(0, round2(hostNetEarnings - totalPaidOut - onHoldAmount))
    );

    return {
      hostId,
      hostName,
      hostEmail,
      hostPhone,
      joinedAt: authInfo?.createdAt || hostProps[0]?.created_at || "",
      iban,
      bankName,
      propertiesCount: propBucketMap.size,
      bookingsCount: transactions.length,
      guestPaidTotal,
      grossListingEarnings,
      hostCommissionTotal,
      promoDiscountTotal,
      hostNetEarnings,
      totalPaidOut,
      pendingDueAmount,
      onHoldAmount,
      vatCollectedOnHostStays,
      platformNetFromHost,
      properties: Array.from(propBucketMap.values()).sort(
        (a, b) => b.hostNetEarningsSar - a.hostNetEarningsSar
      ),
      transactions,
      payouts: hostPayouts,
    };
  }).sort(
    (a, b) =>
      b.pendingDueAmount + b.onHoldAmount - (a.pendingDueAmount + a.onHoldAmount) ||
      b.hostNetEarnings - a.hostNetEarnings ||
      b.propertiesCount - a.propertiesCount
  );

  return {
    metrics: {
      totalGrossVolume: Math.round(liveGrossVolume * 100) / 100,
      platformCommission: platformCommissionTotal,
      vatCollected: vatCollectedTotal,
      disbursedTotal,
      pendingTotal,
      commissionRate: commissionRatePct,
      vatRate: vatRatePct,
    },
    payouts,
    hostLedgers,
    policy,
    reminders,
  };
}

async function notifyHostIfPossible(params: {
  hostId: string;
  title: string;
  body: string;
  eventType: string;
}) {
  const supabase = createAdminDataClient();
  if (!supabase || !params.hostId) return;
  try {
    await supabase.from("host_notifications").insert({
      host_id: params.hostId,
      event_type: params.eventType,
      title: params.title,
      body: params.body,
      is_read: false,
    });
  } catch (err) {
    console.warn("[host_notifications notice]:", err);
  }
}

export async function reviewAdminPayoutRequest(
  payoutId: string,
  decision: "approved" | "rejected",
  actorEmail?: string,
  reason?: string
) {
  await hydrateHostPayoutStore();
  const updated = reviewHostPayoutRequest(payoutId, decision, actorEmail, reason);
  if (updated) {
    await notifyHostIfPossible({
      hostId: updated.hostId,
      eventType: decision === "approved" ? "payout_request_approved" : "payout_request_rejected",
      title:
        decision === "approved"
          ? "تمت الموافقة على طلب تحويل مستحقاتك"
          : "تحديث حول طلب تحويل المستحقات",
      body:
        decision === "approved"
          ? `تمت مراجعة واعتماد طلب سحب مبلغ ${updated.netPayoutAmount.toFixed(2)} ر.س (${updated.reference}) وإحالته لقسم المالية لإتمام التحويل البنكي.`
          : `تعذر اعتماد طلب السحب (${updated.reference}): ${updated.rejectionReason || "قيد المراجعة المالية"}.`,
    });
  }
  return updated;
}

export async function updatePayoutStatus(
  payoutId: string,
  newStatus: PayoutStatus,
  holdReason?: string,
  sarieTxnId?: string
) {
  await hydrateHostPayoutStore();
  const updated = updateStoredPayoutStatus(payoutId, newStatus, holdReason, sarieTxnId);
  if (updated && newStatus === "disbursed") {
    const policy = getHostPayoutPolicy();
    if (policy.autoNotifyHostOnDisburse) {
      await notifyHostIfPossible({
        hostId: updated.hostId,
        eventType: "payout_disbursed",
        title: "تم تحويل مستحقاتك البنكية (SARIE)",
        body: `تم تحويل مبلغ ${updated.netPayoutAmount.toFixed(2)} ر.س لحساب الآيبان الخاص بك (${updated.reference}) برقم العملية البنكية المعتمد ${updated.sarieTxnId}.`,
      });
    }
  }
  return updated;
}

export function batchUpdatePayoutStatus(
  payoutIds: string[],
  newStatus: PayoutStatus,
  sarieTxnId?: string
) {
  return batchUpdateStoredPayoutStatus(payoutIds, newStatus, sarieTxnId);
}

export function processSarieSettlementBatch(sarieTxnId?: string) {
  return processStoredSarieBatch(sarieTxnId);
}

export async function sendHostPayoutReminders(payoutIds?: string[]) {
  const all = getAllStoredPayouts();
  const targets =
    payoutIds && payoutIds.length > 0
      ? all.filter((p) => payoutIds.includes(p.id))
      : all.filter((p) => p.status === "pending" || p.status === "processing");

  if (targets.length === 0) {
    return { remindedCount: 0, payouts: [] as AdminPayoutRecord[] };
  }

  const updated = recordPayoutReminderSent(targets.map((p) => p.id));

  for (const p of updated) {
    await notifyHostIfPossible({
      hostId: p.hostId,
      eventType: "payout_24h_reminder",
      title: "تذكير بتحويل المستحقات خلال ٢٤ ساعة",
      body: `تحويلك بمبلغ ${p.netPayoutAmount.toFixed(2)} ر.س (${p.reference}) قيد المراجعة البنكية وسيصل لحسابك ضمن مهلة ٢٤ ساعة.`,
    });
  }

  return {
    remindedCount: updated.length,
    payouts: updated,
    timestamp: new Date().toISOString(),
  };
}

export function saveAdminPayoutPolicy(updates: Partial<HostPayoutPolicy>) {
  return updateHostPayoutPolicy(updates);
}

function resolveMyFatoorahEnv(): { apiKey?: string; baseUrl: string } {
  let apiKey = process.env.MYFATOORAH_API_KEY?.trim();
  let baseUrl = process.env.MYFATOORAH_BASE_URL?.trim();

  if (!apiKey) {
    const candidates = [
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), "..", "..", ".env.local"),
      path.join(process.cwd(), "..", "guest", ".env.local"),
    ];
    for (const filePath of candidates) {
      try {
        if (!fs.existsSync(filePath)) continue;
        const raw = fs.readFileSync(filePath, "utf8");
        const mKey = raw.match(/^MYFATOORAH_API_KEY=(.+)$/m);
        if (mKey?.[1]?.trim()) {
          apiKey = mKey[1].trim().replace(/^["']|["']$/g, "");
          const mUrl = raw.match(/^MYFATOORAH_BASE_URL=(.+)$/m);
          if (!baseUrl && mUrl?.[1]?.trim()) {
            baseUrl = mUrl[1].trim().replace(/^["']|["']$/g, "");
          }
          break;
        }
      } catch {
        // Ignore unreadable local env file
      }
    }
  }

  return {
    apiKey,
    baseUrl: (baseUrl || "https://apitest.myfatoorah.com/v2").replace(/\/$/, ""),
  };
}

export async function probeMyFatoorahMultiVendor() {
  const { apiKey, baseUrl } = resolveMyFatoorahEnv();
  if (!apiKey) {
    return {
      configured: false,
      multiVendorEnabled: false,
      activeSuppliersCount: 0,
      message: "MYFATOORAH_API_KEY is not configured in environment variables.",
    };
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 7000);
    // Lightweight probe via GetSupplierDashboard?SupplierCode=1 instead of downloading all sandbox suppliers (~6MB)
    const res = await fetch(`${baseUrl}/GetSupplierDashboard?SupplierCode=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(tid));

    const latencyMs = Date.now() - started;
    if (!res.ok) {
      return {
        configured: true,
        multiVendorEnabled: false,
        httpStatus: res.status,
        latencyMs,
        activeSuppliersCount: 0,
        message: `MyFatoorah Multi-Vendor endpoint returned HTTP ${res.status}. Enable Multi-Vendor on merchant account to use CreateSupplier/Split.`,
      };
    }

    const dash = (await res.json()) as { IsApproved?: boolean; IsActive?: boolean };
    const enabled = res.ok && dash && typeof dash === "object";

    return {
      configured: true,
      multiVendorEnabled: enabled,
      httpStatus: res.status,
      latencyMs,
      totalSuppliers: dash?.IsActive ? 1 : 0,
      activeSuppliersCount: dash?.IsApproved && dash?.IsActive ? 1 : 0,
      endpoint: `${baseUrl}/GetSupplierDashboard`,
      message: `MyFatoorah Multi-Vendor API active & reachable (${latencyMs}ms). Gateway split requires Host Supplier KYC + Sun–Thu deposit cycle; SARIE bank transfer covers 24/7 payouts within 24h.`,
    };
  } catch (err: unknown) {
    return {
      configured: true,
      multiVendorEnabled: false,
      latencyMs: Date.now() - started,
      activeSuppliersCount: 0,
      message: err instanceof Error ? err.message : "Failed to reach MyFatoorah Suppliers API.",
    };
  }
}

export function generateSarieCsvString(): string {
  const payouts = getAllStoredPayouts();
  const headers = [
    "Transfer_Reference",
    "Value_Date",
    "SLA_Deadline_24h",
    "Beneficiary_Name",
    "Beneficiary_IBAN",
    "Bank_Name",
    "Gross_Booking_SAR",
    "Commission_SAR",
    "VAT_SAR_15pct",
    "Net_Payout_SAR",
    "Transfer_Status",
    "Host_Phone",
    "SARIE_Txn_ID",
  ];

  const rows = payouts.map((p) => [
    p.reference,
    p.scheduledDate,
    p.slaDeadlineAt,
    `"${p.hostName.replace(/"/g, '""')}"`,
    p.iban,
    `"${p.bankName.replace(/"/g, '""')}"`,
    p.grossAmount.toFixed(2),
    p.commissionAmount.toFixed(2),
    p.vatAmount.toFixed(2),
    p.netPayoutAmount.toFixed(2),
    p.status.toUpperCase(),
    p.hostPhone,
    p.sarieTxnId || "N/A",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

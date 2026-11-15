import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { detectSaudiBank, formatSaudiIban, validateSaudiIban } from "@/lib/financials/saudiBanks";
import { getServerPlatformFeeConfig } from "@qafnest/shared/platformFeeStore";
import { resolveBookingSettlement } from "@qafnest/shared/bookingFinancialsStore";
import {
  generateZatcaTlvBase64,
  isPayoutPostCheckoutEligible,
  QAFNEST_ZATCA_DEFAULTS,
} from "@qafnest/shared";
import {
  getAllStoredPayouts,
  getSharedHostIban,
  setSharedHostIban,
  syncConfirmedBookingsToPayouts,
  upsertHostPayoutRequest,
} from "@qafnest/shared/hostPayoutStore";
import type {
  RemittanceBookingDetail,
  HostRemittance,
  HostPayoutIban,
  HostVatInvoice,
  HostSettlementSettings,
  HostSettlementSummary,
  HostPropertyBookingTx,
  HostPropertyFinanceSummary,
} from "./hostFinancialsTypes";
import { getDefaultRemittances, DEFAULT_VAT_INVOICES } from "./defaultFinancialRecords";

export type {
  RemittanceBookingDetail,
  HostRemittance,
  HostPayoutIban,
  HostVatInvoice,
  HostSettlementSettings,
  HostSettlementSummary,
  HostPropertyBookingTx,
  HostPropertyFinanceSummary,
};

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Memory cache for user custom IBAN updates across server requests
const customHostIbans: Record<string, HostPayoutIban> = {};
const customSettlementSettings: Record<string, HostSettlementSettings> = {};
const pendingPayoutRequests: HostRemittance[] = [];

export async function getHostFinancialData(hostId: string, propertyIdFilter?: string) {
  const supabase = getAdminClient();
  const sharedIban = getSharedHostIban(hostId);
  const hostIban: HostPayoutIban = customHostIbans[hostId] ||
    (sharedIban
      ? {
          iban: sharedIban.iban,
          formattedIban: sharedIban.formattedIban,
          bankNameEn: sharedIban.bankNameEn,
          bankNameAr: sharedIban.bankNameAr,
          accountHolder: sharedIban.accountHolder,
          isVerified: sharedIban.isVerified,
          verifiedAt: sharedIban.verifiedAt || "",
        }
      : {
          iban: "",
          formattedIban: "",
          bankNameEn: "",
          bankNameAr: "",
          accountHolder: "",
          isVerified: false,
          verifiedAt: "",
        });

  let properties: Array<{
    id: string;
    title: string;
    category?: string;
    category_name?: string;
    city?: string;
    city_name?: string;
    status?: string;
    base_price?: number | null;
  }> = [];
  let bookings: any[] = [];

  if (supabase) {
    try {
      const { data: propData } = await supabase
        .from("properties")
        .select("id, title, category, category_name, city, city_name, status, base_price")
        .eq("host_id", hostId)
        .order("created_at", { ascending: false });

      if (propData && propData.length > 0) {
        properties = propData;
        const propIds = propData.map((p) => p.id);

        const { data: bookData } = await supabase
          .from("bookings")
          .select("id, booking_reference, property_id, guest_id, auth_subject, total_nights, total_price, status, payment_status, check_in, check_out, created_at")
          .in("property_id", propIds)
          .order("created_at", { ascending: false });

        bookings = bookData || [];
      }
    } catch (e) {
      console.warn("Could not query host financials from DB, using fallback stats:", e);
    }
  }

  // Calculate actual revenue totals strictly from live verified bookings & unified platform fee rules
  const feeCfg = getServerPlatformFeeConfig();
  const commissionRatePct = feeCfg.baseCommissionPercent;
  const vatRatePct = feeCfg.vatRatePercent;
  const propById = new Map(properties.map((p) => [p.id, p]));

  const confirmed = bookings.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "completed") &&
      (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid")
  );

  // Sync confirmed bookings into shared payout ledger so Host & Admin stay 100% aligned
  if (confirmed.length > 0) {
    try {
      syncConfirmedBookingsToPayouts(
        confirmed.map((b) => {
          const prop = propById.get(b.property_id);
          return {
            id: b.id,
            booking_reference: b.booking_reference,
            total_price: b.total_price,
            status: b.status,
            payment_status: b.payment_status || "success",
            check_in: b.check_in,
            check_out: b.check_out,
            total_nights: b.total_nights,
            created_at: b.created_at,
            guest_name: b.auth_subject || "Guest",
            property: prop
              ? {
                  id: prop.id,
                  title: prop.title,
                  category: prop.category,
                  price_per_night: prop.base_price,
                  host_id: hostId,
                  host_name: hostIban?.accountHolder || "",
                  host_phone: "",
                }
              : null,
          };
        })
      );
    } catch (syncErr) {
      console.warn("Notice: Could not sync host payouts:", syncErr);
    }
  }

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const hostStoredPayouts = getAllStoredPayouts().filter((p) => p.hostId === hostId);
  const payoutByBookingId = new Map<string, typeof hostStoredPayouts[number]>();
  for (const p of hostStoredPayouts) {
    if (p.bookingId) payoutByBookingId.set(p.bookingId, p);
    for (const bk of p.bookings || []) {
      if (bk.id && !payoutByBookingId.has(bk.id)) {
        payoutByBookingId.set(bk.id, p);
      }
    }
  }

  // Build complete per-property breakdown across ALL properties owned by host
  const propertyBuckets = new Map<string, HostPropertyFinanceSummary>();
  for (const prop of properties) {
    propertyBuckets.set(prop.id, {
      propertyId: prop.id,
      propertyTitle: prop.title || "Untitled Property",
      category: prop.category || "property",
      categoryName: prop.category_name || prop.category || "Property",
      city: prop.city_name || prop.city || "Saudi Arabia",
      status: prop.status || "active",
      basePrice: Number(prop.base_price) || 0,
      bookingsCount: 0,
      grossRevenue: 0,
      serviceFeeAmount: 0,
      promoDiscountAmount: 0,
      netEarnings: 0,
      paidOut: 0,
      dueAmount: 0,
      bookings: [],
    });
  }

  const bookingPropertyById = new Map<string, string>();
  for (const b of confirmed) {
    bookingPropertyById.set(b.id, b.property_id);
    const grossPaid = round2(Number(b.total_price) || 0);
    if (grossPaid <= 0) continue;
    const prop = propById.get(b.property_id);
    const settlement = resolveBookingSettlement({
      bookingId: b.id,
      bookingReference: b.booking_reference,
      totalPricePaid: grossPaid,
      nights: b.total_nights,
      nightlyPrice: prop?.base_price,
      category: prop?.category,
      feeConfig: feeCfg,
    });
    const matchedPayout = payoutByBookingId.get(b.id);
    const payoutStatus: HostPropertyBookingTx["payoutStatus"] =
      matchedPayout?.status === "disbursed"
        ? "disbursed"
        : matchedPayout?.status === "on_hold"
        ? "on_hold"
        : matchedPayout?.status === "processing"
        ? "processing"
        : "pending";

    let bucket = propertyBuckets.get(b.property_id);
    if (!bucket) {
      bucket = {
        propertyId: b.property_id,
        propertyTitle: prop?.title || "Property",
        category: prop?.category || "property",
        categoryName: prop?.category_name || prop?.category || "Property",
        city: prop?.city_name || prop?.city || "Saudi Arabia",
        status: prop?.status || "active",
        basePrice: Number(prop?.base_price) || 0,
        bookingsCount: 0,
        grossRevenue: 0,
        serviceFeeAmount: 0,
        promoDiscountAmount: 0,
        netEarnings: 0,
        paidOut: 0,
        dueAmount: 0,
        bookings: [],
      };
      propertyBuckets.set(b.property_id, bucket);
    }

    bucket.bookingsCount += 1;
    bucket.grossRevenue = round2(bucket.grossRevenue + settlement.hostGrossEntitlementSar);
    bucket.serviceFeeAmount = round2(bucket.serviceFeeAmount + settlement.hostCommissionAmountSar);
    bucket.promoDiscountAmount = round2(bucket.promoDiscountAmount + settlement.promoDeductionFromHostSar);
    bucket.netEarnings = round2(bucket.netEarnings + settlement.hostNetPayoutSar);
    if (payoutStatus === "disbursed") {
      bucket.paidOut = round2(bucket.paidOut + settlement.hostNetPayoutSar);
    }

    bucket.bookings.push({
      bookingId: b.id,
      bookingReference: b.booking_reference || b.id.slice(0, 8).toUpperCase(),
      checkIn: b.check_in || "",
      checkOut: b.check_out || "",
      nights: Number(b.total_nights) || 1,
      guestName: b.auth_subject || "Guest",
      grossAmount: settlement.hostGrossEntitlementSar,
      serviceFeeAmount: settlement.hostCommissionAmountSar,
      promoDiscountAmount: settlement.promoDeductionFromHostSar,
      netPayout: settlement.hostNetPayoutSar,
      payoutStatus,
      createdAt: b.created_at || new Date().toISOString(),
    });
  }

  for (const bucket of Array.from(propertyBuckets.values())) {
    bucket.dueAmount = Math.max(0, round2(bucket.netEarnings - bucket.paidOut));
  }
  const propertyLedgers = Array.from(propertyBuckets.values()).sort(
    (a, b) => b.netEarnings - a.netEarnings || b.dueAmount - a.dueAmount
  );

  const activePropertyId =
    propertyIdFilter && propertyIdFilter !== "all" && propertyBuckets.has(propertyIdFilter)
      ? propertyIdFilter
      : "all";

  const scopedConfirmed =
    activePropertyId === "all"
      ? confirmed
      : confirmed.filter((b) => b.property_id === activePropertyId);

  let liveGrossTotal = 0;
  let commission = 0;
  let vatOnCommission = 0;
  let netEarnings = 0;
  let escrowedBalance = 0;
  let unlockedEarningsTotal = 0;

  for (const b of scopedConfirmed) {
    const grossPaid = round2(Number(b.total_price) || 0);
    if (grossPaid <= 0) continue;
    const prop = propById.get(b.property_id);
    const settlement = resolveBookingSettlement({
      bookingId: b.id,
      bookingReference: b.booking_reference,
      totalPricePaid: grossPaid,
      nights: b.total_nights,
      nightlyPrice: prop?.base_price,
      category: prop?.category,
      feeConfig: feeCfg,
    });
    liveGrossTotal += settlement.hostGrossEntitlementSar;
    commission += settlement.hostCommissionAmountSar + settlement.promoDeductionFromHostSar;
    vatOnCommission += settlement.governmentVatRemittanceSar;
    netEarnings += settlement.hostNetPayoutSar;

    const matchedPayout = payoutByBookingId.get(b.id);
    const checkoutCheck = isPayoutPostCheckoutEligible({
      source: matchedPayout?.source,
      checkOutDate: matchedPayout?.checkOutDate || b.check_out,
      bookingStatus: matchedPayout?.bookingStatus || b.status,
    });
    if (checkoutCheck.eligible) {
      unlockedEarningsTotal += settlement.hostNetPayoutSar;
    } else if (matchedPayout?.status !== "disbursed") {
      escrowedBalance += settlement.hostNetPayoutSar;
    }
  }

  liveGrossTotal = round2(liveGrossTotal);
  commission = round2(commission);
  vatOnCommission = round2(vatOnCommission);
  netEarnings = round2(netEarnings);
  escrowedBalance = round2(escrowedBalance);
  unlockedEarningsTotal = round2(unlockedEarningsTotal);

  const selectedPropertyLedger = activePropertyId !== "all" ? propertyBuckets.get(activePropertyId) : null;
  const totalPaidOut = selectedPropertyLedger
    ? selectedPropertyLedger.paidOut
    : round2(
        hostStoredPayouts
          .filter((p) => p.status === "disbursed")
          .reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0)
      );
  const pendingRequestedAmount =
    activePropertyId === "all"
      ? round2(
          hostStoredPayouts
            .filter(
              (p) =>
                p.source === "host_request" &&
                p.status !== "disbursed" &&
                p.payoutRequestStatus !== "rejected"
            )
            .reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0)
        )
      : 0;
  const upcomingPayout = Math.max(0, round2(netEarnings - totalPaidOut));
  const availableInstantBalance = Math.max(
    0,
    round2(unlockedEarningsTotal - totalPaidOut - pendingRequestedAmount)
  );

  const defaultRemittances = getDefaultRemittances(hostIban);
  const sharedRequests: HostRemittance[] = hostStoredPayouts.map((p) => {
    const dt = new Date(p.disbursedAt || p.created_at);
    const effectiveIban = p.iban || hostIban.iban || "";
    const maskedIban =
      effectiveIban.length >= 8
        ? `${effectiveIban.slice(0, 4)} **** **** **** **** ${effectiveIban.slice(-4)}`
        : "Not Configured";
    const bookingRefMatch = p.bookingId ? bookings.find((bk) => bk.id === p.bookingId) : null;
    const bookingProp = bookingRefMatch ? propById.get(bookingRefMatch.property_id) : null;

    return {
      id: p.sarieTxnId || p.reference || p.id,
      dateAr: dt.toLocaleDateString("ar-SA", { day: "2-digit", month: "long", year: "numeric" }),
      dateEn: dt.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" }),
      rawDate: p.disbursedAt || p.created_at,
      bank:
        p.bankName && p.bankName !== "Not Configured"
          ? p.bankName
          : `${hostIban.bankNameEn} / ${hostIban.bankNameAr}`,
      iban: maskedIban,
      amount: p.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      numericAmount: p.netPayoutAmount,
      grossAmount: p.grossAmount,
      commissionAmount: p.commissionAmount,
      commissionRatePercent: p.commissionRate ? Math.round(p.commissionRate * 1000) / 10 : commissionRatePct,
      promoDiscountAmount: p.promoDiscountAmount || 0,
      vatAmount: p.vatAmount,
      staysCount: p.staysCount || p.bookings?.length || 1,
      status:
        p.status === "disbursed"
          ? "settled"
          : p.status === "processing"
          ? "processing"
          : "pending",
      bookings: (p.bookings || []).map((bk) => {
        const matchedBk = bookings.find((x) => x.id === bk.id);
        const bkSettlement = resolveBookingSettlement({
          bookingId: bk.id,
          bookingReference: bk.reference,
          totalPricePaid: Number(matchedBk?.total_price ?? p.guestPaidTotal ?? bk.total) || bk.total,
          nights: bk.nights,
          nightlyPrice: bookingProp?.base_price,
          category: bookingProp?.category,
          feeConfig: feeCfg,
        });
        return {
          bookingId: bk.id,
          bookingReference: bk.reference,
          propertyId: bookingRefMatch?.property_id || bookingPropertyById.get(bk.id),
          propertyTitle: p.propertyTitle && p.propertyTitle !== "—" ? p.propertyTitle : bookingProp?.title || "Reservation",
          checkIn: bk.checkIn,
          checkOut: bk.checkOut,
          grossAmount:
            p.bookings && p.bookings.length === 1
              ? p.grossAmount
              : bkSettlement.hostGrossEntitlementSar,
          commission:
            p.bookings && p.bookings.length === 1
              ? p.commissionAmount + (p.promoDiscountAmount || 0)
              : bkSettlement.hostCommissionAmountSar + bkSettlement.promoDeductionFromHostSar,
          vat: p.bookings && p.bookings.length === 1 ? p.vatAmount : bkSettlement.governmentVatRemittanceSar,
          netPayout: p.bookings && p.bookings.length === 1 ? p.netPayoutAmount : bkSettlement.hostNetPayoutSar,
        };
      }),
    };
  });
  const mergedSeen = new Set(sharedRequests.map((r) => r.id));
  const memExtra = pendingPayoutRequests.filter((r) => !mergedSeen.has(r.id));
  const allRemittancesRaw = [...sharedRequests, ...memExtra, ...defaultRemittances];
  const allRemittances =
    activePropertyId === "all"
      ? allRemittancesRaw
      : allRemittancesRaw.filter((rem) =>
          rem.bookings.some((bk) => bk.propertyId === activePropertyId)
        );

  const liveVatInvoices: HostVatInvoice[] = scopedConfirmed
    .filter((b) => (Number(b.total_price) || 0) > 0)
    .map((b) => {
      const grossPaid = Math.round((Number(b.total_price) || 0) * 100) / 100;
      const prop = propById.get(b.property_id);
      const settlement = resolveBookingSettlement({
        bookingId: b.id,
        bookingReference: b.booking_reference,
        totalPricePaid: grossPaid,
        nights: b.total_nights,
        nightlyPrice: prop?.base_price,
        category: prop?.category,
        feeConfig: feeCfg,
      });
      const commVat = Math.round(settlement.hostCommissionAmountSar * (feeCfg.vatRatePercent / 100) * 100) / 100;
      const totalFeeWithVat = Math.round((settlement.hostCommissionAmountSar + commVat) * 100) / 100;
      const bookingRef = b.booking_reference || b.id.slice(0, 8).toUpperCase();
      const issueIso = b.created_at || new Date().toISOString();

      return {
        id: `INV-COMM-${bookingRef}`,
        date: issueIso.slice(0, 10),
        bookingRef,
        propertyTitle: prop?.title || "Reservation",
        serviceFee: `${settlement.hostCommissionAmountSar.toFixed(2)} SAR`,
        vat: `${commVat.toFixed(2)} SAR`,
        total: `${totalFeeWithVat.toFixed(2)} SAR`,
        qrPayload: generateZatcaTlvBase64({
          sellerName: QAFNEST_ZATCA_DEFAULTS.sellerNameAr,
          vatNumber: QAFNEST_ZATCA_DEFAULTS.vatNumber,
          timestamp: issueIso,
          totalWithVat: totalFeeWithVat.toFixed(2),
          vatAmount: commVat.toFixed(2),
        }),
      };
    });

  return {
    selectedPropertyId: activePropertyId,
    propertyLedgers,
    kpis: {
      totalGrossRevenue: liveGrossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      platformCommission: commission.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      vatOnCommission: vatOnCommission.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      netHostEarnings: netEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      totalPaidOut: totalPaidOut.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      upcomingPayout: upcomingPayout.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      availableInstantBalance: availableInstantBalance.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      escrowedBalance: escrowedBalance.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    },
    iban: hostIban,
    remittances: allRemittances,
    vatInvoices: liveVatInvoices.length > 0 ? liveVatInvoices : DEFAULT_VAT_INVOICES,
    settlement: {
      grossRevenue: liveGrossTotal,
      commissionAmount: commission,
      vatAmount: vatOnCommission,
      commissionRatePercent: commissionRatePct,
      vatRatePercent: vatRatePct,
      netEarnings,
      disbursedTotal: totalPaidOut,
      pendingSettlement: upcomingPayout,
      settings: customSettlementSettings[hostId] || {
        payoutFrequency: "weekly",
        minPayoutThreshold: 500,
        autoReleaseAfterCheckin: true,
        notifySms: true,
      },
      adjustments: [],
    },
  };
}

export function updateHostIban(hostId: string, newIban: string, accountHolder: string) {
  const check = validateSaudiIban(newIban);
  if (!check.valid) {
    throw new Error(check.errorEn || "Invalid Saudi IBAN");
  }
  const cleanIban = newIban.replace(/\s+/g, "").toUpperCase();
  const bank = detectSaudiBank(cleanIban);

  const updated: HostPayoutIban = {
    iban: cleanIban,
    formattedIban: formatSaudiIban(cleanIban),
    bankNameEn: bank.nameEn,
    bankNameAr: bank.nameAr,
    accountHolder: accountHolder.trim(),
    isVerified: true,
    verifiedAt: new Date().toISOString(),
  };

  customHostIbans[hostId] = updated;
  setSharedHostIban(hostId, updated);
  return updated;
}

export async function createPayoutRequest(hostId: string, amount: number) {
  const shared = getSharedHostIban(hostId);
  const hostIban = customHostIbans[hostId] || shared;
  if (!hostIban || !hostIban.iban) {
    throw new Error("Please configure and verify your payout IBAN before requesting a payout.");
  }

  const financialSnapshot = await getHostFinancialData(hostId);
  const unlockedAvailable =
    parseFloat(String(financialSnapshot.kpis.availableInstantBalance || "0").replace(/,/g, "")) || 0;
  const escrowedSar =
    parseFloat(String(financialSnapshot.kpis.escrowedBalance || "0").replace(/,/g, "")) || 0;

  if (unlockedAvailable <= 0) {
    throw new Error(
      escrowedSar > 0
        ? `Funds (${escrowedSar.toFixed(2)} SAR) remain locked in escrow until guest check-out is completed (12:00 PM check-out day).`
        : "No unlocked post-checkout earnings are currently available to request."
    );
  }

  if (amount > unlockedAvailable + 0.01) {
    throw new Error(
      `Requested amount (${amount.toFixed(2)} SAR) exceeds your unlocked post-checkout balance (${unlockedAvailable.toFixed(2)} SAR). Pre-checkout bookings remain in escrow.`
    );
  }

  const feeCfg = getServerPlatformFeeConfig();
  const commRate = feeCfg.baseCommissionPercent / 100;
  const deductionRatio = commRate;
  const grossAmount =
    deductionRatio < 1
      ? Math.round((amount / (1 - deductionRatio)) * 100) / 100
      : Math.round(amount * 100) / 100;
  const commissionAmount = Math.round(grossAmount * commRate * 100) / 100;
  const vatAmount = 0;

  const newId = `TR-${Date.now().toString().slice(-12)}`;
  const now = new Date();
  const formattedAr = now.toLocaleDateString("ar-SA", { day: "2-digit", month: "long", year: "numeric" });
  const formattedEn = now.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  const remittance: HostRemittance = {
    id: newId,
    dateAr: formattedAr,
    dateEn: formattedEn,
    rawDate: now.toISOString(),
    bank: `${hostIban.bankNameEn} / ${hostIban.bankNameAr}`,
    iban: `${hostIban.iban.slice(0, 4)} **** **** **** **** ${hostIban.iban.slice(-4)}`,
    amount: amount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    numericAmount: amount,
    grossAmount,
    commissionAmount,
    vatAmount,
    staysCount: 1,
    status: "processing",
    bookings: [],
  };

  pendingPayoutRequests.unshift(remittance);
  upsertHostPayoutRequest({
    id: newId,
    reference: newId,
    hostId,
    hostName: hostIban.accountHolder || "Partner Host",
    iban: hostIban.iban,
    bankName: `${hostIban.bankNameEn} / ${hostIban.bankNameAr}`,
    amount,
  });
  return remittance;
}

export function updateSettlementSettings(hostId: string, settings: Partial<HostSettlementSettings>) {
  const current = customSettlementSettings[hostId] || {
    payoutFrequency: "weekly",
    minPayoutThreshold: 500,
    autoReleaseAfterCheckin: true,
    notifySms: true,
  };
  const updated = { ...current, ...settings };
  customSettlementSettings[hostId] = updated;
  return updated;
}

export function generateSettlementCsvString(data: any): string {
  const feeCfg = getServerPlatformFeeConfig();
  const commPct = data?.settlement?.commissionRatePercent ?? feeCfg.baseCommissionPercent;
  const headers = ["Item_Type", "Reference", "Description", "Gross_SAR", `Fee_${commPct}pct_SAR`, "Net_SAR", "Status"];
  const rows = [
    ["Summary", "GROSS-SALES", "Total Booking Accommodation Gross", data.kpis.totalGrossRevenue, data.kpis.platformCommission, data.kpis.netHostEarnings, "COMPUTED"],
    ["Settlement", "PAID-OUT", "Total SAMA Disbursed to IBAN", "0.00", "0.00", data.kpis.totalPaidOut, "DISBURSED"],
    ["Settlement", "PENDING", "Available Unsettled Host Earnings", "0.00", "0.00", data.kpis.upcomingPayout, "PENDING"],
  ];
  return [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\r\n");
}

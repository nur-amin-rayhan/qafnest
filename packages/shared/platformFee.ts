/**
 * QafNest Unified Platform Fee, Checkout Pricing & Settlement Reconciliation Engine
 * Pure TypeScript module — safe for both browser and server runtimes.
 */

export interface CategoryFeeOverride {
  category: "chalet" | "villa" | "farm" | "camp" | "penthouse";
  labelEn: string;
  labelAr: string;
  ratePercent: number;
  isActive: boolean;
}

export type GuestFeeMode = "percentage" | "fixed_amount";

export interface PlatformFeeConfig {
  /** Host platform commission percentage deducted from Host listing price at settlement (e.g. 20%) */
  baseCommissionPercent: number;
  /** Guest checkout service fee percentage (e.g. 13%) when guestFeeMode === "percentage" */
  guestServiceFeePercent?: number;
  /** Guest checkout service fee mode: percentage of stay vs manual fixed SAR amount */
  guestFeeMode?: GuestFeeMode;
  /** Manual fixed guest service fee in SAR when guestFeeMode === "fixed_amount" */
  guestFixedFeeAmountSar?: number;
  /** Whether guest service fee automatically mirrors host commission (default false so both are independent) */
  syncGuestServiceFee: boolean;
  /** VAT rate percentage charged on pre-VAT total and remitted 100% to ZATCA (default 15%) */
  vatRatePercent: number;
  enableCategoryOverrides: boolean;
  categoryOverrides: CategoryFeeOverride[];
  newHostIntroRatePercent: number;
  introPeriodDays: number;
  enableIntroRate: boolean;
  minCommissionAmountSar: number;
  /** Optional new guest wallet welcome gift amount in SAR (default 50 SAR) */
  welcomeBonusAmountSar?: number;
  welcomeBonusEnabled?: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export const DEFAULT_FEE_CONFIG: PlatformFeeConfig = {
  baseCommissionPercent: 20.0,
  guestServiceFeePercent: 13.0,
  guestFeeMode: "percentage",
  guestFixedFeeAmountSar: 0,
  syncGuestServiceFee: true,
  vatRatePercent: 15.0,
  enableCategoryOverrides: false,
  categoryOverrides: [
    { category: "chalet", labelEn: "Chalets & Resorts", labelAr: "شاليهات ومنتجعات", ratePercent: 13.0, isActive: true },
    { category: "villa", labelEn: "Private Luxury Villas", labelAr: "فلل خاصة فارهة", ratePercent: 10.0, isActive: true },
    { category: "camp", labelEn: "Desert Camps & Glamping", labelAr: "مخيمات صحراوية", ratePercent: 14.0, isActive: false },
    { category: "farm", labelEn: "Rural Farms & Agritourism", labelAr: "مزارع ريفية", ratePercent: 12.0, isActive: false },
    { category: "penthouse", labelEn: "Serviced Apartments", labelAr: "شقق مخدومة", ratePercent: 10.0, isActive: false },
  ],
  newHostIntroRatePercent: 6.0,
  introPeriodDays: 90,
  enableIntroRate: false,
  minCommissionAmountSar: 0,
  welcomeBonusAmountSar: 50.0,
  welcomeBonusEnabled: true,
  lastUpdatedBy: "Super Admin (Finance Officer)",
  lastUpdatedAt: "2026-11-11T00:00:00Z",
};

let inMemoryConfig: PlatformFeeConfig = { ...DEFAULT_FEE_CONFIG };

function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

export function getPlatformFeeConfig(): PlatformFeeConfig {
  return inMemoryConfig;
}

export function normalizeFeeConfigUpdates(
  current: PlatformFeeConfig,
  updates: Partial<PlatformFeeConfig>
): PlatformFeeConfig {
  if (typeof updates.baseCommissionPercent === "number") {
    if (!Number.isFinite(updates.baseCommissionPercent) || updates.baseCommissionPercent < 0 || updates.baseCommissionPercent > 100) {
      throw new Error("Host platform commission percentage must be between 0% and 100%.");
    }
  }
  if (typeof updates.guestServiceFeePercent === "number") {
    if (!Number.isFinite(updates.guestServiceFeePercent) || updates.guestServiceFeePercent < 0 || updates.guestServiceFeePercent > 100) {
      throw new Error("Guest service fee percentage must be between 0% and 100%.");
    }
  }
  if (typeof updates.guestFixedFeeAmountSar === "number") {
    if (!Number.isFinite(updates.guestFixedFeeAmountSar) || updates.guestFixedFeeAmountSar < 0) {
      throw new Error("Manual guest service fee amount must be 0 SAR or greater.");
    }
  }
  if (typeof updates.vatRatePercent === "number") {
    if (!Number.isFinite(updates.vatRatePercent) || updates.vatRatePercent < 0 || updates.vatRatePercent > 100) {
      throw new Error("VAT rate percentage must be between 0% and 100%.");
    }
  }

  const nextSync =
    updates.syncGuestServiceFee !== undefined
      ? updates.syncGuestServiceFee
      : current.syncGuestServiceFee ?? false;

  const nextGuestPercent =
    updates.guestServiceFeePercent !== undefined
      ? round2(updates.guestServiceFeePercent)
      : nextSync && updates.baseCommissionPercent !== undefined
      ? round2(updates.baseCommissionPercent)
      : current.guestServiceFeePercent ?? 13.0;

  const definedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  ) as Partial<PlatformFeeConfig>;

  return {
    ...DEFAULT_FEE_CONFIG,
    ...current,
    ...definedUpdates,
    syncGuestServiceFee: nextSync,
    baseCommissionPercent:
      updates.baseCommissionPercent !== undefined
        ? round2(updates.baseCommissionPercent)
        : current.baseCommissionPercent,
    guestServiceFeePercent: nextGuestPercent,
    guestFeeMode:
      updates.guestFeeMode === "fixed_amount" || updates.guestFeeMode === "percentage"
        ? updates.guestFeeMode
        : current.guestFeeMode || "percentage",
    guestFixedFeeAmountSar:
      updates.guestFixedFeeAmountSar !== undefined
        ? round2(updates.guestFixedFeeAmountSar)
        : current.guestFixedFeeAmountSar ?? 0,
    welcomeBonusAmountSar:
      updates.welcomeBonusAmountSar !== undefined
        ? round2(updates.welcomeBonusAmountSar)
        : current.welcomeBonusAmountSar ?? DEFAULT_FEE_CONFIG.welcomeBonusAmountSar,
    welcomeBonusEnabled:
      updates.welcomeBonusEnabled !== undefined
        ? Boolean(updates.welcomeBonusEnabled)
        : current.welcomeBonusEnabled ?? DEFAULT_FEE_CONFIG.welcomeBonusEnabled,
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: updates.lastUpdatedBy || current.lastUpdatedBy || "Super Admin (Finance Officer)",
  };
}

export function updatePlatformFeeConfig(updates: Partial<PlatformFeeConfig>): PlatformFeeConfig {
  inMemoryConfig = normalizeFeeConfigUpdates(inMemoryConfig, updates);
  return inMemoryConfig;
}

export interface EffectiveGuestFeeConfig {
  feeMode: GuestFeeMode;
  serviceFeePercent: number;
  serviceFeeRate: number;
  fixedFeeAmountSar: number;
  vatRatePercent: number;
  hostCommissionPercent: number;
  welcomeBonusAmountSar: number;
  welcomeBonusEnabled: boolean;
}

export function getEffectiveGuestFeeConfig(
  category?: string,
  config: PlatformFeeConfig = inMemoryConfig
): EffectiveGuestFeeConfig {
  const feeMode: GuestFeeMode = config.guestFeeMode === "fixed_amount" ? "fixed_amount" : "percentage";
  const fixedFeeAmountSar = round2(Math.max(0, config.guestFixedFeeAmountSar ?? 0));

  let percent = config.syncGuestServiceFee
    ? config.baseCommissionPercent
    : (config.guestServiceFeePercent ?? 13.0);

  if (feeMode === "percentage" && category && config.enableCategoryOverrides) {
    const override = config.categoryOverrides.find((c) => c.category === category && c.isActive);
    if (override) {
      percent = override.ratePercent;
    }
  }

  return {
    feeMode,
    serviceFeePercent: round2(percent),
    serviceFeeRate: Math.round((percent / 100) * 10000) / 10000,
    fixedFeeAmountSar,
    vatRatePercent: round2(config.vatRatePercent ?? 15),
    hostCommissionPercent: getEffectiveHostCommissionPercent(category, config),
    welcomeBonusAmountSar: round2(config.welcomeBonusAmountSar ?? 50),
    welcomeBonusEnabled: config.welcomeBonusEnabled !== false,
  };
}

export function getEffectiveGuestServiceFeeRate(category?: string, config: PlatformFeeConfig = inMemoryConfig): number {
  return getEffectiveGuestFeeConfig(category, config).serviceFeeRate;
}

export function getEffectiveHostCommissionPercent(
  category?: string,
  config: PlatformFeeConfig = inMemoryConfig,
  isNewHost?: boolean
): number {
  if (isNewHost && config.enableIntroRate) {
    return round2(config.newHostIntroRatePercent);
  }
  if (category && config.enableCategoryOverrides) {
    const override = config.categoryOverrides.find((c) => c.category === category && c.isActive);
    if (override) {
      return round2(override.ratePercent);
    }
  }
  return round2(config.baseCommissionPercent ?? 20);
}

/**
 * Legacy helper maintained for compatibility. Applies configured commission % and VAT %
 * directly to a supplied base amount without charging ZATCA VAT on top of itself.
 */
export function calculatePlatformFee(
  baseAmount: number,
  customConfig?: PlatformFeeConfig,
  category?: string,
  isNewHost?: boolean
) {
  const cfg = customConfig || inMemoryConfig;
  const effectiveRatePercent = getEffectiveHostCommissionPercent(category, cfg, isNewHost);
  const rawCommission = round2(baseAmount * (effectiveRatePercent / 100));
  const floor = Math.max(0, cfg.minCommissionAmountSar || 0);
  const commissionAmount = floor > 0 && baseAmount > 0 ? Math.max(rawCommission, floor) : rawCommission;
  const vatAmount = round2(commissionAmount * ((cfg.vatRatePercent ?? 15) / 100));
  const totalDeductions = round2(commissionAmount);
  const netHostPayout = round2(Math.max(0, baseAmount - totalDeductions));

  return {
    grossAmount: round2(baseAmount),
    appliedRatePercent: effectiveRatePercent,
    commissionAmount,
    vatAmount,
    totalDeductions,
    netHostPayout,
  };
}

export interface BookingSettlementInput {
  /** Host original listing stay amount before guest service fee, promo discount, or VAT */
  listingAmountSar: number;
  /** Guest service fee collected by platform (e.g. 13% or manual fixed amount) */
  guestServiceFeeSar: number;
  /** Total ZATCA 15% VAT collected on (discountedStay + guestServiceFee), 100% owed to government */
  vatAmountSar: number;
  /** Promo code discount applied for guest — deducted from Host settlement after Host commission */
  promoDiscountSar?: number;
  /** Portion paid from New User Welcome Gift balance — borne 100% by Platform, never deducted from Host */
  welcomeBonusUsedSar?: number;
  /** Host commission percentage set dynamically in Admin (default 20%) */
  hostCommissionPercent?: number;
  vatRatePercent?: number;
}

export interface BookingSettlementBreakdown {
  listingAmountSar: number;
  guestServiceFeeSar: number;
  promoDiscountSar: number;
  taxableSubtotalSar: number;
  vatRatePercent: number;
  vatAmountSar: number;
  guestTotalCollectedSar: number;
  welcomeBonusUsedSar: number;
  gatewayCashCollectedSar: number;

  // Government ZATCA Remittance
  governmentVatRemittanceSar: number;

  // Host Settlement (Commission computed on original listing price, then promo code deducted)
  hostGrossEntitlementSar: number;
  hostCommissionPercent: number;
  hostCommissionAmountSar: number;
  promoDeductionFromHostSar: number;
  hostNetPayoutSar: number;

  // Platform P&L
  platformGuestServiceFeeSar: number;
  platformHostCommissionSar: number;
  platformGrossEarningsSar: number;
  platformWelcomeBonusSubsidySar: number;
  platformNetRevenueSar: number;
}

/**
 * Authoritative 4-party accounting reconciliation:
 *  - Guest pays: (listingAmount - promoDiscount + guestServiceFee) * (1 + VAT%)
 *  - Government (ZATCA) receives: 100% of VAT
 *  - Host receives: listingAmount - (listingAmount * hostCommission%) - promoDiscount
 *  - Platform earns: guestServiceFee + hostCommission - welcomeBonusUsed
 */
export function calculateBookingSettlement(
  input: BookingSettlementInput
): BookingSettlementBreakdown {
  const listingAmountSar = round2(Math.max(0, input.listingAmountSar));
  const guestServiceFeeSar = round2(Math.max(0, input.guestServiceFeeSar));
  const promoDiscountSar = round2(Math.max(0, input.promoDiscountSar || 0));
  const welcomeBonusUsedSar = round2(Math.max(0, input.welcomeBonusUsedSar || 0));
  const vatRatePercent = round2(input.vatRatePercent ?? 15);
  const hostCommissionPercent = round2(
    input.hostCommissionPercent !== undefined
      ? Math.max(0, input.hostCommissionPercent)
      : inMemoryConfig.baseCommissionPercent ?? 20
  );

  const discountedStaySar = round2(Math.max(0, listingAmountSar - promoDiscountSar));
  const taxableSubtotalSar = round2(discountedStaySar + guestServiceFeeSar);
  const vatAmountSar = round2(
    input.vatAmountSar >= 0 ? input.vatAmountSar : taxableSubtotalSar * (vatRatePercent / 100)
  );
  const guestTotalCollectedSar = round2(taxableSubtotalSar + vatAmountSar);
  const effectiveWelcomeUsed = round2(Math.min(welcomeBonusUsedSar, guestTotalCollectedSar));
  const gatewayCashCollectedSar = round2(Math.max(0, guestTotalCollectedSar - effectiveWelcomeUsed));

  const hostCommissionAmountSar = round2(listingAmountSar * (hostCommissionPercent / 100));
  const hostNetPayoutSar = round2(
    Math.max(0, listingAmountSar - hostCommissionAmountSar - promoDiscountSar)
  );
  const promoDeductionFromHostSar = promoDiscountSar;

  const platformGrossEarningsSar = round2(guestServiceFeeSar + hostCommissionAmountSar);
  const platformNetRevenueSar = round2(platformGrossEarningsSar - effectiveWelcomeUsed);

  return {
    listingAmountSar,
    guestServiceFeeSar,
    promoDiscountSar,
    taxableSubtotalSar,
    vatRatePercent,
    vatAmountSar,
    guestTotalCollectedSar,
    welcomeBonusUsedSar: effectiveWelcomeUsed,
    gatewayCashCollectedSar,
    governmentVatRemittanceSar: vatAmountSar,
    hostGrossEntitlementSar: listingAmountSar,
    hostCommissionPercent,
    hostCommissionAmountSar,
    promoDeductionFromHostSar,
    hostNetPayoutSar,
    platformGuestServiceFeeSar: guestServiceFeeSar,
    platformHostCommissionSar: hostCommissionAmountSar,
    platformGrossEarningsSar,
    platformWelcomeBonusSubsidySar: effectiveWelcomeUsed,
    platformNetRevenueSar,
  };
}

import type { HostRemittance, HostVatInvoice } from "./hostFinancialsTypes";

export function getDefaultRemittances(hostIban: { bankNameEn: string; bankNameAr: string; iban: string }): HostRemittance[] {
  return [];
}

export const DEFAULT_VAT_INVOICES: HostVatInvoice[] = [];

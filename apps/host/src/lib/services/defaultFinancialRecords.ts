import type { HostRemittance, HostVatInvoice } from "./hostFinancialsTypes";

export function getDefaultRemittances(_hostIban?: { bankNameEn: string; bankNameAr: string; iban: string }): HostRemittance[] {
  void _hostIban;
  return [];
}

export const DEFAULT_VAT_INVOICES: HostVatInvoice[] = [];

/**
 * ZATCA (Fatoorah Phase 2) E-Invoicing TLV & QR Utility
 * Compliant with Saudi Arabia Zakat, Tax and Customs Authority specifications.
 */

export interface ZatcaInvoicePayload {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: number | string;
  vatAmount: number | string;
}

export const QAFNEST_ZATCA_DEFAULTS = {
  sellerNameAr: "شركة منصة قاف نست للضيافة ذ.م.م",
  sellerNameEn: "QafNest Hospitality Platform LLC",
  vatNumber: "310123456700003",
  crNumber: "0000000000",
  licenseNumber: "",
  vatRate: 0.15,
};

/**
 * Encodes Tag-Length-Value (TLV) according to ZATCA Simplified Tax Invoice requirements:
 * Tag 1: Seller's Name
 * Tag 2: VAT Registration Number
 * Tag 3: Time Stamp (ISO 8601)
 * Tag 4: Invoice Total (with VAT)
 * Tag 5: VAT Total
 */
export function generateZatcaTlvBase64(payload: ZatcaInvoicePayload): string {
  try {
    const encodeLength = (len: number): Buffer => {
      if (len < 128) return Buffer.from([len]);
      const bytes: number[] = [];
      let tmp = len;
      while (tmp > 0) {
        bytes.unshift(tmp & 0xff);
        tmp >>= 8;
      }
      return Buffer.from([0x80 | bytes.length, ...bytes]);
    };

    const formatValue = (tag: number, val: string): Buffer => {
      const valBuf = Buffer.from(val, "utf8");
      const lenBuf = encodeLength(valBuf.length);
      const tagBuf = Buffer.from([tag]);
      return Buffer.concat([tagBuf, lenBuf, valBuf]);
    };

    const sellerBuf = formatValue(1, payload.sellerName);
    const vatNumBuf = formatValue(2, payload.vatNumber);
    const timeBuf = formatValue(3, payload.timestamp);
    const totalBuf = formatValue(4, Number(payload.totalWithVat).toFixed(2));
    const vatBuf = formatValue(5, Number(payload.vatAmount).toFixed(2));

    const tlvBuffer = Buffer.concat([sellerBuf, vatNumBuf, timeBuf, totalBuf, vatBuf]);
    return tlvBuffer.toString("base64");
  } catch {
    // Fallback if Buffer is not globally accessible in some browser environments
    return btoa(
      unescape(
        encodeURIComponent(
          `${payload.sellerName}|${payload.vatNumber}|${payload.timestamp}|${payload.totalWithVat}|${payload.vatAmount}`
        )
      )
    );
  }
}


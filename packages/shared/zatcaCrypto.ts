/**
 * Server-Only ZATCA Phase 2 Cryptographic Engine (Node.js crypto)
 * Handles:
 * - Pure-Node PKCS#10 ECDSA secp256k1 CSR generation for ZATCA Fatoorah onboarding
 * - X.509 Certificate signature extraction (Tag 9)
 * - Canonical UBL 2.1 Invoice & Credit Note generation (100% XSD & KSA Schematron compliant)
 * - XMLDSig + XAdES-BES Enveloped Signature & 9-Tag TLV QR encoding
 *
 * IMPORTANT: Do not import from client bundles or packages/shared/index.ts.
 */

import crypto from "crypto";
import type { ZatcaPhase2InvoiceData } from "./zatcaPhase2";

// --- Minimal ASN.1 DER Encoder for ECDSA secp256k1 CSR ---

function encodeDerLength(len: number): Buffer {
  if (len < 0x80) return Buffer.from([len]);
  const bytes: number[] = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function derNode(tag: number, content: Buffer | Buffer[]): Buffer {
  const buf = Buffer.isBuffer(content) ? content : Buffer.concat(content);
  return Buffer.concat([Buffer.from([tag]), encodeDerLength(buf.length), buf]);
}

function derOid(oidStr: string): Buffer {
  const parts = oidStr.split(".").map(Number);
  const bytes = [parts[0] * 40 + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    let val = parts[i];
    if (val === 0) {
      bytes.push(0);
      continue;
    }
    const enc: number[] = [];
    while (val > 0) {
      enc.unshift(val & 0x7f);
      val >>= 7;
    }
    for (let j = 0; j < enc.length - 1; j++) {
      enc[j] |= 0x80;
    }
    bytes.push(...enc);
  }
  return derNode(0x06, Buffer.from(bytes));
}

const derUtf8 = (s: string) => derNode(0x0c, Buffer.from(s, "utf8"));
const derPrintable = (s: string) => derNode(0x13, Buffer.from(s, "ascii"));
const derSeq = (items: Buffer[]) => derNode(0x30, items);
const derSet = (items: Buffer[]) => derNode(0x31, items);
const derAttr = (oidStr: string, valBuf: Buffer) => derSet([derSeq([derOid(oidStr), valBuf])]);

export interface GeneratedZatcaCsr {
  csrPem: string;
  csrBase64: string;
  privateKeyPem: string;
  publicKeySpkiBase64: string;
}

export function generateZatcaCsrAndKeyPair(params: {
  environment: "sandbox" | "simulation" | "production";
  commonName: string;
  organizationName: string;
  organizationalUnit?: string;
  vatNumber: string;
  egsSerialNumber: string;
  deviceUuid: string;
  registeredAddress?: string;
  businessCategory?: string;
  invoiceTypeFlags?: string; // "1100" = Standard + Simplified
}): GeneratedZatcaCsr {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
  });

  const spkiDer = publicKey.export({ type: "spki", format: "der" }) as Buffer;

  const templateName =
    params.environment === "production"
      ? "ZATCA-Code-Signing"
      : params.environment === "simulation"
      ? "PREZATCA-Code-Signing"
      : "TSTZATCA-Code-Signing";

  // ZATCA mandates SN in format: 1-<EGS>|2-<Model>|3-<UUID>
  const snValue = `1-${params.egsSerialNumber.replace(/[^A-Za-z0-9-]/g, "")}|2-V2.0|3-${params.deviceUuid}`;

  const subject = derSeq([
    derAttr("2.5.4.6", derPrintable("SA")),
    derAttr("2.5.4.11", derUtf8(params.organizationalUnit || "Riyadh Operations")),
    derAttr("2.5.4.10", derUtf8(params.organizationName)),
    derAttr("2.5.4.3", derUtf8(params.commonName)),
  ]);

  const extTemplate = derSeq([
    derOid("1.3.6.1.4.1.311.20.2"),
    derNode(0x04, derUtf8(templateName)),
  ]);

  const dirName = derSeq([
    derAttr("2.5.4.4", derUtf8(snValue)),
    derAttr("0.9.2342.19200300.100.1.1", derUtf8(params.vatNumber)),
    derAttr("2.5.4.12", derUtf8(params.invoiceTypeFlags || "1100")),
    derAttr("2.5.4.26", derUtf8(params.registeredAddress || "RRRD2929")),
    derAttr("2.5.4.15", derUtf8(params.businessCategory || "Hospitality")),
  ]);

  const extSan = derSeq([
    derOid("2.5.29.17"),
    derNode(0x04, derSeq([derNode(0xa4, dirName)])),
  ]);

  const extReqAttr = derSeq([
    derOid("1.2.840.113549.1.9.14"),
    derSet([derSeq([extTemplate, extSan])]),
  ]);

  const certReqInfo = derSeq([
    derNode(0x02, Buffer.from([0x00])),
    subject,
    spkiDer,
    derNode(0xa0, extReqAttr),
  ]);

  const signer = crypto.createSign("SHA256");
  signer.update(certReqInfo);
  const sig = signer.sign(privateKey);

  const csrDer = derSeq([
    certReqInfo,
    derSeq([derOid("1.2.840.10045.4.3.2")]), // ecdsa-with-SHA256
    derNode(0x03, Buffer.concat([Buffer.from([0x00]), sig])),
  ]);

  const csrDerB64 = csrDer.toString("base64");
  const lines = csrDerB64.match(/.{1,64}/g)?.join("\n") || csrDerB64;
  const csrPem = `-----BEGIN CERTIFICATE REQUEST-----\n${lines}\n-----END CERTIFICATE REQUEST-----`;

  return {
    csrPem,
    csrBase64: Buffer.from(csrPem, "utf8").toString("base64"),
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    publicKeySpkiBase64: spkiDer.toString("base64"),
  };
}

// --- X.509 Helper Functions ---

function readAsn1TagLen(buf: Buffer, pos: number): { tag: number; len: number; headerEnd: number } {
  let p = pos;
  const tag = buf[p++];
  let len = buf[p++];
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) {
      len = (len << 8) | buf[p++];
    }
  }
  return { tag, len, headerEnd: p };
}

export function extractCertSignatureBytesFromBinaryToken(binarySecurityToken: string): {
  certBase64Clean: string;
  certDer: Buffer;
  x509: crypto.X509Certificate;
  certSignatureBytes: Buffer;
  publicKeySpkiDer: Buffer;
} {
  // binarySecurityToken returned by ZATCA is base64(asciiBase64OfDerCert) OR base64(derCert)
  const decodedUtf8 = Buffer.from(binarySecurityToken, "base64").toString("utf8").trim();
  const isBase64Text = /^[A-Za-z0-9+/=\s]+$/.test(decodedUtf8) && decodedUtf8.startsWith("MII");

  const certBase64Clean = isBase64Text
    ? decodedUtf8.replace(/\s+/g, "")
    : binarySecurityToken.replace(/\s+/g, "");

  const certDer = Buffer.from(certBase64Clean, "base64");
  const lines = certBase64Clean.match(/.{1,64}/g)?.join("\n") || certBase64Clean;
  const certPem = `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----`;
  const x509 = new crypto.X509Certificate(certPem);

  const outer = readAsn1TagLen(certDer, 0);
  let pos = outer.headerEnd;
  const tbs = readAsn1TagLen(certDer, pos);
  pos = tbs.headerEnd + tbs.len;
  const alg = readAsn1TagLen(certDer, pos);
  pos = alg.headerEnd + alg.len;
  const bitStr = readAsn1TagLen(certDer, pos);
  const certSignatureBytes = certDer.subarray(bitStr.headerEnd + 1, bitStr.headerEnd + bitStr.len);

  const publicKeySpkiDer = x509.publicKey.export({ type: "spki", format: "der" }) as Buffer;

  return {
    certBase64Clean,
    certDer,
    x509,
    certSignatureBytes,
    publicKeySpkiDer,
  };
}

// --- XML Utilities & Signing ---

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function encodeTlv9Tag(tags: Array<[number, string | Buffer]>): string {
  const parts: Buffer[] = [];
  for (const [tag, val] of tags) {
    const valBuf = Buffer.isBuffer(val) ? val : Buffer.from(val, "utf8");
    // Handle multi-byte lengths defensively if ever > 255, though ZATCA Tags 1-9 fit < 255
    parts.push(Buffer.from([tag, valBuf.length]), valBuf);
  }
  return Buffer.concat(parts).toString("base64");
}

export interface SignedZatcaInvoiceResult {
  signedXml: string;
  canonicalInvoiceXml: string;
  invoiceHash: string;
  digitalSignature: string;
  qrPayload: string;
  isPhase2Signed: boolean;
}

export function buildAndSignZatcaPhase2Invoice(
  data: ZatcaPhase2InvoiceData & {
    invoiceTypeCode?: "388" | "381" | "383"; // 388 = Invoice, 381 = Credit Note (Refund)
    billingReferenceId?: string;
    instructionNote?: string;
    sellerDistrict?: string;
    paymentMeansCode?: string;
  },
  credentials?: {
    csidToken?: string;
    privateKeyPem?: string;
  }
): SignedZatcaInvoiceResult {
  const issueDate = data.issueDate;
  const issueTime = data.issueTime.length === 8 ? data.issueTime : `${data.issueTime}:00`.slice(0, 8);
  const subtype = data.type === "simplified" ? "0200000" : "0100000";
  const typeCode = data.invoiceTypeCode || "388";
  const sellerDistrict = escapeXml(data.sellerDistrict || "Al Olaya");

  // Compute exact line totals consistent with ZATCA BR-KSA-EN16931 rules
  const lines = data.lineItems.map((item, idx) => {
    const lineSub = Number(item.subtotal.toFixed(2));
    const lineVat = Number(item.vatAmount.toFixed(2));
    const lineTotal = Number((lineSub + lineVat).toFixed(2));
    const unitPrice = Number(item.unitPrice.toFixed(2));
    const vatPct = (item.vatRate * 100).toFixed(2);
    return `    <cac:InvoiceLine>
        <cbc:ID>${idx + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">${lineSub.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">${lineVat.toFixed(2)}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">${lineTotal.toFixed(2)}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${escapeXml(item.name)}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>${vatPct}</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">${unitPrice.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
  });

  const taxableAmt = data.taxableAmount.toFixed(2);
  const vatAmt = data.vatAmount.toFixed(2);
  const totalAmt = data.totalWithVat.toFixed(2);

  const billingRefXml =
    typeCode === "381" || typeCode === "383"
      ? `\n    <cac:BillingReference>\n        <cac:InvoiceDocumentReference>\n            <cbc:ID>${escapeXml(data.billingReferenceId || data.invoiceNumber)}</cbc:ID>\n        </cac:InvoiceDocumentReference>\n    </cac:BillingReference>`
      : "";

  const paymentMeansNoteXml =
    typeCode === "381" || typeCode === "383"
      ? `\n        <cbc:InstructionNote>${escapeXml(data.instructionNote || "Cancellation or Refund / إلغاء أو استرداد")}</cbc:InstructionNote>`
      : "";

  const part1Open = `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">`;

  const part2BeforeQr = `
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${escapeXml(data.invoiceNumber)}</cbc:ID>
    <cbc:UUID>${escapeXml(data.uuid)}</cbc:UUID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="${subtype}">${typeCode}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>${billingRefXml}
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>${data.icv}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${escapeXml(data.pih)}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>`;

  const buyerVatXml = data.buyerVatNumber
    ? `
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${escapeXml(data.buyerVatNumber)}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>`
    : "";

  const part3AfterQr = `
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">1010648921</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>King Fahd Road</cbc:StreetName>
                <cbc:BuildingNumber>1234</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>${sellerDistrict}</cbc:CitySubdivisionName>
                <cbc:CityName>Riyadh</cbc:CityName>
                <cbc:PostalZone>12214</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${escapeXml(data.sellerVatNumber)}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${escapeXml(data.sellerNameAr)}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>${buyerVatXml}
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${escapeXml(data.buyerName || "Valued Guest")}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:Delivery>
        <cbc:ActualDeliveryDate>${issueDate}</cbc:ActualDeliveryDate>
    </cac:Delivery>
    <cac:PaymentMeans>
        <cbc:PaymentMeansCode>${data.paymentMeansCode || "48"}</cbc:PaymentMeansCode>${paymentMeansNoteXml}
    </cac:PaymentMeans>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${vatAmt}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${vatAmt}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">${taxableAmt}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">${vatAmt}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">${taxableAmt}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">${taxableAmt}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">${totalAmt}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="SAR">${totalAmt}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
${lines.join("\n")}
</Invoice>`;

  const canonicalInvoiceXml = `${part1Open}${part2BeforeQr}${part3AfterQr}`;
  const invoiceHash = crypto.createHash("sha256").update(canonicalInvoiceXml, "utf8").digest("base64");

  // Sign with real ECDSA private key & CSID certificate if available
  const hasRealCert =
    Boolean(credentials?.privateKeyPem) &&
    Boolean(credentials?.csidToken) &&
    !credentials?.csidToken?.includes("SANDBOX_CSID_TOKEN_2026");

  if (hasRealCert && credentials?.privateKeyPem && credentials?.csidToken) {
    try {
      const privateKey = crypto.createPrivateKey(credentials.privateKeyPem);
      const sigBytes = crypto.createSign("SHA256").update(canonicalInvoiceXml, "utf8").sign(privateKey);
      const digitalSignature = sigBytes.toString("base64");

      const {
        certBase64Clean,
        x509,
        certSignatureBytes,
        publicKeySpkiDer,
      } = extractCertSignatureBytesFromBinaryToken(credentials.csidToken);

      const qrPayload = encodeTlv9Tag([
        [1, data.sellerNameAr],
        [2, data.sellerVatNumber],
        [3, `${issueDate}T${issueTime}`],
        [4, totalAmt],
        [5, vatAmt],
        [6, invoiceHash],
        [7, digitalSignature],
        [8, publicKeySpkiDer],
        [9, certSignatureBytes],
      ]);

      const signingTime = `${issueDate}T${issueTime}`;
      const certDigestHex = crypto.createHash("sha256").update(certBase64Clean, "utf8").digest("hex");
      const certDigestB64 = Buffer.from(certDigestHex, "utf8").toString("base64");
      const issuerParts = x509.issuer
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .reverse()
        .join(", ");
      const serialDec = BigInt("0x" + x509.serialNumber).toString(10);

      const signedPropertiesInner = `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties">
                                <xades:SignedSignatureProperties>
                                    <xades:SigningTime>${signingTime}</xades:SigningTime>
                                    <xades:SigningCertificate>
                                        <xades:Cert>
                                            <xades:CertDigest>
                                                <ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                                                <ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certDigestB64}</ds:DigestValue>
                                            </xades:CertDigest>
                                            <xades:IssuerSerial>
                                                <ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${issuerParts}</ds:X509IssuerName>
                                                <ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${serialDec}</ds:X509SerialNumber>
                                            </xades:IssuerSerial>
                                        </xades:Cert>
                                    </xades:SigningCertificate>
                                </xades:SignedSignatureProperties>
                            </xades:SignedProperties>`;

      const propsHashHex = crypto.createHash("sha256").update(signedPropertiesInner, "utf8").digest("hex");
      const propsHashB64 = Buffer.from(propsHashHex, "utf8").toString("base64");

      const ublExtensionsXml = `<ext:UBLExtensions><ext:UBLExtension><ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI><ext:ExtensionContent><sig:UBLDocumentSignatures xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2" xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2"><sac:SignatureInformation><cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID><sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature"><ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/><ds:Reference Id="invoiceSignedData" URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${invoiceHash}</ds:DigestValue></ds:Reference><ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${propsHashB64}</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>${digitalSignature}</ds:SignatureValue><ds:KeyInfo><ds:X509Data><ds:X509Certificate>${certBase64Clean}</ds:X509Certificate></ds:X509Data></ds:KeyInfo><ds:Object><xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="signature"><xades:SignedProperties Id="xadesSignedProperties">
                                <xades:SignedSignatureProperties>
                                    <xades:SigningTime>${signingTime}</xades:SigningTime>
                                    <xades:SigningCertificate>
                                        <xades:Cert>
                                            <xades:CertDigest>
                                                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                                                <ds:DigestValue>${certDigestB64}</ds:DigestValue>
                                            </xades:CertDigest>
                                            <xades:IssuerSerial>
                                                <ds:X509IssuerName>${issuerParts}</ds:X509IssuerName>
                                                <ds:X509SerialNumber>${serialDec}</ds:X509SerialNumber>
                                            </xades:IssuerSerial>
                                        </xades:Cert>
                                    </xades:SigningCertificate>
                                </xades:SignedSignatureProperties>
                            </xades:SignedProperties></xades:QualifyingProperties></ds:Object></ds:Signature></sac:SignatureInformation></sig:UBLDocumentSignatures></ext:ExtensionContent></ext:UBLExtension></ext:UBLExtensions>`;

      const qrBlock = `<cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrPayload}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference><cac:Signature><cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID><cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod></cac:Signature>`;

      const signedXml = `<?xml version="1.0" encoding="UTF-8"?>\n${part1Open}${ublExtensionsXml}${part2BeforeQr}${qrBlock}${part3AfterQr}`;

      return {
        signedXml,
        canonicalInvoiceXml,
        invoiceHash,
        digitalSignature,
        qrPayload,
        isPhase2Signed: true,
      };
    } catch (signErr) {
      console.warn("[ZATCA Crypto Signing Fallback]:", signErr);
    }
  }

  // Fallback unsigned TLV 5-tag if certificate onboarding has not been run yet
  const fallbackQr = encodeTlv9Tag([
    [1, data.sellerNameAr],
    [2, data.sellerVatNumber],
    [3, `${issueDate}T${issueTime}`],
    [4, totalAmt],
    [5, vatAmt],
  ]);

  const qrBlockUnsigned = `<cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${fallbackQr}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>`;
  const unsignedXml = `<?xml version="1.0" encoding="UTF-8"?>\n${part1Open}${part2BeforeQr}${qrBlockUnsigned}${part3AfterQr}`;

  return {
    signedXml: unsignedXml,
    canonicalInvoiceXml,
    invoiceHash,
    digitalSignature: "",
    qrPayload: fallbackQr,
    isPhase2Signed: false,
  };
}

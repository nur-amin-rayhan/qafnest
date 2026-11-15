import crypto from "crypto";
import nodemailer from "nodemailer";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

export type ContactInquiryStatus = "new" | "in_progress" | "resolved";
export type ContactInquiryDeliveryStatus = "sent" | "stored_only" | "failed";

export interface ContactInquiryRecord {
  id: string;
  ticketNumber: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  source: "contact_page" | "account_support";
  locale: "en" | "ar";
  status: ContactInquiryStatus;
  createdAt: string;
  updatedAt: string;
  recipientEmail: string;
  deliveryStatus: ContactInquiryDeliveryStatus;
  deliveryError?: string;
  messageId?: string;
  adminNotes?: string;
}

export interface ContactFormSettings {
  recipientEmail: string;
  emailForwardingEnabled: boolean;
  autoReplyEnabled: boolean;
  subjectPrefix: string;
  responseSlaHours: number;
  updatedAt: string;
  updatedBy: string;
}

export interface GmailSmtpRuntimeStatus {
  configured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUserMasked: string | null;
  fromAddress: string;
  missingEnvVars: string[];
}

interface ContactStoreDoc {
  settings: ContactFormSettings;
  inquiries: ContactInquiryRecord[];
}

export const DEFAULT_CONTACT_FORM_SETTINGS: ContactFormSettings = {
  recipientEmail: "qafnest@gmail.com",
  emailForwardingEnabled: true,
  autoReplyEnabled: false,
  subjectPrefix: "[QafNest Contact]",
  responseSlaHours: 2,
  updatedAt: "2026-11-14T20:00:00.000Z",
  updatedBy: "System Default",
};

const SUBJECT_LABELS: Record<string, string> = {
  booking: "Existing Booking or Smart Lock",
  refund: "Cancellation & Refund Inquiry",
  host: "Host Partnership / List Property",
  general: "General Inquiries & Suggestions",
  account_support: "Guest Account Direct Support",
};

const CONTACT_STORE_FILE = "contact-inquiries.json";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeEmailOrDefault(email: string | undefined, fallback: string): string {
  const trimmed = String(email || "").trim();
  return isValidEmail(trimmed) ? trimmed : fallback;
}

function readDoc(): ContactStoreDoc {
  return readSharedJsonFile<ContactStoreDoc>(
    CONTACT_STORE_FILE,
    () => ({
      settings: { ...DEFAULT_CONTACT_FORM_SETTINGS },
      inquiries: [],
    }),
    (parsed) => {
      const doc = (parsed || {}) as Partial<ContactStoreDoc>;
      return {
        settings: {
          ...DEFAULT_CONTACT_FORM_SETTINGS,
          ...(doc.settings || {}),
          recipientEmail: normalizeEmailOrDefault(
            doc.settings?.recipientEmail,
            DEFAULT_CONTACT_FORM_SETTINGS.recipientEmail
          ),
        },
        inquiries: Array.isArray(doc.inquiries) ? doc.inquiries : [],
      };
    }
  );
}

function writeDoc(doc: ContactStoreDoc): void {
  writeSharedJsonFile(CONTACT_STORE_FILE, doc);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const prefix = local.slice(0, Math.min(3, local.length));
  return `${prefix}***@${domain}`;
}

function resolveSmtpCredentials() {
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || "").trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const explicitHost = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 465);
  const from = (process.env.CONTACT_FROM_EMAIL || user || DEFAULT_CONTACT_FORM_SETTINGS.recipientEmail).trim();
  return { user, pass, explicitHost, port, from };
}

function createGmailTransporter() {
  const { user, pass, explicitHost, port } = resolveSmtpCredentials();
  if (!user || !pass) return null;

  if (explicitHost) {
    return nodemailer.createTransport({
      host: explicitHost,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export function getGmailSmtpRuntimeStatus(): GmailSmtpRuntimeStatus {
  const { user, pass, explicitHost, port, from } = resolveSmtpCredentials();
  const missingEnvVars: string[] = [];
  if (!user) missingEnvVars.push("GMAIL_USER");
  if (!pass) missingEnvVars.push("GMAIL_APP_PASSWORD");

  return {
    configured: missingEnvVars.length === 0,
    smtpHost: explicitHost || "smtp.gmail.com",
    smtpPort: port,
    smtpUserMasked: user ? maskEmail(user) : null,
    fromAddress: from,
    missingEnvVars,
  };
}

export function getContactSettings(): ContactFormSettings {
  return readDoc().settings;
}

export function saveContactSettings(
  updates: Partial<ContactFormSettings>,
  updatedBy = "CMS Admin"
): ContactFormSettings {
  const doc = readDoc();
  const nextRecipient = updates.recipientEmail !== undefined
    ? updates.recipientEmail.trim()
    : doc.settings.recipientEmail;

  if (!isValidEmail(nextRecipient)) {
    throw new Error("Please provide a valid Gmail or email recipient address.");
  }

  const nextSettings: ContactFormSettings = {
    recipientEmail: nextRecipient,
    emailForwardingEnabled:
      typeof updates.emailForwardingEnabled === "boolean"
        ? updates.emailForwardingEnabled
        : doc.settings.emailForwardingEnabled,
    autoReplyEnabled:
      typeof updates.autoReplyEnabled === "boolean"
        ? updates.autoReplyEnabled
        : doc.settings.autoReplyEnabled,
    subjectPrefix:
      updates.subjectPrefix !== undefined && updates.subjectPrefix.trim()
        ? updates.subjectPrefix.trim().slice(0, 60)
        : doc.settings.subjectPrefix,
    responseSlaHours:
      updates.responseSlaHours !== undefined && Number(updates.responseSlaHours) > 0
        ? Math.min(72, Math.max(1, Math.round(Number(updates.responseSlaHours))))
        : doc.settings.responseSlaHours,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || doc.settings.updatedBy,
  };

  doc.settings = nextSettings;
  writeDoc(doc);
  return nextSettings;
}

export function listContactInquiries(limit = 200): ContactInquiryRecord[] {
  const doc = readDoc();
  return [...doc.inquiries]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export function updateContactInquiry(
  id: string,
  updates: { status?: ContactInquiryStatus; adminNotes?: string }
): ContactInquiryRecord | null {
  const doc = readDoc();
  const idx = doc.inquiries.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const existing = doc.inquiries[idx];
  const updated: ContactInquiryRecord = {
    ...existing,
    status:
      updates.status === "new" || updates.status === "in_progress" || updates.status === "resolved"
        ? updates.status
        : existing.status,
    adminNotes:
      updates.adminNotes !== undefined ? updates.adminNotes.trim().slice(0, 2000) : existing.adminNotes,
    updatedAt: new Date().toISOString(),
  };

  doc.inquiries[idx] = updated;
  writeDoc(doc);
  return updated;
}

export function deleteContactInquiry(id: string): boolean {
  const doc = readDoc();
  const next = doc.inquiries.filter((item) => item.id !== id);
  if (next.length === doc.inquiries.length) return false;
  doc.inquiries = next;
  writeDoc(doc);
  return true;
}

export async function submitContactInquiry(input: {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  source?: "contact_page" | "account_support";
  locale?: "en" | "ar";
}): Promise<{ inquiry: ContactInquiryRecord; emailSent: boolean; emailError?: string }> {
  const doc = readDoc();
  const now = new Date().toISOString();
  const id = `inq_${crypto.randomBytes(6).toString("hex")}`;
  const ticketNumber = `QN-${id.slice(-6).toUpperCase()}`;
  const subjectKey = String(input.subject || "general").trim() || "general";
  const subjectReadable = SUBJECT_LABELS[subjectKey] || subjectKey;
  const senderEmail = input.email && isValidEmail(input.email) ? input.email.trim() : undefined;

  const inquiry: ContactInquiryRecord = {
    id,
    ticketNumber,
    name: input.name.trim().slice(0, 140),
    phone: input.phone.trim().slice(0, 40),
    email: senderEmail,
    subject: subjectKey.slice(0, 120),
    message: input.message.trim().slice(0, 4000),
    source: input.source === "account_support" ? "account_support" : "contact_page",
    locale: input.locale === "ar" ? "ar" : "en",
    status: "new",
    createdAt: now,
    updatedAt: now,
    recipientEmail: doc.settings.recipientEmail,
    deliveryStatus: "stored_only",
  };

  doc.inquiries.unshift(inquiry);
  if (doc.inquiries.length > 500) {
    doc.inquiries = doc.inquiries.slice(0, 500);
  }
  writeDoc(doc);

  let emailSent = false;
  let emailError: string | undefined;

  if (doc.settings.emailForwardingEnabled) {
    const transporter = createGmailTransporter();
    if (!transporter) {
      emailError =
        "Gmail SMTP credentials (GMAIL_USER / GMAIL_APP_PASSWORD) are not configured on the server yet; inquiry saved to CMS Inbox.";
      inquiry.deliveryStatus = "stored_only";
      inquiry.deliveryError = emailError;
    } else {
      const { from } = resolveSmtpCredentials();
      const mailSubject = `${doc.settings.subjectPrefix} ${subjectReadable} (#${ticketNumber}) - ${inquiry.name}`;
      const textBody = [
        `New QafNest Contact Inquiry (${ticketNumber})`,
        `============================================`,
        `Name: ${inquiry.name}`,
        `Phone: ${inquiry.phone || "Not provided"}`,
        `Email: ${inquiry.email || "Not provided"}`,
        `Category: ${subjectReadable}`,
        `Source: ${inquiry.source} (${inquiry.locale.toUpperCase()})`,
        `Submitted At: ${now}`,
        ``,
        `Message:`,
        inquiry.message,
      ].join("\n");

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="margin: 0 0 12px; color: #4F2396;">New Contact Us Inquiry &mdash; #${escapeHtml(ticketNumber)}</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr><td style="padding: 6px 0; color: #6b7280;"><strong>Name:</strong></td><td style="padding: 6px 0;">${escapeHtml(inquiry.name)}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;"><strong>Phone:</strong></td><td style="padding: 6px 0;">${escapeHtml(inquiry.phone || "Not provided")}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;"><strong>Email:</strong></td><td style="padding: 6px 0;">${escapeHtml(inquiry.email || "Not provided")}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;"><strong>Category:</strong></td><td style="padding: 6px 0;">${escapeHtml(subjectReadable)}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;"><strong>Source:</strong></td><td style="padding: 6px 0;">${escapeHtml(inquiry.source)} (${escapeHtml(inquiry.locale.toUpperCase())})</td></tr>
          </table>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(inquiry.message)}</div>
        </div>
      `;

      try {
        const info = await transporter.sendMail({
          from: `"QafNest Support" <${from}>`,
          to: doc.settings.recipientEmail,
          replyTo: inquiry.email || undefined,
          subject: mailSubject,
          text: textBody,
          html: htmlBody,
        });
        emailSent = true;
        inquiry.deliveryStatus = "sent";
        inquiry.messageId = info.messageId;

        if (doc.settings.autoReplyEnabled && inquiry.email) {
          await transporter
            .sendMail({
              from: `"QafNest Support" <${from}>`,
              to: inquiry.email,
              replyTo: doc.settings.recipientEmail,
              subject:
                inquiry.locale === "ar"
                  ? `تم استلام رسالتك في قاف نست (#${ticketNumber})`
                  : `We received your QafNest inquiry (#${ticketNumber})`,
              text:
                inquiry.locale === "ar"
                  ? `مرحباً ${inquiry.name}،\n\nشكراً لتواصلك مع قاف نست. تم تسجيل طلبك برقم #${ticketNumber} وسيتواصل معك فريقنا خلال ${doc.settings.responseSlaHours} ساعة.\n\nفريق قاف نست`
                  : `Hello ${inquiry.name},\n\nThank you for contacting QafNest. Your ticket #${ticketNumber} has been received and our team will respond within ${doc.settings.responseSlaHours} hours.\n\nQafNest Support`,
            })
            .catch(() => {});
        }
      } catch (err: unknown) {
        emailError = err instanceof Error ? err.message : "Failed sending email via Gmail SMTP";
        inquiry.deliveryStatus = "failed";
        inquiry.deliveryError = emailError;
      }
    }

    const latestDoc = readDoc();
    const targetIdx = latestDoc.inquiries.findIndex((item) => item.id === inquiry.id);
    if (targetIdx !== -1) {
      latestDoc.inquiries[targetIdx] = inquiry;
      writeDoc(latestDoc);
    }
  }

  return { inquiry, emailSent, emailError };
}

export async function sendContactTestEmail(
  targetEmail?: string
): Promise<{ ok: boolean; recipient: string; messageId?: string; error?: string }> {
  const settings = getContactSettings();
  const recipient = normalizeEmailOrDefault(targetEmail, settings.recipientEmail);
  const transporter = createGmailTransporter();

  if (!transporter) {
    return {
      ok: false,
      recipient,
      error: "GMAIL_USER and GMAIL_APP_PASSWORD must be configured in your server environment first.",
    };
  }

  const { from } = resolveSmtpCredentials();
  try {
    const info = await transporter.sendMail({
      from: `"QafNest CMS" <${from}>`,
      to: recipient,
      subject: `${settings.subjectPrefix} Gmail SMTP Test Verification`,
      text: `QafNest Contact Us Gmail SMTP test succeeded at ${new Date().toISOString()}.\nConfigured recipient: ${recipient}`,
      html: `<p><strong>QafNest Contact Us Gmail SMTP test succeeded.</strong></p><p>Timestamp: ${escapeHtml(new Date().toISOString())}</p><p>Configured recipient: <code>${escapeHtml(recipient)}</code></p>`,
    });
    return { ok: true, recipient, messageId: info.messageId };
  } catch (err: unknown) {
    return {
      ok: false,
      recipient,
      error: err instanceof Error ? err.message : "Gmail SMTP connection failed",
    };
  }
}

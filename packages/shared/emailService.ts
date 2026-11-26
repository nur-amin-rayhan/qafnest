/**
 * QafNest Transactional Email Service
 * Powered by Resend Outbound API with optional SMTP fallback via Nodemailer
 */
import nodemailer from "nodemailer";
import { escapeHtml } from "./escapeHtml";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Core email sender function.
 * Uses Resend REST API if RESEND_API_KEY is present, otherwise falls back to configured SMTP.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const defaultFrom = (process.env.RESEND_FROM_EMAIL || "support@qafnest.com").trim();
  const formattedFrom = defaultFrom.includes("<")
    ? defaultFrom
    : `QafNest Support <${defaultFrom}>`;

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const validRecipients = recipients
    .map((r) => r.trim())
    .filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r));

  if (validRecipients.length === 0) {
    return {
      success: false,
      error: "No valid recipient email address provided.",
    };
  }

  // 1. Send via Resend REST API (fastest, most reliable, no SMTP overhead)
  if (apiKey) {
    try {
      const payload: Record<string, unknown> = {
        from: options.from || formattedFrom,
        to: validRecipients,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, "").trim(),
      };
      if (options.replyTo) {
        payload.reply_to = options.replyTo;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        name?: string;
      };

      if (!res.ok) {
        return {
          success: false,
          error: data.message || `Resend API returned status ${res.status}`,
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error contacting Resend API",
      };
    }
  }

  // 2. Fallback to configured Nodemailer SMTP (Gmail App Password or custom SMTP)
  const smtpUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "").trim();
  const smtpPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const smtpHost = (process.env.SMTP_HOST || "").trim();
  const smtpPort = Number(process.env.SMTP_PORT || 465);

  if (smtpUser && smtpPass) {
    try {
      const transporter = smtpHost
        ? nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          })
        : nodemailer.createTransport({
            service: "gmail",
            auth: { user: smtpUser, pass: smtpPass },
          });

      const info = await transporter.sendMail({
        from: options.from || formattedFrom,
        to: validRecipients,
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, "").trim(),
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "SMTP email delivery failed",
      };
    }
  }

  return {
    success: false,
    error: "No outbound email provider configured (set RESEND_API_KEY or SMTP credentials).",
  };
}

/**
 * Generates high-craft, humanized HTML for the guest inquiry auto-reply email.
 */
export function buildInquiryAutoReplyHtml(params: {
  name: string;
  ticketNumber: string;
  subjectTitle: string;
  message: string;
  locale?: "ar" | "en";
}): string {
  const isAr = params.locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const fontFamily = isAr
    ? "'Tajawal', 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const greeting = isAr
    ? `مرحباً ${escapeHtml(params.name)}،`
    : `Hello ${escapeHtml(params.name)},`;

  const bannerText = isAr ? "تم استلام رسالتك بنجاح" : "We Received Your Message";
  const subtitle = isAr
    ? "شكراً لتواصلك مع منصة قاف نست للضيافة والسكن الفاخر بالمملكة العربية السعودية. تم تسجيل استفسارك وسيقوم فريق العمليات بمراجعته والتواصل معك خلال ساعتي عمل."
    : "Thank you for reaching out to QafNest Luxury Stays & Hospitality in Saudi Arabia. Your inquiry has been logged and our central operations team will review it and reply within 2 business hours.";

  const ticketLabel = isAr ? "رقم مرجع التذكرة" : "Inquiry Ticket Reference";
  const categoryLabel = isAr ? "تصنيف الاستفسار" : "Category";
  const messageLabel = isAr ? "نص رسالتك" : "Your Submitted Message";
  const assistanceTitle = isAr ? "هل تحتاج مساعدة عاجلة؟" : "Need Urgent Assistance?";
  const assistanceDesc = isAr
    ? "يمكنك الاتصال مباشرة بفريق الدعم على مدار الساعة أو عبر واتساب الرسمي:"
    : "You can reach our 24/7 Saudi helpline directly or connect on official WhatsApp:";

  return `
<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isAr ? "تأكيد استلام رسالتك - قاف نست" : "Inquiry Confirmation - QafNest"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: ${fontFamily}; color: #1e293b; direction: ${dir}; text-align: ${isAr ? "right" : "left"};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #3B1973; padding: 28px 32px; text-align: ${isAr ? "right" : "left"};">
              <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Qaf<span style="color: #c084fc;">Nest</span>
              </div>
              <div style="margin-top: 12px; font-size: 18px; font-weight: 700; color: #ffffff;">
                ${bannerText}
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 12px;">
                ${greeting}
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
                ${subtitle}
              </p>

              <!-- Ticket Box -->
              <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #7e22ce; letter-spacing: 0.5px; margin-bottom: 4px;">
                  ${ticketLabel}
                </div>
                <div style="font-size: 22px; font-weight: 800; font-family: monospace; color: #3b0764;">
                  #${escapeHtml(params.ticketNumber)}
                </div>
                <div style="font-size: 12px; color: #6b21a8; margin-top: 6px;">
                  <strong>${categoryLabel}:</strong> ${escapeHtml(params.subjectTitle)}
                </div>
              </div>

              <!-- Message Copy -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px;">
                  ${messageLabel}
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
                  ${escapeHtml(params.message)}
                </div>
              </div>

              <!-- Immediate Assistance -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px;">
                <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 6px;">
                  ${assistanceTitle}
                </p>
                <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.5;">
                  ${assistanceDesc}
                </p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <a href="tel:+966576707709" style="display: inline-block; background-color: #3B1973; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 8px;">
                    📞 +966 57 670 7709
                  </a>
                  <a href="https://wa.me/966576707709" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 8px; margin-${isAr ? "right" : "left"}: 8px;">
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              <div>QafNest Technologies &bull; Riyadh & Jeddah, Kingdom of Saudi Arabia</div>
              <div style="margin-top: 4px;">support@qafnest.com &bull; +966 57 670 7709</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

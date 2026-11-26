/**
 * Shared HTML, attribute, CSV, JSON-LD, XML, and safe href escaping helpers
 * (pure JS with zero DOM/Node runtime dependencies so Edge Middleware stays safe).
 */

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Neutralizes spreadsheet formula injection (=, +, -, @, tab, CR) and quotes RFC 4180 CSV cells.
 */
export function sanitizeCsvCell(value: unknown): string {
  let raw = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(raw)) {
    raw = `'${raw}`;
  }
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Serializes JSON-LD safely inside <script type="application/ld+json"> tags,
 * escaping '<' and Unicode line separators so </script> breakouts are impossible.
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function sanitizeHrefUrl(
  rawUrl: string | null | undefined,
  allowedProtocols: string[] = ["http:", "https:", "mailto:", "tel:"]
): string {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    const proto = parsed.protocol.toLowerCase();
    if (allowedProtocols.includes(proto)) {
      if (proto === "data:" && !/^data:image\/(?:png|jpeg|jpg|webp|avif|gif);base64,/i.test(trimmed)) {
        return "";
      }
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Sanitizes rich HTML content by stripping dangerous tags and scripts
 * while preserving safe formatting tags (h1-h6, p, ul, ol, li, strong, em, blockquote, a, img).
 */
export function sanitizeRichHtml(html: string): string {
  if (typeof html !== "string") return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}


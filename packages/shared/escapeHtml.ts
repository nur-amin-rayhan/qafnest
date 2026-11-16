/**
 * Shared HTML, attribute, XML, and Blog rich-text escaping/sanitization helpers
 * used across invoice HTML/PDF renderers, ZATCA UBL XML generators, and CMS blogs.
 */

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeHrefUrl(rawUrl: string | null | undefined, allowedProtocols: string[] = ["http:", "https:", "mailto:", "tel:"]): string {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (allowedProtocols.includes(parsed.protocol.toLowerCase())) {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Strips executable elements (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<svg onload=...>`,
 * inline event handlers `on*=`, and `javascript:`/`vbscript:`/`data:text/html` URIs) from CMS HTML.
 */
export function sanitizeRichHtml(rawHtml: unknown): string {
  let html = String(rawHtml ?? "");
  if (!html) return "";

  html = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|iframe|object|embed|applet|meta|link|base|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|applet|meta|link|base|form)\b[^>]*\/?>/gi, "")
    .replace(/<\s*svg\b[^>]*>[\s\S]*?<\s*\/\s*svg\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src|xlink:href|action|formaction)\s*=\s*(["'])\s*(?:javascript:|vbscript:|data:(?!image\/(?:png|jpe?g|webp|gif);base64,))[\s\S]*?\2/gi, '$1="#"');

  return html;
}

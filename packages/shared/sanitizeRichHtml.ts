import DOMPurify from "isomorphic-dompurify";

const RICH_HTML_ALLOWED_TAGS = [
  "a", "b", "blockquote", "br", "caption", "code", "div", "em", "figcaption", "figure",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre",
  "s", "span", "strong", "sub", "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
];

const RICH_HTML_ALLOWED_ATTR = [
  "alt", "class", "colspan", "dir", "height", "href", "lang", "loading", "rel", "rowspan", "src", "style", "target", "title", "width",
];

/**
 * DOMPurify-backed rich HTML sanitizer enforcing a strict tag/attribute allowlist and safe URL protocols.
 * Kept separate from escapeHtml.ts so Edge Middleware bundles never import DOMPurify.
 */
export function sanitizeRichHtml(rawHtml: unknown): string {
  const html = String(rawHtml ?? "");
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_HTML_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "applet", "meta", "link", "base", "form", "svg", "math", "style"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "formaction", "xlink:href"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/(?!\/|\\)|data:image\/(?:png|jpe?g|webp|avif|gif);base64,)/i,
  });
}

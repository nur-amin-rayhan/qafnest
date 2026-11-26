/**
 * Shared Next.js security headers and allowed remote image patterns.
 * Single source of truth across Guest, Host, CMS, and Admin portals.
 */

const BASE_IMAGE_PATTERNS = [
  { protocol: "https", hostname: "*.supabase.co" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "lh3.googleusercontent.com" },
  { protocol: "https", hostname: "firebasestorage.googleapis.com" },
  { protocol: "https", hostname: "cdn.tamara.co" },
  { protocol: "https", hostname: "img.mpay.samsung.com" },
  { protocol: "https", hostname: "api.qrserver.com" },
  { protocol: "https", hostname: "tile.openstreetmap.org" },
  { protocol: "https", hostname: "qafnest.com" },
  { protocol: "https", hostname: "*.qafnest.com" },
];

export function getAllowedImageRemotePatterns() {
  const patterns = [...BASE_IMAGE_PATTERNS];
  const isProd = process.env.NODE_ENV === "production";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      const protocol = parsed.protocol.replace(":", "");
      if (
        (protocol === "https" || (!isProd && protocol === "http")) &&
        parsed.hostname &&
        !parsed.hostname.endsWith(".supabase.co")
      ) {
        patterns.push({ protocol, hostname: parsed.hostname });
      }
    } catch {
      // Ignore malformed env URL
    }
  }

  if (!isProd) {
    patterns.push(
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" }
    );
  }

  return patterns;
}

export function buildContentSecurityPolicy() {
  const isProd = process.env.NODE_ENV === "production";

  let customSupabaseOrigin = "";
  let customSupabaseWs = "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      customSupabaseOrigin = ` ${parsed.origin}`;
      customSupabaseWs = ` ${parsed.origin.replace(/^http/, "ws")}`;
    } catch {
      // Ignore malformed env URL
    }
  }

  const devConnect = isProd
    ? ""
    : " http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*";
  const scriptEval = isProd ? "" : " 'unsafe-eval'";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${scriptEval} https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://www.gstatic.com https://www.google.com https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:" + (isProd ? "" : " http://localhost:* http://127.0.0.1:*"),
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${customSupabaseOrigin}${customSupabaseWs} https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.google.com https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://challenges.cloudflare.com https://*.myfatoorah.com https://api.myfatoorah.com https://apitest.myfatoorah.com https://nominatim.openstreetmap.org https://photon.komoot.io https://geocode.arcgis.com https://tile.openstreetmap.org${devConnect}`,
    "frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://maps.google.com https://accounts.google.com https://*.firebaseapp.com https://*.myfatoorah.com",
    "worker-src 'self' blob:",
    "form-action 'self' https://*.myfatoorah.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function getGlobalSecurityHeaders() {
  const isProd = process.env.NODE_ENV === "production";
  const headers = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];

  if (isProd) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

/**
 * Ignores runtime-mutated JSON data stores so Next.js dev server does not
 * trigger HMR / RSC refetch storms on polling reads or state hydration.
 */
export function applySharedWebpackConfig(config, sharedPath) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "@qafnest/shared": sharedPath,
  };
  const prevIgnored = config.watchOptions?.ignored;
  const extraGlobs = ["**/packages/shared/data/**", "**/.qafnest-*.json"];
  let nextIgnored;
  if (prevIgnored instanceof RegExp) {
    nextIgnored = new RegExp(
      `${prevIgnored.source}|packages[/\\\\]shared[/\\\\]data|\\.qafnest-.*\\.json`
    );
  } else if (Array.isArray(prevIgnored)) {
    const stringGlobs = prevIgnored.filter((item) => typeof item === "string" && item.length > 0);
    nextIgnored = [...stringGlobs, ...extraGlobs];
  } else if (typeof prevIgnored === "string" && prevIgnored.length > 0) {
    nextIgnored = [prevIgnored, ...extraGlobs];
  } else {
    nextIgnored = ["**/node_modules/**", "**/.git/**", ...extraGlobs];
  }
  config.watchOptions = {
    ...config.watchOptions,
    ignored: nextIgnored,
  };
  return config;
}

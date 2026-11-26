import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import net from "net";
import { verifyHostSession } from "@/lib/auth/serverAuth";
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsUrl,
  extractGoogleMapsPlaceQuery,
  extractGoogleMapsUrlFromInput,
  isGoogleMapsEmbedUrl,
  isValidLatLng,
  parseGoogleMapsCoordinates,
} from "@/lib/geo/mapsUrlParser";
import {
  forwardGeocodeReal,
  reverseGeocodeReal,
  type ServerGeocodedLocation,
} from "@/lib/geo/serverGeocoder";

function isPrivateOrReservedIp(ip: string): boolean {
  const clean = ip.replace(/^::ffff:/i, "").trim().toLowerCase();
  if (net.isIPv4(clean)) {
    const parts = clean.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }
  if (net.isIPv6(clean)) {
    const bare = clean.split("%")[0];
    if (bare === "::" || bare === "::1" || bare === "0:0:0:0:0:0:0:0" || bare === "0:0:0:0:0:0:0:1") {
      return true;
    }
    const firstHextetHex = bare.split(":")[0] || "";
    const firstHextet = parseInt(firstHextetHex || "0", 16);
    if (
      bare.startsWith("fc") ||
      bare.startsWith("fd") ||
      bare.startsWith("ff") ||
      bare.startsWith("2001:db8") ||
      (firstHextet >= 0xfe80 && firstHextet <= 0xfebf)
    ) {
      return true;
    }
    return false;
  }
  return true;
}

const MAX_MAPS_RESPONSE_BYTES = 2 * 1024 * 1024;

async function readBoundedResponseText(res: Response, maxBytes = MAX_MAPS_RESPONSE_BYTES): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        const remaining = value.subarray(0, Math.max(0, value.byteLength - (total - maxBytes)));
        if (remaining.byteLength > 0) chunks.push(remaining);
        await reader.cancel().catch(() => {});
        break;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

async function assertPublicGoogleUrl(targetUrl: string): Promise<URL> {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP(S) URLs are allowed");
  }
  if (!isAllowedGoogleHost(parsed.hostname)) {
    throw new Error("Only Google Maps URLs are allowed");
  }
  if (net.isIP(parsed.hostname)) {
    throw new Error("IP literals are not allowed");
  }
  const resolved = await dns.lookup(parsed.hostname, { all: true });
  if (!resolved.length || resolved.some((entry) => isPrivateOrReservedIp(entry.address))) {
    throw new Error("Blocked private or reserved network destination");
  }
  return parsed;
}

async function safeFetchGoogleUrl(initialUrl: string, signal?: AbortSignal): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicGoogleUrl(currentUrl);
    const res = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return { response: res, finalUrl: res.url || currentUrl };
  }
  throw new Error("Too many Google Maps redirects");
}

function isAllowedGoogleHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "g.co" ||
    host === "share.google"
  ) {
    return true;
  }
  return /^(?:maps\.|www\.)?google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/i.test(host);
}

function stripBidiControls(input: string): string {
  return input.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
}

function decodeHtmlEntities(input: string): string {
  return stripBidiControls(
    input
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  ).trim();
}

function cleanMetaCandidate(raw: string | undefined | null): string {
  if (!raw) return "";
  const cleaned = decodeHtmlEntities(raw).replace(/\s*·\s*Google Maps.*$/i, "").trim();
  if (
    !cleaned ||
    cleaned.length <= 2 ||
    /^google maps$/i.test(cleaned) ||
    /^خرائط\s*google/i.test(cleaned) ||
    /^find local businesses/i.test(cleaned) ||
    /^\d{1,3}°\d{1,2}'/.test(cleaned)
  ) {
    return "";
  }
  return cleaned;
}

async function fetchGooglePreviewHints(
  html: string
): Promise<{ placeTitle: string; placeAddress: string; coords: { lat: number; lng: number } | null }> {
  const empty = { placeTitle: "", placeAddress: "", coords: null };
  const preloadMatch = html.match(/href="(\/maps\/preview\/place\?[^"]+)"/i);
  if (!preloadMatch?.[1]) return empty;

  const previewPath = decodeHtmlEntities(preloadMatch[1]);
  if (!previewPath.startsWith("/maps/preview/place?")) return empty;

  try {
    const targetPreviewUrl = `https://www.google.com${previewPath}`;
    await assertPublicGoogleUrl(targetPreviewUrl);
    const res = await fetch(targetPreviewUrl, {
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
      },
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });
    if (!res.ok) return empty;
    const rawText = await readBoundedResponseText(res).catch(() => "");
    const jsonText = rawText.replace(/^\)\]\}'\s*/, "");
    const parsed = JSON.parse(jsonText) as unknown[];
    const placeTuple = Array.isArray(parsed?.[6]) ? (parsed[6] as unknown[]) : null;
    if (!placeTuple) return empty;

    const placeTitle =
      typeof placeTuple[11] === "string" ? cleanMetaCandidate(placeTuple[11]) : "";

    const rawAddrLines = Array.isArray(placeTuple[2])
      ? (placeTuple[2] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const structuredComps = Array.isArray((placeTuple[183] as unknown[] | undefined)?.[1])
      ? ((placeTuple[183] as unknown[])[1] as unknown[]).filter(
          (x): x is string => typeof x === "string"
        )
      : [];
    const fallbackAddrStr =
      typeof placeTuple[39] === "string"
        ? placeTuple[39]
        : typeof placeTuple[18] === "string"
          ? placeTuple[18]
          : "";

    const rawCombinedAddr =
      rawAddrLines.length > 0
        ? rawAddrLines.join(", ")
        : structuredComps.length > 1
          ? [structuredComps[1], structuredComps[0], structuredComps[3], structuredComps[4]]
              .filter(Boolean)
              .join(", ")
          : fallbackAddrStr;

    const placeAddress = cleanMetaCandidate(rawCombinedAddr);

    let coords: { lat: number; lng: number } | null = null;
    const coordTuple = Array.isArray(placeTuple[9]) ? (placeTuple[9] as unknown[]) : null;
    if (coordTuple && typeof coordTuple[2] === "number" && typeof coordTuple[3] === "number") {
      if (isValidLatLng(coordTuple[2], coordTuple[3])) {
        coords = { lat: coordTuple[2], lng: coordTuple[3] };
      }
    }

    return { placeTitle, placeAddress, coords };
  } catch {
    return empty;
  }
}

function extractMetaHintsFromHtml(html: string): { placeTitle: string; placeAddress: string } {
  const titleCandidates = [
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1],
    html.match(/<meta[^>]+itemprop=["']name["'][^>]+content=["']([^"']+)["']/i)?.[1],
  ];
  const descCandidates = [
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1],
    html.match(/<meta[^>]+itemprop=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1],
  ];

  const placeTitle = titleCandidates.map(cleanMetaCandidate).find(Boolean) || "";
  const placeAddress = descCandidates.map(cleanMetaCandidate).find(Boolean) || "";
  return { placeTitle, placeAddress };
}

function extractCoordsFromHtmlBody(html: string): { lat: number; lng: number } | null {
  const staticCenter = html.match(/center=([+-]?\d+\.?\d+)(?:%2C|,)([+-]?\d+\.?\d+)/i);
  if (staticCenter) {
    const lat = parseFloat(staticCenter[1]);
    const lng = parseFloat(staticCenter[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  const stateCoords = html.match(/\[null,null,([+-]?\d+\.\d+),([+-]?\d+\.\d+)\]/);
  if (stateCoords) {
    const lat = parseFloat(stateCoords[1]);
    const lng = parseFloat(stateCoords[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  return parseGoogleMapsCoordinates(html);
}

function formatSuccessPayload(params: {
  geo: ServerGeocodedLocation;
  resolvedUrl: string;
  googleMapsUrl: string;
  embedUrl: string;
  placeName?: string;
}) {
  const { geo, resolvedUrl, googleMapsUrl, embedUrl, placeName } = params;
  return {
    success: true,
    ...geo,
    city: geo.cityId,
    resolvedUrl,
    googleMapsUrl,
    embedUrl,
    placeName: placeName || "",
  };
}

export async function POST(request: NextRequest) {
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", error: "Host authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const lang: "ar" | "en" = body.lang === "ar" ? "ar" : "en";

    // Mode 1: Direct coordinate reverse geocoding (map drag/click/GPS)
    if (typeof body.url !== "string" && typeof body.lat === "number" && typeof body.lng === "number") {
      if (!isValidLatLng(body.lat, body.lng)) {
        return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
      }
      const preferredCity = typeof body.preferredCity === "string" ? body.preferredCity : null;
      const geo = await reverseGeocodeReal(body.lat, body.lng, { preferredCity });
      const mapsUrl = buildGoogleMapsUrl(geo.lat, geo.lng);
      return NextResponse.json(
        formatSuccessPayload({
          geo,
          resolvedUrl: mapsUrl,
          googleMapsUrl: mapsUrl,
          embedUrl: buildGoogleMapsEmbedUrl(geo.lat, geo.lng, lang),
        })
      );
    }

    // Mode 2: Address / Place forward geocoding search
    if (typeof body.url !== "string" && typeof body.query === "string" && body.query.trim()) {
      const cityHint = typeof body.cityHint === "string" ? body.cityHint : null;
      const geo = await forwardGeocodeReal(body.query.trim(), { cityHint });
      if (!geo) {
        return NextResponse.json(
          { error: "Could not find this location. Try adding the city or pasting a Google Maps link." },
          { status: 404 }
        );
      }
      const mapsUrl = buildGoogleMapsUrl(geo.lat, geo.lng);
      return NextResponse.json(
        formatSuccessPayload({
          geo,
          resolvedUrl: mapsUrl,
          googleMapsUrl: mapsUrl,
          embedUrl: buildGoogleMapsEmbedUrl(geo.lat, geo.lng, lang),
          placeName: body.query.trim(),
        })
      );
    }

    // Mode 3: Google Maps URL resolution + full bilingual address fetch
    const rawInput = typeof body.url === "string" ? body.url.trim() : "";
    const rawUrl = extractGoogleMapsUrlFromInput(rawInput);

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing or invalid Google Maps URL" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return NextResponse.json({ error: "Only HTTP(S) URLs are allowed" }, { status: 400 });
    }

    if (!isAllowedGoogleHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Only Google Maps URLs are allowed" }, { status: 400 });
    }

    let finalUrl = rawUrl;
    let coords = parseGoogleMapsCoordinates(rawUrl);
    let htmlPlaceHint = "";
    let htmlAddressHint = "";
    const urlPlaceHint = cleanMetaCandidate(extractGoogleMapsPlaceQuery(rawUrl));

    // Fetch URL to expand shortened links (maps.app.goo.gl / goo.gl / g.co) or retrieve Google's preloaded place address
    const shouldFetchRemote =
      !coords ||
      parsedUrl.hostname === "maps.app.goo.gl" ||
      parsedUrl.hostname === "goo.gl" ||
      parsedUrl.hostname === "g.co" ||
      parsedUrl.hostname === "share.google" ||
      parsedUrl.pathname.includes("/maps/place/");

    if (shouldFetchRemote && !isGoogleMapsEmbedUrl(rawUrl)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const { response, finalUrl: resolvedFinalUrl } = await safeFetchGoogleUrl(
          rawUrl,
          controller.signal
        ).finally(() => clearTimeout(timeout));

        finalUrl = resolvedFinalUrl || rawUrl;
        if (!coords) {
          coords = parseGoogleMapsCoordinates(finalUrl);
        }

        if (response.ok) {
          const html = await readBoundedResponseText(response).catch(() => "");
          if (html) {
            const [hints, preview] = await Promise.all([
              Promise.resolve(extractMetaHintsFromHtml(html)),
              fetchGooglePreviewHints(html),
            ]);
            if (!coords) {
              coords = preview.coords || extractCoordsFromHtmlBody(html);
            }
            htmlPlaceHint = preview.placeTitle || hints.placeTitle;
            htmlAddressHint = preview.placeAddress || hints.placeAddress;
          }
        }
      } catch {
        // Proceed with inline URL parsing/place query if remote fetch fails
      }
    }

    const resolvedPlaceHint =
      htmlPlaceHint ||
      cleanMetaCandidate(extractGoogleMapsPlaceQuery(finalUrl)) ||
      urlPlaceHint;

    let geo: ServerGeocodedLocation | null = null;
    if (coords) {
      geo = await reverseGeocodeReal(coords.lat, coords.lng, {
        placeHint: resolvedPlaceHint,
        addressHint: htmlAddressHint,
      });
    } else if (resolvedPlaceHint || htmlAddressHint) {
      geo = await forwardGeocodeReal(resolvedPlaceHint || htmlAddressHint, {
        addressHint: htmlAddressHint,
      });
    }

    if (!geo) {
      return NextResponse.json(
        {
          error:
            "Could not extract location coordinates or address from this link. Paste the full Google Maps share link.",
          resolvedUrl: finalUrl,
        },
        { status: 422 }
      );
    }

    const embedUrl = buildGoogleMapsEmbedUrl(geo.lat, geo.lng, lang, rawUrl);
    // Preserve direct Google share link for booking/WhatsApp sharing (never save iframe embed HTML URL as share URL)
    const canonicalShareUrl = isGoogleMapsEmbedUrl(rawUrl)
      ? buildGoogleMapsUrl(geo.lat, geo.lng)
      : rawUrl;

    return NextResponse.json(
      formatSuccessPayload({
        geo,
        resolvedUrl: finalUrl,
        googleMapsUrl: canonicalShareUrl,
        embedUrl,
        placeName: resolvedPlaceHint,
      })
    );
  } catch (err: unknown) {
    console.error("[host resolve-maps-url] error:", err);
    return NextResponse.json(
      { error: "Failed to process location request" },
      { status: 500 }
    );
  }
}

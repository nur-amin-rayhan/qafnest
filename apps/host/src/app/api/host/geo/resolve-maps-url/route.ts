import { NextRequest, NextResponse } from "next/server";
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
    const res = await fetch(`https://www.google.com${previewPath}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
      },
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });
    if (!res.ok) return empty;
    const rawText = await res.text().catch(() => "");
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
        const response = await fetch(rawUrl, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
          },
        }).finally(() => clearTimeout(timeout));

        finalUrl = response.url || rawUrl;
        if (!coords) {
          coords = parseGoogleMapsCoordinates(finalUrl);
        }

        if (response.ok) {
          const html = await response.text().catch(() => "");
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process location request" },
      { status: 500 }
    );
  }
}

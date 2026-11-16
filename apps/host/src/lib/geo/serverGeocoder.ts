import { resolveSaudiCity } from "@qafnest/shared";
import {
  fetchArcgisForward,
  fetchArcgisReverse,
  fetchGoogleRestGeocode,
  fetchNominatimForward,
  fetchNominatimReverse,
  fetchPhotonForwardCoords,
  fetchPhotonReverse,
} from "./serverGeocoderProviders";
import {
  arabicRoadToEnglishFallback,
  areSimilarRoadNames,
  combineBuildingWithRoad,
  computeDirectionFromCenter,
  dedupeJoin,
  DIRECTION_EN_MAP,
  englishRoadToArabicFallback,
  extractBuildingNumberPrefix,
  extractStreetFromPlaceHint,
  findNearestSaudiCity,
  hasArabic,
  hasLatin,
  isNoiseHint,
  isStreetOrBuildingSegment,
  normalizeArabicDigits,
  normalizeComparableName,
  normalizeHints,
  pickNominatimField,
  stripBidiChars,
} from "./serverGeocoderText";
import type { ArcgisForwardCandidate, ServerGeocodedLocation } from "./serverGeocoderTypes";

export type { ServerGeocodedLocation } from "./serverGeocoderTypes";

/** Resolves exact GPS coordinates into rich bilingual (EN + AR) address components. */
export async function reverseGeocodeReal(
  lat: number,
  lng: number,
  options?: { placeHint?: string | null; addressHint?: string | null; preferredCity?: string | null }
): Promise<ServerGeocodedLocation> {
  const cleanLat = Number(lat.toFixed(6));
  const cleanLng = Number(lng.toFixed(6));

  const [googleEn, googleAr, arcgisEn, arcgisAr, nomEn] = await Promise.all([
    fetchGoogleRestGeocode({ lat: cleanLat, lng: cleanLng }, "en"),
    fetchGoogleRestGeocode({ lat: cleanLat, lng: cleanLng }, "ar"),
    fetchArcgisReverse(cleanLat, cleanLng, "EN"),
    fetchArcgisReverse(cleanLat, cleanLng, "AR"),
    fetchNominatimReverse(cleanLat, cleanLng, "en"),
  ]);

  const streetFields = ["road", "pedestrian", "street", "residential", "footway", "path", "track"] as const;
  const nomStreetEnRaw = [
    pickNominatimField(nomEn?.address, ["house_number"]),
    pickNominatimField(nomEn?.address, [...streetFields]) ||
      (nomEn?.category === "highway" && nomEn.name && !isNoiseHint(nomEn.name) ? nomEn.name.trim() : ""),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const nomAr = !arcgisAr?.district || !arcgisAr?.street ? await fetchNominatimReverse(cleanLat, cleanLng, "ar") : null;
  const nomStreetArRaw = [
    pickNominatimField(nomAr?.address, [...streetFields]) ||
      (nomAr?.category === "highway" && nomAr.name && !isNoiseHint(nomAr.name) ? nomAr.name.trim() : ""),
    pickNominatimField(nomAr?.address, ["house_number"]),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const hasInitialStreet = Boolean(
    googleEn?.street || googleAr?.street || arcgisEn?.street || arcgisAr?.street || nomStreetEnRaw || nomStreetArRaw
  );
  const photon = !hasInitialStreet ? await fetchPhotonReverse(cleanLat, cleanLng) : null;
  const photonStreetRaw = photon
    ? [photon.housenumber, photon.street || (photon.osm_key === "highway" || photon.type === "street" ? photon.name : "")]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  const cityFields = ["city", "town", "village", "municipality", "state_district", "county"] as const;
  const rawCityEn = googleEn?.city || arcgisEn?.city || pickNominatimField(nomEn?.address, [...cityFields]) || photon?.city || "";
  const rawCityAr = googleAr?.city || arcgisAr?.city || pickNominatimField(nomAr?.address, [...cityFields]) || "";

  const matchedCity =
    resolveSaudiCity(rawCityEn) ||
    resolveSaudiCity(rawCityAr) ||
    resolveSaudiCity(options?.placeHint) ||
    resolveSaudiCity(options?.preferredCity);
  const nearest = findNearestSaudiCity(cleanLat, cleanLng);
  const effectiveSaudiCity = matchedCity || (nearest.distanceDeg < 0.8 ? nearest.city : undefined);

  const cityEn = effectiveSaudiCity?.en || (hasLatin(rawCityEn) ? rawCityEn : "") || rawCityEn || rawCityAr || "Riyadh";
  const cityAr = effectiveSaudiCity?.ar || (hasArabic(rawCityAr) ? rawCityAr : "") || rawCityAr || rawCityEn || "الرياض";

  const rawStateEn = googleEn?.state || arcgisEn?.state || pickNominatimField(nomEn?.address, ["state", "province", "region"]) || effectiveSaudiCity?.regionEn || "";
  const rawStateAr = googleAr?.state || arcgisAr?.state || pickNominatimField(nomAr?.address, ["state", "province", "region"]) || effectiveSaudiCity?.regionAr || rawStateEn;
  const stateEn = hasLatin(rawStateEn) ? rawStateEn : effectiveSaudiCity?.regionEn || rawStateEn;
  const stateAr = hasArabic(rawStateAr) ? rawStateAr : effectiveSaudiCity?.regionAr || rawStateAr;

  const districtFields = ["suburb", "neighbourhood", "quarter", "city_district", "hamlet", "residential"] as const;
  const rawDistrictEn =
    googleEn?.district || arcgisEn?.district || pickNominatimField(nomEn?.address, [...districtFields]) ||
    (photon?.district && hasLatin(photon.district) ? photon.district.trim() : "") ||
    (photon?.locality && hasLatin(photon.locality) ? photon.locality.trim() : "");
  const rawDistrictAr =
    googleAr?.district || arcgisAr?.district || pickNominatimField(nomAr?.address, [...districtFields]) ||
    (photon?.district && hasArabic(photon.district) ? photon.district.trim() : "") ||
    (photon?.locality && hasArabic(photon.locality) ? photon.locality.trim() : "");

  const resolvedDistrictEn = (hasLatin(rawDistrictEn) ? rawDistrictEn : "") || (hasLatin(rawDistrictAr) ? rawDistrictAr : "") || cityEn;
  const resolvedDistrictAr = (hasArabic(rawDistrictAr) ? rawDistrictAr : "") || (hasArabic(rawDistrictEn) ? rawDistrictEn : "") || cityAr;

  const hintStreet =
    extractStreetFromPlaceHint(options?.addressHint || "", cityEn, cityAr, resolvedDistrictEn, resolvedDistrictAr) ||
    extractStreetFromPlaceHint(options?.placeHint || "", cityEn, cityAr, resolvedDistrictEn, resolvedDistrictAr);

  const explicitBuildingNum = extractBuildingNumberPrefix(hintStreet);
  const hintHasRoadOrNum = Boolean(hintStreet && isStreetOrBuildingSegment(hintStreet));

  let baseStreetEn = googleEn?.street || arcgisEn?.street || (hasLatin(nomStreetEnRaw) ? nomStreetEnRaw : "") || (hasLatin(photonStreetRaw) ? photonStreetRaw : "");
  let baseStreetAr = googleAr?.street || arcgisAr?.street || (hasArabic(nomStreetArRaw) ? nomStreetArRaw : "") || (hasArabic(photonStreetRaw) ? photonStreetRaw : "");

  if (explicitBuildingNum && !googleEn?.street && !googleAr?.street) {
    const sameRoadEn = Boolean(baseStreetEn && areSimilarRoadNames(hintStreet, baseStreetEn));
    const sameRoadAr = Boolean(baseStreetAr && areSimilarRoadNames(hintStreet, baseStreetAr));
    if (hasLatin(hintStreet)) {
      baseStreetEn = sameRoadEn ? combineBuildingWithRoad(explicitBuildingNum, baseStreetEn, arcgisEn?.addNum) : hintStreet;
      baseStreetAr = sameRoadAr ? combineBuildingWithRoad(explicitBuildingNum, baseStreetAr, arcgisAr?.addNum) : "";
    } else if (hasArabic(hintStreet)) {
      baseStreetAr = sameRoadAr ? combineBuildingWithRoad(explicitBuildingNum, baseStreetAr, arcgisAr?.addNum) : hintStreet;
      baseStreetEn = sameRoadEn ? combineBuildingWithRoad(explicitBuildingNum, baseStreetEn, arcgisEn?.addNum) : "";
    }
  } else if (hintHasRoadOrNum && !googleEn?.street && !googleAr?.street) {
    if (hasLatin(hintStreet) && !baseStreetEn) baseStreetEn = hintStreet;
    if (hasArabic(hintStreet) && !baseStreetAr) baseStreetAr = hintStreet;
  }

  let resolvedStreetEn = baseStreetEn || (hasLatin(hintStreet) ? hintStreet : "");
  let resolvedStreetAr = baseStreetAr || (hasArabic(hintStreet) ? hintStreet : "");
  if (!resolvedStreetEn && resolvedStreetAr) resolvedStreetEn = arabicRoadToEnglishFallback(resolvedStreetAr);
  if (!resolvedStreetAr && resolvedStreetEn) resolvedStreetAr = englishRoadToArabicFallback(resolvedStreetEn);
  if (!resolvedStreetEn) resolvedStreetEn = `${resolvedDistrictEn || cityEn} Main Rd`;
  if (!resolvedStreetAr) resolvedStreetAr = `طريق ${resolvedDistrictAr || cityAr} الرئيسي`;

  const postalCode = googleEn?.postalCode || googleAr?.postalCode || arcgisEn?.postalCode || arcgisAr?.postalCode || nomEn?.address?.postcode || nomAr?.address?.postcode || (photon?.postcode || "").trim() || "";
  const cleanAddressHint = normalizeHints(options?.addressHint);
  const placeVenueName = normalizeHints(options?.placeHint).split(/[،,·|]/)[0]?.trim() || "";
  const rawPlaceCheck = normalizeComparableName(placeVenueName);
  const knownNames = [cityEn, cityAr, resolvedDistrictEn, resolvedDistrictAr, resolvedStreetEn, resolvedStreetAr].map(normalizeComparableName);
  const isDuplicatePlaceHint =
    !placeVenueName || isNoiseHint(placeVenueName) || knownNames.includes(rawPlaceCheck) ||
    areSimilarRoadNames(placeVenueName, resolvedStreetEn) || areSimilarRoadNames(placeVenueName, resolvedStreetAr);

  const builtAddressEn = googleEn?.formattedAddress || dedupeJoin([resolvedStreetEn, !isDuplicatePlaceHint && hasLatin(placeVenueName) ? placeVenueName : "", resolvedDistrictEn !== cityEn ? resolvedDistrictEn : "", cityEn, stateEn, postalCode, "Saudi Arabia"], ", ");
  const builtAddressAr = googleAr?.formattedAddress || dedupeJoin([resolvedStreetAr, !isDuplicatePlaceHint && hasArabic(placeVenueName) ? placeVenueName : "", resolvedDistrictAr !== cityAr ? resolvedDistrictAr : "", cityAr, stateAr, postalCode, "المملكة العربية السعودية"], "، ");
  const finalAddressEn = builtAddressEn || cleanAddressHint || nomEn?.display_name || arcgisEn?.formattedAddress || "";
  const finalAddressAr = builtAddressAr || (hasArabic(cleanAddressHint) ? cleanAddressHint : "") || arcgisAr?.formattedAddress || nomAr?.display_name || finalAddressEn;

  const direction = computeDirectionFromCenter(cleanLat, cleanLng, effectiveSaudiCity?.lat ?? cleanLat, effectiveSaudiCity?.lng ?? cleanLng);
  const source: ServerGeocodedLocation["source"] = googleEn || googleAr ? "google" : arcgisEn || arcgisAr || nomEn || nomAr || photon ? "nominatim" : "fallback";

  return {
    found: source !== "fallback",
    source,
    lat: cleanLat,
    lng: cleanLng,
    cityId: cityAr,
    cityEn,
    cityAr,
    state: stateEn,
    stateAr,
    district: resolvedDistrictEn,
    districtAr: resolvedDistrictAr,
    street: resolvedStreetEn,
    streetAr: resolvedStreetAr,
    postalCode,
    address: finalAddressEn,
    addressAr: finalAddressAr,
    direction,
    directionEn: DIRECTION_EN_MAP[direction],
  };
}

/** Forward-geocodes a place name, street query, or Google Maps URL label into bilingual location metadata. */
export async function forwardGeocodeReal(
  query: string,
  options?: { cityHint?: string | null; addressHint?: string | null }
): Promise<ServerGeocodedLocation | null> {
  const trimmed = normalizeArabicDigits(stripBidiChars(query || "")).trim();
  if (!trimmed) return null;

  const cityObj = resolveSaudiCity(options?.cityHint) || resolveSaudiCity(trimmed);
  const queryWithContext =
    cityObj && !trimmed.toLowerCase().includes(cityObj.en.toLowerCase()) && !trimmed.includes(cityObj.ar)
      ? `${trimmed}, ${cityObj.en}, Saudi Arabia`
      : trimmed;
  const reverseOpts = { placeHint: trimmed, addressHint: options?.addressHint || trimmed, preferredCity: options?.cityHint || cityObj?.en };

  const googleFirst = await fetchGoogleRestGeocode({ address: queryWithContext }, "en");
  if (googleFirst && (Math.abs(googleFirst.lat) > 0.0001 || Math.abs(googleFirst.lng) > 0.0001)) {
    return reverseGeocodeReal(googleFirst.lat, googleFirst.lng, reverseOpts);
  }

  let results = await fetchNominatimForward(queryWithContext, true);
  if (results.length === 0 && queryWithContext !== trimmed) results = await fetchNominatimForward(trimmed, true);
  if (results.length === 0) results = await fetchNominatimForward(trimmed, false);

  if (results.length === 0) {
    const strippedBuildingQuery = trimmed.replace(/^\d{3,5}\s+/, "").trim();
    const arcQueries = [queryWithContext];
    if (strippedBuildingQuery && strippedBuildingQuery !== trimmed) {
      arcQueries.push(
        cityObj && !strippedBuildingQuery.toLowerCase().includes(cityObj.en.toLowerCase()) && !strippedBuildingQuery.includes(cityObj.ar)
          ? `${strippedBuildingQuery}, ${cityObj.en}, Saudi Arabia`
          : strippedBuildingQuery
      );
    }

    let arcBest: ArcgisForwardCandidate | undefined;
    for (const aq of arcQueries) {
      const cands = await fetchArcgisForward(aq);
      const top = cands
        .map((c) => {
          let total = c.score + (c.stAddr ? 15 : 0);
          if (cityObj) {
            const hay = `${c.address} ${c.city}`.toLowerCase();
            if (hay.includes(cityObj.en.toLowerCase()) || hay.includes(cityObj.ar)) total += 25;
          }
          return { c, total };
        })
        .sort((a, b) => b.total - a.total)[0]?.c;
      if (top && (top.stAddr || top.score >= 82)) {
        arcBest = top;
        break;
      }
      if (!arcBest && top && top.score >= 78) arcBest = top;
    }

    if (arcBest) return reverseGeocodeReal(arcBest.lat, arcBest.lng, reverseOpts);
    const photonCoords = await fetchPhotonForwardCoords(queryWithContext);
    return photonCoords ? reverseGeocodeReal(photonCoords[1], photonCoords[0], reverseOpts) : null;
  }

  const best = results
    .map((r) => {
      const hay = `${r.display_name || ""} ${r.address?.city || ""} ${r.address?.state || ""}`.toLowerCase();
      const cityBoost = cityObj && (hay.includes(cityObj.en.toLowerCase()) || hay.includes(cityObj.ar)) ? 5 : 0;
      return { r, score: Number(r.importance || 0) + cityBoost };
    })
    .sort((a, b) => b.score - a.score)[0]?.r;

  const bestLat = Number(best?.lat);
  const bestLng = Number(best?.lon);
  return Number.isFinite(bestLat) && Number.isFinite(bestLng) ? reverseGeocodeReal(bestLat, bestLng, reverseOpts) : null;
}

export interface ServerGeocodedLocation {
  found: boolean;
  source: "google" | "nominatim" | "fallback";
  lat: number;
  lng: number;
  cityId: string;
  cityEn: string;
  cityAr: string;
  state: string;
  stateAr: string;
  district: string;
  districtAr: string;
  street: string;
  streetAr: string;
  postalCode: string;
  address: string;
  addressAr: string;
  direction: "شمال" | "جنوب" | "شرق" | "غرب" | "وسط";
  directionEn: string;
}

export interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  street?: string;
  residential?: string;
  footway?: string;
  path?: string;
  track?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  hamlet?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  province?: string;
  region?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimResponse {
  lat?: string;
  lon?: string;
  name?: string;
  category?: string;
  type?: string;
  display_name?: string;
  importance?: number;
  address?: NominatimAddress;
}

export interface StructuredGeoProviderResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  street: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  addrType?: string;
  addNum?: string;
  snapDistanceMeters?: number;
}

export interface PhotonFeatureProperties {
  osm_key?: string;
  osm_value?: string;
  type?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  locality?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
}

export interface ArcgisForwardCandidate {
  score: number;
  lat: number;
  lng: number;
  address: string;
  stAddr: string;
  addrType: string;
  city: string;
  district: string;
}

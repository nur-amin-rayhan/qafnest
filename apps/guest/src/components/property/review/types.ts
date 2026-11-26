export type PaymentMethod =
  | "card"
  | "mada"
  | "apple"
  | "google"
  | "stcpay"
  | "samsung"
  | "tabby"
  | "tamara"
  | "wallet";

export type OtpChannel = "sms" | "whatsapp";
export type OtpStep = "code" | "profile";

export interface SamsungPayClientCapability {
  available: boolean;
  requiresSetup: boolean;
  serviceId: string | null;
  environment: "STAGE" | "STAGE_WITHOUT_APK" | "PRODUCTION";
}

export interface GatewayMethodCapability {
  available: boolean;
  code: string;
  methodId: number;
  isEmbedded: boolean;
  currency: string;
  labelEn: string;
  labelAr: string;
}

export interface GatewayCapabilitiesResponse {
  configured: boolean;
  isTest: boolean;
  methods: {
    card: GatewayMethodCapability;
    mada: GatewayMethodCapability;
    apple: GatewayMethodCapability;
    google: GatewayMethodCapability;
    stcpay: GatewayMethodCapability;
    samsung: SamsungPayClientCapability;
  };
}

export const OTP_LENGTH =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_OTP_LENGTH === "4" ? 4 : 6;

export function resetRecaptcha(widgetId: number | null) {
  if (widgetId === null || typeof window === "undefined") return;
  const grecaptcha = (
    window as unknown as { grecaptcha?: { reset: (id?: number) => void } }
  ).grecaptcha;
  grecaptcha?.reset(widgetId);
}

export type ConfirmedBooking = {
  bookingId: string;
  bookingRef: string;
  smartLockPin: string | null;
  amount: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  property: {
    id: string;
    title: string;
    titleAr?: string | null;
    title_ar?: string | null;
    city?: string | null;
    city_name: string;
    state?: string | null;
    stateAr?: string | null;
    state_ar?: string | null;
    district?: string | null;
    districtAr?: string | null;
    district_ar?: string | null;
    street?: string | null;
    streetAr?: string | null;
    street_ar?: string | null;
    address?: string | null;
    addressAr?: string | null;
    address_ar?: string | null;
    postalCode?: string | null;
    postal_code?: string | null;
    lat?: number | null;
    lng?: number | null;
    googleMapsUrl?: string | null;
    google_maps_url?: string | null;
    images: string[];
  };
};

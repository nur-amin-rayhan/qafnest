import { NextResponse } from "next/server";
import { PROPERTIES, getPropertyCapacity } from "@/data/properties";
import { createClient } from "@/lib/supabase/server";

const paymentMethods = ["card", "apple", "tabby", "tamara"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

function paymentProviderFor(method: PaymentMethod) {
  // These settings can later be read from the admin/CMS payment-gateway table.
  // Card and Apple Pay share the same processor; BNPL providers are independent.
  if (method === "card" || method === "apple") return process.env.CARD_PAYMENT_PROVIDER || null;
  if (method === "tabby") return process.env.TABBY_PAYMENT_PROVIDER || null;
  return process.env.TAMARA_PAYMENT_PROVIDER || null;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    }
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const method = body.method;
  if (typeof method !== "string" || !paymentMethods.includes(method as PaymentMethod)) {
    return NextResponse.json({ code: "unsupported_payment_method" }, { status: 400 });
  }
  const selectedMethod = method as PaymentMethod;

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !user.phone_confirmed_at) {
    return NextResponse.json({ code: "phone_verification_required" }, { status: 401 });
  }

  const firstName = user.user_metadata?.first_name;
  const lastName = user.user_metadata?.last_name;
  const contactEmail = user.user_metadata?.contact_email;
  if (typeof firstName !== "string" || !firstName.trim() || typeof lastName !== "string" || !lastName.trim() || typeof contactEmail !== "string" || !contactEmail.includes("@")) {
    return NextResponse.json({ code: "profile_details_required" }, { status: 400 });
  }

  const propertyId = body.propertyId;
  const property = typeof propertyId === "string" ? PROPERTIES.find((item) => item.id === propertyId) : undefined;
  const checkIn = body.checkIn;
  const checkOut = body.checkOut;
  const guests = body.guests;
  if (!property || !isIsoDate(checkIn) || !isIsoDate(checkOut) || !Number.isInteger(guests)) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }

  const nights = (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86_400_000;
  if (nights < 1 || nights > 90 || Number(guests) < 1 || Number(guests) > getPropertyCapacity(property)) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }

  const provider = paymentProviderFor(selectedMethod);
  if (!provider) {
    return NextResponse.json({
      code: "payment_provider_not_configured",
      method: selectedMethod,
      provider: selectedMethod === "card" || selectedMethod === "apple" ? "Card / Apple Pay" : selectedMethod === "tabby" ? "Tabby" : "Tamara",
    }, { status: 503 });
  }

  // Do not collect raw card data or create a pretend payment. A provider adapter
  // must create a tokenized/hosted or embedded checkout session before enabling
  // this path for live payments.
  return NextResponse.json({ code: "payment_adapter_not_available", method: selectedMethod }, { status: 503 });
}

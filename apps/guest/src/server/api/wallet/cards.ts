import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import {
  getUserSavedCards,
  saveUserCard,
  setDefaultUserCard,
  deleteUserCard,
  toPublicSavedCard,
} from "@/lib/services/walletService";

export async function GET(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cards = (await getUserSavedCards(authUser.id)).map(toPublicSavedCard);
  return NextResponse.json(
    { success: true, cards },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}

export async function POST(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cardholderName = String(body.cardholderName || "").trim();
  const rawLast4 = String(body.last4 || "").replace(/\D/g, "");
  const cardDigits = String(body.cardNumber || "").replace(/\D/g, "");
  const last4 = /^\d{4}$/.test(rawLast4) ? rawLast4 : cardDigits.slice(-4);
  const expiryMonth = String(body.expiryMonth || "").trim();
  const expiryYear = String(body.expiryYear || "").trim();
  const gatewayToken = typeof body.gatewayToken === "string" ? body.gatewayToken.trim() : undefined;
  const panHash = typeof body.panHash === "string" ? body.panHash.trim() : undefined;
  const isDefault = Boolean(body.isDefault);

  const monthNum = parseInt(expiryMonth, 10);
  if (
    !cardholderName ||
    !/^\d{4}$/.test(last4) ||
    !expiryMonth ||
    !expiryYear ||
    isNaN(monthNum) ||
    monthNum < 1 ||
    monthNum > 12
  ) {
    return NextResponse.json(
      { error: "Please enter valid cardholder name, last 4 card digits, and expiry date." },
      { status: 400 }
    );
  }

  // PCI-DSS: NEVER store full PAN or CVV on our servers; only masked display metadata or gateway tokens
  const newCard = await saveUserCard(authUser.id, {
    cardholderName,
    last4,
    cardNumber: cardDigits,
    expiryMonth,
    expiryYear,
    brand: typeof body.brand === "string" ? (body.brand as any) : undefined,
    gatewayToken,
    panHash,
    maskedPan: `**** **** **** ${last4}`,
    isDefault,
  });

  const allCards = (await getUserSavedCards(authUser.id)).map(toPublicSavedCard);

  return NextResponse.json({
    success: true,
    card: toPublicSavedCard(newCard),
    cards: allCards,
    message: "Card metadata saved securely (PAN & CVV are never stored).",
  });
}

async function handleSetDefault(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cardId = String(body.cardId || "").trim();
  if (!cardId) {
    return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
  }

  const result = await setDefaultUserCard(authUser.id, cardId);
  if (!result.updated) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    cards: result.cards.map(toPublicSavedCard),
    message: "Default card updated successfully.",
  });
}

export async function PUT(request: Request) {
  return handleSetDefault(request);
}

export async function PATCH(request: Request) {
  return handleSetDefault(request);
}

export async function DELETE(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cardId = url.searchParams.get("cardId");
  if (!cardId) {
    return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
  }

  const result = await deleteUserCard(authUser.id, cardId);
  if (!result.removed) {
    const status = result.errorCode === "not_found" ? 404 : 400;
    return NextResponse.json(
      {
        success: false,
        code: result.errorCode || "delete_blocked",
        error: result.message || "Unable to delete card.",
        messageAr: result.messageAr,
        cards: result.cards.map(toPublicSavedCard),
      },
      { status }
    );
  }

  return NextResponse.json({
    success: true,
    cards: result.cards.map(toPublicSavedCard),
  });
}

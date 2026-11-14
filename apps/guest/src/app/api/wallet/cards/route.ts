import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import {
  getUserSavedCards,
  saveUserCard,
  deleteUserCard,
} from "@/lib/services/walletService";

export async function GET(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cards = await getUserSavedCards(authUser.id);
  return NextResponse.json({ success: true, cards });
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
  const cardNumber = String(body.cardNumber || "").replace(/\s/g, "");
  const expiryMonth = String(body.expiryMonth || "").trim();
  const expiryYear = String(body.expiryYear || "").trim();
  const isDefault = Boolean(body.isDefault);

  if (!cardholderName || cardNumber.length < 15 || !expiryMonth || !expiryYear) {
    return NextResponse.json(
      { error: "Please enter complete cardholder name, valid card number, and expiry date." },
      { status: 400 }
    );
  }

  const newCard = await saveUserCard(authUser.id, {
    cardholderName,
    cardNumber,
    expiryMonth,
    expiryYear,
    isDefault,
  });

  return NextResponse.json({
    success: true,
    card: newCard,
    message: "Card saved successfully for fast 1-click checkout!",
  });
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

  const removed = await deleteUserCard(authUser.id, cardId);
  return NextResponse.json({ success: removed });
}

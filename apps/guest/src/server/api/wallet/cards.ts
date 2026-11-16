import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import {
  getUserSavedCards,
  saveUserCard,
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
  const cardNumber = String(body.cardNumber || "").replace(/\D/g, "");
  const expiryMonth = String(body.expiryMonth || "").trim();
  const expiryYear = String(body.expiryYear || "").trim();
  const cvv = String(body.cvv || "").replace(/\D/g, "");
  const isDefault = Boolean(body.isDefault);

  const monthNum = parseInt(expiryMonth, 10);
  if (
    !cardholderName ||
    cardNumber.length < 15 ||
    cardNumber.length > 19 ||
    !expiryMonth ||
    !expiryYear ||
    isNaN(monthNum) ||
    monthNum < 1 ||
    monthNum > 12 ||
    !/^\d{3,4}$/.test(cvv)
  ) {
    return NextResponse.json(
      { error: "Please enter complete cardholder name, valid card number, expiry date, and CVV." },
      { status: 400 }
    );
  }

  const newCard = await saveUserCard(authUser.id, {
    cardholderName,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    isDefault,
  });

  return NextResponse.json({
    success: true,
    card: toPublicSavedCard(newCard),
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

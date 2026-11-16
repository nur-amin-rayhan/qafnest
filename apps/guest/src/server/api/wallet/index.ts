import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import {
  getUserWallet,
  getActiveLoyaltyOffers,
  toPublicSavedCard,
} from "@/lib/services/walletService";


export async function GET(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = authUser.id;
  const wallet = await getUserWallet(userId);
  const safeWallet = {
    ...wallet,
    savedCards: (wallet.savedCards || []).map(toPublicSavedCard),
  };
  const offers = getActiveLoyaltyOffers();

  return NextResponse.json(
    {
      success: true,
      wallet: safeWallet,
      offers,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}

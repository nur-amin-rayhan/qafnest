import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getUserWallet, getActiveLoyaltyOffers } from "@/lib/services/walletService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = authUser.id;
  const wallet = await getUserWallet(userId);
  const offers = getActiveLoyaltyOffers();

  return NextResponse.json(
    {
      success: true,
      wallet,
      offers,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}

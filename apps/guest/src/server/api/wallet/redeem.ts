import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { redeemPointsForCredit } from "@/lib/services/walletService";

export async function POST(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const points = Number(body.points);
  if (isNaN(points) || points < 100) {
    return NextResponse.json(
      { error: "Minimum 100 points required for redemption" },
      { status: 400 }
    );
  }

  const result = await redeemPointsForCredit({
    userId: authUser.id,
    pointsToRedeem: Math.floor(points),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message || "Redemption failed" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    wallet: result.wallet,
    message: "Points redeemed successfully!",
  });
}

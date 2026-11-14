import { NextResponse } from "next/server";
import {
  getServerSaudiIdentityConfig,
  updateServerSaudiIdentityConfig,
} from "@qafnest/shared/saudiIdentityStore";

export async function GET() {
  const config = getServerSaudiIdentityConfig();
  return NextResponse.json({ success: true, config });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = updateServerSaudiIdentityConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update identity configuration";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

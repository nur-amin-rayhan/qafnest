import { NextResponse } from "next/server";

export async function POST() {
  // Guest PIN control is strictly disabled. Smart lock PINs are exclusively set and managed by the property host.
  return NextResponse.json(
    {
      code: "forbidden_guest_control",
      message: "Guests cannot configure or update smart lock PIN codes. Smart lock passcodes are exclusively assigned and managed by property hosts from the Host Portal.",
    },
    { status: 403 }
  );
}


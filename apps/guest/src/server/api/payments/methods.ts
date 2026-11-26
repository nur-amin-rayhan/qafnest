import { NextResponse } from "next/server";
import { getSupportedGatewayCapabilities } from "@/lib/services/myfatoorah";

export async function GET() {
  try {
    const capabilities = await getSupportedGatewayCapabilities();
    return NextResponse.json({
      success: true,
      provider: "MyFatoorah",
      ...capabilities,
    });
  } catch (err: unknown) {
    console.error("[payment methods] error:", err);
    return NextResponse.json(
      {
        success: false,
        provider: "MyFatoorah",
        configured: false,
        error: "Could not check payment methods.",
      },
      { status: 500 }
    );
  }
}

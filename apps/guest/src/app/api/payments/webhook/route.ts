import { NextRequest } from "next/server";
import { POST as handleMyFatoorahWebhook } from "@/app/api/payments/myfatoorah/webhook/route";

export async function POST(request: NextRequest) {
  return handleMyFatoorahWebhook(request);
}


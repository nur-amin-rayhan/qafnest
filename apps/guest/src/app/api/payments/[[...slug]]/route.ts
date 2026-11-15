import { NextRequest } from "next/server";
import { dispatchApiModule, type RouteModule } from "@/server/api/dispatchRoute";
import * as checkoutRoute from "@/server/api/payments/checkout";
import * as checkoutAbandonRoute from "@/server/api/payments/checkoutAbandon";
import * as methodsRoute from "@/server/api/payments/methods";
import * as myfatoorahCallbackRoute from "@/server/api/payments/myfatoorahCallback";
import * as myfatoorahWebhookRoute from "@/server/api/payments/myfatoorahWebhook";

export const dynamic = "force-dynamic";

const PAYMENTS_ROUTES: Record<string, RouteModule> = {
  checkout: checkoutRoute,
  "checkout/abandon": checkoutAbandonRoute,
  methods: methodsRoute,
  "myfatoorah/callback": myfatoorahCallbackRoute,
  "myfatoorah/webhook": myfatoorahWebhookRoute,
  webhook: myfatoorahWebhookRoute,
};

async function handlePaymentsRoute(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  const pathKey = (context.params?.slug ?? []).join("/");
  return dispatchApiModule(PAYMENTS_ROUTES[pathKey] ?? null, request);
}

export async function GET(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handlePaymentsRoute(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handlePaymentsRoute(request, context);
}

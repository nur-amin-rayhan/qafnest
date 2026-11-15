import { NextRequest } from "next/server";
import { dispatchApiModule, type RouteModule } from "@/server/api/dispatchRoute";
import * as listRoute from "@/server/api/bookings/list";
import * as byRefRoute from "@/server/api/bookings/byRef";
import * as cancelRoute from "@/server/api/bookings/cancel";
import * as pinRoute from "@/server/api/bookings/pin";
import * as transferClaimRoute from "@/server/api/bookings/transferClaim";

export const dynamic = "force-dynamic";

async function handleBookingsRoute(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  const slug = context.params?.slug ?? [];
  let routeModule: RouteModule | null = null;
  let subContext: unknown;

  if (slug.length === 0) {
    routeModule = listRoute;
  } else if (slug.length === 1) {
    routeModule = byRefRoute;
    subContext = { params: { ref: slug[0] } };
  } else if (slug.length === 2) {
    const refPromise = Promise.resolve({ ref: slug[0] });
    if (slug[1] === "cancel") {
      routeModule = cancelRoute;
      subContext = { params: refPromise };
    } else if (slug[1] === "pin") {
      routeModule = pinRoute;
    } else if (slug[1] === "transfer-claim") {
      routeModule = transferClaimRoute;
      subContext = { params: refPromise };
    }
  }

  return dispatchApiModule(routeModule, request, subContext);
}

export async function GET(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handleBookingsRoute(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handleBookingsRoute(request, context);
}

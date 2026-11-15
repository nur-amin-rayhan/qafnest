import { NextRequest } from "next/server";
import { dispatchApiModule, type RouteModule } from "@/server/api/dispatchRoute";
import * as adminReviewsRoute from "@/server/api/core/adminReviews";
import * as adminReviewsReplyRoute from "@/server/api/core/adminReviewsReply";
import * as authDevLoginRoute from "@/server/api/core/authDevLogin";
import * as authSignupGuardRoute from "@/server/api/core/authSignupGuard";
import * as authWelcomeBonusRoute from "@/server/api/core/authWelcomeBonus";
import * as cmsBlogsRoute from "@/server/api/core/cmsBlogs";
import * as cmsPagesRoute from "@/server/api/core/cmsPages";
import * as contactRoute from "@/server/api/core/contact";
import * as couponsActiveRoute from "@/server/api/core/couponsActive";
import * as couponsValidateRoute from "@/server/api/core/couponsValidate";
import * as invoicesZatcaRoute from "@/server/api/core/invoicesZatca";
import * as platformFeesRoute from "@/server/api/core/platformFees";
import * as profileRoute from "@/server/api/core/profile";
import * as profileVerifyRoute from "@/server/api/core/profileVerify";
import * as propertyAvailabilityRoute from "@/server/api/core/propertyAvailability";
import * as reviewsEligibilityRoute from "@/server/api/core/reviewsEligibility";
import * as reviewsListRoute from "@/server/api/core/reviewsList";
import * as reviewsSubmitRoute from "@/server/api/core/reviewsSubmit";
import * as translateRoute from "@/server/api/core/translate";
import * as verifyBookingRoute from "@/server/api/core/verifyBooking";
import * as walletRoute from "@/server/api/wallet/index";
import * as walletCardsRoute from "@/server/api/wallet/cards";
import * as walletRedeemRoute from "@/server/api/wallet/redeem";
import * as walletTopupRoute from "@/server/api/wallet/topup";
import * as walletTopupCallbackRoute from "@/server/api/wallet/topupCallback";

export const dynamic = "force-dynamic";

const CORE_ROUTES: Record<string, RouteModule> = {
  "admin/reviews": adminReviewsRoute,
  "admin/reviews/reply": adminReviewsReplyRoute,
  "auth/dev-login": authDevLoginRoute,
  "auth/signup-guard": authSignupGuardRoute,
  "auth/welcome-bonus": authWelcomeBonusRoute,
  "cms/blogs": cmsBlogsRoute,
  "cms/pages": cmsPagesRoute,
  contact: contactRoute,
  "coupons/active": couponsActiveRoute,
  "coupons/validate": couponsValidateRoute,
  "invoices/zatca": invoicesZatcaRoute,
  "platform/fees": platformFeesRoute,
  profile: profileRoute,
  "profile/verify": profileVerifyRoute,
  reviews: reviewsListRoute,
  "reviews/eligibility": reviewsEligibilityRoute,
  "reviews/submit": reviewsSubmitRoute,
  translate: translateRoute,
  wallet: walletRoute,
  "wallet/cards": walletCardsRoute,
  "wallet/redeem": walletRedeemRoute,
  "wallet/topup": walletTopupRoute,
  "wallet/topup/callback": walletTopupCallbackRoute,
};

async function handleCoreApiRoute(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  const slug = context.params?.slug ?? [];
  const pathKey = slug.join("/");

  let routeModule: RouteModule | null = CORE_ROUTES[pathKey] ?? null;
  let subContext: unknown;

  if (!routeModule && slug.length === 3 && slug[0] === "properties" && slug[2] === "availability") {
    routeModule = propertyAvailabilityRoute;
    subContext = { params: { id: slug[1] } };
  } else if (!routeModule && slug.length === 2 && slug[0] === "verify-booking") {
    routeModule = verifyBookingRoute;
    subContext = { params: Promise.resolve({ token: slug[1] }) };
  }

  return dispatchApiModule(routeModule, request, subContext);
}

export async function GET(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handleCoreApiRoute(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handleCoreApiRoute(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handleCoreApiRoute(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { slug?: string[] } }
) {
  return handleCoreApiRoute(request, context);
}

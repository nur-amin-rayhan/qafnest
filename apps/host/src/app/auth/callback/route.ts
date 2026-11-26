import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authorizeHostPortalAccount } from "@/lib/auth/serverAuth";
import { signPortalSessionToken } from "@qafnest/shared/portalSessionEdge";
import { normalizePhoneInput, normalizeSaudiPhone } from "@qafnest/shared/phone";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/app";
  const isSafeRelativePath = requestedNext.startsWith("/") && !/^\/[\/\\]/.test(requestedNext);
  let destination = new URL(isSafeRelativePath ? requestedNext : "/app", requestUrl.origin);
  if (destination.origin !== requestUrl.origin) {
    destination = new URL("/app", requestUrl.origin);
  }

  if (!code) {
    destination.searchParams.set("auth_error", "confirmation_code_missing");
    return NextResponse.redirect(destination);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    destination.searchParams.set("auth_error", "confirmation_failed");
    return NextResponse.redirect(destination);
  }

  const user = data.user;
  const allowed = await authorizeHostPortalAccount({
    uid: user.id,
    provider: "supabase",
    appMeta: (user.app_metadata || {}) as Record<string, unknown>,
    userMeta: (user.user_metadata || {}) as Record<string, unknown>,
    allowEnrollment: true,
  });

  if (!allowed) {
    await supabase.auth.signOut().catch(() => {});
    destination.searchParams.set("auth_error", "guest_account_not_allowed");
    return NextResponse.redirect(destination);
  }

  const rawPhone =
    user.phone ||
    (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
  const phone = rawPhone
    ? normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)
    : null;
  const signedToken = await signPortalSessionToken(
    {
      sub: user.id,
      role: "host",
      provider: "supabase",
      phone,
      email: user.email || null,
      name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null,
    },
    86400
  );

  const response = NextResponse.redirect(destination);
  if (signedToken) {
    response.cookies.set("qafnest_has_host_session", signedToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 86400,
    });
  }
  return response;
}

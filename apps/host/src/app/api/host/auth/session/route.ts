import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  authorizeHostPortalAccount,
  verifyFirebaseTokenPayload,
} from "@/lib/auth/serverAuth";
import { signPortalSessionToken } from "@qafnest/shared/portalSessionEdge";
import { normalizePhoneInput, normalizeSaudiPhone } from "@qafnest/shared/phone";

export async function POST(request: NextRequest) {
  let bodyToken: string | null = null;
  try {
    const body = (await request.json()) as { accessToken?: unknown };
    if (typeof body?.accessToken === "string" && body.accessToken.trim()) {
      bodyToken = body.accessToken.trim();
    }
  } catch {
    // Empty body is valid when authenticating via Bearer header or Supabase SSR cookies
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || bodyToken;

  let uid: string | null = null;
  let provider: "supabase" | "firebase" = "supabase";
  let phone: string | null = null;
  let email: string | null = null;
  let name: string | null = null;
  let appMeta: Record<string, unknown> = {};
  let userMeta: Record<string, unknown> = {};

  if (bearer && bearer !== "dev_host_token") {
    const fbUser = await verifyFirebaseTokenPayload(bearer);
    if (fbUser) {
      uid = fbUser.id;
      provider = "firebase";
      phone = fbUser.phone;
      email = fbUser.email;
      name = fbUser.name;
    } else {
      try {
        const supabase = await createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(bearer);
        if (!error && user) {
          uid = user.id;
          provider = "supabase";
          const rawPhone =
            user.phone ||
            (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
          phone = rawPhone
            ? normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)
            : null;
          email = user.email || null;
          name =
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : null;
          appMeta = (user.app_metadata || {}) as Record<string, unknown>;
          userMeta = (user.user_metadata || {}) as Record<string, unknown>;
        }
      } catch {}
    }
  }

  if (!uid) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!error && user) {
        uid = user.id;
        provider = "supabase";
        const rawPhone =
          user.phone ||
          (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
        phone = rawPhone
          ? normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)
          : null;
        email = user.email || null;
        name =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null;
        appMeta = (user.app_metadata || {}) as Record<string, unknown>;
        userMeta = (user.user_metadata || {}) as Record<string, unknown>;
      }
    } catch {}
  }

  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await authorizeHostPortalAccount({
    uid,
    provider,
    appMeta,
    userMeta,
    allowEnrollment: true,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Guest or unauthorized accounts cannot sign in to the host portal." },
      { status: 403 }
    );
  }

  const signedToken = await signPortalSessionToken(
    {
      sub: uid,
      role: "host",
      provider,
      phone,
      email,
      name,
    },
    86400
  );

  if (!signedToken) {
    return NextResponse.json(
      { error: "Session signing secret is not configured." },
      { status: 503 }
    );
  }

  const response = NextResponse.json({ authenticated: true, role: "host" });
  response.cookies.set("qafnest_has_host_session", signedToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 86400,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  response.cookies.set("qafnest_has_host_session", "", cookieOpts);
  response.cookies.set("qafnest_host_dev", "", cookieOpts);
  return response;
}

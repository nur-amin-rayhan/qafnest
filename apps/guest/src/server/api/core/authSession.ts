import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { verifyFirebaseIdToken } from "@/lib/auth/serverAuth";
import { signPortalSessionToken } from "@qafnest/shared/portalSessionEdge";
import {
  getRegisteredPortalRole,
  registerPortalAccount,
} from "@qafnest/shared/portalRegistryStore";
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
  let isHostFlag = false;
  let supabaseUserAppMeta: Record<string, unknown> | null = null;

  if (bearer && bearer !== "dev_guest_token") {
    const fbUser = await verifyFirebaseIdToken(bearer);
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
          supabaseUserAppMeta = (user.app_metadata || {}) as Record<string, unknown>;
          isHostFlag =
            user.app_metadata?.role === "host" ||
            user.user_metadata?.role === "host" ||
            user.id === (process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002");
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
        supabaseUserAppMeta = (user.app_metadata || {}) as Record<string, unknown>;
        isHostFlag =
          user.app_metadata?.role === "host" ||
          user.user_metadata?.role === "host" ||
          user.id === (process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002");
      }
    } catch {}
  }

  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const registeredRole = await getRegisteredPortalRole(uid);
  if (isHostFlag || registeredRole === "host") {
    return NextResponse.json(
      { error: "Host accounts cannot sign in to the guest portal." },
      { status: 403 }
    );
  }

  const registration = await registerPortalAccount(uid, "guest", provider);
  if (!registration.ok) {
    return NextResponse.json(
      { error: "Host accounts cannot sign in to the guest portal." },
      { status: 403 }
    );
  }

  // Stamp immutable app_metadata.role on Supabase user when service role is available
  if (provider === "supabase" && !supabaseUserAppMeta?.role) {
    try {
      const adminDb = await getAdminOrServerClient();
      if (typeof (adminDb as any).auth?.admin?.updateUserById === "function") {
        await (adminDb as any).auth.admin.updateUserById(uid, {
          app_metadata: { ...(supabaseUserAppMeta || {}), role: "guest" },
        });
      }
    } catch {}
  }

  const signedToken = await signPortalSessionToken(
    {
      sub: uid,
      role: "guest",
      provider,
      phone,
      email,
      name,
    },
    3600
  );

  if (!signedToken) {
    return NextResponse.json(
      { error: "Session signing secret is not configured." },
      { status: 503 }
    );
  }

  const response = NextResponse.json({ authenticated: true, role: "guest" });
  response.cookies.set("qafnest_has_session", signedToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 3600,
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
  response.cookies.set("qafnest_has_session", "", cookieOpts);
  response.cookies.set("qafnest_verified_guest", "", cookieOpts);
  return response;
}

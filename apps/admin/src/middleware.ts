import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { ADMIN_COOKIE_NAME, verifyAdminTokenEdge } from "@/lib/adminAuthEdge";

const PUBLIC_PREFIXES = ["/login", "/api/admin/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isPublic) {
    const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader && /^Bearer\s+/i.test(authHeader)
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : null;

    const token = cookieToken || bearerToken;
    const verifiedAdmin = token ? await verifyAdminTokenEdge(token) : null;

    if (!verifiedAdmin || verifiedAdmin.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized", code: "admin_access_required" },
          { status: 401 }
        );
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      if (pathname !== "/") {
        loginUrl.searchParams.set("returnUrl", pathname);
      }
      const redirectResponse = NextResponse.redirect(loginUrl);
      if (cookieToken) {
        redirectResponse.cookies.delete(ADMIN_COOKIE_NAME);
      }
      return redirectResponse;
    }
  }

  // Update Supabase session if needed
  let response: NextResponse;
  try {
    response = await updateSupabaseSession(request);
  } catch {
    response = NextResponse.next();
  }

  const langParam = request.nextUrl.searchParams.get("lang");
  if (langParam === "en" || langParam === "ar") {
    response.cookies.set("qafnest_admin_lang", langParam, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)",
  ],
};


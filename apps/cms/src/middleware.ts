import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { ADMIN_COOKIE_NAME, verifyAdminTokenEdge } from "@/lib/adminAuthEdge";

const PUBLIC_PREFIXES = ["/login", "/api/admin/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isPublic) {
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const rawToken = bearerToken || cookieToken;
    const verifiedPayload = rawToken ? await verifyAdminTokenEdge(rawToken) : null;

    if (!verifiedPayload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      if (pathname !== "/") {
        loginUrl.searchParams.set("returnUrl", pathname);
      }
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete(ADMIN_COOKIE_NAME);
      return redirectResponse;
    }
  }

  try {
    return await updateSupabaseSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

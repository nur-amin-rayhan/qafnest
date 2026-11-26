import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/";
  const isSafeRelativePath = requestedNext.startsWith("/") && !/^\/[\/\\]/.test(requestedNext);
  let destination = new URL(isSafeRelativePath ? requestedNext : "/", requestUrl.origin);
  if (destination.origin !== requestUrl.origin) {
    destination = new URL("/", requestUrl.origin);
  }

  if (!code) {
    destination.searchParams.set("auth_error", "confirmation_code_missing");
    return NextResponse.redirect(destination);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    destination.searchParams.set("auth_error", "confirmation_failed");
  } else if (data.user) {
    const devHostId =
      process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
    const isHost =
      data.user.app_metadata?.role === "host" ||
      data.user.user_metadata?.role === "host" ||
      data.user.id === devHostId;
    if (isHost) {
      await supabase.auth.signOut().catch(() => {});
      destination.searchParams.set("auth_error", "host_account_not_allowed");
    }
  }

  return NextResponse.redirect(destination);
}

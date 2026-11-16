import { createClient as createSupabaseJsClient, SupabaseClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReviewAuthContext = {
  supabase: SupabaseClient;
  subject: string;
  guestId: string | null;
  displayName: string;
};

export class ReviewAuthError extends Error {
  constructor(readonly code: "sign_in_required" | "auth_provider_setup_required") {
    super(code);
  }
}

function pickDisplayName(value: unknown) {
  if (typeof value !== "string") return "Verified guest";
  const cleaned = value.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, 80) : "Verified guest";
}

export async function getReviewAuthContext(request: Request): Promise<ReviewAuthContext | null> {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (bearer) {
    // 1. Cryptographically verify Bearer token against Supabase Auth first
    try {
      const supabaseCookieClient = await createCookieClient();
      const { data: { user }, error } = await supabaseCookieClient.auth.getUser(bearer);
      if (!error && user) {
        return contextFromSupabaseUser(bearer, user);
      }
    } catch {}

    // 2. Cryptographically verify Firebase ID tokens / verified phone session via RS256 JWK/x509
    try {
      const guestUser = await verifyGuestSession(request);
      if (guestUser) {
        const adminClient = await getAdminOrServerClient();
        return {
          supabase: adminClient,
          subject: guestUser.id,
          guestId: uuidPattern.test(guestUser.id) ? guestUser.id : null,
          displayName: pickDisplayName(guestUser.name),
        };
      }
    } catch {}

    return null;
  }

  // 3. Fallback to cookie-based Supabase session
  try {
    const supabase = await createCookieClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return contextFromSupabaseUser(session.access_token, user);
      }
    }
  } catch {}

  // 4. Fallback to verified guest session cookies (Firebase cookie / dev cookie)
  try {
    const guestUser = await verifyGuestSession(request);
    if (guestUser) {
      const adminClient = await getAdminOrServerClient();
      return {
        supabase: adminClient,
        subject: guestUser.id,
        guestId: uuidPattern.test(guestUser.id) ? guestUser.id : null,
        displayName: pickDisplayName(guestUser.name),
      };
    }
  } catch {}

  return null;
}

function contextFromSupabaseUser(
  accessToken: string,
  user: { id: string; user_metadata?: Record<string, unknown> }
): ReviewAuthContext {
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const { url, key } = getSupabaseConfig();
  return {
    supabase: createSupabaseJsClient(url, key, {
      accessToken: async () => accessToken,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
    subject: user.id,
    guestId: uuidPattern.test(user.id) ? user.id : null,
    displayName: pickDisplayName(metadataName),
  };
}

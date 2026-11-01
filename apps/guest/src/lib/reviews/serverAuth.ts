import { createClient as createSupabaseJsClient, SupabaseClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TokenClaims = {
  sub?: unknown;
  role?: unknown;
  name?: unknown;
  email?: unknown;
  user_metadata?: { full_name?: unknown; name?: unknown };
};

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

function decodeClaims(token: string): TokenClaims | null {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenClaims;
  } catch {
    return null;
  }
}

function pickDisplayName(value: unknown) {
  if (typeof value !== "string") return "Verified guest";
  const cleaned = value.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, 80) : "Verified guest";
}

export async function getReviewAuthContext(request: Request): Promise<ReviewAuthContext | null> {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) {
    const claims = decodeClaims(bearer);
    if (typeof claims?.sub !== "string") return null;
    if (claims.role !== "authenticated") throw new ReviewAuthError("auth_provider_setup_required");

    const { url, key } = getSupabaseConfig();
    const supabase = createSupabaseJsClient(url, key, {
      accessToken: async () => bearer,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const candidateGuestId = claims.sub;
    const displayName = pickDisplayName(
      claims.name ?? claims.user_metadata?.full_name ?? claims.user_metadata?.name
    );

    return {
      supabase,
      subject: candidateGuestId,
      guestId: uuidPattern.test(candidateGuestId) ? candidateGuestId : null,
      displayName,
    };
  }

  const supabase = await createCookieClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return contextFromSupabaseUser(session.access_token, user);
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
    guestId: user.id,
    displayName: pickDisplayName(metadataName),
  };
}

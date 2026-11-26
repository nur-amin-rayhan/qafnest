import { NextRequest, NextResponse } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public non-PII host display lookup bypassing client profiles RLS cleanly. */
export async function GET(request: NextRequest) {
  const hostId = (request.nextUrl.searchParams.get("id") || "").trim();
  if (!hostId || !UUID_REGEX.test(hostId)) {
    return NextResponse.json({ host: null }, { status: 400 });
  }

  try {
    const db = await getAdminOrServerClient();
    let fullName: string | null = null;
    let avatarUrl: string | null = null;
    let createdAt: string | null = null;

    const { data: profileRow } = await db
      .from("profiles")
      .select("full_name, avatar_url, created_at")
      .eq("id", hostId)
      .maybeSingle();

    if (profileRow) {
      fullName = profileRow.full_name || null;
      avatarUrl = profileRow.avatar_url || null;
      createdAt = profileRow.created_at || null;
    }

    if (!fullName && typeof (db as any).auth?.admin?.getUserById === "function") {
      try {
        const { data: authRes } = await (db as any).auth.admin.getUserById(hostId);
        const meta = (authRes?.user?.user_metadata || {}) as Record<string, unknown>;
        fullName =
          String(meta.full_name || meta.name || meta.business_name || "").trim() || null;
        if (!createdAt && authRes?.user?.created_at) {
          createdAt = String(authRes.user.created_at);
        }
      } catch {
        // Optional auth lookup
      }
    }

    return NextResponse.json(
      {
        host: fullName || createdAt ? { id: hostId, full_name: fullName, avatar_url: avatarUrl, created_at: createdAt } : null,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch {
    return NextResponse.json({ host: null }, { status: 200 });
  }
}

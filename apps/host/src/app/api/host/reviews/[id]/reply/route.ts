import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { verifyHostSession } from "@/lib/auth/serverAuth";

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const reviewId = resolvedParams?.id;
  if (!reviewId) {
    return NextResponse.json({ code: "invalid_review_id" }, { status: 400 });
  }

  let body: { reply?: string; replyAr?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_body" }, { status: 400 });
  }

  const replyText = (body.reply || body.replyAr || "").trim();
  if (!replyText || replyText.length < 3) {
    return NextResponse.json(
      { code: "reply_too_short", message: "Reply must be at least 3 characters long." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    // 1. Fetch review and its property to verify host ownership
    const { data: review, error: revErr } = await supabase
      .from("reviews")
      .select("id, property_id")
      .eq("id", reviewId)
      .single();

    if (revErr || !review) {
      return NextResponse.json({ code: "not_found", message: "Review not found." }, { status: 404 });
    }

    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("id, host_id")
      .eq("id", review.property_id)
      .single();

    if (propErr || !property || property.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to reply to this review." },
        { status: 403 }
      );
    }

    // 2. Update review with official host response
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      admin_reply: replyText,
      admin_reply_ar: body.replyAr?.trim() || replyText,
      admin_reply_by: "host",
      admin_reply_at: nowIso,
    };

    const { data: updated, error: updateErr } = await supabase
      .from("reviews")
      .update(updatePayload)
      .eq("id", reviewId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ code: "update_failed", message: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

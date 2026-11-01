import { NextResponse } from "next/server";
import { getReviewAdminContext, ReviewAuthError } from "@/lib/reviews/adminAuth";
import { isReviewSchemaUnavailable } from "@/lib/reviews/serverErrors";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    }
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const reviewId = typeof body.reviewId === "string" ? body.reviewId : "";
  const reply = typeof body.reply === "string"
    ? body.reply.replace(/\u0000/g, "").trim().slice(0, 2000)
    : "";
  const replyAr = typeof body.replyAr === "string"
    ? body.replyAr.replace(/\u0000/g, "").trim().slice(0, 2000)
    : "";
  if (!uuidPattern.test(reviewId) || (reply.length > 0 && reply.length < 5) || (replyAr.length > 0 && replyAr.length < 5)) {
    return NextResponse.json({ code: "invalid_reply" }, { status: 400 });
  }

  try {
    const admin = await getReviewAdminContext(request);
    if (!admin) {
      const hasBearer = /^Bearer\s+.+$/i.test(request.headers.get("authorization") || "");
      return NextResponse.json({ code: hasBearer ? "admin_access_required" : "sign_in_required" }, { status: hasBearer ? 403 : 401 });
    }

    const hasReply = Boolean(reply || replyAr);
    const { data, error } = await admin.supabase
      .from("reviews")
      .update(hasReply
        ? {
            admin_reply: reply || replyAr,
            admin_reply_ar: reply ? replyAr || null : null,
            admin_reply_by: admin.adminDisplayName,
            admin_reply_at: new Date().toISOString(),
          }
        : { admin_reply: null, admin_reply_ar: null, admin_reply_by: null, admin_reply_at: null })
      .eq("id", reviewId)
      .eq("is_published", true)
      .eq("is_sample", false)
      .select("id, admin_reply, admin_reply_ar, admin_reply_by, admin_reply_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ code: "review_not_found" }, { status: 404 });
    return NextResponse.json({ review: data });
  } catch (error) {
    if (error instanceof ReviewAuthError) return NextResponse.json({ code: error.code }, { status: 401 });
    return NextResponse.json({ code: isReviewSchemaUnavailable(error) ? "review_admin_schema_not_ready" : "review_reply_save_failed" }, { status: 503 });
  }
}

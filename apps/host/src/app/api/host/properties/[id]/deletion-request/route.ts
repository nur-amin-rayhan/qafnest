import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNumericUnitCode } from "@qafnest/shared";
import {
  cancelPendingDeletionRequest,
  createOrUpdatePendingDeletionRequest,
  getLatestDeletionRequestForProperty,
  getPendingDeletionRequestForProperty,
  hydratePropertyDeletionStore,
  toDeletionRequestSummary,
  validateDeletionReasonInput,
} from "@qafnest/shared/propertyDeletionStore";
import { recordUserActivity } from "@qafnest/shared/userActivityStore";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { verifyHostSession } from "@/lib/auth/serverAuth";
import { checkHostPropertyDeletionEligibility } from "@/lib/propertyDeletionCheck";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveVerifiedHostProperty(params: {
  request: NextRequest;
  propertyId: string;
}) {
  const { request, propertyId } = params;
  if (!propertyId) {
    return { errorRes: NextResponse.json({ code: "missing_property_id" }, { status: 400 }) };
  }

  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return {
      errorRes: NextResponse.json(
        { code: "unauthorized", message: "Host authentication required." },
        { status: 401 }
      ),
    };
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return {
      errorRes: NextResponse.json({ code: "database_not_configured" }, { status: 503 }),
    };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId);
  const lookupCol = isUuid ? "id" : "slug";

  const { data: existing, error: propError } = await supabase
    .from("properties")
    .select("id, host_id, title, title_ar, city, city_name")
    .eq(lookupCol, propertyId)
    .maybeSingle();

  if (propError || !existing) {
    return {
      errorRes: NextResponse.json(
        { code: "property_not_found", message: "Property not found." },
        { status: 404 }
      ),
    };
  }

  await hydratePropertyDeletionStore();

  const isDevBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_HOST_BYPASS === "true" &&
    (authUser.id === "00000000-0000-0000-0000-000000000002" ||
      authUser.id === "11111111-2222-4333-8444-555555555555" ||
      existing.host_id === "00000000-0000-0000-0000-000000000002" ||
      existing.host_id === "11111111-2222-4333-8444-555555555555");

  if (!existing.host_id || (existing.host_id !== authUser.id && !isDevBypass)) {
    return {
      errorRes: NextResponse.json(
        { code: "forbidden", message: "You are not authorized to manage this property." },
        { status: 403 }
      ),
    };
  }

  return { authUser, supabase, property: existing };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolved = await resolveVerifiedHostProperty({
    request,
    propertyId: params.id,
  });
  if ("errorRes" in resolved) return resolved.errorRes;

  const { supabase, property } = resolved;
  const { eligibility, error } = await checkHostPropertyDeletionEligibility(
    supabase,
    String(property.id)
  );
  if (error) {
    console.error("[host deletion-request GET] eligibility check failed:", error);
    return NextResponse.json(
      { code: "bookings_check_failed", message: "Failed to verify property bookings." },
      { status: 500 }
    );
  }

  const pendingRequest = getPendingDeletionRequestForProperty(String(property.id));
  const latestRequest = getLatestDeletionRequestForProperty(String(property.id));

  return NextResponse.json({
    success: true,
    unitCode: getNumericUnitCode(String(property.id)),
    eligibility,
    pendingRequest: toDeletionRequestSummary(pendingRequest),
    latestRequest: toDeletionRequestSummary(latestRequest),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolved = await resolveVerifiedHostProperty({
    request,
    propertyId: params.id,
  });
  if ("errorRes" in resolved) return resolved.errorRes;

  const { authUser, supabase, property } = resolved;
  const body = (await request.json().catch(() => ({}))) as {
    reasonCode?: string;
    reasonDetails?: string;
  };

  // 1. Strict safeguard: block deletion request whenever active/upcoming/unchecked-out/unsettled reservations exist
  const { eligibility, error } = await checkHostPropertyDeletionEligibility(
    supabase,
    String(property.id)
  );
  if (error) {
    console.error("[host deletion-request GET] eligibility check failed:", error);
    return NextResponse.json(
      { code: "bookings_check_failed", message: "Failed to verify property bookings." },
      { status: 500 }
    );
  }
  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        code: "active_bookings_exist",
        message: eligibility.reasonEn,
        message_ar: eligibility.reasonAr,
        blockingBookings: eligibility.blockingBookings,
      },
      { status: 409 }
    );
  }

  // 2. Mandatory specific reason validation
  const reasonCheck = validateDeletionReasonInput(body.reasonCode, body.reasonDetails);
  if (!reasonCheck.valid || !reasonCheck.option) {
    return NextResponse.json(
      {
        code: "reason_required",
        message: reasonCheck.errorEn || "Specific deletion reason is required.",
        message_ar: reasonCheck.errorAr || "سبب حذف العقار مطلوب لمراجعة الإدارة.",
      },
      { status: 400 }
    );
  }

  let hostName = authUser.name || "";
  let hostPhone = authUser.phone || "";
  const hostEmail = authUser.email || "";
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", authUser.id)
      .maybeSingle();
    if (prof?.full_name) hostName = String(prof.full_name);
    if (prof?.phone) hostPhone = String(prof.phone);
  } catch {}

  const created = createOrUpdatePendingDeletionRequest({
    propertyId: String(property.id),
    unitCode: getNumericUnitCode(String(property.id)),
    propertyTitle: String(property.title || "Property"),
    propertyTitleAr: typeof property.title_ar === "string" ? property.title_ar : undefined,
    propertyCity: String(property.city_name || property.city || ""),
    hostId: authUser.id,
    hostName: hostName || undefined,
    hostPhone: hostPhone || undefined,
    hostEmail: hostEmail || undefined,
    reasonCode: reasonCheck.option.code,
    reasonDetails: reasonCheck.cleanedDetails,
  });

  try {
    recordUserActivity({
      userId: authUser.id,
      userName: hostName || authUser.email || authUser.id,
      userEmail: hostEmail || undefined,
      role: "host",
      category: "property",
      action: "property_deletion_requested",
      title: `Requested deletion of ${property.title}`,
      details: `${reasonCheck.option.labelEn}: ${reasonCheck.cleanedDetails}`,
      targetId: String(property.id),
      targetLabel: String(property.title || property.id),
      actor: authUser.email || authUser.phone || authUser.id,
    });
  } catch {}

  return NextResponse.json(
    {
      success: true,
      pendingReview: true,
      message:
        "Deletion request submitted for QafNest Admin review. Once approved, the property will be deleted automatically.",
      message_ar:
        "تم إرسال طلب حذف العقار لمراجعة إدارة قاف نست. سيتم حذف العقار تلقائياً فور اعتماد الإدارة للطلب.",
      request: toDeletionRequestSummary(created),
    },
    { status: 202 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolved = await resolveVerifiedHostProperty({
    request,
    propertyId: params.id,
  });
  if ("errorRes" in resolved) return resolved.errorRes;

  const { authUser, property } = resolved;
  const cancelled = cancelPendingDeletionRequest(String(property.id), authUser.id);
  if (!cancelled) {
    return NextResponse.json(
      {
        code: "no_pending_request",
        message: "No pending deletion request found for this property.",
        message_ar: "لا يوجد طلب حذف قيد المراجعة لهذا العقار.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Property deletion request withdrawn.",
    message_ar: "تم سحب طلب حذف العقار بنجاح.",
    request: toDeletionRequestSummary(cancelled),
  });
}

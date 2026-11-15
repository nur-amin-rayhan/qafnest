import { NextRequest, NextResponse } from "next/server";
import {
  finalizePropertyDeletionReview,
  getPendingDeletionRequestForProperty,
  getPropertyDeletionRequestById,
  readPropertyDeletionRequests,
} from "@qafnest/shared/propertyDeletionStore";
import { recordUserActivity } from "@qafnest/shared/userActivityStore";
import {
  createAdminDataClient,
  getAdminSession,
  isAdminRequest,
} from "@/lib/adminApi";
import {
  enrichDeletionRequestsWithLiveBookings,
  verifySinglePropertyDeletionEligibility,
} from "@/lib/propertyDeletionServer";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json(
      { code: "admin_database_not_configured" },
      { status: 503 }
    );
  }

  const allRequests = readPropertyDeletionRequests();
  const requests = await enrichDeletionRequestsWithLiveBookings(supabase, allRequests);

  return NextResponse.json({
    success: true,
    requests,
  });
}

export async function PATCH(request: NextRequest) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json(
      { code: "admin_database_not_configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      requestId?: string;
      propertyId?: string;
      action?: string;
      adminNotes?: string;
    };

    const action = String(body.action || "").trim().toLowerCase();
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        {
          code: "invalid_action",
          message: "Action must be either 'approve' or 'reject'.",
        },
        { status: 400 }
      );
    }

    const requestId = String(body.requestId || "").trim();
    const propertyId = String(body.propertyId || "").trim();
    const adminNotes = String(body.adminNotes || "").trim();
    const reviewer = session.email || "admin";

    const targetReq = requestId
      ? getPropertyDeletionRequestById(requestId)
      : propertyId
        ? getPendingDeletionRequestForProperty(propertyId)
        : null;

    if (!targetReq || targetReq.status !== "pending") {
      return NextResponse.json(
        {
          code: "deletion_request_not_found",
          message: "Pending property deletion request not found.",
        },
        { status: 404 }
      );
    }

    if (action === "reject") {
      if (adminNotes.length < 5) {
        return NextResponse.json(
          {
            code: "admin_notes_required",
            message:
              "Please enter a clear admin reason (minimum 5 characters) when declining a deletion request.",
          },
          { status: 400 }
        );
      }

      const updated = finalizePropertyDeletionReview({
        requestId: targetReq.id,
        decision: "reject",
        reviewedBy: reviewer,
        adminNotes,
      });

      recordUserActivity({
        userId: targetReq.hostId || targetReq.propertyId,
        userName: targetReq.hostName,
        userEmail: targetReq.hostEmail,
        role: "admin",
        category: "property",
        action: "property_deletion_rejected",
        title: `Declined removal request for ${targetReq.propertyTitle}`,
        details: adminNotes,
        targetId: targetReq.propertyId,
        targetLabel: targetReq.propertyTitle,
        actor: reviewer,
      });

      return NextResponse.json({
        success: true,
        action: "rejected",
        request: updated,
      });
    }

    // Approve & Auto-Delete: strictly verify zero active / upcoming / unsettled reservations first
    const { eligibility, error: checkError } =
      await verifySinglePropertyDeletionEligibility(supabase, targetReq.propertyId);

    if (checkError) {
      return NextResponse.json(
        { code: "eligibility_check_failed", message: checkError },
        { status: 500 }
      );
    }

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          code: "active_bookings_exist",
          error: eligibility.reasonEn,
          message: eligibility.reasonEn,
          messageAr: eligibility.reasonAr,
          blockingBookings: eligibility.blockingBookings,
        },
        { status: 409 }
      );
    }

    const { error: deleteErr } = await supabase
      .from("properties")
      .delete()
      .eq("id", targetReq.propertyId);

    if (deleteErr) {
      return NextResponse.json(
        {
          code: "property_delete_failed",
          message: deleteErr.message,
        },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();
    const updated = finalizePropertyDeletionReview({
      requestId: targetReq.id,
      decision: "approve",
      reviewedBy: reviewer,
      adminNotes:
        adminNotes ||
        "Verified 0 active or unsettled reservations. Approved and auto-deleted listing.",
      autoDeletedAt: nowIso,
    });

    recordUserActivity({
      userId: targetReq.hostId || targetReq.propertyId,
      userName: targetReq.hostName,
      userEmail: targetReq.hostEmail,
      role: "admin",
      category: "property",
      action: "property_deletion_approved_autodeleted",
      title: `Approved & auto-deleted property ${targetReq.propertyTitle}`,
      details: `Reason: ${targetReq.reasonLabelEn} — ${targetReq.reasonDetails}`,
      targetId: targetReq.propertyId,
      targetLabel: targetReq.propertyTitle,
      actor: reviewer,
    });

    return NextResponse.json({
      success: true,
      action: "approved",
      deletedPropertyId: targetReq.propertyId,
      request: updated,
    });
  } catch (err) {
    return NextResponse.json(
      {
        code: "internal_error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to review property deletion request.",
      },
      { status: 500 }
    );
  }
}

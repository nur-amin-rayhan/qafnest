import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/adminAuth";
import {
  deleteContactInquiry,
  getContactSettings,
  getGmailSmtpRuntimeStatus,
  hydrateContactInquiriesStore,
  listContactInquiries,
  persistContactInquiriesStore,
  saveContactSettings,
  sendContactTestEmail,
  updateContactInquiry,
  type ContactInquiryStatus,
} from "@qafnest/shared/contactInquiriesStore";

export const dynamic = "force-dynamic";

function getVerifiedCmsAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET(request: NextRequest) {
  const admin = getVerifiedCmsAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await hydrateContactInquiriesStore();
  return NextResponse.json({
    success: true,
    settings: getContactSettings(),
    smtp: getGmailSmtpRuntimeStatus(),
    inquiries: listContactInquiries(200),
  });
}

export async function POST(request: NextRequest) {
  const admin = getVerifiedCmsAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await hydrateContactInquiriesStore();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "");

    if (action === "save_settings") {
      const updated = saveContactSettings(
        {
          recipientEmail:
            typeof body.recipientEmail === "string" ? body.recipientEmail : undefined,
          emailForwardingEnabled:
            typeof body.emailForwardingEnabled === "boolean"
              ? body.emailForwardingEnabled
              : undefined,
          autoReplyEnabled:
            typeof body.autoReplyEnabled === "boolean" ? body.autoReplyEnabled : undefined,
          subjectPrefix:
            typeof body.subjectPrefix === "string" ? body.subjectPrefix : undefined,
          responseSlaHours:
            body.responseSlaHours !== undefined ? Number(body.responseSlaHours) : undefined,
        },
        admin.email
      );
      await persistContactInquiriesStore();
      return NextResponse.json({
        success: true,
        settings: updated,
        smtp: getGmailSmtpRuntimeStatus(),
      });
    }

    if (action === "send_test_email") {
      const targetEmail =
        typeof body.targetEmail === "string" ? body.targetEmail.trim() : undefined;
      const result = await sendContactTestEmail(targetEmail);
      return NextResponse.json(
        {
          success: result.ok,
          ...result,
          smtp: getGmailSmtpRuntimeStatus(),
        },
        { status: result.ok ? 200 : 400 }
      );
    }

    if (action === "update_inquiry") {
      const id = String(body.id || "");
      const status = body.status as ContactInquiryStatus | undefined;
      const adminNotes =
        typeof body.adminNotes === "string" ? body.adminNotes : undefined;
      const updated = updateContactInquiry(id, { status, adminNotes });
      if (!updated) {
        return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
      }
      await persistContactInquiriesStore();
      return NextResponse.json({ success: true, inquiry: updated });
    }

    if (action === "delete_inquiry") {
      const id = String(body.id || "");
      const ok = deleteContactInquiry(id);
      if (!ok) {
        return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
      }
      await persistContactInquiriesStore();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[cms contact POST] error:", err);
    return NextResponse.json(
      { error: "Failed to update contact CMS state" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const admin = getVerifiedCmsAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await hydrateContactInquiriesStore();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const emailCandidate =
      typeof body.email === "string" && body.email.includes("@")
        ? body.email.trim()
        : typeof body.recipientEmail === "string" && body.recipientEmail.includes("@")
        ? body.recipientEmail.trim()
        : undefined;

    const updated = saveContactSettings(
      {
        recipientEmail: emailCandidate,
        ...(typeof body.emailForwardingEnabled === "boolean"
          ? { emailForwardingEnabled: body.emailForwardingEnabled }
          : {}),
        ...(typeof body.autoReplyEnabled === "boolean"
          ? { autoReplyEnabled: body.autoReplyEnabled }
          : {}),
      },
      admin.email
    );
    await persistContactInquiriesStore();

    return NextResponse.json({
      success: true,
      settings: updated,
      smtp: getGmailSmtpRuntimeStatus(),
    });
  } catch (err: unknown) {
    console.error("[cms contact PUT] error:", err);
    return NextResponse.json(
      { error: "Failed to update contact settings" },
      { status: 500 }
    );
  }
}

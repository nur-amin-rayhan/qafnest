import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import {
  getContactSettings,
  submitContactInquiry,
} from "@qafnest/shared/contactInquiriesStore";


export async function GET() {
  const settings = getContactSettings();
  return NextResponse.json({
    success: true,
    settings: {
      recipientEmail: settings.recipientEmail,
      emailForwardingEnabled: settings.emailForwardingEnabled,
      responseSlaHours: settings.responseSlaHours,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const guest = await verifyGuestSession(request).catch(() => null);

    const source =
      body.source === "account_support" ? "account_support" : "contact_page";
    const locale = body.locale === "ar" ? "ar" : "en";

    const name = String(body.name || guest?.email?.split("@")[0] || "QafNest Guest").trim();
    const phone = String(body.phone || guest?.phone || "").trim();
    const email = String(body.email || guest?.email || "").trim();
    const subject = String(body.subject || (source === "account_support" ? "account_support" : "general")).trim();
    const message = String(body.message || "").trim();

    if (!name || !message) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "ar"
              ? "يرجى إدخال الاسم ونص الرسالة."
              : "Please enter your name and message.",
        },
        { status: 400 }
      );
    }

    if (source === "contact_page" && !phone) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "ar"
              ? "يرجى إدخال رقم الجوال للتواصل."
              : "Please enter your mobile phone number.",
        },
        { status: 400 }
      );
    }

    const result = await submitContactInquiry({
      name,
      phone,
      email: email || undefined,
      subject,
      message,
      source,
      locale,
    });

    return NextResponse.json({
      success: true,
      ticketNumber: result.inquiry.ticketNumber,
      inquiryId: result.inquiry.id,
      emailSent: result.emailSent,
      deliveryStatus: result.inquiry.deliveryStatus,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to submit message.",
      },
      { status: 500 }
    );
  }
}

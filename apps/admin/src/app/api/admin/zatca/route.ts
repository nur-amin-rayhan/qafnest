import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminApi";
import {
  getZatcaEgsState,
  generateInvoiceUblXmlForRecord,
  reportInvoiceToZatcaApi,
  testZatcaGatewayHandshake,
} from "@/lib/services/zatcaPhase2Service";
import { getLiveAdminInvoices } from "@/lib/services/adminInvoicesService";
import { renderInvoicePdfHtml } from "@/lib/services/renderInvoicePdfHtml";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");
  const invoiceId = searchParams.get("invoiceId");

  if (action === "download_pdf" && invoiceId) {
    const invoices = await getLiveAdminInvoices();
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) {
      return NextResponse.json({ code: "invoice_not_found", message: "Invoice not found." }, { status: 404 });
    }
    const html = await renderInvoicePdfHtml(inv, true);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  if (action === "download_xml" && invoiceId) {
    try {
      const { xml, filename } = await generateInvoiceUblXmlForRecord(invoiceId);
      return new NextResponse(xml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { code: "invoice_not_found", message: err instanceof Error ? err.message : "Invoice not found." },
        { status: 404 }
      );
    }
  }

  const state = getZatcaEgsState();
  return NextResponse.json({ success: true, egs: state });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, invoiceId } = body;

    if (action === "test_handshake") {
      const handshake = await testZatcaGatewayHandshake();
      return NextResponse.json({
        success: true,
        handshake,
      });
    }

    if (action === "report" && invoiceId) {
      const result = await reportInvoiceToZatcaApi(invoiceId);
      return NextResponse.json({
        ...result,
        message: result.success
          ? "Invoice successfully reported to ZATCA E-Invoicing Platform (Phase 2)."
          : "ZATCA E-Invoicing returned validation feedback.",
      });
    }

    if (action === "inspect_xml" && invoiceId) {
      const details = await generateInvoiceUblXmlForRecord(invoiceId);
      return NextResponse.json({
        success: true,
        ...details,
      });
    }

    return NextResponse.json({ code: "invalid_action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "ZATCA processing error" },
      { status: 500 }
    );
  }
}

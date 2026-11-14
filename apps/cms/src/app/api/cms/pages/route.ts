import { NextResponse, type NextRequest } from "next/server";
import { getAllCmsPages, getCmsPage, saveCmsPage } from "@qafnest/shared/cmsPagesStore";
import type { CmsPageRecord } from "@qafnest/shared";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const page = getCmsPage(id);
      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
      return NextResponse.json(page);
    }
    const pages = getAllCmsPages();
    return NextResponse.json(pages);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CmsPageRecord;
    if (!body || !body.id) {
      return NextResponse.json({ error: "Missing page id" }, { status: 400 });
    }
    const success = saveCmsPage(body);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist CMS page" }, { status: 500 });
    }
    return NextResponse.json({ success: true, page: body });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

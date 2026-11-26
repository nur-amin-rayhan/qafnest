import { NextResponse, type NextRequest } from "next/server";
import { getAllCmsPages, getCmsPage, saveCmsPage } from "@qafnest/shared/cmsPagesStore";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import type { CmsPageRecord } from "@qafnest/shared";
import { isAdminRequest } from "@/lib/adminApi";

const PAGES_FILE = "cms-pages.json";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<CmsPageRecord[]>(PAGES_FILE, () => []);
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
    console.error("[cms pages] error:", err);
    return NextResponse.json({ error: "CMS page operation failed." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await hydrateSharedJsonFile<CmsPageRecord[]>(PAGES_FILE, () => []);
    const body = (await request.json()) as CmsPageRecord;
    if (!body || !body.id) {
      return NextResponse.json({ error: "Missing page id" }, { status: 400 });
    }
    const success = saveCmsPage(body);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist CMS page" }, { status: 500 });
    }
    await persistSharedJsonFile(PAGES_FILE, getAllCmsPages());
    return NextResponse.json({ success: true, page: body });
  } catch (err: unknown) {
    console.error("[cms pages] error:", err);
    return NextResponse.json({ error: "CMS page operation failed." }, { status: 500 });
  }
}

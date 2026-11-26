import { NextResponse, type NextRequest } from "next/server";
import { getAllCmsPages, getCmsPage } from "@qafnest/shared/cmsPagesStore";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import type { CmsPageRecord } from "@qafnest/shared";

export async function GET(request: NextRequest) {
  try {
    await hydrateSharedJsonFile<CmsPageRecord[]>("cms-pages.json", () => []);
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
    console.error("[cmsPages] load error:", err);
    return NextResponse.json({ error: "Failed to load CMS pages." }, { status: 500 });
  }
}

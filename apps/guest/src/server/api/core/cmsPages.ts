import { NextResponse, type NextRequest } from "next/server";
import { getAllCmsPages, getCmsPage } from "@qafnest/shared/cmsPagesStore";

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

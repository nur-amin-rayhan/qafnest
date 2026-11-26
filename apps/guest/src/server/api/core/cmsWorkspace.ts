import { NextResponse } from "next/server";
import { getServerPublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";

export async function GET() {
  try {
    const workspace = await getServerPublicCmsWorkspace();
    return NextResponse.json(
      { success: true, workspace },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    console.error("[cmsWorkspace] load error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load CMS workspace." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

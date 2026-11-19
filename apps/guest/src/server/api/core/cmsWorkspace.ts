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
    const message = err instanceof Error ? err.message : "Failed to load CMS workspace";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

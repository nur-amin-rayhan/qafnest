import { NextRequest, NextResponse } from "next/server";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { isAdminRequest } from "@/lib/adminApi";
import { createDefaultCmsWorkspace } from "@/data/cmsWorkspaceDefaults";
import type { CmsWorkspaceData } from "@/types/cms";

export const dynamic = "force-dynamic";

const WORKSPACE_FILE = "cms-workspace-v2.json";

function mergeWithDefaults(partial: Partial<CmsWorkspaceData> | null | undefined): CmsWorkspaceData {
  const defaults = createDefaultCmsWorkspace();
  if (!partial || typeof partial !== "object") return defaults;

  return {
    users: Array.isArray(partial.users) ? partial.users : defaults.users,
    media: Array.isArray(partial.media) ? partial.media : defaults.media,
    categories: Array.isArray(partial.categories) ? partial.categories : defaults.categories,
    roles: Array.isArray(partial.roles) ? partial.roles : defaults.roles,
    faqs: Array.isArray(partial.faqs) ? partial.faqs : defaults.faqs,
    homePopups: Array.isArray(partial.homePopups) ? partial.homePopups : defaults.homePopups,
    businessPages: Array.isArray(partial.businessPages) ? partial.businessPages : defaults.businessPages,
    legalPages: Array.isArray(partial.legalPages) ? partial.legalPages : defaults.legalPages,
    navigationLinks: Array.isArray(partial.navigationLinks) ? partial.navigationLinks : defaults.navigationLinks,
    socialLinks: Array.isArray(partial.socialLinks) ? partial.socialLinks : defaults.socialLinks,
    globals: {
      homeHero: partial.globals?.homeHero ?? defaults.globals.homeHero,
      features: partial.globals?.features ?? defaults.globals.features,
      fleetCapabilities: partial.globals?.fleetCapabilities ?? defaults.globals.fleetCapabilities,
      coverageNetwork: partial.globals?.coverageNetwork ?? defaults.globals.coverageNetwork,
      industries: partial.globals?.industries ?? defaults.globals.industries,
      contactUs: partial.globals?.contactUs ?? defaults.globals.contactUs,
      siteSeo: partial.globals?.siteSeo ?? defaults.globals.siteSeo,
      gtm: partial.globals?.gtm ?? defaults.globals.gtm,
      aboutUs: partial.globals?.aboutUs ?? defaults.globals.aboutUs,
    },
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const raw = await hydrateSharedJsonFile<Partial<CmsWorkspaceData>>(
      WORKSPACE_FILE,
      () => createDefaultCmsWorkspace()
    );
    const workspace = mergeWithDefaults(raw);
    return NextResponse.json(
      { success: true, workspace },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load CMS workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { workspace?: Partial<CmsWorkspaceData> };
    const existing = await hydrateSharedJsonFile<Partial<CmsWorkspaceData>>(
      WORKSPACE_FILE,
      () => createDefaultCmsWorkspace()
    );
    const merged = mergeWithDefaults({
      ...existing,
      ...(body.workspace || body),
      globals: {
        ...(existing?.globals || {}),
        ...(body.workspace?.globals || (body as Partial<CmsWorkspaceData>).globals || {}),
      } as CmsWorkspaceData["globals"],
    });
    await persistSharedJsonFile(WORKSPACE_FILE, merged);
    return NextResponse.json(
      { success: true, workspace: merged },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save CMS workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

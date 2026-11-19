import { NextRequest, NextResponse } from "next/server";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { isAdminRequest } from "@/lib/adminApi";
import { createDefaultCmsWorkspace } from "@/data/cmsWorkspaceDefaults";
import type { CmsWorkspaceData } from "@/types/cms";

export const dynamic = "force-dynamic";

const WORKSPACE_FILE = "cms-workspace-v2.json";

const LEGACY_LEGAL_PLACEHOLDERS = [
  "QafNest complies with Saudi Personal Data Protection Law (PDPL) to safeguard guest and host information.",
  "These terms govern bookings, host listings, payments, and dispute resolution on QafNest.",
  "Transparent refund tiers based on check-in notice windows with automatic wallet or card return.",
  "All short-term rentals must hold an active Ministry of Tourism permit and comply with local safety codes.",
];

function upgradeLegacyLegalPages(
  stored: CmsWorkspaceData["legalPages"],
  defaults: CmsWorkspaceData["legalPages"]
): CmsWorkspaceData["legalPages"] {
  const defaultBySlug = new Map(defaults.map((p) => [p.slug, p]));
  const upgraded = stored.map((page) => {
    const def = defaultBySlug.get(page.slug);
    if (!def) return page;
    const enHtml = String(page.content?.en || "");
    const isLegacyStub =
      enHtml.length < 260 &&
      LEGACY_LEGAL_PLACEHOLDERS.some((stub) => enHtml.includes(stub));
    if (isLegacyStub) {
      return {
        ...page,
        title: def.title,
        content: def.content,
        metaDescription: def.metaDescription,
      };
    }
    return page;
  });

  // Ensure Cookies Policy exists if missing from an older saved workspace
  const existingSlugs = new Set(upgraded.map((p) => p.slug));
  const cookiesDef = defaultBySlug.get("cookies-policy");
  if (cookiesDef && !existingSlugs.has("cookies-policy") && !existingSlugs.has("cookies")) {
    upgraded.push(cookiesDef);
  }
  return upgraded;
}

function upgradeLegacyFaqs(
  stored: CmsWorkspaceData["faqs"] | undefined,
  defaults: CmsWorkspaceData["faqs"]
): CmsWorkspaceData["faqs"] {
  if (!Array.isArray(stored) || stored.length < 10) {
    return defaults;
  }
  return stored.map((f, i) => {
    const def = defaults[i] || defaults.find((d) => d.id === f.id);
    return {
      ...f,
      category: f.category || def?.category || "booking",
    };
  });
}

function syncDestinationMedia(
  existingMedia: CmsWorkspaceData["media"],
  destinations: CmsWorkspaceData["destinations"],
  nowIso: string
): CmsWorkspaceData["media"] {
  const seenUrls = new Set(existingMedia.map((m) => m.url.trim()));
  const merged = [...existingMedia];
  for (const d of destinations) {
    if (!d.image || seenUrls.has(d.image.trim())) continue;
    seenUrls.add(d.image.trim());
    const label = d.name?.en || d.city || "Destination";
    merged.push({
      id: `med-dest-${d.id}`,
      filename: `${d.city || d.id}-destination.webp`,
      alt: `QafNest ${label} Destination Photo`,
      url: d.image.trim(),
      mimeType: "image/webp",
      sizeKb: 180,
      width: 400,
      height: 400,
      createdAt: d.updatedAt || nowIso,
    });
  }
  return merged;
}

function mergeWithDefaults(partial: Partial<CmsWorkspaceData> | null | undefined): CmsWorkspaceData {
  const defaults = createDefaultCmsWorkspace();
  if (!partial || typeof partial !== "object") return defaults;

  const legalPages = Array.isArray(partial.legalPages)
    ? upgradeLegacyLegalPages(partial.legalPages, defaults.legalPages)
    : defaults.legalPages;

  const destinations =
    Array.isArray(partial.destinations) && partial.destinations.length > 0
      ? partial.destinations
      : defaults.destinations;

  const nowIso = new Date().toISOString();
  const rawMedia = Array.isArray(partial.media) ? partial.media : defaults.media;
  const media = syncDestinationMedia(rawMedia, destinations, nowIso);

  return {
    users: Array.isArray(partial.users) ? partial.users : defaults.users,
    media,
    categories: Array.isArray(partial.categories) ? partial.categories : defaults.categories,
    roles: Array.isArray(partial.roles) ? partial.roles : defaults.roles,
    faqs: upgradeLegacyFaqs(partial.faqs, defaults.faqs),
    homePopups: Array.isArray(partial.homePopups) ? partial.homePopups : defaults.homePopups,
    destinations,
    businessPages: Array.isArray(partial.businessPages) ? partial.businessPages : defaults.businessPages,
    legalPages,
    navigationLinks: Array.isArray(partial.navigationLinks) ? partial.navigationLinks : defaults.navigationLinks,
    socialLinks: Array.isArray(partial.socialLinks) ? partial.socialLinks : defaults.socialLinks,
    globals: {
      homeHero: partial.globals?.homeHero ?? defaults.globals.homeHero,
      features: partial.globals?.features ?? defaults.globals.features,
      fleetCapabilities: partial.globals?.fleetCapabilities ?? defaults.globals.fleetCapabilities,
      coverageNetwork: partial.globals?.coverageNetwork ?? defaults.globals.coverageNetwork,
      industries: partial.globals?.industries ?? defaults.globals.industries,
      contactUs: partial.globals?.contactUs ?? defaults.globals.contactUs,
      siteSeo: {
        ...defaults.globals.siteSeo,
        ...(partial.globals?.siteSeo || {}),
        robots: {
          ...defaults.globals.siteSeo.robots,
          ...(partial.globals?.siteSeo?.robots || {}),
        },
      },
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

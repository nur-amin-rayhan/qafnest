import { NextRequest, NextResponse } from "next/server";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import { createDefaultCmsWorkspace } from "@/data/cmsWorkspaceDefaults";
import type { CmsMediaRecord, CmsWorkspaceData } from "@/types/cms";

export const dynamic = "force-dynamic";

const WORKSPACE_FILE = "cms-workspace-v2.json";

function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
  return cleaned || `upload-${Date.now()}.png`;
}

async function loadWorkspace(): Promise<CmsWorkspaceData> {
  const defaults = createDefaultCmsWorkspace();
  const raw = await hydrateSharedJsonFile<Partial<CmsWorkspaceData>>(
    WORKSPACE_FILE,
    () => defaults
  );
  return {
    ...defaults,
    ...(raw || {}),
    media: Array.isArray(raw?.media) ? raw.media : defaults.media,
    globals: {
      ...defaults.globals,
      ...(raw?.globals || {}),
    },
  };
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let filename = `media-${Date.now()}.png`;
    let alt = "";
    let mimeType = "image/png";
    let sizeKb = 1;
    let url = "";
    let buffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const providedAlt = String(formData.get("alt") || "").trim();

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      filename = sanitizeFilename(file.name || filename);
      alt = providedAlt || filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      mimeType = file.type || "image/png";
      sizeKb = Math.max(1, Math.round(file.size / 1024));

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      // Try uploading to Supabase storage bucket first
      const adminClient = createAdminDataClient();
      if (adminClient) {
        const storagePath = `cms-media/${Date.now()}-${filename}`;
        const { error: uploadError } = await adminClient.storage
          .from("property-images")
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });
        if (!uploadError) {
          const { data: pub } = adminClient.storage
            .from("property-images")
            .getPublicUrl(storagePath);
          if (pub?.publicUrl) {
            url = pub.publicUrl;
          }
        }
      }

      // Fallback to inline data URL when storage is unavailable
      if (!url) {
        const base64 = buffer.toString("base64");
        url = `data:${mimeType};base64,${base64}`;
      }
    } else {
      const body = (await request.json()) as {
        filename?: string;
        alt?: string;
        url?: string;
        dataUrl?: string;
        mimeType?: string;
        sizeKb?: number;
      };
      filename = sanitizeFilename(body.filename || filename);
      alt = (body.alt || "").trim() || filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      mimeType = body.mimeType || "image/png";
      sizeKb = Math.max(1, Math.round(Number(body.sizeKb) || 24));
      url = (body.url || body.dataUrl || "").trim();

      if (!url) {
        return NextResponse.json({ error: "Missing image URL or data" }, { status: 400 });
      }
    }

    const record: CmsMediaRecord = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      filename,
      alt,
      url,
      mimeType,
      sizeKb,
      createdAt: new Date().toISOString(),
    };

    const workspace = await loadWorkspace();
    workspace.media = [record, ...workspace.media];
    await persistSharedJsonFile(WORKSPACE_FILE, workspace);

    return NextResponse.json({ success: true, media: record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing media id" }, { status: 400 });
    }
    const workspace = await loadWorkspace();
    workspace.media = workspace.media.filter((item) => item.id !== id);
    await persistSharedJsonFile(WORKSPACE_FILE, workspace);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

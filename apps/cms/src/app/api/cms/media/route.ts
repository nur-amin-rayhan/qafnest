import { NextRequest, NextResponse } from "next/server";
import { hydrateSharedJsonFile, persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
import { createDefaultCmsWorkspace } from "@/data/cmsWorkspaceDefaults";
import type { CmsMediaRecord, CmsWorkspaceData } from "@/types/cms";

export const dynamic = "force-dynamic";

const WORKSPACE_FILE = "cms-workspace-v2.json";
const MAX_CMS_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_CMS_DATA_URL_BYTES = 512 * 1024;
const ALLOWED_CMS_IMAGE_MIMES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"]);

function hasValidCmsImageMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (mime === "image/webp") {
    return (
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mime === "image/avif") {
    const ftyp = buf.subarray(4, 12).toString("ascii");
    return ftyp.startsWith("ftyp") && (ftyp.includes("avif") || ftyp.includes("avis") || ftyp.includes("mif1"));
  }
  return false;
}

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

      if (!(file instanceof File) || file.size <= 0) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      if (!ALLOWED_CMS_IMAGE_MIMES.has(file.type)) {
        return NextResponse.json(
          { error: "Unsupported image type. Allowed: JPEG, PNG, WEBP, AVIF." },
          { status: 400 }
        );
      }
      if (file.size > MAX_CMS_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "File exceeds 5 MB upload size limit." },
          { status: 400 }
        );
      }

      filename = sanitizeFilename(file.name || filename);
      alt = providedAlt || filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      mimeType = file.type;
      sizeKb = Math.max(1, Math.round(file.size / 1024));

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      if (!hasValidCmsImageMagicBytes(buffer, mimeType)) {
        return NextResponse.json(
          { error: "Uploaded file failed image signature verification." },
          { status: 400 }
        );
      }

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

      // Fallback to bounded inline image data URL when storage is unavailable
      if (!url) {
        if (buffer.byteLength > MAX_CMS_DATA_URL_BYTES) {
          return NextResponse.json(
            { error: "Image too large for fallback storage. Configure cloud storage for files over 512 KB." },
            { status: 413 }
          );
        }
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
      mimeType = typeof body.mimeType === "string" && ALLOWED_CMS_IMAGE_MIMES.has(body.mimeType)
        ? body.mimeType
        : "image/png";
      sizeKb = Math.max(1, Math.round(Number(body.sizeKb) || 24));
      url = (body.url || body.dataUrl || "").trim();

      if (!url) {
        return NextResponse.json({ error: "Missing image URL or data" }, { status: 400 });
      }
      if (url.startsWith("data:")) {
        if (!/^data:image\/(?:jpeg|jpg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/i.test(url)) {
          return NextResponse.json({ error: "Invalid image data URL format" }, { status: 400 });
        }
        if (Buffer.byteLength(url, "utf8") > MAX_CMS_DATA_URL_BYTES * 1.4) {
          return NextResponse.json({ error: "Data URL exceeds size limit" }, { status: 413 });
        }
      } else {
        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.protocol !== "https:") {
            return NextResponse.json({ error: "External media URLs must use HTTPS" }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid external media URL" }, { status: 400 });
        }
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
  } catch (err) {
    console.error("CMS media upload error:", err);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
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
    const target = workspace.media.find((item) => item.id === id);
    if (target?.url && target.url.includes("/storage/v1/object/public/property-images/")) {
      const storagePath = target.url.split("/storage/v1/object/public/property-images/")[1]?.split("?")[0];
      if (storagePath) {
        const adminClient = createAdminDataClient();
        await adminClient?.storage.from("property-images").remove([decodeURIComponent(storagePath)]).catch(() => {});
      }
    }
    workspace.media = workspace.media.filter((item) => item.id !== id);
    await persistSharedJsonFile(WORKSPACE_FILE, workspace);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CMS media delete error:", err);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}

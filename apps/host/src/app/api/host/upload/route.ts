import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyHostSession } from "@/lib/auth/serverAuth";
import { getHostServiceRoleClient } from "@/lib/supabase/service";
import { ALLOWED_IMAGE_MIMES, MAX_FILE_SIZE_BYTES } from "@/lib/storage/uploadBridge";

export async function POST(request: NextRequest) {
  // 1. Enforce authenticated host session (supports Firebase phone, Supabase token/cookie, dev host)
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required to upload property media." },
      { status: 401 }
    );
  }

  // 2. Service role client with storage administration permissions
  const supabase = getHostServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { code: "storage_not_configured", message: "Host storage service client is unavailable." },
      { status: 503 }
    );
  }

  // 3. Extract and parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { code: "invalid_form_data", message: "Failed to parse multipart media upload." },
      { status: 400 }
    );
  }

  // Collect all files from "files" and "file" fields
  const fileEntries: File[] = [];
  const rawList = formData.getAll("files");
  for (const item of rawList) {
    if (item instanceof File && item.size > 0) fileEntries.push(item);
  }

  const singleList = formData.getAll("file");
  for (const item of singleList) {
    if (item instanceof File && item.size > 0 && !fileEntries.includes(item)) {
      fileEntries.push(item);
    }
  }

  if (fileEntries.length === 0) {
    return NextResponse.json(
      { code: "no_files_provided", message: "No image files were supplied in the upload request." },
      { status: 400 }
    );
  }

  const bucketName = (formData.get("bucket") as string)?.trim() || "property-images";

  // 4. Strict security validation on all files before performing uploads
  for (const file of fileEntries) {
    if (!(ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        {
          code: "invalid_media_type",
          message: `File "${file.name}" has unsupported type (${file.type || "unknown"}). Only JPG, PNG, WEBP, and AVIF are permitted.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          code: "file_too_large",
          message: `File "${file.name}" exceeds 2 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
        },
        { status: 400 }
      );
    }
  }

  const uploadedPaths: string[] = [];
  const publicUrls: string[] = [];
  const fileDetails: { originalName: string; url: string; path: string; size: number }[] = [];

  try {
    for (const file of fileEntries) {
      const rawExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const safeExt = ["jpeg", "jpg", "png", "webp", "avif"].includes(rawExt) ? rawExt : "jpg";
      const filePath = `${authUser.id}/${crypto.randomUUID()}.${safeExt}`;

      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload error for "${file.name}": ${uploadError.message}`);
      }

      uploadedPaths.push(filePath);
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      publicUrls.push(data.publicUrl);
      fileDetails.push({
        originalName: file.name,
        url: data.publicUrl,
        path: filePath,
        size: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      urls: publicUrls,
      files: fileDetails,
    });
  } catch (err: unknown) {
    // Automatic Rollback: remove partially uploaded files from storage
    if (uploadedPaths.length > 0) {
      try {
        await supabase.storage.from(bucketName).remove(uploadedPaths);
      } catch (cleanupErr) {
        console.error("Notice: Failed to clean up partial storage uploads:", cleanupErr);
      }
    }

    return NextResponse.json(
      {
        code: "upload_failed",
        message: err instanceof Error ? err.message : "Media upload to storage failed.",
      },
      { status: 500 }
    );
  }
}

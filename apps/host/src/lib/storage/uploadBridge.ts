import { SupabaseClient } from "@supabase/supabase-js";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): UploadValidationResult {
  if (!(ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type (${file.type || "unknown"}). Only JPG, PNG, WEBP, and AVIF are permitted.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return { valid: true };
}

export interface UploadBridgeOptions {
  supabase?: SupabaseClient;
  hostId: string;
  files: File[];
  bucketName?: string;
  authToken?: string;
  useServerRoute?: boolean;
}

/**
 * Uploads media files directly via the authoritative server API route `/api/host/upload`.
 * This cleanly bypasses Supabase Storage RLS barriers for Firebase Phone Auth hosts.
 */
export async function uploadFilesViaServerRoute(
  files: File[],
  options: { authToken?: string; bucketName?: string } = {}
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  if (options.bucketName) {
    formData.append("bucket", options.bucketName);
  }

  const headers: Record<string, string> = {};
  if (options.authToken) {
    headers["Authorization"] = `Bearer ${options.authToken}`;
  }

  const res = await fetch("/api/host/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.urls)) {
    throw new Error(data.message || `Server upload failed with status ${res.status}`);
  }

  return data.urls as string[];
}

/**
 * Resilient bridge to validate and upload images to Supabase storage.
 * Prioritizes the secure server-side upload route (`/api/host/upload`) with fallback
 * to direct client storage, providing atomic rollback on batch failure.
 */
export async function uploadPropertyImagesBridge({
  supabase,
  hostId,
  files,
  bucketName = "property-images",
  authToken,
  useServerRoute = true,
}: UploadBridgeOptions): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  // Pre-validate all files before starting upload
  for (const file of files) {
    const val = validateImageFile(file);
    if (!val.valid) {
      throw new Error(val.error);
    }
  }

  // 1. Primary path: upload via server route (resilient for both Firebase Phone Auth and Supabase)
  if (useServerRoute) {
    try {
      return await uploadFilesViaServerRoute(files, { authToken, bucketName });
    } catch (serverErr) {
      console.warn("Notice: Server-side upload failed, attempting fallback:", serverErr);
      if (!supabase) throw serverErr;
    }
  }

  // 2. Fallback / direct client-side upload if requested and client is present
  if (!supabase) {
    throw new Error("No Supabase client or server upload route available.");
  }

  const uploadedPaths: string[] = [];
  const publicUrls: string[] = [];

  try {
    for (const file of files) {
      const rawExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const safeExt = ["jpeg", "jpg", "png", "webp", "avif"].includes(rawExt) ? rawExt : "jpg";
      const filePath = `${hostId}/${crypto.randomUUID()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
      }

      uploadedPaths.push(filePath);
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      publicUrls.push(data.publicUrl);
    }

    return publicUrls;
  } catch (err: unknown) {
    // Rollback / cleanup on failure
    if (uploadedPaths.length > 0) {
      try {
        await supabase.storage.from(bucketName).remove(uploadedPaths);
      } catch (cleanupErr) {
        console.error("Failed to clean up partial storage uploads:", cleanupErr);
      }
    }

    // If client upload failed due to RLS/Auth, attempt server route as second chance
    if (!useServerRoute) {
      try {
        return await uploadFilesViaServerRoute(files, { authToken, bucketName });
      } catch (fallbackErr) {
        console.error("Secondary server upload fallback failed:", fallbackErr);
      }
    }

    throw err;
  }
}

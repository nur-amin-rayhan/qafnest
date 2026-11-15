import { SupabaseClient } from "@supabase/supabase-js";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB final uploaded asset limit
export const MAX_SOURCE_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB pre-compression raw limit
export const MAX_IMAGE_DIMENSION_PX = 1920; // Optimal full-HD/4K balanced width/height cap

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSourceImageFile(file: File): UploadValidationResult {
  if (!(ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type (${file.type || "unknown"}). Only JPG, PNG, WEBP, and AVIF are permitted.`,
    };
  }

  if (file.size > MAX_SOURCE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds 15 MB raw upload limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return { valid: true };
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
      error: `File "${file.name}" exceeds 2 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  return { valid: true };
}

function loadBrowserImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to decode image "${file.name}".`));
    };
    img.src = objectUrl;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

/**
 * Automatically resizes oversized property images (<= 1920px longest side) and
 * converts them to lightweight WebP files <= 2 MB in the browser before upload.
 */
export async function optimizePropertyImageToWebP(file: File): Promise<File> {
  const sourceCheck = validateSourceImageFile(file);
  if (!sourceCheck.valid) {
    throw new Error(sourceCheck.error);
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  const img = await loadBrowserImage(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;
  if (!srcWidth || !srcHeight) {
    throw new Error(`Image "${file.name}" has invalid dimensions.`);
  }

  const longestSide = Math.max(srcWidth, srcHeight);
  const baseScale = longestSide > MAX_IMAGE_DIMENSION_PX ? MAX_IMAGE_DIMENSION_PX / longestSide : 1;
  const baseName = file.name.replace(/\.[^/.]+$/, "") || "property-photo";

  // Keep already-compact WebP files within dimensions untouched to avoid quality loss
  if (file.type === "image/webp" && baseScale === 1 && file.size <= MAX_FILE_SIZE_BYTES) {
    return file;
  }

  let scale = baseScale;
  let bestBlob: Blob | null = null;
  const qualitySteps = [0.82, 0.72, 0.62, 0.52, 0.42];

  for (let pass = 0; pass < 3; pass++) {
    const targetW = Math.max(1, Math.round(srcWidth * scale));
    const targetH = Math.max(1, Math.round(srcHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    for (const q of qualitySteps) {
      const blob = await canvasToWebpBlob(canvas, q);
      if (!blob) continue;
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }
      if (blob.size <= MAX_FILE_SIZE_BYTES) {
        return new File([blob], `${baseName}.webp`, {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }
    }

    scale *= 0.8;
  }

  if (bestBlob && bestBlob.size <= MAX_FILE_SIZE_BYTES) {
    return new File([bestBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  }

  if (file.size <= MAX_FILE_SIZE_BYTES) {
    return file;
  }

  throw new Error(
    `Image "${file.name}" could not be compressed below 2 MB. Please choose a smaller photo.`
  );
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
          cacheControl: "31536000",
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

export const ADMIN_COOKIE_NAME = "qafnest_admin_session";

export interface AdminTokenPayload {
  email: string;
  role: string;
  exp: number;
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeText(base64url: string): string {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  return decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

export async function verifyAdminTokenEdge(
  token: string,
  secretKey?: string
): Promise<AdminTokenPayload | null> {
  try {
    const secret = secretKey || process.env.ADMIN_SECRET_KEY?.trim();
    if (!secret || secret.length < 32) return null;

    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8Array(signature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      encoder.encode(data) as unknown as BufferSource
    );
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecodeText(data)) as AdminTokenPayload;
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.exp !== "number" ||
      Date.now() > payload.exp ||
      payload.role !== "admin"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "qafnest_admin_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getSecretKey(): string {
  const secret = process.env.ADMIN_SECRET_KEY?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SECRET_KEY must be configured with at least 32 characters.");
  }
  return secret;
}

export function signAdminToken(payload: { email: string; role: string; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifyAdminToken(token: string): { email: string; role: string; exp: number } | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getSecretKey())
      .update(data)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as {
      email: string;
      role: string;
      exp: number;
    };

    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}


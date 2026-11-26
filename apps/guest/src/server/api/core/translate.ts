import { NextResponse } from "next/server";
import { translateText, isArabicText } from "@/lib/services/translationService";
import { checkRateLimit } from "@qafnest/shared/rateLimiter";
import { extractClientIp } from "@qafnest/shared/signupSecurityStore";

const MAX_TRANSLATE_CHARS = 5000;

export async function POST(request: Request) {
  const clientIp = extractClientIp(request);
  const rl = checkRateLimit(`translate:${clientIp}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many translation requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const targetLang = body?.targetLang === "ar" || body?.targetLang === "en" ? body.targetLang : "ar";

    if (!text) {
      return NextResponse.json({ translatedText: "" });
    }
    if (text.length > MAX_TRANSLATE_CHARS) {
      return NextResponse.json(
        { error: `Text exceeds maximum translation length (${MAX_TRANSLATE_CHARS} characters).` },
        { status: 400 }
      );
    }

    const translatedText = await translateText(text, targetLang);
    return NextResponse.json({
      translatedText,
      sourceIsArabic: isArabicText(text),
    });
  } catch (err) {
    console.warn("Translation API error:", err);
    return NextResponse.json(
      { error: "Translation service temporarily unavailable" },
      { status: 500 }
    );
  }
}

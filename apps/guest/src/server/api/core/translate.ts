import { NextResponse } from "next/server";
import { translateText, isArabicText } from "@/lib/services/translationService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const targetLang = body?.targetLang === "ar" || body?.targetLang === "en" ? body.targetLang : "ar";

    if (!text) {
      return NextResponse.json({ translatedText: "" });
    }

    const translatedText = await translateText(text, targetLang);
    return NextResponse.json({
      translatedText,
      sourceIsArabic: isArabicText(text),
    });
  } catch (err) {
    console.warn("Translation API error:", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}

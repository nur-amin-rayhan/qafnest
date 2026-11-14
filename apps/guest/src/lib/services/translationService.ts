/**
 * Translation service for reviews and content
 * Automatically translates between Arabic and English
 */

const translationCache = new Map<string, string>();

export function isArabicText(text: string): boolean {
  if (!text) return false;
  // Arabic Unicode range
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

export async function translateText(text: string, targetLang: "ar" | "en"): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";

  const cacheKey = `${targetLang}:${clean}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // If text is already predominantly in the target language
  const hasArabic = isArabicText(clean);
  if (targetLang === "ar" && hasArabic && clean.length > 5 && !/[a-zA-Z]{6,}/.test(clean)) {
    return clean;
  }
  if (targetLang === "en" && !hasArabic) {
    return clean;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(clean)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "force-cache",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0]
          .map((item: unknown[]) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
          .join("");

        if (translated.trim()) {
          translationCache.set(cacheKey, translated.trim());
          return translated.trim();
        }
      }
    }
  } catch (err) {
    console.warn("Translation service notice:", err);
  }

  // Graceful fallback
  return clean;
}

export async function translateReviewContent({
  title,
  comment,
}: {
  title: string;
  comment: string;
}): Promise<{
  titleEn: string;
  titleAr: string;
  commentEn: string;
  commentAr: string;
}> {
  const isArabicInput = isArabicText(comment) || isArabicText(title);

  if (isArabicInput) {
    const [titleEn, commentEn] = await Promise.all([
      translateText(title, "en"),
      translateText(comment, "en"),
    ]);

    return {
      titleEn: titleEn || title,
      titleAr: title,
      commentEn: commentEn || comment,
      commentAr: comment,
    };
  }

  // English input -> translate to Arabic
  const [titleAr, commentAr] = await Promise.all([
    translateText(title, "ar"),
    translateText(comment, "ar"),
  ]);

  return {
    titleEn: title,
    titleAr: titleAr || title,
    commentEn: comment,
    commentAr: commentAr || comment,
  };
}

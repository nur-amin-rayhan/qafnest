import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { localizePath } from "@/lib/localization/localeHelper";

const SLUG_ALIASES: Record<string, string> = {
  terms: "terms-and-conditions",
  "terms-conditions": "terms-and-conditions",
  "terms-and-conditions": "terms-and-conditions",
  privacy: "privacy-policy",
  "privacy-policy": "privacy-policy",
  "data-protection": "privacy-policy",
  cookies: "cookies-policy",
  "cookie-policy": "cookies-policy",
  "cookies-policy": "cookies-policy",
  cancellation: "cancellation-refund-policy",
  refund: "cancellation-refund-policy",
  refunds: "cancellation-refund-policy",
  "cancellation-policy": "cancellation-refund-policy",
  "cancellation-refund-policy": "cancellation-refund-policy",
  host: "host-compliance-policy",
  "host-rules": "host-compliance-policy",
  "host-standards": "host-compliance-policy",
  "host-compliance": "host-compliance-policy",
  "host-compliance-policy": "host-compliance-policy",
  all: "all",
  full: "all",
  charter: "all",
  unified: "all",
};

export default async function PolicySlugRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [resolvedParams, cookieStore, reqHeaders] = await Promise.all([
    params,
    cookies(),
    headers(),
  ]);

  const headerLang = reqHeaders.get("x-qafnest-locale");
  const rawLang = headerLang || cookieStore.get("qafnest_lang")?.value;
  const lang: "ar" | "en" = rawLang === "en" ? "en" : "ar";

  const rawSlug = decodeURIComponent(resolvedParams.slug || "").trim().toLowerCase();
  const canonicalSlug = SLUG_ALIASES[rawSlug] || rawSlug;

  if (canonicalSlug === "all" || !canonicalSlug) {
    redirect(localizePath("/policies", lang));
  }

  // Redirect cleanly to unified master container with the chapter hash
  redirect(localizePath(`/policies#${canonicalSlug}`, lang));
}

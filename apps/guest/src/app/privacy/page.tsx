import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { localizePath } from "@/lib/localization/localeHelper";

export default async function PrivacyPage() {
  const [cookieStore, reqHeaders] = await Promise.all([cookies(), headers()]);
  const rawLang = reqHeaders.get("x-qafnest-locale") || cookieStore.get("qafnest_lang")?.value;
  const lang = rawLang === "en" ? "en" : "ar";
  redirect(localizePath("/policies#privacy-policy", lang));
}

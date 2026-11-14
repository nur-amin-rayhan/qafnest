import { redirect } from "next/navigation";

export default function SettingsRedirectPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const lang = searchParams?.lang === "en" ? "en" : "ar";
  redirect(`/${lang}/account?tab=profile`);
}



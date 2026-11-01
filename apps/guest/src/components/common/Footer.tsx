"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Award, Flame, PhoneCall } from "lucide-react";
import { useApp } from "@/context/AppContext";

const paymentMethods = ["Apple Pay", "Visa", "Mastercard", "mada", "Tabby", "Tamara", "Qitaf"];

export default function Footer() {
  const { setSelectedCategory, setSelectedCity, language, t } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const browse = (query: "category" | "city", value: string) => {
    if (query === "category") setSelectedCategory(value);
    else setSelectedCity(value);

    const section = document.getElementById("properties");
    if (pathname === "/" && section) {
      section.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push(`/search?${query}=${encodeURIComponent(value)}`);
  };

  const label = (en: string, ar: string) => language === "ar" ? ar : en;

  return (
    <footer id="contact" className="border-t border-violet-100 bg-white py-10 text-gray-900 dark:border-white/10 dark:bg-[#08070D] dark:text-white sm:py-14">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_12px_40px_rgba(57,34,93,0.04)] dark:border-violet-400/15 dark:bg-[#12101a] sm:p-8 lg:grid-cols-[1.4fr_1fr_0.9fr] lg:gap-12">
          <div>
            <Link href="/" aria-label="QafNest home" className="inline-flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-800 font-display text-xl font-black text-white">Q</span>
              <span className="font-display text-2xl font-extrabold tracking-tight text-violet-800 dark:text-violet-300">Qaf<span className="text-orange-500">Nest</span></span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-300">{t.footer.desc}</p>
            <div className="mt-5 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p className="inline-flex items-center gap-2"><Award className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" />{t.footer.license}</p>
              <p className="pl-6">{t.footer.cr}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="mb-4 text-sm font-bold text-gray-950 dark:text-white">{label("Explore stays", "اكتشف الإقامات")}</h2>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li><button onClick={() => browse("category", "penthouse")} className="text-start transition hover:text-violet-700 dark:hover:text-violet-300">{label("Apartments & studios", "شقق واستوديوهات")}</button></li>
                <li><button onClick={() => browse("category", "chalet")} className="text-start transition hover:text-violet-700 dark:hover:text-violet-300">{label("Chalets & resorts", "شاليهات ومنتجعات")}</button></li>
                <li><button onClick={() => browse("category", "villa")} className="text-start transition hover:text-violet-700 dark:hover:text-violet-300">{label("Villas", "فلل")}</button></li>
                <li><button onClick={() => browse("category", "farm")} className="text-start transition hover:text-violet-700 dark:hover:text-violet-300">{label("Farms", "مزارع")}</button></li>
                <li><button onClick={() => browse("category", "camp")} className="text-start transition hover:text-violet-700 dark:hover:text-violet-300">{label("Camps", "مخيمات")}</button></li>
                <li><Link href="/blog" className="inline-flex items-center gap-1.5 transition hover:text-violet-700 dark:hover:text-violet-300"><Flame className="h-3.5 w-3.5 text-orange-500" />{label("Blog & Travel Guides", "المدونة وأدلة السفر")}</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-bold text-gray-950 dark:text-white">{label("Help & links", "المساعدة والروابط")}</h2>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li><Link href="/#faq" className="transition hover:text-violet-700 dark:hover:text-violet-300">{label("FAQs", "الأسئلة الشائعة")}</Link></li>
                <li><Link href="/my-bookings" className="transition hover:text-violet-700 dark:hover:text-violet-300">{label("My bookings", "حجوزاتي")}</Link></li>
                <li><a href="https://business.qafnest.vercel.app" target="_blank" rel="noopener noreferrer" className="transition hover:text-violet-700 dark:hover:text-violet-300">{label("Host portal", "بوابة المضيفين")}</a></li>
                <li><a href="tel:+966559600576" className="transition hover:text-violet-700 dark:hover:text-violet-300">{label("Contact us", "تواصل معنا")}</a></li>
              </ul>
              <a href="tel:+966559600576" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-100 px-3 py-2.5 text-xs font-semibold text-gray-800 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:text-gray-200 dark:hover:text-violet-300">
                <PhoneCall className="h-3.5 w-3.5 text-violet-700 dark:text-violet-300" /><span dir="ltr">+966 55 960 0576</span>
              </a>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-gray-950 dark:text-white">{label("Popular destinations", "وجهات مميزة")}</h2>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-gray-600 dark:text-gray-300">
              {[["riyadh", "Riyadh", "الرياض"], ["jeddah", "Jeddah", "جدة"], ["alula", "AlUla", "العلا"], ["khobar", "Al Khobar", "الخبر"], ["abha", "Abha", "أبها"]].map(([id, en, ar]) => (
                <li key={id}><button onClick={() => browse("city", id)} className="text-start transition hover:text-violet-700 dark:hover:text-violet-300">{label(en, ar)}</button></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-3xl border border-violet-100 bg-white p-5 dark:border-violet-400/15 dark:bg-[#12101a] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">{label("Payment methods", "طرق الدفع")}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label("Available options are confirmed at checkout.", "تتأكد خيارات الدفع المتاحة عند إتمام الحجز.")}</p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-3" aria-label={label("Payment method brands", "علامات طرق الدفع")}>
            {paymentMethods.map((method) => <li key={method}><PaymentMark name={method} /></li>)}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 px-1 pt-6 text-xs text-gray-500 dark:text-gray-400 sm:flex-row">
          <p>{t.footer.rights}</p>
          <div className="flex items-center gap-2" aria-label={label("Social media", "وسائل التواصل الاجتماعي")}>
            <SocialMark name="Facebook" />
            <SocialMark name="X" />
            <SocialMark name="Instagram" />
            <SocialMark name="YouTube" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function PaymentMark({ name }: { name: string }) {
  const shared = "inline-flex h-8 items-center justify-center whitespace-nowrap font-bold";
  if (name === "Apple Pay") return <span role="img" aria-label="Apple Pay" className={`${shared}`}><Image src="/apple-pay-mark.svg" alt="" aria-hidden="true" width={50} height={32} unoptimized className="h-8 w-[50px] object-contain" /></span>;
  if (name === "Visa") return <span className={`${shared} text-xl italic tracking-tight text-[#1434CB]`}>VISA</span>;
  if (name === "Mastercard") return <span className={`${shared} gap-1`} aria-label="Mastercard"><span className="h-5 w-5 rounded-full bg-[#EB001B]" /><span className="-ml-3 h-5 w-5 rounded-full bg-[#F79E1B]/90" /><span className="sr-only">Mastercard</span></span>;
  if (name === "mada") return <span className={`${shared} gap-1 text-[10px] leading-none text-gray-800 dark:text-gray-100`}><span className="flex flex-col gap-[2px]" aria-hidden="true"><i className="h-1 w-5 bg-[#009E4D]" /><i className="h-1 w-5 bg-[#00AEEF]" /><i className="h-1 w-5 bg-[#86BC25]" /></span><span>مدى<br />mada</span></span>;
  if (name === "Tabby") return <span className={`${shared} rounded-md bg-[#35E8A5] px-2 text-sm lowercase tracking-tight text-[#111]`}>tabby</span>;
  if (name === "Tamara") return <span className={`${shared} rounded-md bg-gradient-to-r from-[#FFE17A] via-[#F8C7D7] to-[#B9D5FF] px-2 text-sm lowercase tracking-tight text-[#111]`}>tamara</span>;
  return <span className={`${shared} flex-col text-[10px] leading-[0.9] text-[#51218C]`}><span className="font-extrabold">قطاف</span><span className="font-semibold">qitaf</span></span>;
}

function SocialMark({ name }: { name: "Facebook" | "X" | "Instagram" | "YouTube" }) {
  return (
    <span title={name} aria-label={name} className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-800 text-orange-400">
      {name === "Facebook" && <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.02 4.388 11.016 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.017 1.792-4.695 4.533-4.695 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.49 0-1.955.93-1.955 1.886v2.265h3.328l-.532 3.47h-2.796v8.385C19.612 23.09 24 18.093 24 12.073z" /></svg>}
      {name === "X" && <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>}
      {name === "Instagram" && <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm5 2.5A5.5 5.5 0 1 0 12 17.5 5.5 5.5 0 0 0 12 6.5zm0 2A3.5 3.5 0 1 1 12 15.5a3.5 3.5 0 0 1 0-7zm5.75-3.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" /></svg>}
      {name === "YouTube" && <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.57 12 3.57 12 3.57s-7.55 0-9.4.51A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.51 9.4.51 9.4.51s7.55 0 9.4-.51a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>}
    </span>
  );
}

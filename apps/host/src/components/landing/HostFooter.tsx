"use client";

import React from "react";
import Link from "next/link";
import { Award, MessageCircle, PhoneCall } from "lucide-react";
import { ECOSYSTEM_URLS, QAFNEST_SUPPORT_CONTACT, QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";

interface HostFooterProps {
  t: (en: string, ar: string) => string;
}

const SOCIAL_LINKS: Array<{ name: "Facebook" | "X" | "Instagram" | "YouTube"; href: string }> = [
  { name: "Facebook", href: "https://www.facebook.com/qafnest" },
  { name: "X", href: "https://x.com/qafnest" },
  { name: "Instagram", href: "https://www.instagram.com/qafnest" },
  { name: "YouTube", href: "https://www.youtube.com/@qafnest" },
];

function HostSocialIcon({ name, href }: { name: "Facebook" | "X" | "Instagram" | "YouTube"; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      aria-label={name}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#492a7e] text-white transition hover:bg-[#3a1f66]"
    >
      {name === "Facebook" && (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.02 4.388 11.016 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.017 1.792-4.695 4.533-4.695 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.49 0-1.955.93-1.955 1.886v2.265h3.328l-.532 3.47h-2.796v8.385C19.612 23.09 24 18.093 24 12.073z" />
        </svg>
      )}
      {name === "X" && (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )}
      {name === "Instagram" && (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm5 2.5A5.5 5.5 0 1 0 12 17.5 5.5 5.5 0 0 0 12 6.5zm0 2A3.5 3.5 0 1 1 12 15.5a3.5 3.5 0 0 1 0-7zm5.75-3.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
        </svg>
      )}
      {name === "YouTube" && (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.57 12 3.57 12 3.57s-7.55 0-9.4.51A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.51 9.4.51 9.4.51s7.55 0 9.4-.51a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
        </svg>
      )}
    </a>
  );
}

export function HostFooter({ t }: HostFooterProps) {
  return (
    <footer className="border-t border-gray-100 bg-[#FAFAFC] py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Band 1: Gathern-style Upper Rounded Card */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-8 sm:px-10 sm:py-9">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_1fr_0.75fr] lg:items-start lg:gap-10">
            {/* Left Column: QafNest Business + License + Support Number */}
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/" className="inline-flex items-center gap-1.5 select-none">
                  <span className="text-[28px] sm:text-[32px] font-black tracking-[-0.05em] text-[#4F2396]">
                    Qaf<span className="text-[#7c3aed]">Nest</span>
                    <span className="text-[#FF9750]">.</span>
                  </span>
                </Link>

                <span aria-hidden="true" className="h-9 w-px bg-gray-200" />

                <div className="inline-flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-[#4F2396]">
                    <Award className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <span className="block text-[11px] font-bold text-[#4F2396]">
                      بوابة أعمال مرخصة
                    </span>
                    <span className="block text-[11px] font-semibold text-[#4F2396]/90">
                      Official Host Portal
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-1 text-[13px] leading-6 text-[#1f2937]">
                <p>{t("Licensed by the Ministry of Tourism", "مرخصة من وزارة السياحة")}</p>
                <p>
                  {t(
                    `License Number: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber}`,
                    `ترخيص رقم: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber}`
                  )}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[13px]">
                <a
                  href={QAFNEST_SUPPORT_CONTACT.telHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-1.5 font-semibold text-[#1f2937] transition hover:border-[#4F2396] hover:text-[#4F2396]"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-[#4F2396]" />
                  <span>{t("Host Support:", "دعم المضيفين:")}</span>
                  <span dir="ltr" className="font-bold">
                    {QAFNEST_SUPPORT_CONTACT.displayPhone}
                  </span>
                </a>
                <a
                  href={QAFNEST_SUPPORT_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{t("WhatsApp", "واتساب")}</span>
                </a>
              </div>
            </div>

            {/* Middle & Right Columns */}
            <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6 lg:contents lg:border-t-0 lg:pt-0">
              <ul className="space-y-3 text-[13.5px] font-medium text-[#2c2c2c]">
                <li>
                  <Link href="/app" className="transition hover:text-[#4F2396]">
                    {t("Host Dashboard", "لوحة تحكم المضيف")}
                  </Link>
                </li>
                <li>
                  <Link href="/properties/new?mode=new" className="transition hover:text-[#4F2396]">
                    {t("Register New Property", "تسجيل عقار جديد")}
                  </Link>
                </li>
                <li>
                  <Link href="/properties/new?mode=resume" className="transition hover:text-[#4F2396]">
                    {t("Resume Property Draft", "استكمال آخر عقار")}
                  </Link>
                </li>
                <li>
                  <a href="#calculator" className="transition hover:text-[#4F2396]">
                    {t("Monthly Income Calculator", "حاسبة الدخل الشهري")}
                  </a>
                </li>
                <li>
                  <a href="#protection" className="transition hover:text-[#4F2396]">
                    {t("Host Protection Program", "برنامج حماية المضيف")}
                  </a>
                </li>
              </ul>

              <ul className="space-y-3 text-[13.5px] font-medium text-[#2c2c2c]">
                <li>
                  <a href="#how-to-host" className="transition hover:text-[#4F2396]">
                    {t("How to Host", "طريقة الاستضافة")}
                  </a>
                </li>
                <li>
                  <a
                    href={`${ECOSYSTEM_URLS.guest}/en/account?tab=terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396]"
                  >
                    {t("Terms of use", "شروط الاستخدام")}
                  </a>
                </li>
                <li>
                  <a
                    href={`${ECOSYSTEM_URLS.guest}/en/#faq`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396]"
                  >
                    {t("FAQs", "الأسئلة المتكررة")}
                  </a>
                </li>
                <li>
                  <a
                    href={ECOSYSTEM_URLS.guest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396]"
                  >
                    {t("Guest Platform", "منصة الضيوف")}
                  </a>
                </li>
                <li>
                  <a href={QAFNEST_SUPPORT_CONTACT.telHref} className="transition hover:text-[#4F2396]">
                    {t("Contact us", "تواصل معنا")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Band 2: Standalone Settlement & Payment Card */}
        <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white px-6 py-5 sm:flex-row sm:px-10">
          <h2 className="text-[14px] font-bold text-[#111827]">
            {t("Multiple and secure payout & payment channels", "قنوات دفع وتحويلات مالية متعددة وآمنة")}
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-3 text-xs font-extrabold sm:justify-end">
            <li className="rounded-lg border border-gray-200 px-2.5 py-1 text-slate-900">Apple Pay</li>
            <li className="rounded-lg border border-gray-200 px-2.5 py-1 text-[#1A1F71]">VISA</li>
            <li className="rounded-lg border border-gray-200 px-2.5 py-1 text-[#EB001B]">Mastercard</li>
            <li className="rounded-lg border border-gray-200 px-2.5 py-1 text-[#0074C1]">mada مدى</li>
            <li className="rounded-lg border border-gray-200 px-2.5 py-1 text-[#4F2396]">STC Pay</li>
            <li className="rounded-lg border border-gray-200 px-2.5 py-1 text-emerald-700">Saudi IBAN · SARIE</li>
          </ul>
        </div>

        {/* Band 3: Bottom Copyright & Purple Social Badges */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 pt-5 text-xs text-[#6b7280] sm:flex-row">
          <p>
            {t(
              `All Rights Reserved © ${new Date().getFullYear()} QafNest`,
              `جميع الحقوق محفوظة © ${new Date().getFullYear()} قاف نست`
            )}
          </p>
          <div className="flex w-full items-center justify-center gap-2.5 border-b border-gray-200 pb-4 sm:w-auto sm:justify-end sm:border-b-0 sm:pb-0">
            {SOCIAL_LINKS.map((item) => (
              <HostSocialIcon key={item.name} name={item.name} href={item.href} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

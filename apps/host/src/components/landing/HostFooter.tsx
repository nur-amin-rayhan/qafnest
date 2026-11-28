"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, MessageCircle, PhoneCall } from "lucide-react";
import { ECOSYSTEM_URLS, QAFNEST_SUPPORT_CONTACT, QAFNEST_ZATCA_DEFAULTS } from "@qafnest/shared";

interface HostFooterProps {
  t: (en: string, ar: string) => string;
}

const SOCIAL_LINKS: Array<{ name: "Snapchat" | "Facebook" | "X" | "Instagram" | "YouTube"; href: string }> = [
  { name: "Snapchat", href: "https://www.snapchat.com/@qafnest" },
  { name: "Instagram", href: "https://www.instagram.com/qafnest" },
  { name: "Facebook", href: "https://www.facebook.com/qafnest" },
  { name: "X", href: "https://x.com/qafnest" },
];

function HostSocialIcon({ name, href }: { name: "Snapchat" | "Facebook" | "X" | "Instagram" | "YouTube"; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      aria-label={name}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#492a7e] text-white transition hover:bg-[#3a1f66]"
    >
      {name === "Snapchat" && (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .33.016.495.104.374.181.734.285 1.033.301.197 0 .33-.045.406-.09-.009-.165-.018-.33-.03-.51l-.002-.06C5.873 7.034 5.748 5.008 6.277 3.815c1.583-3.545 4.94-3.822 5.93-3.822z" />
        </svg>
      )}
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
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-[#FAFAFC] dark:bg-[#070810] py-8 text-slate-900 dark:text-slate-100 sm:py-12 transition-colors">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Band 1: Upper Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] px-6 py-8 sm:px-10 sm:py-9 shadow-xs">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_1fr_0.75fr] lg:items-start lg:gap-10">
            {/* Left Column: QafNest Business + License + Support Number */}
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/" className="inline-flex items-center gap-1.5 select-none">
                  <span className="text-[26px] sm:text-[30px] font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                    Qaf<span className="text-[#4F2396] dark:text-purple-400">Nest</span>
                    <span className="text-[#FF9750]">.</span>
                  </span>
                </Link>

                <span aria-hidden="true" className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

                <div className="inline-flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-200/80 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300">
                    <Award className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <span className="block text-[11px] font-bold text-slate-900 dark:text-white">
                      بوابة أعمال مرخصة
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Official Host Portal
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-1 text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                <p>{t("Licensed by the Ministry of Tourism", "مرخصة من وزارة السياحة")}</p>
                <p>
                  {t(
                    `License Number: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber || "73102999"}`,
                    `ترخيص رقم: ${QAFNEST_ZATCA_DEFAULTS.licenseNumber || "73102999"}`
                  )}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[13px]">
                <a
                  href={QAFNEST_SUPPORT_CONTACT.telHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200 transition hover:border-[#4F2396] hover:text-[#4F2396]"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-[#4F2396] dark:text-purple-400" />
                  <span>{t("Host Support:", "دعم المضيفين:")}</span>
                  <span dir="ltr" className="font-bold">
                    {QAFNEST_SUPPORT_CONTACT.displayPhone}
                  </span>
                </a>
                <a
                  href={QAFNEST_SUPPORT_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 py-1.5 font-semibold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{t("WhatsApp", "واتساب")}</span>
                </a>
              </div>
            </div>

            {/* Middle & Right Columns */}
            <div className="grid grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6 lg:contents lg:border-t-0 lg:pt-0">
              <ul className="space-y-3 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">
                <li>
                  <Link href={`/${t("en", "ar")}/app`} className="transition hover:text-[#4F2396] dark:hover:text-purple-300">
                    {t("Host Dashboard", "لوحة تحكم المضيف")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${t("en", "ar")}/properties/new?mode=new`}
                    className="transition hover:text-[#4F2396] dark:hover:text-purple-300"
                  >
                    {t("Register New Property", "تسجيل عقار جديد")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${t("en", "ar")}/properties/new?mode=resume`}
                    className="transition hover:text-[#4F2396] dark:hover:text-purple-300"
                  >
                    {t("Resume Property Draft", "استكمال آخر عقار")}
                  </Link>
                </li>
                <li>
                  <a href="#calculator" className="transition hover:text-[#4F2396] dark:hover:text-purple-300">
                    {t("Monthly Income Calculator", "حاسبة الدخل الشهري")}
                  </a>
                </li>
                <li>
                  <a href="#protection" className="transition hover:text-[#4F2396]">
                    {t("Host Protection Program", "برنامج حماية المضيف")}
                  </a>
                </li>
              </ul>

              <ul className="space-y-3 text-[13.5px] font-medium text-slate-700 dark:text-slate-300">
                <li>
                  <a href="#how-to-host" className="transition hover:text-[#4F2396] dark:hover:text-purple-400">
                    {t("How to Host", "طريقة الاستضافة")}
                  </a>
                </li>
                <li>
                  <a
                    href={`${ECOSYSTEM_URLS.guest}/${t("en", "ar")}/policies#terms-and-conditions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396] dark:hover:text-purple-400"
                  >
                    {t("Terms of use", "شروط الاستخدام")}
                  </a>
                </li>
                <li>
                  <a
                    href={`${ECOSYSTEM_URLS.guest}/${t("en", "ar")}/faq`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396] dark:hover:text-purple-400"
                  >
                    {t("FAQs", "الأسئلة المتكررة")}
                  </a>
                </li>
                <li>
                  <a
                    href={`${ECOSYSTEM_URLS.guest}/${t("en", "ar")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#4F2396] dark:hover:text-purple-400"
                  >
                    {t("Guest Platform", "منصة الضيوف")}
                  </a>
                </li>
                <li>
                  <a href={QAFNEST_SUPPORT_CONTACT.telHref} className="transition hover:text-[#4F2396] dark:hover:text-purple-400">
                    {t("Contact us", "تواصل معنا")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Band 2: Standalone Settlement & Payment Card */}
        <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] px-6 py-5 sm:flex-row sm:px-10 transition-colors">
          <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
            {t("Multiple and secure payout & payment channels", "قنوات دفع وتحويلات مالية متعددة وآمنة")}
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-end">
            {/* Apple Pay */}
            <li title="Apple Pay">
              <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200/85 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 px-2 py-0.5 shadow-2xs transition hover:border-gray-400 dark:hover:border-slate-600">
                <Image
                  src="/apple-pay-mark.svg"
                  alt="Apple Pay"
                  width={48}
                  height={30}
                  unoptimized
                  className="h-full w-auto object-contain"
                />
              </span>
            </li>

            {/* VISA */}
            <li title="VISA">
              <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200/85 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 px-2 py-0.5 shadow-2xs transition hover:border-gray-400 dark:hover:border-slate-600">
                <Image
                  src="/payment-icons/v.png"
                  alt="VISA"
                  width={44}
                  height={28}
                  unoptimized
                  className="h-full w-auto object-contain"
                />
              </span>
            </li>

            {/* Mastercard */}
            <li title="Mastercard">
              <span className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200/85 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 px-1.5 py-0.5 shadow-2xs transition hover:border-gray-400 dark:hover:border-slate-600">
                <Image
                  src="/payment-icons/m.png"
                  alt="Mastercard"
                  width={44}
                  height={28}
                  unoptimized
                  className="h-full w-auto object-contain"
                />
              </span>
            </li>

            {/* mada */}
            <li title="mada">
              <span className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200/85 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 px-1.5 py-0.5 shadow-2xs transition hover:border-gray-400 dark:hover:border-slate-600">
                <Image
                  src="/payment-icons/md.png"
                  alt="mada"
                  width={44}
                  height={28}
                  unoptimized
                  className="h-full w-auto object-contain"
                />
              </span>
            </li>

            {/* STC Pay */}
            <li title="STC Pay">
              <span className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200/85 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 px-1.5 py-0.5 shadow-2xs transition hover:border-gray-400 dark:hover:border-slate-600">
                <Image
                  src="/payment-icons/stc.png"
                  alt="STC Pay"
                  width={46}
                  height={28}
                  unoptimized
                  className="h-full w-auto object-contain"
                />
              </span>
            </li>

            {/* Saudi IBAN · SARIE */}
            <li title="Saudi IBAN · SARIE">
              <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-emerald-800 dark:text-emerald-200 shadow-2xs transition hover:border-emerald-300 dark:hover:border-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black tracking-tight text-emerald-900 dark:text-emerald-100">SARIE · سريع</span>
                <span className="rounded bg-emerald-200/70 dark:bg-emerald-800/50 px-1 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-200">Saudi IBAN</span>
              </span>
            </li>
          </ul>
        </div>

        {/* Band 3: Bottom Copyright & Purple Social Badges */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 pt-5 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
          <p>
            {t(
              `All Rights Reserved © ${new Date().getFullYear()} QafNest`,
              `جميع الحقوق محفوظة © ${new Date().getFullYear()} قاف نست`
            )}
          </p>
          <div className="flex w-full items-center justify-center gap-2.5 border-b border-gray-200 dark:border-slate-800 pb-4 sm:w-auto sm:justify-end sm:border-b-0 sm:pb-0">
            {SOCIAL_LINKS.map((item) => (
              <HostSocialIcon key={item.name} name={item.name} href={item.href} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";

export const PAYMENT_METHODS = [
  "Apple Pay",
  "Visa",
  "Mastercard",
  "mada",
  "Tabby",
  "Tamara",
  "STC Pay",
  "Qitaf",
];

export function PaymentMark({ name }: { name: string }) {
  const shared = "inline-flex h-8 items-center justify-center whitespace-nowrap font-bold";
  if (name === "Apple Pay") return <OfficialPaymentIcon name="apple" heightClass="h-7" />;
  if (name === "Google Pay") return <OfficialPaymentIcon name="google" heightClass="h-7" />;
  if (name === "STC Pay") return <OfficialPaymentIcon name="stcpay" heightClass="h-7" />;
  if (name === "Visa") return <OfficialPaymentIcon name="visa" heightClass="h-7" />;
  if (name === "Mastercard") return <OfficialPaymentIcon name="mastercard" heightClass="h-7" />;
  if (name === "mada") return <OfficialPaymentIcon name="mada" heightClass="h-7" />;
  if (name === "Tabby") return <OfficialPaymentIcon name="tabby" heightClass="h-7" />;
  if (name === "Tamara")
    return (
      <span
        className="inline-flex h-7 items-center justify-center rounded-full bg-gradient-to-r from-[#FCD6D2] via-[#E5D4F7] to-[#BFE6FF] px-2.5 text-[11px] font-extrabold lowercase tracking-tight text-[#111] shadow-2xs"
        title="Tamara"
      >
        tamara
      </span>
    );
  return (
    <span className={`${shared} flex-col text-[10px] leading-[0.95] text-[#4F2396] dark:text-violet-300`} title="STC Qitaf">
      <span className="font-extrabold">قطاف</span>
      <span className="font-bold lowercase">qitaf</span>
    </span>
  );
}

const SOCIAL_HREFS: Record<string, string> = {
  Facebook: "https://www.facebook.com/qafnest",
  X: "https://x.com/qafnest",
  Twitter: "https://x.com/qafnest",
  Instagram: "https://www.instagram.com/qafnest",
  YouTube: "https://www.youtube.com/@qafnest",
  Snapchat: "https://www.snapchat.com/@qafnest",
  TikTok: "https://www.tiktok.com/@qafnest",
  LinkedIn: "https://www.linkedin.com/company/qafnest",
};

export function SocialMark({
  name,
  href,
}: {
  name: string;
  href?: string;
}) {
  const normalized = name.trim();
  const lower = normalized.toLowerCase();
  const safeHref =
    href && /^https?:\/\//i.test(href.trim())
      ? href.trim()
      : SOCIAL_HREFS[normalized] || "#";

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      title={normalized}
      aria-label={normalized}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#492a7e] text-white transition hover:bg-[#3a1f66]"
    >
      {lower.includes("facebook") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.02 4.388 11.016 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.017 1.792-4.695 4.533-4.695 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.49 0-1.955.93-1.955 1.886v2.265h3.328l-.532 3.47h-2.796v8.385C19.612 23.09 24 18.093 24 12.073z" />
        </svg>
      ) : lower === "x" || lower.includes("twitter") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ) : lower.includes("instagram") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm5 2.5A5.5 5.5 0 1 0 12 17.5 5.5 5.5 0 0 0 12 6.5zm0 2A3.5 3.5 0 1 1 12 15.5a3.5 3.5 0 0 1 0-7zm5.75-3.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
        </svg>
      ) : lower.includes("youtube") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.57 12 3.57 12 3.57s-7.55 0-9.4.51A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.51 9.4.51 9.4.51s7.55 0 9.4-.51a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
        </svg>
      ) : lower.includes("snapchat") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .33.016.495.104.374.181.734.285 1.033.301.197 0 .33-.045.406-.09-.009-.165-.018-.33-.03-.51l-.002-.06C5.873 7.034 5.748 5.008 6.277 3.815c1.583-3.545 4.94-3.822 5.93-3.822z" />
        </svg>
      ) : lower.includes("whatsapp") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.14c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
        </svg>
      ) : lower.includes("tiktok") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.88-4.47V8.84a8.27 8.27 0 0 0 4.89 1.6V7a4.85 4.85 0 0 1-1-.31z" />
        </svg>
      ) : lower.includes("linkedin") ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ) : (
        <span className="text-[11px] font-black uppercase" aria-hidden="true">
          {normalized.slice(0, 2)}
        </span>
      )}
    </a>
  );
}


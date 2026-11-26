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
          <path d="M12.003 2c-3.134 0-5.32 2.29-5.32 5.253 0 .493.076.993.228 1.47-.723.155-1.376.554-1.82 1.119-.46.582-.625 1.32-.454 2.019.152.624.545 1.098 1.084 1.307-.066.38-.1.78-.1 1.193 0 1.2.368 2.046 1.094 2.513-.225.452-.537.818-.926 1.087-.588.408-1.384.57-2.304.474-1.069-.113-1.47.731-.834 1.276 1.415 1.211 3.336 1.178 4.828.752.883-.252 1.674-.519 2.413-.801.416-.16.823-.32 1.22-.479.396.159.803.319 1.219.479.739.282 1.53.549 2.413.801 1.492.426 3.413.459 4.828-.752.636-.545.235-1.389-.834-1.276-.92.096-1.716-.066-2.304-.474-.389-.269-.701-.635-.926-1.087.726-.467 1.094-1.313 1.094-2.513 0-.413-.034-.813-.1-1.193.539-.209.932-.683 1.084-1.307.171-.699.006-1.437-.454-2.019-.444-.565-1.097-.964-1.82-1.119.152-.477.228-.977.228-1.47C17.343 4.29 15.157 2 12.003 2z" />
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


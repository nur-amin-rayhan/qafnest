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

const SOCIAL_HREFS: Record<"Facebook" | "X" | "Instagram" | "YouTube", string> = {
  Facebook: "https://www.facebook.com/qafnest",
  X: "https://x.com/qafnest",
  Instagram: "https://www.instagram.com/qafnest",
  YouTube: "https://www.youtube.com/@qafnest",
};

export function SocialMark({
  name,
}: {
  name: "Facebook" | "X" | "Instagram" | "YouTube";
}) {
  return (
    <a
      href={SOCIAL_HREFS[name]}
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


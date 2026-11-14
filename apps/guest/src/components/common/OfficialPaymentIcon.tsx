"use client";

import React from "react";
import Image from "next/image";

export type OfficialPaymentIconName =
  | "apple"
  | "google"
  | "stcpay"
  | "mada"
  | "visa"
  | "mastercard"
  | "vm"
  | "amex"
  | "tabby";

const ICON_CONFIG: Record<
  OfficialPaymentIconName,
  { src: string; alt: string; width: number; height: number; needsSurface: boolean }
> = {
  apple: {
    src: "/apple-pay-mark.svg",
    alt: "Apple Pay",
    width: 48,
    height: 30,
    needsSurface: false,
  },
  google: {
    src: "/payment-icons/gp.png",
    alt: "Google Pay",
    width: 54,
    height: 29,
    needsSurface: false,
  },
  stcpay: {
    src: "/payment-icons/stc.png",
    alt: "STC Pay",
    width: 46,
    height: 28,
    needsSurface: true,
  },
  mada: {
    src: "/payment-icons/md.png",
    alt: "mada",
    width: 44,
    height: 28,
    needsSurface: true,
  },
  visa: {
    src: "/payment-icons/v.png",
    alt: "Visa",
    width: 44,
    height: 28,
    needsSurface: false,
  },
  mastercard: {
    src: "/payment-icons/m.png",
    alt: "Mastercard",
    width: 44,
    height: 28,
    needsSurface: true,
  },
  vm: {
    src: "/payment-icons/vm.png",
    alt: "Visa and Mastercard",
    width: 48,
    height: 30,
    needsSurface: false,
  },
  amex: {
    src: "/payment-icons/ae.png",
    alt: "American Express",
    width: 44,
    height: 28,
    needsSurface: false,
  },
  tabby: {
    src: "/payment-icons/tabby.svg",
    alt: "Tabby",
    width: 64,
    height: 28,
    needsSurface: false,
  },
};

export function OfficialPaymentIcon({
  name,
  className = "",
  heightClass = "h-7",
}: {
  name: OfficialPaymentIconName;
  className?: string;
  heightClass?: string;
}) {
  const cfg = ICON_CONFIG[name];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${
        cfg.needsSurface
          ? "overflow-hidden rounded-md bg-white border border-gray-200/85 px-1.5 py-0.5 shadow-2xs dark:border-white/15"
          : ""
      } ${heightClass} ${className}`}
    >
      <Image
        src={cfg.src}
        alt={cfg.alt}
        width={cfg.width}
        height={cfg.height}
        unoptimized
        className="h-full w-auto object-contain"
      />
    </span>
  );
}

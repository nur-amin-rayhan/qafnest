"use client";

import React from "react";
import Image from "next/image";
import { OfficialPaymentIcon } from "@/components/common/OfficialPaymentIcon";

export function PaymentRow({
  selected,
  disabled,
  onSelect,
  title,
  description,
  marks,
}: {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  marks: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${title}. ${description}`}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 py-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4F2396] disabled:cursor-not-allowed cursor-pointer ${
        selected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected ? "border-[#4F2396] dark:border-purple-400" : "border-slate-300 dark:border-slate-600"
        }`}
        aria-hidden="true"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full bg-[#4F2396] transition-transform dark:bg-purple-400 ${
            selected ? "scale-100" : "scale-0"
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>
      <span className="ms-3 flex shrink-0 items-center justify-end">{marks}</span>
    </button>
  );
}

export function PaymentBrandLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{children}</span>;
}

export function GooglePayBrandMark() {
  return <OfficialPaymentIcon name="google" heightClass="h-7" />;
}

export function StcPayBrandMark() {
  return <OfficialPaymentIcon name="stcpay" heightClass="h-7" />;
}

export function SamsungPayBrandMark({ requiresSetup }: { requiresSetup?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {requiresSetup && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Setup pending
        </span>
      )}
      <span className="inline-flex items-center rounded-lg bg-[#1428A0] px-2.5 py-1 text-[11px] font-black tracking-tight text-white">
        Samsung Pay
      </span>
    </span>
  );
}

export function TabbyBrandMark() {
  return <OfficialPaymentIcon name="tabby" heightClass="h-7" />;
}

export function TamaraBrandMark() {
  return (
    <Image
      src="https://cdn.tamara.co/assets/png/tamara-logo-badge-en.png"
      alt="Tamara"
      width={64}
      height={28}
      unoptimized
      className="h-7 w-16 object-contain"
    />
  );
}

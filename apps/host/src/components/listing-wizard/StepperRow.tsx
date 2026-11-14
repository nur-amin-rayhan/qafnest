"use client";

import React from "react";

interface StepperRowProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
}

export function StepperRow({ label, value, onChange }: StepperRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={`text-lg font-black px-2 select-none transition ${
            value <= 0
              ? "text-slate-300 cursor-not-allowed"
              : "text-[#4F2396] cursor-pointer hover:text-[#3b1875]"
          }`}
        >
          −
        </button>
        <div className="flex h-11 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="text-lg font-black text-[#4F2396] px-2 cursor-pointer select-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

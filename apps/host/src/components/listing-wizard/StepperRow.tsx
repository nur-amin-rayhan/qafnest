"use client";

import React from "react";

interface StepperRowProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disableIncrement?: boolean;
  helperText?: string;
}

export function StepperRow({
  label,
  value,
  onChange,
  min = 0,
  max,
  disableIncrement = false,
  helperText,
}: StepperRowProps) {
  const canDecrement = value > min;
  const canIncrement = !disableIncrement && (max === undefined || value < max);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-black text-slate-800">{label}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canDecrement}
            onClick={() => canDecrement && onChange(Math.max(min, value - 1))}
            aria-label={`Decrease ${label}`}
            className={`text-lg font-black px-2 select-none transition ${
              canDecrement
                ? "text-[#4F2396] cursor-pointer hover:text-[#3b1875]"
                : "text-slate-300 cursor-not-allowed"
            }`}
          >
            −
          </button>
          <div className="flex h-11 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm">
            {value}
          </div>
          <button
            type="button"
            disabled={!canIncrement}
            onClick={() => canIncrement && onChange(value + 1)}
            aria-label={`Increase ${label}`}
            className={`text-lg font-black px-2 select-none transition ${
              canIncrement
                ? "text-[#4F2396] cursor-pointer hover:text-[#3b1875]"
                : "text-slate-300 cursor-not-allowed"
            }`}
          >
            +
          </button>
        </div>
      </div>
      {helperText && (
        <p className="mt-1 text-[11px] font-semibold text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

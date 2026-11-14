"use client";

import React from "react";

export function RatingScale({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div
      className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-10"
      role="group"
      aria-label={`${label}, 1 to 10`}
    >
      {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          aria-label={`${score} / 10`}
          aria-pressed={value === score}
          className={`h-9 rounded-lg border text-xs font-bold transition hover:border-violet-500 hover:text-violet-800 dark:hover:text-violet-200 cursor-pointer ${
            value === score
              ? "border-violet-800 bg-violet-800 text-white"
              : "border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-[#08070D] dark:text-gray-200"
          }`}
        >
          {score}
        </button>
      ))}
      <span className="col-span-5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 sm:col-span-10">
        {value} / 10
      </span>
    </div>
  );
}

export function CategoryRatingSelect({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={`${label}, 1 to 10`}
      className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#08070D] dark:text-white cursor-pointer"
    >
      {Array.from({ length: 10 }, (_, index) => 10 - index).map((score) => (
        <option key={score} value={score}>
          {score} / 10
        </option>
      ))}
    </select>
  );
}


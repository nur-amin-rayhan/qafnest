"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewPaginationProps {
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  label: (en: string, ar: string) => string;
}

export function ReviewPagination({
  page,
  totalPages,
  setPage,
  label,
}: ReviewPaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label={label("Review pages", "صفحات التقييمات")}
      className="mt-5 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <button
          type="button"
          aria-label={label("Previous page", "الصفحة السابقة")}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-violet-400 dark:border-white/10 dark:text-gray-200 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
      )}
      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          aria-label={`${label("Go to page", "انتقل إلى الصفحة")} ${pageNumber}`}
          aria-current={pageNumber === page ? "page" : undefined}
          onClick={() => setPage(pageNumber)}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition cursor-pointer ${
            pageNumber === page
              ? "bg-violet-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-violet-50 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-violet-400/10"
          }`}
        >
          {pageNumber}
        </button>
      ))}
      {page < totalPages && (
        <button
          type="button"
          aria-label={label("Next page", "الصفحة التالية")}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-violet-400 dark:border-white/10 dark:text-gray-200 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      )}
    </nav>
  );
}


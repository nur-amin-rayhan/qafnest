"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface HomePopupItem {
  id: string;
  title: string;
  desktopImage: string;
  mobileImage: string;
  link: string;
  openInNewTab: boolean;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  updatedAt: string;
}

function getDismissKey(popup: HomePopupItem): string {
  return `qafnest_home_popup_dismissed_${popup.id}_${popup.updatedAt || "v1"}`;
}

export default function HomePromoPopup() {
  const { language, isDarkTheme } = useApp();
  const [popup, setPopup] = useState<HomePopupItem | null>(null);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (popup) {
      try {
        window.sessionStorage.setItem(getDismissKey(popup), "1");
      } catch {}
    }
  }, [popup]);

  useEffect(() => {
    let cancelled = false;

    async function loadPopups() {
      try {
        const res = await fetch("/api/cms/popups", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { popups?: HomePopupItem[] };
        const list = Array.isArray(data?.popups) ? data.popups : [];
        if (cancelled || list.length === 0) return;

        const nextPopup = list.find((item) => {
          try {
            return window.sessionStorage.getItem(getDismissKey(item)) !== "1";
          } catch {
            return true;
          }
        });

        if (nextPopup && !cancelled) {
          setPopup(nextPopup);
          setVisible(true);
        }
      } catch {
        // Non-blocking promotional banner; ignore transient network failures
      }
    }

    void loadPopups();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, dismiss]);

  if (!visible || !popup) return null;

  const desktopSrc = popup.desktopImage || popup.mobileImage;
  const mobileSrc = popup.mobileImage || popup.desktopImage;
  const hasImage = Boolean(desktopSrc || mobileSrc);
  const isAr = language === "ar";

  const bannerContent = hasImage ? (
    <div className="relative overflow-hidden rounded-2xl bg-black/20">
      {desktopSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={desktopSrc}
          alt={popup.title}
          className="hidden sm:block w-full max-h-[80vh] object-contain"
        />
      )}
      {mobileSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mobileSrc}
          alt={popup.title}
          className="block sm:hidden w-full max-h-[78vh] object-contain"
        />
      )}
    </div>
  ) : (
    <div
      className={`p-7 sm:p-9 rounded-2xl text-center space-y-4 ${
        isDarkTheme
          ? "bg-[#11101C] border border-purple-500/25 text-white"
          : "bg-white border border-purple-200 text-gray-900"
      }`}
    >
      <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/25">
        <Sparkles className="w-6 h-6" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{popup.title}</h2>
      {popup.link && (
        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-md">
          <span>{isAr ? "استكشف العرض" : "Explore Offer"}</span>
          <ExternalLink className="w-4 h-4" />
        </span>
      )}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
      onClick={dismiss}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[92vw] sm:max-w-2xl md:max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={isAr ? "إغلاق النافذة المنبثقة" : "Close promotional popup"}
          className="absolute top-3 end-3 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/25 flex items-center justify-center transition cursor-pointer shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>

        {popup.link ? (
          <a
            href={popup.link}
            target={popup.openInNewTab ? "_blank" : undefined}
            rel={popup.openInNewTab ? "noopener noreferrer" : undefined}
            onClick={dismiss}
            className="block focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-2xl"
          >
            {bannerContent}
          </a>
        ) : (
          bannerContent
        )}
      </div>
    </div>
  );
}

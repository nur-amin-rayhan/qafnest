"use client";

import React, { useEffect, useState } from "react";
import { usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";
import { QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import {
  FileText,
  Shield,
  Cookie,
  RefreshCw,
  Building2,
  HelpCircle,
  Phone,
  Mail,
} from "lucide-react";

import type { PublicCmsWorkspace } from "@/lib/cms/serverCmsWorkspace";

export interface TocChapter {
  slug: string;
  num: string;
  shortLabelEn: string;
  shortLabelAr: string;
  labelEn: string;
  labelAr: string;
  badgeEn: string;
  badgeAr: string;
  readTimeEn: string;
  readTimeAr: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "terms-and-conditions": FileText,
  "privacy-policy": Shield,
  "cancellation-refund-policy": RefreshCw,
  "host-compliance-policy": Building2,
  "cookies-policy": Cookie,
};

interface PolicyTocSidebarProps {
  chapters: TocChapter[];
  lang: "ar" | "en";
  initialCms?: PublicCmsWorkspace;
}

export default function PolicyTocSidebar({ chapters, lang, initialCms }: PolicyTocSidebarProps) {
  const isAr = lang === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const [activeSlug, setActiveSlug] = useState<string>(chapters[0]?.slug || "terms-and-conditions");
  const { workspace: clientWorkspace } = usePublicCmsWorkspace();
  const cmsWorkspace = clientWorkspace || initialCms;

  const cmsContact = cmsWorkspace?.globals?.contactUs;
  const rawPhone =
    cmsContact?.phone?.trim() && !cmsContact.phone.includes("500000000")
      ? cmsContact.phone.trim()
      : QAFNEST_SUPPORT_CONTACT.displayPhone;
  const displayPhone = rawPhone.startsWith("05")
    ? `+966${rawPhone.slice(1)}`
    : rawPhone.startsWith("966")
    ? `+${rawPhone}`
    : rawPhone;
  const telHref = `tel:${displayPhone.replace(/[^\d+]/g, "")}`;
  const supportEmail = cmsContact?.supportEmail?.trim() || "support@qafnest.com";

  useEffect(() => {
    // Listen to hash changes on initial mount
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash && chapters.some((c) => c.slug === currentHash)) {
      setActiveSlug(currentHash);
    }

    // Intersection observer to track which chapter is currently in view
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target?.id) {
          setActiveSlug(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    chapters.forEach((chapter) => {
      const el = document.getElementById(chapter.slug);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapters]);

  const handleScrollTo = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSlug(slug);
    const target = document.getElementById(slug);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.history.pushState) {
        window.history.pushState(null, "", `#${slug}`);
      }
    }
  };

  return (
    <aside className="lg:sticky lg:top-28 space-y-4">
      {/* Primary TOC Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/10">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {label("Charter Navigation", "فهرس وثائق الميثاق")}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {chapters.length} {label("Chapters", "أقسام")}
          </span>
        </div>

        <nav aria-label={label("Policy Chapters", "فهرس السياسات")} className="space-y-1">
          {chapters.map((item) => {
            const Icon = ICON_MAP[item.slug] || FileText;
            const isActive = activeSlug === item.slug;

            return (
              <a
                key={item.slug}
                href={`#${item.slug}`}
                onClick={(e) => handleScrollTo(item.slug, e)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition group cursor-pointer ${
                  isActive
                    ? "bg-[#4F2396] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate">{label(item.shortLabelEn, item.shortLabelAr)}</span>
                </div>
                <span
                  className={`text-[11px] font-mono shrink-0 transition-colors ${
                    isActive ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  {item.num}
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* 24/7 Hospitality & Compliance Concierge */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 text-xs space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
          <HelpCircle className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
          <span>{label("Hospitality Concierge", "خدمة العناية بالنزلاء")}</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          {label(
            "Our Saudi regulatory compliance team is available 24/7 to answer your questions regarding bookings, security, and policies.",
            "فريق خدمة النزلاء والامتثال في قاف نست متاح على مدار الساعة للإجابة على جميع استفساراتكم وحماية حجوزاتكم."
          )}
        </p>
        <div className="pt-1 flex flex-col gap-1.5 font-semibold">
          <a
            href={telHref}
            className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
          >
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{label("Phone / Support:", "الهاتف المباشر:")}</span>
            </span>
            <span dir="ltr">{displayPhone}</span>
          </a>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
          >
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>{label("Direct Email:", "البريد الإلكتروني:")}</span>
            </span>
            <span>{supportEmail}</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

"use client";

import React, { useState } from "react";

interface CmsAnnouncementsTabProps {
  t: (en: string, ar: string) => string;
}

interface AnnouncementBanner {
  id: string;
  text: string;
  active: boolean;
}

export function CmsAnnouncementsTab({ t }: CmsAnnouncementsTabProps) {
  const [banners, setBanners] = useState<AnnouncementBanner[]>([]);
  const [draft, setDraft] = useState("");

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setBanners((prev) => [{ id: String(Date.now()), text: draft.trim(), active: true }, ...prev]);
    setDraft("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">{t("Header Promotional Banners", "الشريط الإعلاني الترويجي")}</h1>
        <p className="text-xs text-gray-400 mt-1">
          {t(
            "Display seasonal alerts on the top bar of the Guest App.",
            "عرض تنبيهات المواسم والعروض الخاصة في الشريط العلوي لتطبيق الضيوف."
          )}
        </p>
      </div>

      <form onSubmit={handleAddBanner} className="rounded-2xl border border-white/10 bg-[#0C1018] p-5 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("Enter promotional banner text...", "أدخل نص الشريط الإعلاني...")}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40"
        >
          {t("Publish Banner", "نشر الإعلان")}
        </button>
      </form>

      <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-4">
        {banners.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            {t("No active promotional banners configured.", "لا توجد إعلانات ترويجية نشطة حالياً.")}
          </p>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {banner.active ? t("Active Live Banner", "إعلان نشط") : t("Disabled", "معطل")}
                </span>
                <p className="text-sm font-bold mt-1">{banner.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setBanners((prev) => prev.filter((b) => b.id !== banner.id))}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                {t("Remove", "حذف")}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


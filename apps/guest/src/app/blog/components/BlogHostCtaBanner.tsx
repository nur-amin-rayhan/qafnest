"use client";

import { ECOSYSTEM_URLS } from "@qafnest/shared";

interface BlogHostCtaBannerProps {
  language: string;
}

export default function BlogHostCtaBanner({ language }: BlogHostCtaBannerProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] p-8 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl text-center md:text-left rtl:md:text-right">
          <span className="text-xs uppercase font-bold text-[#4F2396] dark:text-violet-300 tracking-wider">
            {language === "ar" ? "انضم كمضيف في قاف نست" : "Host on QafNest"}
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {language === "ar"
              ? "هل تمتلك شاليه، فيلا، مزرعة أو مخيم؟"
              : "Own a Chalet, Villa, Country Farm or Camp?"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {language === "ar"
              ? "أعلن عن عقارك الآن واستقبل آلاف الضيوف مع تقويم موحد، تأمين على الأضرار، وعوائد مجزية."
              : "List your property now to connect with verified guests across Saudi Arabia with damage protection and instant smart locks."}
          </p>
        </div>

        <a
          href={ECOSYSTEM_URLS.host}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#4F2396] hover:bg-[#3d1979] shadow-xs transition-all shrink-0 cursor-pointer"
        >
          {language === "ar" ? "أعلن عن عقارك معنا" : "List Your Property"}
        </a>
      </div>
    </section>
  );
}

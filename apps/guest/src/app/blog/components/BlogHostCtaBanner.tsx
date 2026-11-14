"use client";

import { ECOSYSTEM_URLS } from "@qafnest/shared";

interface BlogHostCtaBannerProps {
  language: string;
}

export default function BlogHostCtaBanner({ language }: BlogHostCtaBannerProps) {
  return (
    <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 mt-16">
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 border border-violet-500/20 bg-gradient-to-r from-violet-950/70 via-purple-950/50 to-[#0E0E1A] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl text-center md:text-left rtl:md:text-right">
          <span className="text-xs uppercase font-bold text-fuchsia-400 tracking-wider">
            {language === "ar" ? "انضم كمضيف في قاف نست" : "Host on QafNest"}
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            {language === "ar"
              ? "هل تمتلك شاليه، فيلا، مزرعة أو مخيم؟"
              : "Own a Chalet, Villa, Country Farm or Camp?"}
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-2">
            {language === "ar"
              ? "أعلن عن عقارك الآن واستقبل آلاف الضيوف مع تقويم موحد، تأمين على الأضرار، وعوائد مجزية."
              : "List your property now to connect with verified guests across Saudi Arabia with damage protection and instant smart locks."}
          </p>
        </div>

        <a
          href={ECOSYSTEM_URLS.host}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all shrink-0 cursor-pointer"
        >
          {language === "ar" ? "أعلن عن عقارك معنا" : "List Your Property"}
        </a>
      </div>
    </section>
  );
}


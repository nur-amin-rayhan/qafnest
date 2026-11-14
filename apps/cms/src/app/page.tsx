"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { CmsHeader } from "@/components/CmsHeader";
import { CmsSidebar } from "@/components/CmsSidebar";
import { CmsArticlesTab } from "@/components/tabs/CmsArticlesTab";
import { CmsPagesTab } from "@/components/tabs/CmsPagesTab";
import { CmsContactTab } from "@/components/tabs/CmsContactTab";
import { CmsSeoTab } from "@/components/tabs/CmsSeoTab";
import { CmsFaqsTab } from "@/components/tabs/CmsFaqsTab";
import { CmsAnnouncementsTab } from "@/components/tabs/CmsAnnouncementsTab";
import { CmsIdentityTab } from "@/components/tabs/CmsIdentityTab";
import { CmsZatcaTab } from "@/components/tabs/CmsZatcaTab";
import {
  INITIAL_ARTICLES,
  INITIAL_SEO_ROUTES,
  INITIAL_FAQS,
} from "@/data/cmsMockData";
import type { CmsTab, BlogArticle, SeoRouteMeta, FaqItem } from "@/types/cms";

export default function ContentAndSeoCmsPage() {
  const { user, signOut } = useAdminAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [activeTab, setActiveTab] = useState<CmsTab>("articles");

  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const [articles, setArticles] = useState<BlogArticle[]>(INITIAL_ARTICLES);
  const [seoRoutes] = useState<SeoRouteMeta[]>(INITIAL_SEO_ROUTES);
  const [faqs] = useState<FaqItem[]>(INITIAL_FAQS);

  return (
    <div className={`min-h-screen bg-[#07090E] text-white flex flex-col ${lang === "ar" ? "rtl" : "ltr"}`}>
      {/* Top Bar */}
      <CmsHeader
        userEmail={user?.email}
        lang={lang}
        setLang={setLang}
        signOut={signOut}
        t={t}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <CmsSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          articlesCount={articles.length}
          t={t}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
          {activeTab === "articles" && (
            <CmsArticlesTab t={t} />
          )}

          {activeTab === "pages" && (
            <CmsPagesTab t={t} />
          )}

          {activeTab === "contact" && (
            <CmsContactTab t={t} />
          )}

          {activeTab === "seo" && (
            <CmsSeoTab
              seoRoutes={seoRoutes}
              t={t}
            />
          )}

          {activeTab === "faqs" && (
            <CmsFaqsTab
              faqs={faqs}
              t={t}
            />
          )}

          {activeTab === "announcements" && (
            <CmsAnnouncementsTab t={t} />
          )}

          {activeTab === "identity" && (
            <CmsIdentityTab t={t} />
          )}

          {activeTab === "zatca" && (
            <CmsZatcaTab t={t} />
          )}
        </main>
      </div>
    </div>
  );
}

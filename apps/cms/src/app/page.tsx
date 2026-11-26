"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { SharedBlogPost } from "@qafnest/shared";
import { cmsPath } from "@/lib/cmsUrl";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { createDefaultCmsWorkspace } from "@/data/cmsWorkspaceDefaults";
import { CmsShellSidebar } from "@/components/cms/CmsShellSidebar";
import { CmsTopBar } from "@/components/cms/CmsTopBar";
import { CmsDashboardView } from "@/components/cms/CmsDashboardView";
import { CmsBlogsModule } from "@/components/cms/CmsBlogsModule";
import { CmsMediaModule } from "@/components/cms/CmsMediaModule";
import { CmsRolesModule, CmsUsersModule } from "@/components/cms/CmsUsersAndRolesModule";
import { CmsCollectionsModule } from "@/components/cms/CmsCollectionsModule";
import { CmsGlobalsModule, type GlobalKind } from "@/components/cms/CmsGlobalsModule";
import { CmsIdentityTab } from "@/components/tabs/CmsIdentityTab";
import { CmsZatcaTab } from "@/components/tabs/CmsZatcaTab";
import type { CmsLocale, CmsMediaRecord, CmsTab, CmsWorkspaceData } from "@/types/cms";

const GLOBAL_TABS: GlobalKind[] = [
  "home-hero",
  "features",
  "fleet-capabilities",
  "coverage-network",
  "industries",
  "contact-us",
  "site-seo",
  "google-tag-manager",
  "about-us",
];

const COLLECTION_TABS = [
  "categories",
  "faqs",
  "home-popups",
  "destinations",
  "business-pages",
  "legal-pages",
  "navigation-links",
  "social-links",
] as const;

export default function ContentAndSeoCmsPage() {
  const { user, signOut } = useAdminAuth();
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CmsTab>("dashboard");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialParam = new URLSearchParams(window.location.search).get("tab") as CmsTab | null;
    if (initialParam) {
      setActiveTab(initialParam);
    }
  }, []);

  const handleSelectTab = useCallback((nextTab: CmsTab) => {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextTab === "dashboard") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", nextTab);
      }
      window.history.pushState(null, "", `${url.pathname}${url.search}`);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => {
      const p = (new URLSearchParams(window.location.search).get("tab") as CmsTab | null) || "dashboard";
      setActiveTab(p);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [workspace, setWorkspace] = useState<CmsWorkspaceData>(() => createDefaultCmsWorkspace());
  const [blogs, setBlogs] = useState<SharedBlogPost[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  }, []);

  // Sync html class for light/dark + RTL
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", darkMode);
    html.classList.toggle("light", !darkMode);
    html.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
  }, [darkMode, locale]);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch(cmsPath("/api/cms/workspace"), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.workspace) {
          setWorkspace(data.workspace);
        }
      }
    } catch {
      // Keep default workspace if offline
    }
  }, []);

  const loadBlogs = useCallback(async () => {
    setBlogsLoading(true);
    try {
      const res = await fetch(cmsPath("/api/cms/blogs"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBlogs(data);
        } else if (Array.isArray(data?.posts)) {
          setBlogs(data.posts);
        } else if (Array.isArray(data?.blogs)) {
          setBlogs(data.blogs);
        }
      }
    } catch {
      // Ignore transient network failures
    } finally {
      setBlogsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
    void loadBlogs();
  }, [loadWorkspace, loadBlogs]);

  const saveWorkspacePatch = useCallback(
    async (patch: Partial<CmsWorkspaceData>) => {
      setWorkspace((prev) => ({
        ...prev,
        ...patch,
        globals: patch.globals
          ? { ...prev.globals, ...patch.globals }
          : prev.globals,
      }));
      try {
        const res = await fetch(cmsPath("/api/cms/workspace"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace: patch }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.workspace) setWorkspace(data.workspace);
        } else {
          notify("Failed to persist changes");
        }
      } catch {
        notify("Failed to persist changes");
      }
    },
    [notify]
  );

  const handleMediaUploaded = useCallback((record: CmsMediaRecord) => {
    setWorkspace((prev) => ({
      ...prev,
      media: [record, ...prev.media.filter((m) => m.id !== record.id)],
    }));
  }, []);

  const handleAddCategoryQuick = useCallback(
    async (name: string) => {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      const newCat = {
        id: `cat-${Date.now()}`,
        name: { en: name, ar: name },
        slug: slug || `cat-${Date.now()}`,
        description: { en: "", ar: "" },
        updatedAt: new Date().toISOString(),
      };
      await saveWorkspacePatch({ categories: [...workspace.categories, newCat] });
      notify(`Category "${name}" added`);
    },
    [workspace.categories, saveWorkspacePatch, notify]
  );

  const counts: Partial<Record<CmsTab, number>> = {
    users: workspace.users.length,
    media: workspace.media.length,
    categories: workspace.categories.length,
    blogs: blogs.length,
    roles: workspace.roles.length,
    faqs: workspace.faqs.length,
    "home-popups": workspace.homePopups.length,
    destinations: (workspace.destinations || []).length,
    "business-pages": workspace.businessPages.length,
    "legal-pages": workspace.legalPages.length,
    "navigation-links": workspace.navigationLinks.length,
    "social-links": workspace.socialLinks.length,
  };

  const isCollectionTab = (COLLECTION_TABS as readonly string[]).includes(activeTab);
  const isGlobalTab = (GLOBAL_TABS as readonly string[]).includes(activeTab);

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen flex transition-colors ${
        darkMode ? "bg-[#0B0D14] text-slate-100" : "bg-[#F8F9FA] text-[#111827]"
      }`}
    >
      {/* Left Navigation Sidebar */}
      <CmsShellSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={() => setSearchOpen(true)}
        locale={locale}
        darkMode={darkMode}
        collapsed={sidebarCollapsed}
        userEmail={user?.email}
        counts={counts}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <CmsTopBar
          activeTab={activeTab}
          locale={locale}
          setLocale={setLocale}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          userEmail={user?.email}
          onSignOut={signOut}
          onSelectTab={handleSelectTab}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
        />

        <main className="flex-1 p-5 md:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === "dashboard" && (
            <CmsDashboardView
              workspace={workspace}
              blogsCount={blogs.length}
              locale={locale}
              darkMode={darkMode}
              onSelectTab={handleSelectTab}
            />
          )}

          {activeTab === "blogs" && (
            <CmsBlogsModule
              blogs={blogs}
              loading={blogsLoading}
              onRefreshBlogs={loadBlogs}
              categories={workspace.categories}
              onAddCategoryQuick={handleAddCategoryQuick}
              users={workspace.users}
              mediaLibrary={workspace.media}
              onMediaUploaded={handleMediaUploaded}
              locale={locale}
              setLocale={setLocale}
              darkMode={darkMode}
              onNotify={notify}
            />
          )}

          {activeTab === "media" && (
            <CmsMediaModule
              media={workspace.media}
              onMediaChange={(next) => saveWorkspacePatch({ media: next })}
              locale={locale}
              darkMode={darkMode}
              onNotify={notify}
            />
          )}

          {activeTab === "users" && (
            <CmsUsersModule
              users={workspace.users}
              roles={workspace.roles}
              onUsersChange={(next) => saveWorkspacePatch({ users: next })}
              locale={locale}
              darkMode={darkMode}
              onNotify={notify}
            />
          )}

          {activeTab === "roles" && (
            <CmsRolesModule
              roles={workspace.roles}
              onRolesChange={(next) => saveWorkspacePatch({ roles: next })}
              locale={locale}
              darkMode={darkMode}
              onNotify={notify}
            />
          )}

          {isCollectionTab && (
            <CmsCollectionsModule
              key={activeTab}
              kind={activeTab as (typeof COLLECTION_TABS)[number]}
              workspace={workspace}
              onSaveWorkspacePatch={saveWorkspacePatch}
              onMediaUploaded={handleMediaUploaded}
              locale={locale}
              darkMode={darkMode}
              onNotify={notify}
            />
          )}

          {isGlobalTab && (
            <CmsGlobalsModule
              key={activeTab}
              kind={activeTab as GlobalKind}
              workspace={workspace}
              onSaveGlobals={(nextGlobals) => saveWorkspacePatch({ globals: nextGlobals })}
              onMediaUploaded={handleMediaUploaded}
              locale={locale}
              darkMode={darkMode}
              onNotify={notify}
            />
          )}

          {activeTab === "identity" && (
            <div className="rounded-2xl bg-[#0B0E17] text-white p-6 border border-white/10">
              <CmsIdentityTab t={t} />
            </div>
          )}

          {activeTab === "zatca" && (
            <div className="rounded-2xl bg-[#0B0E17] text-white p-6 border border-white/10">
              <CmsZatcaTab t={t} />
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-medium shadow-xl border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

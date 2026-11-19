"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FileCode2, Globe, RefreshCw, Search } from "lucide-react";
import { cmsPath } from "@/lib/cmsUrl";

interface SeoDiagnosticsPayload {
  generatedAt: string;
  baseUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  sitemapEnabled: boolean;
  gtm: {
    enabled: boolean;
    gtmId: string;
    valid: boolean;
    activeLive: boolean;
  };
  counts: {
    total: number;
    excluded?: number;
    staticAndCities: number;
    properties: number;
    blogs: number;
    legal: number;
  };
  urls: Array<{
    url: string;
    source: "static" | "city" | "blog" | "legal" | "property";
    changeFrequency: string;
    priority: number;
    lastModified: string;
  }>;
  excludedUrls?: Array<{
    url: string;
    source: "static" | "city" | "blog" | "legal" | "property" | "robots";
    reason: string;
  }>;
  robotsTxt: string;
}

export function CmsSeoMonitorPanel({
  darkMode,
  cardCls,
  inputCls,
  sitemapEnabled,
  customRules,
  onChangeSitemapEnabled,
  onChangeCustomRules,
  onSaveGlobals,
}: {
  darkMode: boolean;
  cardCls: string;
  inputCls: string;
  sitemapEnabled: boolean;
  customRules: string;
  onChangeSitemapEnabled: (enabled: boolean) => void;
  onChangeCustomRules: (rules: string) => void;
  onSaveGlobals?: () => Promise<void>;
}) {
  const [diag, setDiag] = useState<SeoDiagnosticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRobots, setSavingRobots] = useState(false);
  const [urlFilter, setUrlFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"included" | "excluded">("included");

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(cmsPath("/api/cms/seo-diagnostics"), { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as SeoDiagnosticsPayload;
        setDiag(data);
      }
    } catch {
      // ignore offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  const handleApplyRobots = async () => {
    if (!onSaveGlobals) return;
    setSavingRobots(true);
    try {
      await onSaveGlobals();
      await loadDiagnostics();
    } finally {
      setSavingRobots(false);
    }
  };

  const filteredUrls = (diag?.urls || []).filter((entry) => {
    if (sourceFilter !== "all" && entry.source !== sourceFilter) return false;
    if (!urlFilter.trim()) return true;
    return entry.url.toLowerCase().includes(urlFilter.trim().toLowerCase());
  });

  const filteredExcluded = (diag?.excludedUrls || []).filter((entry) => {
    if (sourceFilter !== "all" && entry.source !== sourceFilter) return false;
    if (!urlFilter.trim()) return true;
    const q = urlFilter.trim().toLowerCase();
    return entry.url.toLowerCase().includes(q) || entry.reason.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Dynamic robots.txt Editor & Live Preview */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#2563EB]" />
            <div>
              <h3 className="text-sm font-semibold">Dynamic robots.txt</h3>
              <p className="text-[11px] text-gray-500">
                Automatically synced with live qafnest.com/robots.txt (save above to apply changes).
              </p>
            </div>
          </div>
          {diag?.robotsUrl && (
            <a
              href={diag.robotsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E] text-xs font-medium hover:border-[#2563EB] hover:text-[#2563EB] transition"
            >
              <span>Open Live robots.txt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={sitemapEnabled}
            onChange={(e) => onChangeSitemapEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#2563EB]"
          />
          <span>Enable Dynamic Sitemap Reference &amp; Auto-Generation (sitemap.xml)</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Extra Custom Rules (merged with default paths)
              </label>
              {onSaveGlobals && (
                <button
                  type="button"
                  disabled={savingRobots}
                  onClick={handleApplyRobots}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${savingRobots ? "animate-spin" : ""}`} />
                  <span>{savingRobots ? "Saving..." : "Save & Apply robots.txt"}</span>
                </button>
              )}
            </div>
            <textarea
              rows={7}
              value={customRules}
              onChange={(e) => onChangeCustomRules(e.target.value)}
              placeholder={"# Write custom rules line-by-line\nDisallow: /admin-secret/\nAllow: /en/blog/special"}
              className={`${inputCls} font-mono text-xs`}
            />
            <p className="text-[11px] text-gray-500">
              Note: System protected paths (like /api/, /auth/, /my-bookings) remain protected. Your extra Allow/Disallow lines are safely appended on top.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Live Rendered robots.txt Preview
              </label>
              <button
                type="button"
                onClick={() => void loadDiagnostics()}
                className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
              >
                Refresh Preview
              </button>
            </div>
            <pre
              className={`p-3 rounded-lg border text-[11px] font-mono overflow-auto max-h-[168px] whitespace-pre-wrap ${
                darkMode
                  ? "bg-[#0E1017] border-[#2A2F3E] text-emerald-300"
                  : "bg-[#F8FAFC] border-gray-200 text-slate-800"
              }`}
            >
              {diag?.robotsTxt || (loading ? "Loading live robots.txt..." : "Unavailable")}
            </pre>
          </div>
        </div>
      </div>

      {/* Dynamic sitemap.xml Live Monitor */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold">Dynamic sitemap.xml Monitor</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Auto-Synced Daily &amp; On Publish
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Every new published blog post, legal page, or approved property is automatically added to sitemap.xml.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadDiagnostics()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E] text-xs font-medium hover:border-[#2563EB] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            {diag?.sitemapUrl && (
              <a
                href={diag.sitemapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <span>Open sitemap.xml</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Summary Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: "Total Indexed URLs", value: diag?.counts.total ?? "—" },
            { label: "Static & Cities", value: diag?.counts.staticAndCities ?? "—" },
            { label: "Approved Properties", value: diag?.counts.properties ?? "—" },
            { label: "Published Blogs", value: diag?.counts.blogs ?? "—" },
            { label: "Custom Legal Pages", value: diag?.counts.legal ?? "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg border p-3 ${
                darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-[#F9FAFB] border-gray-200"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {stat.label}
              </div>
              <div className="text-lg font-extrabold mt-1">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Included vs Excluded Switcher + Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-[#2A2F3E] p-0.5 bg-gray-100/70 dark:bg-[#11131A]">
            <button
              type="button"
              onClick={() => setViewMode("included")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === "included"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Included in Sitemap ({diag?.counts.total ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("excluded")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === "excluded"
                  ? "bg-amber-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Excluded / Not Indexed ({diag?.counts.excluded ?? 0})
            </button>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlFilter}
              onChange={(e) => setUrlFilter(e.target.value)}
              placeholder={
                viewMode === "included"
                  ? "Filter indexed sitemap URLs..."
                  : "Filter excluded URLs or reason..."
              }
              className={`${inputCls} ps-8`}
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option value="all">All Sources</option>
            <option value="static">Static Pages</option>
            <option value="city">City Pages</option>
            <option value="property">Properties</option>
            <option value="blog">Blogs</option>
            <option value="legal">Legal Pages</option>
            {viewMode === "excluded" && <option value="robots">Robots Blocked</option>}
          </select>
        </div>

        {/* Live URL Preview List */}
        <div
          className={`rounded-lg border overflow-hidden ${
            darkMode ? "border-[#2A2F3E]" : "border-gray-200"
          }`}
        >
          <div className="max-h-72 overflow-y-auto">
            {viewMode === "included" ? (
              <table className="w-full text-left text-xs">
                <thead
                  className={`sticky top-0 text-[10px] uppercase tracking-wider ${
                    darkMode ? "bg-[#181B24] text-gray-400" : "bg-gray-50 text-gray-500"
                  }`}
                >
                  <tr>
                    <th className="py-2 px-3">Indexed URL</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Freq</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3 text-right">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60 dark:divide-[#222634]">
                  {filteredUrls.slice(0, 120).map((item) => (
                    <tr key={item.url} className="hover:bg-blue-500/5">
                      <td className="py-2 px-3 font-mono text-[11px] truncate max-w-[340px]">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] hover:underline"
                        >
                          {item.url}
                        </a>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {item.source}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">{item.changeFrequency}</td>
                      <td className="py-2 px-3 font-mono">{item.priority.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono text-[11px] text-gray-500">
                        {item.lastModified.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                  {filteredUrls.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        {loading ? "Scanning live pages, blogs, and properties..." : "No indexed URLs match this filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead
                  className={`sticky top-0 text-[10px] uppercase tracking-wider ${
                    darkMode ? "bg-[#181B24] text-gray-400" : "bg-gray-50 text-gray-500"
                  }`}
                >
                  <tr>
                    <th className="py-2 px-3">Excluded URL / Path</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Reason Excluded from Sitemap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60 dark:divide-[#222634]">
                  {filteredExcluded.slice(0, 120).map((item, idx) => (
                    <tr key={`${item.url}-${idx}`} className="hover:bg-amber-500/5">
                      <td className="py-2 px-3 font-mono text-[11px] text-gray-500 truncate max-w-[300px]">
                        {item.url}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          {item.source}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                  {filteredExcluded.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-500">
                        {loading ? "Checking excluded URLs..." : "No excluded URLs match this filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {diag?.generatedAt && (
          <p className="text-[11px] text-gray-500">
            Last live scan: {new Date(diag.generatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

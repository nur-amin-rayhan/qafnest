"use client";

import React, { useRef, useState } from "react";
import {
  Search,
  Plus,
  Upload,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Copy,
  Check,
  Pencil,
  Loader2,
  X,
} from "lucide-react";
import { cmsPath } from "@/lib/cmsUrl";
import type { CmsLocale, CmsMediaRecord } from "@/types/cms";

interface CmsMediaModuleProps {
  media: CmsMediaRecord[];
  onMediaChange: (next: CmsMediaRecord[]) => Promise<void>;
  locale: CmsLocale;
  darkMode: boolean;
  onNotify: (msg: string) => void;
}

export function CmsMediaModule({
  media,
  onMediaChange,
  locale,
  darkMode,
  onNotify,
}: CmsMediaModuleProps) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CmsMediaRecord | null>(null);
  const singleFileRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const filtered = media.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.filename.toLowerCase().includes(q) ||
      m.alt.toLowerCase().includes(q) ||
      m.mimeType.toLowerCase().includes(q)
    );
  });

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: CmsMediaRecord[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("alt", file.name.replace(/\.[^.]+$/, ""));
        const res = await fetch(cmsPath("/api/cms/media"), {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.media) uploaded.push(data.media);
        }
      }
      if (uploaded.length > 0) {
        await onMediaChange([...uploaded, ...media]);
        onNotify(
          isAr
            ? `تم رفع ${uploaded.length} ملف بنجاح`
            : `Uploaded ${uploaded.length} media file${uploaded.length > 1 ? "s" : ""}`
        );
      }
    } catch {
      onNotify("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: CmsMediaRecord) => {
    if (!window.confirm(`Delete "${item.filename}"?`)) return;
    await fetch(cmsPath(`/api/cms/media?id=${encodeURIComponent(item.id)}`), {
      method: "DELETE",
    });
    await onMediaChange(media.filter((m) => m.id !== item.id));
    onNotify("Media item removed");
  };

  const handleCopy = (item: CmsMediaRecord) => {
    navigator.clipboard?.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const next = media.map((m) => (m.id === editingItem.id ? editingItem : m));
    await onMediaChange(next);
    setEditingItem(null);
    onNotify("Media details updated");
  };

  const cardBg = darkMode
    ? "bg-[#151822] border-[#222634] text-slate-100"
    : "bg-white border-[#E5E7EB] text-[#111827]";

  return (
    <div className="space-y-4">
      <input
        ref={singleFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFilesUpload(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={bulkFileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFilesUpload(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Header Row (Matching Screenshot 3) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-[#111827]"}`}>
            {isAr ? "مكتبة الوسائط (Media)" : "Media"}
          </h1>
          <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
            {media.length} {isAr ? "ملف وسائط" : "assets in library"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => bulkFileRef.current?.click()}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${
              darkMode
                ? "bg-[#181B24] border-[#2A2F3E] text-slate-200 hover:bg-white/5"
                : "bg-white border-[#D1D5DB] text-[#374151] hover:bg-gray-50"
            }`}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>Bulk Upload</span>
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => singleFileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث باسم الملف..." : "Search by File Name"}
            className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs outline-none ${
              darkMode
                ? "bg-[#151822] border-[#2A2F3E] text-white"
                : "bg-white border-[#D1D5DB] text-[#111827]"
            }`}
          />
        </div>

        <div
          className={`inline-flex rounded-lg border p-0.5 ${
            darkMode ? "bg-[#151822] border-[#2A2F3E]" : "bg-white border-[#D1D5DB]"
          }`}
        >
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition ${
              viewMode === "grid" ? "bg-[#2563EB] text-white" : "text-gray-500 hover:text-gray-800"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition ${
              viewMode === "list" ? "bg-[#2563EB] text-white" : "text-gray-500 hover:text-gray-800"
            }`}
            title="List View"
          >
            <ListIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gallery Grid or List */}
      {filtered.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center space-y-3 ${cardBg}`}>
          <div className="text-sm font-semibold">No media files found.</div>
          <p className="text-xs text-gray-500">Upload images individually or in bulk to use across blogs and pages.</p>
          <button
            type="button"
            onClick={() => singleFileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Image
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className={`rounded-xl border overflow-hidden group transition ${cardBg}`}>
              <div className="h-40 bg-gray-100 dark:bg-[#0D0F15] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="p-1.5 rounded-md bg-black/70 text-white hover:bg-black"
                    title="Copy URL"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...item })}
                    className="p-1.5 rounded-md bg-black/70 text-white hover:bg-black"
                    title="Edit Alt Text"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-md bg-red-600/90 text-white hover:bg-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-xs font-semibold truncate">{item.filename}</div>
                <div className={`text-[11px] truncate ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                  {item.alt || "No alt text"}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span>{item.mimeType}</span>
                  <span>{item.sizeKb} KB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <table className="w-full text-left text-xs">
            <thead className={darkMode ? "bg-[#181B24] text-slate-400" : "bg-[#F9FAFB] text-gray-500"}>
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Alt Text</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-[#222634]" : "divide-gray-200"}`}>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5">
                    <div className="w-12 h-9 rounded overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{item.filename}</td>
                  <td className="px-4 py-2.5 text-gray-500">{item.alt}</td>
                  <td className="px-4 py-2.5 text-gray-500">{item.sizeKb} KB</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => handleCopy(item)} className="p-1.5 rounded hover:bg-gray-500/10" title="Copy URL">
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={() => setEditingItem({ ...item })} className="p-1.5 rounded hover:bg-gray-500/10" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Media Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>
          <div
            className={`w-full max-w-md rounded-xl border p-5 space-y-4 shadow-2xl ${cardBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Edit Media Details</h3>
              <button type="button" onClick={() => setEditingItem(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Filename</label>
                <input
                  value={editingItem.filename}
                  onChange={(e) => setEditingItem({ ...editingItem, filename: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Alt Text (SEO)</label>
                <input
                  value={editingItem.alt}
                  onChange={(e) => setEditingItem({ ...editingItem, alt: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

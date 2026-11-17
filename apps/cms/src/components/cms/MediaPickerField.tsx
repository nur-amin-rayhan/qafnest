"use client";

import React, { useRef, useState } from "react";
import { Upload, FolderOpen, X, Link2, Loader2, Check } from "lucide-react";
import { cmsPath } from "@/lib/cmsUrl";
import type { CmsMediaRecord } from "@/types/cms";

interface MediaPickerFieldProps {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (url: string) => void;
  mediaLibrary: CmsMediaRecord[];
  onMediaUploaded?: (media: CmsMediaRecord) => void;
  darkMode?: boolean;
  required?: boolean;
}

export function MediaPickerField({
  label,
  helperText,
  value,
  onChange,
  mediaLibrary,
  onMediaUploaded,
  darkMode = false,
  required = false,
}: MediaPickerFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", file.name.replace(/\.[^.]+$/, ""));
      const res = await fetch(cmsPath("/api/cms/media"), {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.media?.url) {
          onChange(data.media.url);
          onMediaUploaded?.(data.media);
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className={`block text-xs font-medium ${darkMode ? "text-slate-300" : "text-[#374151]"}`}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {helperText && (
        <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-gray-500"}`}>{helperText}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border ${
            darkMode ? "bg-[#151822] border-[#2A2F3E]" : "bg-[#F9FAFB] border-[#E5E7EB]"
          }`}
        >
          <div className="w-20 h-14 rounded-md overflow-hidden border border-black/10 shrink-0 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label || "Selected media"} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-medium truncate ${darkMode ? "text-slate-100" : "text-gray-900"}`}>
              {value.startsWith("data:") ? "Uploaded image" : value.split("/").pop() || value}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`text-[11px] px-2 py-0.5 rounded border transition ${
                  darkMode
                    ? "border-[#2A2F3E] text-slate-300 hover:bg-white/5"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                className={`text-[11px] px-2 py-0.5 rounded border transition ${
                  darkMode
                    ? "border-[#2A2F3E] text-slate-300 hover:bg-white/5"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Choose existing
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[11px] px-2 py-0.5 rounded text-red-500 hover:bg-red-500/10 inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-5 text-center transition ${
            dragOver
              ? "border-[#2563EB] bg-blue-50/60 dark:bg-blue-500/10"
              : darkMode
              ? "border-[#2A2F3E] bg-[#151822]/60"
              : "border-[#D1D5DB] bg-[#FAFAFA]"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-[#2563EB] py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading image...</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition ${
                  darkMode
                    ? "bg-[#181B24] border-[#2A2F3E] text-slate-200 hover:border-blue-500"
                    : "bg-white border-[#D1D5DB] text-[#111827] hover:bg-gray-50 shadow-xs"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Create New</span>
              </button>
              <span className="text-xs text-gray-400">or</span>
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition ${
                  darkMode
                    ? "bg-[#181B24] border-[#2A2F3E] text-slate-200 hover:border-blue-500"
                    : "bg-white border-[#D1D5DB] text-[#111827] hover:bg-gray-50 shadow-xs"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Choose from existing</span>
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-gray-500 hover:text-[#2563EB]`}
                title="Paste Image URL"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
            </div>
          )}

          {showUrlInput && (
            <div className="mt-3 flex gap-2 max-w-md mx-auto">
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={`flex-1 px-3 py-1.5 rounded-md border text-xs outline-none ${
                  darkMode ? "bg-[#11131A] border-[#2A2F3E] text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (urlDraft.trim()) {
                    onChange(urlDraft.trim());
                    setUrlDraft("");
                    setShowUrlInput(false);
                  }
                }}
                className="px-3 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-medium"
              >
                Apply
              </button>
            </div>
          )}

          <p className="text-[11px] text-gray-400 mt-2">Drag and drop an image file here, or click Create New</p>
        </div>
      )}

      {/* Existing Media Library Modal */}
      {libraryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setLibraryOpen(false)}
        >
          <div
            className={`w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden ${
              darkMode ? "bg-[#151822] border-[#2A2F3E] text-white" : "bg-white border-gray-200 text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${darkMode ? "border-[#2A2F3E]" : "border-gray-200"}`}>
              <h3 className="text-sm font-semibold">Choose from Media Library</h3>
              <button type="button" onClick={() => setLibraryOpen(false)} className="p-1 rounded hover:bg-gray-500/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {mediaLibrary.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No media assets yet. Click &quot;Create New&quot; to upload one.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaLibrary.map((item) => {
                    const selected = value === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onChange(item.url);
                          setLibraryOpen(false);
                        }}
                        className={`relative rounded-lg border overflow-hidden text-left transition ${
                          selected
                            ? "border-[#2563EB] ring-2 ring-blue-500/30"
                            : darkMode
                            ? "border-[#2A2F3E] hover:border-blue-500"
                            : "border-gray-200 hover:border-blue-500"
                        }`}
                      >
                        <div className="h-28 bg-gray-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-medium truncate">{item.filename}</div>
                          <div className="text-[10px] text-gray-500 truncate">{item.alt}</div>
                        </div>
                        {selected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

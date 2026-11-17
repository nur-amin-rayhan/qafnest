"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Table,
  RemoveFormatting,
  Maximize2,
  Minimize2,
  Eye,
  Code2,
  Subscript,
  Superscript,
  Upload,
  Loader2,
  X,
} from "lucide-react";
import { cmsPath } from "@/lib/cmsUrl";
import type { CmsMediaRecord } from "@/types/cms";

interface RichVisualEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  dir?: "ltr" | "rtl";
  minHeight?: number;
  mediaLibrary?: CmsMediaRecord[];
  onMediaUploaded?: (media: CmsMediaRecord) => void;
}

export function RichVisualEditor({
  value,
  onChange,
  placeholder = "Start writing content...",
  darkMode = false,
  dir = "ltr",
  minHeight = 260,
  mediaLibrary = [],
  onMediaUploaded,
}: RichVisualEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [fullscreen, setFullscreen] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOverEditor, setDragOverEditor] = useState(false);
  const [altDraft, setAltDraft] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastExternalValue = useRef<string>(value);

  useEffect(() => {
    if (mode === "visual" && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
        lastExternalValue.current = value;
      }
    }
  }, [value, mode]);

  const saveSelection = () => {
    if (mode !== "visual") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const exec = (cmd: string, arg?: string) => {
    if (mode !== "visual") return;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false, arg);
    if (editorRef.current) {
      const next = editorRef.current.innerHTML;
      lastExternalValue.current = next;
      onChange(next);
    }
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tag = e.target.value;
    exec("formatBlock", tag === "p" ? "<p>" : `<${tag}>`);
  };

  const handleInsertLink = () => {
    saveSelection();
    const url = window.prompt("Enter link URL (https://...):", "https://");
    if (url && url.trim()) {
      exec("createLink", url.trim());
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr><th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Column 1</th><th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Column 2</th></tr></thead><tbody><tr><td style="border:1px solid #d1d5db;padding:8px;">Value 1</td><td style="border:1px solid #d1d5db;padding:8px;">Value 2</td></tr></tbody></table><p></p>`;
    if (mode === "visual") {
      exec("insertHTML", tableHtml);
    } else {
      insertIntoHtmlTextarea(tableHtml);
    }
  };

  const insertIntoHtmlTextarea = (snippet: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? value.length;
      const end = ta.selectionEnd ?? value.length;
      const next = value.slice(0, start) + snippet + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + snippet.length, start + snippet.length);
      });
    } else {
      onChange(`${value}\n${snippet}`);
    }
  };

  const handleInsertImageUrl = (url: string, alt = "Blog image") => {
    const safeAlt = (altDraft.trim() || alt || "Blog image").replace(/"/g, "&quot;");
    const imgHtml = `\n<figure style="margin:20px 0;"><img src="${url}" alt="${safeAlt}" style="width:100%;max-width:100%;height:auto;border-radius:14px;display:block;" /></figure>\n`;
    if (mode === "visual") {
      editorRef.current?.focus();
      restoreSelection();
      document.execCommand("insertHTML", false, imgHtml);
      if (editorRef.current) {
        const next = editorRef.current.innerHTML;
        lastExternalValue.current = next;
        onChange(next);
      }
    } else {
      insertIntoHtmlTextarea(imgHtml);
    }
    setAltDraft("");
    setShowMediaModal(false);
  };

  const uploadAndInsertFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alt", altDraft.trim() || file.name.replace(/\.[^.]+$/, ""));
      const res = await fetch(cmsPath("/api/cms/media"), {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.media?.url) {
          onMediaUploaded?.(data.media);
          handleInsertImageUrl(data.media.url, data.media.alt || file.name);
        }
      }
    } catch (err) {
      console.error("Inline image upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleEditorDrop = (e: React.DragEvent) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const imgFile = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (imgFile) {
        e.preventDefault();
        setDragOverEditor(false);
        void uploadAndInsertFile(imgFile);
      }
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void uploadAndInsertFile(file);
          return;
        }
      }
    }
  };

  const toolbarBtn = `p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center justify-center ${
    darkMode ? "text-slate-300" : "text-gray-600"
  }`;

  const containerCls = fullscreen
    ? `fixed inset-4 z-50 flex flex-col rounded-xl border shadow-2xl overflow-hidden ${
        darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-white border-[#D1D5DB]"
      }`
    : `rounded-lg border overflow-hidden ${
        darkMode ? "bg-[#151822] border-[#2A2F3E]" : "bg-white border-[#D1D5DB]"
      }`;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadAndInsertFile(f);
          e.target.value = "";
        }}
      />

      <div className={containerCls}>
        {/* Toolbar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 border-b ${
            darkMode ? "bg-[#181B24] border-[#2A2F3E]" : "bg-[#F9FAFB] border-[#E5E7EB]"
          }`}
        >
          <div className="flex flex-wrap items-center gap-0.5">
            <button type="button" onClick={() => exec("undo")} className={toolbarBtn} title="Undo">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("redo")} className={toolbarBtn} title="Redo">
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className={`w-px h-4 mx-1 ${darkMode ? "bg-white/10" : "bg-gray-300"}`} />

            <select
              onChange={handleHeadingChange}
              defaultValue="p"
              disabled={mode !== "visual"}
              className={`text-xs px-2 py-1 rounded border outline-none ${
                darkMode
                  ? "bg-[#11131A] border-[#2A2F3E] text-slate-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
              title="Block Format"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
            </select>

            <div className={`w-px h-4 mx-1 ${darkMode ? "bg-white/10" : "bg-gray-300"}`} />

            <button type="button" onClick={() => exec("bold")} className={toolbarBtn} title="Bold">
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("italic")} className={toolbarBtn} title="Italic">
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("underline")} className={toolbarBtn} title="Underline">
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("strikeThrough")} className={toolbarBtn} title="Strikethrough">
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("insertHTML", "<code>code</code>")}
              className={toolbarBtn}
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("subscript")} className={toolbarBtn} title="Subscript">
              <Subscript className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("superscript")} className={toolbarBtn} title="Superscript">
              <Superscript className="w-3.5 h-3.5" />
            </button>

            <div className={`w-px h-4 mx-1 ${darkMode ? "bg-white/10" : "bg-gray-300"}`} />

            <button
              type="button"
              onClick={() => exec("formatBlock", "<blockquote>")}
              className={toolbarBtn}
              title="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("insertUnorderedList")} className={toolbarBtn} title="Bullet List">
              <List className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("insertOrderedList")} className={toolbarBtn} title="Numbered List">
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className={`w-px h-4 mx-1 ${darkMode ? "bg-white/10" : "bg-gray-300"}`} />

            <button type="button" onClick={() => exec("justifyLeft")} className={toolbarBtn} title="Align Left">
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("justifyCenter")} className={toolbarBtn} title="Align Center">
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => exec("justifyRight")} className={toolbarBtn} title="Align Right">
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <div className={`w-px h-4 mx-1 ${darkMode ? "bg-white/10" : "bg-gray-300"}`} />

            <button type="button" onClick={handleInsertLink} className={toolbarBtn} title="Insert Link">
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowMediaModal(true);
              }}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                darkMode
                  ? "bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                  : "bg-blue-50 text-[#2563EB] hover:bg-blue-100"
              }`}
              title="Upload or Insert Image at Cursor"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Insert Image</span>
            </button>
            <button type="button" onClick={handleInsertTable} className={toolbarBtn} title="Insert Table">
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("removeFormat")}
              className={toolbarBtn}
              title="Clear Formatting"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Mode Controls: Visual | HTML + Fullscreen */}
          <div className="flex items-center gap-1.5">
            {uploading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Uploading...
              </span>
            )}
            <div
              className={`inline-flex rounded-md p-0.5 border text-[11px] font-medium ${
                darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-white border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setMode("visual")}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition ${
                  mode === "visual"
                    ? "bg-[#2563EB] text-white"
                    : darkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("html")}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition ${
                  mode === "html"
                    ? "bg-[#2563EB] text-white"
                    : darkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>HTML</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFullscreen((prev) => !prev)}
              className={toolbarBtn}
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Editor Body (Supports Drag-and-Drop Image Files & Ctrl+V Paste!) */}
        <div
          onDragOver={(e) => {
            if (e.dataTransfer?.types?.includes("Files")) {
              e.preventDefault();
              setDragOverEditor(true);
            }
          }}
          onDragLeave={() => setDragOverEditor(false)}
          onDrop={handleEditorDrop}
          className={`relative ${dragOverEditor ? "ring-2 ring-inset ring-[#2563EB] bg-blue-50/30" : ""}`}
        >
          {dragOverEditor && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-blue-600/10 backdrop-blur-[1px]">
              <div className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold shadow-lg">
                Drop image here to upload &amp; insert
              </div>
            </div>
          )}

          {mode === "visual" ? (
            <div
              ref={editorRef}
              contentEditable
              dir={dir}
              suppressContentEditableWarning
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              onPaste={handleEditorPaste}
              onInput={(e) => {
                const html = e.currentTarget.innerHTML;
                lastExternalValue.current = html;
                onChange(html);
              }}
              data-placeholder={placeholder}
              style={{ minHeight: fullscreen ? "calc(100vh - 120px)" : `${minHeight}px` }}
              className={`p-4 text-sm leading-relaxed outline-none overflow-y-auto prose max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 ${
                darkMode ? "text-slate-100 prose-invert" : "text-[#111827]"
              }`}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handleEditorPaste}
              dir="ltr"
              style={{ minHeight: fullscreen ? "calc(100vh - 120px)" : `${minHeight}px` }}
              className={`w-full p-4 font-mono text-xs leading-relaxed outline-none resize-y ${
                darkMode ? "bg-[#0D0F15] text-emerald-300" : "bg-[#FAFAFA] text-[#111827]"
              }`}
              placeholder="<h2>Section title</h2><p>HTML content... (Tip: click 'Insert Image' or drag an image file here to auto-upload & insert an <img> tag!)</p>"
            />
          )}
        </div>
      </div>

      {/* Insert Image Modal (Upload from Computer + Media Library + URL) */}
      {showMediaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowMediaModal(false)}
        >
          <div
            className={`w-full max-w-2xl rounded-xl border p-5 shadow-2xl space-y-4 ${
              darkMode ? "bg-[#151822] border-[#2A2F3E] text-white" : "bg-white border-gray-200 text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Insert Image into Article</h3>
                <p className="text-[11px] text-gray-500">
                  Upload from your computer, pick from Media Library, or paste a URL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="p-1 rounded hover:bg-gray-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Alt Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">Image Alt Text (SEO)</label>
              <input
                value={altDraft}
                onChange={(e) => setAltDraft(e.target.value)}
                placeholder="Describe this image for Google SEO (e.g. Heated pool chalet in Riyadh)"
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                  darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-white border-gray-300"
                }`}
              />
            </div>

            {/* Direct Upload from Computer Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) void uploadAndInsertFile(f);
              }}
              className={`rounded-lg border-2 border-dashed p-5 text-center space-y-2 ${
                darkMode ? "border-[#2A2F3E] bg-[#11131A]" : "border-blue-200 bg-blue-50/40"
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-[#2563EB] py-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading image and inserting into article...</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Computer</span>
                  </button>
                  <p className="text-[11px] text-gray-500">
                    Or drag and drop an image file directly from your Downloads folder
                  </p>
                </>
              )}
            </div>

            {/* Paste Image URL */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const imgUrl = String(fd.get("imgUrl") || "").trim();
                if (imgUrl) handleInsertImageUrl(imgUrl);
              }}
              className="flex gap-2"
            >
              <input
                name="imgUrl"
                placeholder="Or paste an image URL (https://...)"
                className={`flex-1 px-3 py-2 text-xs rounded-lg border outline-none ${
                  darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-white border-gray-300"
                }`}
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-[#2A2F3E] text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Insert URL
              </button>
            </form>

            {/* Media Library Grid */}
            {mediaLibrary.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Or select from Media Library</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto">
                  {mediaLibrary.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleInsertImageUrl(m.url, m.alt)}
                      className={`group rounded-lg border overflow-hidden text-left transition ${
                        darkMode ? "border-[#2A2F3E] hover:border-blue-500" : "border-gray-200 hover:border-blue-500"
                      }`}
                    >
                      <div className="h-20 bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt={m.alt} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </div>
                      <div className="p-1.5 text-[11px] truncate">{m.filename}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

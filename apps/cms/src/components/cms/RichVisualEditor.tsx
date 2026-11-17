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
} from "lucide-react";
import type { CmsMediaRecord } from "@/types/cms";

interface RichVisualEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  dir?: "ltr" | "rtl";
  minHeight?: number;
  mediaLibrary?: CmsMediaRecord[];
}

export function RichVisualEditor({
  value,
  onChange,
  placeholder = "Start writing content...",
  darkMode = false,
  dir = "ltr",
  minHeight = 260,
  mediaLibrary = [],
}: RichVisualEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [fullscreen, setFullscreen] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastExternalValue = useRef<string>(value);

  useEffect(() => {
    if (mode === "visual" && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
        lastExternalValue.current = value;
      }
    }
  }, [value, mode]);

  const exec = (cmd: string, arg?: string) => {
    if (mode !== "visual") return;
    editorRef.current?.focus();
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
    const url = window.prompt("Enter link URL (https://...):", "https://");
    if (url && url.trim()) {
      exec("createLink", url.trim());
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr><th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Column 1</th><th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Column 2</th></tr></thead><tbody><tr><td style="border:1px solid #d1d5db;padding:8px;">Value 1</td><td style="border:1px solid #d1d5db;padding:8px;">Value 2</td></tr></tbody></table><p></p>`;
    exec("insertHTML", tableHtml);
  };

  const handleInsertImageUrl = (url: string, alt = "Embedded image") => {
    const imgHtml = `<p><img src="${url}" alt="${alt.replace(/"/g, "&quot;")}" style="max-width:100%;border-radius:8px;margin:8px 0;" /></p>`;
    if (mode === "visual") {
      exec("insertHTML", imgHtml);
    } else {
      onChange(`${value}\n${imgHtml}`);
    }
    setShowMediaModal(false);
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
              onClick={() => setShowMediaModal(true)}
              className={toolbarBtn}
              title="Insert Image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
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

        {/* Editor Body */}
        {mode === "visual" ? (
          <div
            ref={editorRef}
            contentEditable
            dir={dir}
            suppressContentEditableWarning
            onInput={(e) => {
              const html = e.currentTarget.innerHTML;
              lastExternalValue.current = html;
              onChange(html);
            }}
            data-placeholder={placeholder}
            style={{ minHeight: fullscreen ? "calc(100vh - 120px)" : `${minHeight}px` }}
            className={`p-4 text-sm leading-relaxed outline-none overflow-y-auto prose max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-blue-600 [&_a]:underline ${
              darkMode ? "text-slate-100 prose-invert" : "text-[#111827]"
            }`}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            style={{ minHeight: fullscreen ? "calc(100vh - 120px)" : `${minHeight}px` }}
            className={`w-full p-4 font-mono text-xs leading-relaxed outline-none resize-y ${
              darkMode ? "bg-[#0D0F15] text-emerald-300" : "bg-[#FAFAFA] text-[#111827]"
            }`}
            placeholder="<h2>Section title</h2><p>HTML content...</p>"
          />
        )}
      </div>

      {/* Insert Image Modal */}
      {showMediaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowMediaModal(false)}
        >
          <div
            className={`w-full max-w-xl rounded-xl border p-5 shadow-2xl space-y-4 ${
              darkMode ? "bg-[#151822] border-[#2A2F3E] text-white" : "bg-white border-gray-200 text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Insert Image into Editor</h3>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

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
                placeholder="Paste image URL (https://...)"
                className={`flex-1 px-3 py-2 text-xs rounded-lg border outline-none ${
                  darkMode ? "bg-[#11131A] border-[#2A2F3E]" : "bg-white border-gray-300"
                }`}
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-medium hover:bg-blue-700"
              >
                Insert URL
              </button>
            </form>

            {mediaLibrary.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Or select from Media Library</div>
                <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto">
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

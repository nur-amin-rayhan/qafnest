"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Check, CheckCircle2, XCircle } from "lucide-react";
import { CollectionTableShell, type TableColumn } from "./CollectionTableShell";
import { RichVisualEditor } from "./RichVisualEditor";
import { MediaPickerField } from "./MediaPickerField";
import type {
  CmsBusinessPageRecord,
  CmsCategoryRecord,
  CmsDestinationRecord,
  CmsFaqRecord,
  CmsHomePopupRecord,
  CmsLegalPageRecord,
  CmsLocale,
  CmsMediaRecord,
  CmsNavLinkRecord,
  CmsSocialLinkRecord,
  CmsWorkspaceData,
} from "@/types/cms";

type CollectionKind =
  | "categories"
  | "faqs"
  | "home-popups"
  | "destinations"
  | "business-pages"
  | "legal-pages"
  | "navigation-links"
  | "social-links";

interface CmsCollectionsModuleProps {
  kind: CollectionKind;
  workspace: CmsWorkspaceData;
  onSaveWorkspacePatch: (patch: Partial<CmsWorkspaceData>) => Promise<void>;
  onMediaUploaded: (media: CmsMediaRecord) => void;
  locale: CmsLocale;
  darkMode: boolean;
  onNotify: (msg: string) => void;
}

function slugify(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  ) : (
    <XCircle className="w-4 h-4 text-gray-300 dark:text-slate-600" />
  );
}

export function CmsCollectionsModule({
  kind,
  workspace,
  onSaveWorkspacePatch,
  onMediaUploaded,
  locale,
  darkMode,
  onNotify,
}: CmsCollectionsModuleProps) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs outline-none ${
    darkMode
      ? "bg-[#11131A] border-[#2A2F3E] text-white focus:border-blue-500"
      : "bg-white border-[#D1D5DB] text-[#111827] focus:border-[#2563EB]"
  }`;
  const cardCls = `rounded-xl border p-5 space-y-4 ${
    darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-[#E5E7EB]"
  }`;

  // ==================== 1. CATEGORIES ====================
  if (kind === "categories") {
    const draft = editing as CmsCategoryRecord | null;
    if (draft) {
      return (
        <div className="space-y-5 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold">{(isAr ? draft.name.ar : draft.name.en) || "[Untitled Category]"}</h1>
            </div>
            <button
              type="button"
              onClick={async () => {
                const nameEn = draft.name.en.trim() || draft.name.ar.trim();
                const nameAr = draft.name.ar.trim() || draft.name.en.trim();
                if (!nameEn) return onNotify("Category name is required");
                const rec: CmsCategoryRecord = {
                  ...draft,
                  name: { en: nameEn, ar: nameAr },
                  slug: draft.slug.trim() || slugify(nameEn),
                  updatedAt: new Date().toISOString(),
                };
                const next = isNew
                  ? [rec, ...workspace.categories]
                  : workspace.categories.map((c) => (c.id === rec.id ? rec : c));
                await onSaveWorkspacePatch({ categories: next });
                setEditing(null);
                onNotify("Category saved");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          <div className={cardCls}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Name ({locale.toUpperCase()}) *</label>
                <input
                  value={isAr ? draft.name.ar : draft.name.en}
                  dir={isAr ? "rtl" : "ltr"}
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      name: { ...draft.name, [locale]: e.target.value },
                      ...(isNew && !isAr ? { slug: slugify(e.target.value) } : {}),
                    } as unknown as Record<string, unknown>)
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Slug *</label>
                <input
                  value={draft.slug}
                  onChange={(e) => setEditing({ ...draft, slug: e.target.value } as unknown as Record<string, unknown>)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description ({locale.toUpperCase()})</label>
              <textarea
                rows={3}
                dir={isAr ? "rtl" : "ltr"}
                value={isAr ? draft.description.ar : draft.description.en}
                onChange={(e) =>
                  setEditing({
                    ...draft,
                    description: { ...draft.description, [locale]: e.target.value },
                  } as unknown as Record<string, unknown>)
                }
                className={inputCls}
              />
            </div>
          </div>
        </div>
      );
    }

    const rows = workspace.categories.filter((c) =>
      !search.trim()
        ? true
        : c.name.en.toLowerCase().includes(search.toLowerCase()) ||
          c.name.ar.includes(search) ||
          c.slug.toLowerCase().includes(search.toLowerCase())
    );
    const cols: TableColumn<CmsCategoryRecord>[] = [
      {
        key: "name",
        label: "Name",
        render: (c) => (
          <button
            type="button"
            onClick={() => {
              setEditing({ ...c } as unknown as Record<string, unknown>);
              setIsNew(false);
            }}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            {isAr ? c.name.ar : c.name.en}
          </button>
        ),
      },
      { key: "slug", label: "Slug", render: (c) => <span className="font-mono text-gray-500">{c.slug}</span> },
      { key: "desc", label: "Description", render: (c) => <span className="text-gray-500">{isAr ? c.description.ar : c.description.en}</span> },
    ];
    return (
      <CollectionTableShell
        title={isAr ? "التصنيفات (Categories)" : "Categories"}
        searchPlaceholder="Search by Name or Slug"
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={() => {
          setEditing({
            id: `cat-${Date.now()}`,
            name: { en: "", ar: "" },
            slug: "",
            description: { en: "", ar: "" },
            updatedAt: new Date().toISOString(),
          });
          setIsNew(true);
        }}
        columns={cols}
        rows={rows}
        onEdit={(c) => {
          setEditing({ ...c } as unknown as Record<string, unknown>);
          setIsNew(false);
        }}
        onDelete={async (c) => {
          if (!window.confirm(`Delete category "${c.name.en}"?`)) return;
          await onSaveWorkspacePatch({ categories: workspace.categories.filter((x) => x.id !== c.id) });
          onNotify("Category deleted");
        }}
        darkMode={darkMode}
      />
    );
  }

  // ==================== 2. FAQs (Screenshot 9) ====================
  if (kind === "faqs") {
    const draft = editing as CmsFaqRecord | null;
    if (draft) {
      return (
        <div className="space-y-5 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold truncate max-w-md">{(isAr ? draft.question.ar : draft.question.en) || "[New FAQ]"}</h1>
            </div>
            <button
              type="button"
              onClick={async () => {
                const qEn = draft.question.en.trim() || draft.question.ar.trim();
                const qAr = draft.question.ar.trim() || draft.question.en.trim();
                if (!qEn) return onNotify("Question is required");
                const rec: CmsFaqRecord = {
                  ...draft,
                  question: { en: qEn, ar: qAr },
                  answer: {
                    en: draft.answer.en.trim() || draft.answer.ar.trim(),
                    ar: draft.answer.ar.trim() || draft.answer.en.trim(),
                  },
                  updatedAt: new Date().toISOString(),
                };
                const next = isNew
                  ? [rec, ...workspace.faqs]
                  : workspace.faqs.map((f) => (f.id === rec.id ? rec : f));
                await onSaveWorkspacePatch({ faqs: next });
                setEditing(null);
                onNotify("FAQ saved");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          <div className={cardCls}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Question ({locale.toUpperCase()}) *</label>
              <input
                value={isAr ? draft.question.ar : draft.question.en}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) =>
                  setEditing({
                    ...draft,
                    question: { ...draft.question, [locale]: e.target.value },
                  } as unknown as Record<string, unknown>)
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Answer ({locale.toUpperCase()}) *</label>
              <textarea
                rows={4}
                dir={isAr ? "rtl" : "ltr"}
                value={isAr ? draft.answer.ar : draft.answer.en}
                onChange={(e) =>
                  setEditing({
                    ...draft,
                    answer: { ...draft.answer, [locale]: e.target.value },
                  } as unknown as Record<string, unknown>)
                }
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setEditing({ ...draft, enabled: e.target.checked } as unknown as Record<string, unknown>)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Enabled (visible on website)</span>
            </label>
          </div>
        </div>
      );
    }

    const rows = workspace.faqs.filter((f) => {
      if (statusFilter === "enabled" && !f.enabled) return false;
      if (statusFilter === "disabled" && f.enabled) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return f.question.en.toLowerCase().includes(q) || f.question.ar.includes(search) || f.answer.en.toLowerCase().includes(q);
    });
    const cols: TableColumn<CmsFaqRecord>[] = [
      {
        key: "question",
        label: "Question",
        render: (f) => (
          <button
            type="button"
            onClick={() => {
              setEditing({ ...f } as unknown as Record<string, unknown>);
              setIsNew(false);
            }}
            className="font-semibold text-[#2563EB] hover:underline text-left max-w-[280px] truncate block"
          >
            {isAr ? f.question.ar : f.question.en}
          </button>
        ),
      },
      { key: "enabled", label: "Enabled", render: (f) => <BoolIcon value={f.enabled} /> },
      {
        key: "answer",
        label: "Answer",
        render: (f) => (
          <span className="text-gray-500 max-w-[300px] truncate block">
            {isAr ? f.answer.ar : f.answer.en}
          </span>
        ),
      },
      { key: "updatedAt", label: "Updated At", render: (f) => <span className="text-gray-500" suppressHydrationWarning>{f.updatedAt ? String(f.updatedAt).slice(0, 10) : "—"}</span> },
    ];
    return (
      <CollectionTableShell
        title={isAr ? "الأسئلة الشائعة (FAQs)" : "FAQs"}
        searchPlaceholder="Search by Question"
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          { label: "All", value: "all" },
          { label: "Enabled", value: "enabled" },
          { label: "Disabled", value: "disabled" },
        ]}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onCreateNew={() => {
          setEditing({
            id: `faq-${Date.now()}`,
            question: { en: "", ar: "" },
            answer: { en: "", ar: "" },
            enabled: true,
            order: workspace.faqs.length + 1,
            updatedAt: new Date().toISOString(),
          });
          setIsNew(true);
        }}
        columns={cols}
        rows={rows}
        draggable
        onReorder={async (reordered) => {
          await onSaveWorkspacePatch({ faqs: reordered.map((f, i) => ({ ...f, order: i + 1 })) });
        }}
        onEdit={(f) => {
          setEditing({ ...f } as unknown as Record<string, unknown>);
          setIsNew(false);
        }}
        onDelete={async (f) => {
          if (!window.confirm("Delete this FAQ?")) return;
          await onSaveWorkspacePatch({ faqs: workspace.faqs.filter((x) => x.id !== f.id) });
          onNotify("FAQ deleted");
        }}
        darkMode={darkMode}
      />
    );
  }

  // ==================== 3. HOME POPUPS (Screenshots 10 & 11) ====================
  if (kind === "home-popups") {
    const draft = editing as CmsHomePopupRecord | null;
    if (draft) {
      return (
        <div className="space-y-5 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{draft.title || "[Untitled Popup]"}</h1>
                <p className="text-xs text-gray-500">{isNew ? "Creating new Home Popup" : "Editing Home Popup"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!draft.title.trim()) return onNotify("Popup title is required");
                const rec: CmsHomePopupRecord = { ...draft, updatedAt: new Date().toISOString() };
                const next = isNew
                  ? [rec, ...workspace.homePopups]
                  : workspace.homePopups.map((p) => (p.id === rec.id ? rec : p));
                await onSaveWorkspacePatch({ homePopups: next });
                setEditing(null);
                onNotify("Home popup saved");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          <div className={cardCls}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title *</label>
              <input
                value={draft.title}
                onChange={(e) => setEditing({ ...draft, title: e.target.value } as unknown as Record<string, unknown>)}
                placeholder="Summer Chalets Promo Banner"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <MediaPickerField
                label="Desktop Image"
                helperText="Recommended dimensions: 1200 × 750 px"
                value={draft.desktopImage}
                onChange={(url) => setEditing({ ...draft, desktopImage: url } as unknown as Record<string, unknown>)}
                mediaLibrary={workspace.media}
                onMediaUploaded={onMediaUploaded}
                darkMode={darkMode}
              />
              <MediaPickerField
                label="Mobile Image"
                helperText="Recommended dimensions: 600 × 750 px"
                value={draft.mobileImage}
                onChange={(url) => setEditing({ ...draft, mobileImage: url } as unknown as Record<string, unknown>)}
                mediaLibrary={workspace.media}
                onMediaUploaded={onMediaUploaded}
                darkMode={darkMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Link URL</label>
                <input
                  value={draft.link}
                  onChange={(e) => setEditing({ ...draft, link: e.target.value } as unknown as Record<string, unknown>)}
                  placeholder="https://qafnest.com/properties"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Status</label>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setEditing({ ...draft, status: e.target.value as "active" | "inactive" } as unknown as Record<string, unknown>)
                  }
                  className={inputCls}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Start Date</label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setEditing({ ...draft, startDate: e.target.value } as unknown as Record<string, unknown>)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">End Date</label>
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => setEditing({ ...draft, endDate: e.target.value } as unknown as Record<string, unknown>)}
                  className={inputCls}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={draft.openInNewTab}
                onChange={(e) => setEditing({ ...draft, openInNewTab: e.target.checked } as unknown as Record<string, unknown>)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Open Link in New Tab</span>
            </label>
          </div>
        </div>
      );
    }

    const rows = workspace.homePopups.filter((p) =>
      !search.trim() ? true : p.title.toLowerCase().includes(search.toLowerCase())
    );
    const cols: TableColumn<CmsHomePopupRecord>[] = [
      {
        key: "title",
        label: "Title",
        render: (p) => (
          <button
            type="button"
            onClick={() => {
              setEditing({ ...p } as unknown as Record<string, unknown>);
              setIsNew(false);
            }}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            {p.title}
          </button>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (p) => (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              p.status === "active"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-gray-500/10 text-gray-500"
            }`}
          >
            {p.status}
          </span>
        ),
      },
      { key: "schedule", label: "Schedule", render: (p) => <span className="text-gray-500">{p.startDate || "—"} → {p.endDate || "—"}</span> },
      { key: "link", label: "Link", render: (p) => <span className="text-gray-500 truncate max-w-[200px] block">{p.link || "—"}</span> },
    ];
    return (
      <CollectionTableShell
        title={isAr ? "النوافذ المنبثقة (Home Popups)" : "Home Popups"}
        searchPlaceholder="Search by Title"
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={() => {
          setEditing({
            id: `popup-${Date.now()}`,
            title: "",
            desktopImage: "",
            mobileImage: "",
            link: "",
            openInNewTab: true,
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            status: "active",
            updatedAt: new Date().toISOString(),
          });
          setIsNew(true);
        }}
        columns={cols}
        rows={rows}
        emptyTitle="No Home Popups found."
        emptyDescription="Create a promotional desktop & mobile popup banner for the QafNest homepage."
        onEdit={(p) => {
          setEditing({ ...p } as unknown as Record<string, unknown>);
          setIsNew(false);
        }}
        onDelete={async (p) => {
          if (!window.confirm(`Delete popup "${p.title}"?`)) return;
          await onSaveWorkspacePatch({ homePopups: workspace.homePopups.filter((x) => x.id !== p.id) });
          onNotify("Popup deleted");
        }}
        darkMode={darkMode}
      />
    );
  }

  // ==================== 3B. DESTINATIONS ("A Place to Stay Wherever You Go") ====================
  if (kind === "destinations") {
    const destList = [...(workspace.destinations || [])].sort(
      (a, b) => Number(a.order || 0) - Number(b.order || 0)
    );
    const draft = editing as CmsDestinationRecord | null;
    if (draft) {
      return (
        <div className="space-y-5 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{draft.name[locale] || "[Untitled Destination]"}</h1>
                <p className="text-xs text-gray-500">
                  {isNew ? "Creating Destination Card (Place to Stay)" : "Editing Destination Card"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!draft.name.en.trim() && !draft.name.ar.trim()) {
                  return onNotify("Destination name is required");
                }
                const cleanCity = (draft.city || slugify(draft.name.en || draft.id)).trim().toLowerCase();
                const rec: CmsDestinationRecord = {
                  ...draft,
                  city: cleanCity || "all",
                  updatedAt: new Date().toISOString(),
                };
                const next = isNew
                  ? [...destList, rec]
                  : destList.map((d) => (d.id === rec.id ? rec : d));
                await onSaveWorkspacePatch({ destinations: next });
                setEditing(null);
                onNotify("Destination saved & synced to homepage");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>

          <div className={cardCls}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Name (English) *</label>
                <input
                  value={draft.name.en}
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      name: { ...draft.name, en: e.target.value },
                    } as unknown as Record<string, unknown>)
                  }
                  placeholder="Riyadh"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Name (Arabic) *</label>
                <input
                  value={draft.name.ar}
                  dir="rtl"
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      name: { ...draft.name, ar: e.target.value },
                    } as unknown as Record<string, unknown>)
                  }
                  placeholder="الرياض"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Subtitle (English)</label>
                <input
                  value={draft.subtitle.en}
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      subtitle: { ...draft.subtitle, en: e.target.value },
                    } as unknown as Record<string, unknown>)
                  }
                  placeholder="Al-Ammariyah & Diriyah Chalets"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Subtitle (Arabic)</label>
                <input
                  value={draft.subtitle.ar}
                  dir="rtl"
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      subtitle: { ...draft.subtitle, ar: e.target.value },
                    } as unknown as Record<string, unknown>)
                  }
                  placeholder="شاليهات العمارية والدرعية"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">City Filter Slug *</label>
                <input
                  value={draft.city}
                  onChange={(e) =>
                    setEditing({ ...draft, city: e.target.value } as unknown as Record<string, unknown>)
                  }
                  placeholder="riyadh (or 'all' for Monthly Stays)"
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Display Order</label>
                <input
                  type="number"
                  value={draft.order}
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      order: Number(e.target.value) || 0,
                    } as unknown as Record<string, unknown>)
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Monthly Badge (optional)</label>
                <input
                  value={draft.badgeText || ""}
                  onChange={(e) =>
                    setEditing({ ...draft, badgeText: e.target.value } as unknown as Record<string, unknown>)
                  }
                  placeholder="-35%"
                  className={inputCls}
                />
              </div>
            </div>

            <MediaPickerField
              label="Destination Circle Image"
              helperText="Recommended square image (400 × 400 px)"
              value={draft.image}
              onChange={(url) =>
                setEditing({ ...draft, image: url } as unknown as Record<string, unknown>)
              }
              mediaLibrary={workspace.media}
              onMediaUploaded={onMediaUploaded}
              darkMode={darkMode}
            />

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) =>
                    setEditing({ ...draft, enabled: e.target.checked } as unknown as Record<string, unknown>)
                  }
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Active (Show on Homepage)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.isMonthly)}
                  onChange={(e) =>
                    setEditing({ ...draft, isMonthly: e.target.checked } as unknown as Record<string, unknown>)
                  }
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Monthly Stays Filter Card</span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    const rows = destList.filter((d) =>
      !search.trim()
        ? true
        : d.name.en.toLowerCase().includes(search.toLowerCase()) ||
          d.name.ar.includes(search) ||
          d.city.toLowerCase().includes(search.toLowerCase())
    );
    const cols: TableColumn<CmsDestinationRecord>[] = [
      {
        key: "destination",
        label: "Destination",
        render: (d) => (
          <div className="flex items-center gap-3">
            {d.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.image}
                alt={d.name.en}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-[#2A2F3E] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-600/20 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                {d.name.en.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditing({ ...d } as unknown as Record<string, unknown>);
                  setIsNew(false);
                }}
                className="font-semibold text-[#2563EB] hover:underline text-left block"
              >
                {d.name[locale] || d.name.en}
              </button>
              <span className="text-[11px] text-gray-500 font-mono">
                {d.isMonthly ? "monthly-stays" : `city: ${d.city}`}
              </span>
            </div>
          </div>
        ),
      },
      { key: "order", label: "Order", render: (d) => <span className="font-mono text-gray-500">#{d.order}</span> },
      {
        key: "reorder",
        label: "Move",
        render: (d) => {
          const idx = destList.findIndex((x) => x.id === d.id);
          const canUp = idx > 0;
          const canDown = idx < destList.length - 1;
          const move = async (delta: number) => {
            const next = [...destList];
            const targetIdx = idx + delta;
            const temp = next[idx];
            next[idx] = next[targetIdx];
            next[targetIdx] = temp;
            const updated = next.map((item, i) => ({
              ...item,
              order: i + 1,
              updatedAt: new Date().toISOString(),
            }));
            await onSaveWorkspacePatch({ destinations: updated });
            onNotify(`"${d.name.en || d.city}" moved ${delta < 0 ? "up" : "down"}`);
          };
          return (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canUp}
                onClick={() => move(-1)}
                className="p-1 rounded border border-gray-200 dark:border-[#2A2F3E] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition cursor-pointer"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!canDown}
                onClick={() => move(1)}
                className="p-1 rounded border border-gray-200 dark:border-[#2A2F3E] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition cursor-pointer"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
      {
        key: "enabled",
        label: "Status (Toggle)",
        render: (d) => (
          <button
            type="button"
            onClick={async () => {
              const next = destList.map((item) =>
                item.id === d.id
                  ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() }
                  : item
              );
              await onSaveWorkspacePatch({ destinations: next });
              onNotify(
                !d.enabled
                  ? `"${d.name.en}" enabled on homepage`
                  : `"${d.name.en}" hidden from homepage`
              );
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
              d.enabled
                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                : "bg-gray-500/15 text-gray-500 hover:bg-gray-500/25"
            }`}
          >
            {d.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>{d.enabled ? "Active (Visible)" : "Hidden (Off)"}</span>
          </button>
        ),
      },
    ];

    return (
      <CollectionTableShell
        title={isAr ? "الوجهات — أماكن الإقامة (Place to Stay)" : "Destinations (A Place to Stay Wherever You Go)"}
        searchPlaceholder="Search city or destination name"
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={() => {
          setEditing({
            id: `dest-${Date.now()}`,
            city: "",
            name: { en: "", ar: "" },
            subtitle: { en: "", ar: "" },
            image: "",
            isMonthly: false,
            badgeText: "",
            enabled: true,
            order: destList.length + 1,
            updatedAt: new Date().toISOString(),
          });
          setIsNew(true);
        }}
        columns={cols}
        rows={rows}
        draggable
        onReorder={async (reordered) => {
          const updated = reordered.map((item, idx) => ({
            ...item,
            order: idx + 1,
            updatedAt: new Date().toISOString(),
          }));
          await onSaveWorkspacePatch({ destinations: updated });
          onNotify("Destinations order updated & synced to homepage");
        }}
        emptyTitle="No destinations configured."
        emptyDescription="Add cities or Monthly Stays cards for the homepage circular destinations strip."
        onEdit={(d) => {
          setEditing({ ...d } as unknown as Record<string, unknown>);
          setIsNew(false);
        }}
        onDelete={async (d) => {
          if (!window.confirm(`Delete destination "${d.name.en}"?`)) return;
          await onSaveWorkspacePatch({
            destinations: destList.filter((x) => x.id !== d.id),
          });
          onNotify("Destination removed");
        }}
        darkMode={darkMode}
      />
    );
  }

  // ==================== 4 & 5. BUSINESS PAGES & LEGAL PAGES (Screenshots 15 & 16) ====================
  if (kind === "business-pages" || kind === "legal-pages") {
    const isLegal = kind === "legal-pages";
    const list = isLegal ? workspace.legalPages : workspace.businessPages;
    const draft = editing as (CmsBusinessPageRecord | CmsLegalPageRecord) | null;

    if (draft) {
      return (
        <div className="space-y-5 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold">
                {(isAr ? draft.title.ar : draft.title.en) || (isLegal ? "[New Legal Page]" : "[New Business Page]")}
              </h1>
            </div>
            <button
              type="button"
              onClick={async () => {
                const titleEn = draft.title.en.trim() || draft.title.ar.trim();
                const titleAr = draft.title.ar.trim() || draft.title.en.trim();
                if (!titleEn) return onNotify("Page title is required");
                const rec: CmsLegalPageRecord = {
                  ...draft,
                  title: { en: titleEn, ar: titleAr },
                  slug: draft.slug.trim() || slugify(titleEn),
                  updatedAt: new Date().toISOString(),
                };
                const next = isNew ? [rec, ...list] : list.map((p) => (p.id === rec.id ? rec : p));
                await onSaveWorkspacePatch(isLegal ? { legalPages: next } : { businessPages: next });
                setEditing(null);
                onNotify("Page saved");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          <div className={cardCls}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Title ({locale.toUpperCase()}) *</label>
                <input
                  value={isAr ? draft.title.ar : draft.title.en}
                  dir={isAr ? "rtl" : "ltr"}
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      title: { ...draft.title, [locale]: e.target.value },
                      ...(isNew && !isAr ? { slug: slugify(e.target.value) } : {}),
                    } as unknown as Record<string, unknown>)
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Slug *</label>
                <input
                  value={draft.slug}
                  onChange={(e) => setEditing({ ...draft, slug: e.target.value } as unknown as Record<string, unknown>)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={draft.showSection}
                onChange={(e) => setEditing({ ...draft, showSection: e.target.checked } as unknown as Record<string, unknown>)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Show Section / Published</span>
            </label>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Content ({locale.toUpperCase()})</label>
              <RichVisualEditor
                value={isAr ? draft.content.ar : draft.content.en}
                onChange={(html) =>
                  setEditing({
                    ...draft,
                    content: { ...draft.content, [locale]: html },
                  } as unknown as Record<string, unknown>)
                }
                darkMode={darkMode}
                dir={isAr ? "rtl" : "ltr"}
                mediaLibrary={workspace.media}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-[#222634]">
              <div className="space-y-1">
                <label className="text-xs font-medium">Meta Title ({locale.toUpperCase()})</label>
                <input
                  value={isAr ? draft.metaTitle.ar : draft.metaTitle.en}
                  onChange={(e) =>
                    setEditing({
                      ...draft,
                      metaTitle: { ...draft.metaTitle, [locale]: e.target.value },
                    } as unknown as Record<string, unknown>)
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Canonical URL</label>
                <input
                  value={draft.canonicalUrl}
                  onChange={(e) => setEditing({ ...draft, canonicalUrl: e.target.value } as unknown as Record<string, unknown>)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    const rows = list.filter((p) =>
      !search.trim()
        ? true
        : p.title.en.toLowerCase().includes(search.toLowerCase()) ||
          p.title.ar.includes(search) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
    );
    const cols: TableColumn<CmsLegalPageRecord>[] = [
      {
        key: "title",
        label: "Title",
        render: (p) => (
          <button
            type="button"
            onClick={() => {
              setEditing({ ...p } as unknown as Record<string, unknown>);
              setIsNew(false);
            }}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            {isAr ? p.title.ar : p.title.en}
          </button>
        ),
      },
      { key: "slug", label: "Slug", render: (p) => <span className="font-mono text-gray-500">/{p.slug}</span> },
      { key: "showSection", label: "Show Section", render: (p) => <BoolIcon value={p.showSection} /> },
      { key: "updatedAt", label: "Updated At", render: (p) => <span className="text-gray-500" suppressHydrationWarning>{p.updatedAt ? String(p.updatedAt).slice(0, 10) : "—"}</span> },
    ];
    return (
      <CollectionTableShell
        title={isLegal ? (isAr ? "الصفحات القانونية (Legal Pages)" : "Legal Pages") : isAr ? "صفحات الأعمال (Business Pages)" : "Business Pages"}
        searchPlaceholder="Search by Title or Slug"
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={() => {
          setEditing({
            id: `${isLegal ? "legal" : "biz"}-${Date.now()}`,
            title: { en: "", ar: "" },
            slug: "",
            content: { en: "<h2>Overview</h2><p>Page content...</p>", ar: "<h2>نظرة عامة</h2><p>محتوى الصفحة...</p>" },
            showSection: true,
            metaTitle: { en: "", ar: "" },
            metaDescription: { en: "", ar: "" },
            canonicalUrl: "",
            updatedAt: new Date().toISOString(),
          });
          setIsNew(true);
        }}
        columns={cols}
        rows={rows}
        emptyTitle={isLegal ? "No Legal Pages found." : "No Business Pages found."}
        emptyDescription="Create a custom landing or compliance page with rich visual content and SEO."
        onEdit={(p) => {
          setEditing({ ...p } as unknown as Record<string, unknown>);
          setIsNew(false);
        }}
        onDelete={async (p) => {
          if (!window.confirm(`Delete page "${p.title.en}"?`)) return;
          const next = list.filter((x) => x.id !== p.id);
          await onSaveWorkspacePatch(isLegal ? { legalPages: next } : { businessPages: next });
          onNotify("Page deleted");
        }}
        darkMode={darkMode}
      />
    );
  }

  // ==================== 6. NAVIGATION LINKS (Screenshot 17) ====================
  if (kind === "navigation-links") {
    const draft = editing as CmsNavLinkRecord | null;
    if (draft) {
      return (
        <div className="space-y-5 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold">{(isAr ? draft.title.ar : draft.title.en) || "[New Link]"}</h1>
            </div>
            <button
              type="button"
              onClick={async () => {
                const titleEn = draft.title.en.trim() || draft.title.ar.trim();
                const titleAr = draft.title.ar.trim() || draft.title.en.trim();
                if (!titleEn || !draft.link.trim()) return onNotify("Title and link URL are required");
                const rec: CmsNavLinkRecord = { ...draft, title: { en: titleEn, ar: titleAr } };
                const next = isNew
                  ? [...workspace.navigationLinks, rec]
                  : workspace.navigationLinks.map((n) => (n.id === rec.id ? rec : n));
                await onSaveWorkspacePatch({ navigationLinks: next });
                setEditing(null);
                onNotify("Navigation link saved");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          <div className={cardCls}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Title ({locale.toUpperCase()}) *</label>
                <input
                  value={isAr ? draft.title.ar : draft.title.en}
                  dir={isAr ? "rtl" : "ltr"}
                  onChange={(e) =>
                    setEditing({ ...draft, title: { ...draft.title, [locale]: e.target.value } } as unknown as Record<string, unknown>)
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Link Path / URL *</label>
                <input
                  value={draft.link}
                  onChange={(e) => setEditing({ ...draft, link: e.target.value } as unknown as Record<string, unknown>)}
                  placeholder="/properties"
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showInNavbar}
                  onChange={(e) => setEditing({ ...draft, showInNavbar: e.target.checked } as unknown as Record<string, unknown>)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Show in Navbar</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showInFooter}
                  onChange={(e) => setEditing({ ...draft, showInFooter: e.target.checked } as unknown as Record<string, unknown>)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Show in Footer</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.openInNewTab}
                  onChange={(e) => setEditing({ ...draft, openInNewTab: e.target.checked } as unknown as Record<string, unknown>)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span>Open in New Tab</span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    const rows = workspace.navigationLinks.filter((n) =>
      !search.trim()
        ? true
        : n.title.en.toLowerCase().includes(search.toLowerCase()) ||
          n.title.ar.includes(search) ||
          n.link.toLowerCase().includes(search.toLowerCase())
    );
    const cols: TableColumn<CmsNavLinkRecord>[] = [
      {
        key: "title",
        label: "Title",
        render: (n) => (
          <button
            type="button"
            onClick={() => {
              setEditing({ ...n } as unknown as Record<string, unknown>);
              setIsNew(false);
            }}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            {isAr ? n.title.ar : n.title.en}
          </button>
        ),
      },
      { key: "navbar", label: "Show in Navbar", render: (n) => <BoolIcon value={n.showInNavbar} /> },
      { key: "footer", label: "Show in Footer", render: (n) => <BoolIcon value={n.showInFooter} /> },
      { key: "link", label: "Link", render: (n) => <span className="font-mono text-gray-500">{n.link}</span> },
    ];
    return (
      <CollectionTableShell
        title={isAr ? "روابط التنقل (Navigation Links)" : "Navigation Links"}
        searchPlaceholder="Search by Title or Link"
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={() => {
          setEditing({
            id: `nav-${Date.now()}`,
            title: { en: "", ar: "" },
            link: "/",
            showInNavbar: true,
            showInFooter: true,
            openInNewTab: false,
            order: workspace.navigationLinks.length + 1,
          });
          setIsNew(true);
        }}
        columns={cols}
        rows={rows}
        draggable
        onReorder={async (reordered) => {
          await onSaveWorkspacePatch({ navigationLinks: reordered.map((n, i) => ({ ...n, order: i + 1 })) });
        }}
        onEdit={(n) => {
          setEditing({ ...n } as unknown as Record<string, unknown>);
          setIsNew(false);
        }}
        onDelete={async (n) => {
          if (!window.confirm(`Delete navigation link "${n.title.en}"?`)) return;
          await onSaveWorkspacePatch({ navigationLinks: workspace.navigationLinks.filter((x) => x.id !== n.id) });
          onNotify("Navigation link deleted");
        }}
        darkMode={darkMode}
      />
    );
  }

  // ==================== 7. SOCIAL LINKS (Screenshot 18) ====================
  const draft = editing as CmsSocialLinkRecord | null;
  if (draft) {
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold">{draft.platform || "[New Social Link]"}</h1>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!draft.platform.trim() || !draft.url.trim()) return onNotify("Platform and URL are required");
              const rec: CmsSocialLinkRecord = { ...draft, updatedAt: new Date().toISOString() };
              const next = isNew
                ? [...workspace.socialLinks, rec]
                : workspace.socialLinks.map((s) => (s.id === rec.id ? rec : s));
              await onSaveWorkspacePatch({ socialLinks: next });
              setEditing(null);
              onNotify("Social link saved");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
          >
            <Check className="w-3.5 h-3.5" /> Save
          </button>
        </div>
        <div className={cardCls}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Platform *</label>
              <select
                value={draft.platform}
                onChange={(e) => setEditing({ ...draft, platform: e.target.value } as unknown as Record<string, unknown>)}
                className={inputCls}
              >
                {["Instagram", "X / Twitter", "WhatsApp", "LinkedIn", "TikTok", "Facebook", "YouTube", "Snapchat"].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Profile URL *</label>
              <input
                value={draft.url}
                onChange={(e) => setEditing({ ...draft, url: e.target.value } as unknown as Record<string, unknown>)}
                placeholder="https://instagram.com/qafnest"
                className={inputCls}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setEditing({ ...draft, enabled: e.target.checked } as unknown as Record<string, unknown>)}
              className="w-4 h-4 accent-[#2563EB]"
            />
            <span>Enabled</span>
          </label>
        </div>
      </div>
    );
  }

  const socialRows = workspace.socialLinks.filter((s) =>
    !search.trim()
      ? true
      : s.platform.toLowerCase().includes(search.toLowerCase()) ||
        s.url.toLowerCase().includes(search.toLowerCase())
  );
  const socialCols: TableColumn<CmsSocialLinkRecord>[] = [
    {
      key: "platform",
      label: "Platform",
      render: (s) => (
        <button
          type="button"
          onClick={() => {
            setEditing({ ...s } as unknown as Record<string, unknown>);
            setIsNew(false);
          }}
          className="font-semibold text-[#2563EB] hover:underline"
        >
          {s.platform}
        </button>
      ),
    },
    { key: "url", label: "URL", render: (s) => <span className="text-gray-500">{s.url}</span> },
    { key: "enabled", label: "Enabled", render: (s) => <BoolIcon value={s.enabled} /> },
    { key: "updatedAt", label: "Updated At", render: (s) => <span className="text-gray-500" suppressHydrationWarning>{s.updatedAt ? String(s.updatedAt).slice(0, 10) : "—"}</span> },
  ];

  return (
    <CollectionTableShell
      title={isAr ? "روابط التواصل (Social Links)" : "Social Links"}
      searchPlaceholder="Search by Platform or URL"
      searchValue={search}
      onSearchChange={setSearch}
      onCreateNew={() => {
        setEditing({
          id: `soc-${Date.now()}`,
          platform: "Instagram",
          url: "https://",
          enabled: true,
          updatedAt: new Date().toISOString(),
        });
        setIsNew(true);
      }}
      columns={socialCols}
      rows={socialRows}
      onEdit={(s) => {
        setEditing({ ...s } as unknown as Record<string, unknown>);
        setIsNew(false);
      }}
      onDelete={async (s) => {
        if (!window.confirm(`Delete social link "${s.platform}"?`)) return;
        await onSaveWorkspacePatch({ socialLinks: workspace.socialLinks.filter((x) => x.id !== s.id) });
        onNotify("Social link deleted");
      }}
      darkMode={darkMode}
    />
  );
}

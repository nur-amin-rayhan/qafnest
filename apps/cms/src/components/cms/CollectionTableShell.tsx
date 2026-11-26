"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Columns3,
  SlidersHorizontal,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";

export interface TableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  defaultVisible?: boolean;
  widthClass?: string;
}

interface FilterOption {
  label: string;
  value: string;
}

interface CollectionTableShellProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  createLabel?: string;
  onCreateNew: () => void;
  extraToolbarActions?: React.ReactNode;
  filterLabel?: string;
  filterOptions?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (val: string) => void;
  columns: TableColumn<T>[];
  rows: T[];
  draggable?: boolean;
  onReorder?: (reordered: T[]) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  darkMode?: boolean;
  loading?: boolean;
}

export function CollectionTableShell<T extends { id: string }>({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  createLabel = "Create New",
  onCreateNew,
  extraToolbarActions,
  filterLabel = "Filters",
  filterOptions,
  activeFilter = "all",
  onFilterChange,
  columns,
  rows,
  draggable = false,
  onReorder,
  onEdit,
  onDelete,
  emptyTitle = "No Results.",
  emptyDescription = "No entries match your current view. Create your first item to get started.",
  darkMode = false,
  loading = false,
}: CollectionTableShellProps<T>) {
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() =>
    columns.filter((c) => c.defaultVisible !== false).map((c) => c.key)
  );
  const columnsSignature = useMemo(() => columns.map((c) => c.key).join("|"), [columns]);
  useEffect(() => {
    setVisibleKeys(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key));
    setSelectedIds([]);
    setPage(1);
    setColsOpen(false);
    setFilterOpen(false);
  }, [columnsSignature, columns]);
  const [colsOpen, setColsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleKeys.includes(c.key)),
    [columns, visibleKeys]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const pageRows = rows.slice(startIdx, startIdx + perPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === pageRows.length && pageRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pageRows.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((k) => k !== key)
          : prev
        : [...prev, key]
    );
  };

  const handleDropRow = (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx || !onReorder) return;
    const realFrom = startIdx + dragIndex;
    const realTo = startIdx + targetIdx;
    const copy = [...rows];
    const [moved] = copy.splice(realFrom, 1);
    copy.splice(realTo, 0, moved);
    onReorder(copy);
    setDragIndex(null);
  };

  const cardSurface = darkMode
    ? "bg-[#151822] border-[#222634] text-slate-100"
    : "bg-white border-[#E5E7EB] text-[#111827]";

  const controlBtn = darkMode
    ? "bg-[#181B24] border-[#2A2F3E] text-slate-200 hover:bg-white/5"
    : "bg-white border-[#D1D5DB] text-[#374151] hover:bg-gray-50";

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-[#111827]"}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {extraToolbarActions}
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{createLabel}</span>
          </button>
        </div>
      </div>

      {/* Search + Columns + Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={searchValue}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs outline-none transition ${
              darkMode
                ? "bg-[#151822] border-[#2A2F3E] text-white placeholder:text-slate-500 focus:border-blue-500"
                : "bg-white border-[#D1D5DB] text-[#111827] placeholder:text-gray-400 focus:border-[#2563EB]"
            }`}
          />
        </div>

        {/* Columns Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setColsOpen((p) => !p);
              setFilterOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${controlBtn}`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Columns</span>
          </button>
          {colsOpen && (
            <div
              className={`absolute right-0 mt-1.5 w-48 rounded-lg border shadow-xl z-20 p-1.5 space-y-0.5 ${
                darkMode ? "bg-[#151822] border-[#2A2F3E]" : "bg-white border-gray-200"
              }`}
            >
              {columns.map((col) => {
                const checked = visibleKeys.includes(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition ${
                      darkMode ? "hover:bg-white/5 text-slate-200" : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span>{col.label}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters Dropdown */}
        {filterOptions && filterOptions.length > 0 && onFilterChange && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFilterOpen((p) => !p);
                setColsOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                activeFilter !== "all"
                  ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]"
                  : controlBtn
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{filterLabel}</span>
            </button>
            {filterOpen && (
              <div
                className={`absolute right-0 mt-1.5 w-48 rounded-lg border shadow-xl z-20 p-1.5 space-y-0.5 ${
                  darkMode ? "bg-[#151822] border-[#2A2F3E]" : "bg-white border-gray-200"
                }`}
              >
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onFilterChange(opt.value);
                      setFilterOpen(false);
                      setPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition ${
                      activeFilter === opt.value
                        ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                        : darkMode
                        ? "hover:bg-white/5 text-slate-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {activeFilter === opt.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className={`rounded-xl border p-12 text-center text-xs text-gray-500 ${cardSurface}`}>
          Loading records...
        </div>
      ) : rows.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center space-y-3 ${cardSurface}`}>
          <div className={`text-sm font-semibold ${darkMode ? "text-white" : "text-[#111827]"}`}>
            {emptyTitle}
          </div>
          <p className={`text-xs max-w-md mx-auto ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
            {emptyDescription}
          </p>
          <div>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{createLabel}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${cardSurface}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                    darkMode
                      ? "bg-[#181B24] border-[#222634] text-slate-400"
                      : "bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]"
                  }`}
                >
                  {draggable && <th className="w-8 px-2 py-3" />}
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={pageRows.length > 0 && selectedIds.length === pageRows.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 accent-[#2563EB]"
                    />
                  </th>
                  {visibleColumns.map((col) => (
                    <th key={col.key} className={`px-4 py-3 ${col.widthClass || ""}`}>
                      {col.label}
                    </th>
                  ))}
                  {(onEdit || onDelete) && <th className="px-4 py-3 text-right w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${darkMode ? "divide-[#222634]" : "divide-[#E5E7EB]"}`}>
                {pageRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    draggable={draggable}
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => {
                      if (draggable) e.preventDefault();
                    }}
                    onDrop={() => handleDropRow(idx)}
                    className={`transition ${
                      darkMode ? "hover:bg-white/[0.03]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {draggable && (
                      <td className="px-2 py-3 text-gray-400 cursor-grab">
                        <GripVertical className="w-3.5 h-3.5 mx-auto" />
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-gray-300 accent-[#2563EB]"
                      />
                    </td>
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-middle">
                        {col.render(row)}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              className={`p-1.5 rounded-md transition ${
                                darkMode
                                  ? "text-slate-400 hover:bg-white/10 hover:text-white"
                                  : "text-gray-500 hover:bg-gray-100 hover:text-[#2563EB]"
                              }`}
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(row)}
                              className={`p-1.5 rounded-md transition ${
                                darkMode
                                  ? "text-slate-400 hover:bg-red-500/15 hover:text-red-400"
                                  : "text-gray-500 hover:bg-red-50 hover:text-red-600"
                              }`}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            className={`px-4 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
              darkMode
                ? "bg-[#181B24] border-[#222634] text-slate-400"
                : "bg-[#F9FAFB] border-[#E5E7EB] text-gray-500"
            }`}
          >
            <div>
              {rows.length > 0
                ? `${startIdx + 1}-${Math.min(startIdx + perPage, rows.length)} of ${rows.length}`
                : "0 of 0"}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Per Page:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className={`rounded border px-1.5 py-0.5 text-xs outline-none ${
                    darkMode ? "bg-[#11131A] border-[#2A2F3E] text-white" : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded border border-transparent hover:border-gray-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-1.5 font-medium">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded border border-transparent hover:border-gray-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { NextResponse } from "next/server";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";

export interface PublicHomePopup {
  id: string;
  title: string;
  desktopImage: string;
  mobileImage: string;
  link: string;
  openInNewTab: boolean;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  updatedAt: string;
}

interface WorkspacePopupSlice {
  homePopups?: unknown[];
}

function getRiyadhTodayIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function sanitizePopupLink(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Reject invalid or unsafe protocols (e.g. javascript:)
  }
  return "";
}

function normalizeDateOnly(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return match ? match[1] : "";
}

function sanitizeImageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed;
  }
  return "";
}

function normalizePopup(entry: unknown): PublicHomePopup | null {
  if (!entry || typeof entry !== "object") return null;
  const item = entry as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id.trim() : "";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!id || !title) return null;

  const status = item.status === "active" ? "active" : "inactive";
  return {
    id,
    title,
    desktopImage: sanitizeImageUrl(item.desktopImage),
    mobileImage: sanitizeImageUrl(item.mobileImage),
    link: sanitizePopupLink(item.link),
    openInNewTab: Boolean(item.openInNewTab),
    startDate: normalizeDateOnly(item.startDate),
    endDate: normalizeDateOnly(item.endDate),
    status,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : "",
  };
}

export async function GET() {
  try {
    const workspace = await hydrateSharedJsonFile<WorkspacePopupSlice>(
      "cms-workspace-v2.json",
      () => ({ homePopups: [] })
    );

    const rawList = Array.isArray(workspace?.homePopups) ? workspace.homePopups : [];
    const today = getRiyadhTodayIso();

    const activePopups = rawList
      .map(normalizePopup)
      .filter((p): p is PublicHomePopup => {
        if (!p || p.status !== "active") return false;
        if (p.startDate && today < p.startDate) return false;
        if (p.endDate && today > p.endDate) return false;
        return true;
      })
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

    return NextResponse.json(
      { popups: activePopups },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load home popups";
    return NextResponse.json(
      { popups: [], error: msg },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

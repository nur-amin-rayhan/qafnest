"use client";

import { useEffect, useState } from "react";
import type { PublicCmsLegalPage, PublicCmsWorkspace } from "./serverCmsWorkspace";

let cachedWorkspace: PublicCmsWorkspace | null = null;
let cachedAt = 0;
let inFlightPromise: Promise<PublicCmsWorkspace | null> | null = null;
const CLIENT_TTL_MS = 15_000;

async function fetchPublicWorkspace(): Promise<PublicCmsWorkspace | null> {
  const now = Date.now();
  if (cachedWorkspace && now - cachedAt < CLIENT_TTL_MS) {
    return cachedWorkspace;
  }
  if (!inFlightPromise) {
    inFlightPromise = fetch("/api/cms/workspace", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { workspace?: PublicCmsWorkspace };
        if (data?.workspace) {
          cachedWorkspace = data.workspace;
          cachedAt = Date.now();
          return data.workspace;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        inFlightPromise = null;
      });
  }
  return inFlightPromise;
}

export function usePublicCmsWorkspace(): {
  workspace: PublicCmsWorkspace | null;
  loading: boolean;
} {
  // Always initialize with null so client-side initial hydration pass matches SSR HTML exactly
  const [workspace, setWorkspace] = useState<PublicCmsWorkspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    if (cachedWorkspace) {
      setWorkspace(cachedWorkspace);
      setLoading(false);
    }
    void fetchPublicWorkspace().then((ws) => {
      if (!active) return;
      if (ws) setWorkspace(ws);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { workspace, loading };
}

/** Re-export DOMPurify-backed shared HTML sanitizer so all CMS callers share one implementation. */
export { sanitizeRichHtml as sanitizeCmsHtml } from "@qafnest/shared/sanitizeRichHtml";

const LEGACY_STUBS = [
  "QafNest complies with Saudi Personal Data Protection Law (PDPL) to safeguard guest and host information.",
  "These terms govern bookings, host listings, payments, and dispute resolution on QafNest.",
];

export function findCmsLegalPage(
  workspace: PublicCmsWorkspace | null,
  slugAliases: string[]
): PublicCmsLegalPage | null {
  if (!workspace?.legalPages?.length) return null;
  const targets = new Set(slugAliases.map((s) => s.toLowerCase().trim()));
  const found = workspace.legalPages.find(
    (p) => p.showSection !== false && targets.has(String(p.slug || "").toLowerCase().trim())
  );
  if (!found) return null;
  const enHtml = String(found.content?.en || "").trim();
  const isStub = enHtml.length < 240 && LEGACY_STUBS.some((s) => enHtml.includes(s));
  return isStub ? null : found;
}

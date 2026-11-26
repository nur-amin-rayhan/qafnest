"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { cmsPath } from "@/lib/cmsUrl";
import { MediaPickerField } from "./MediaPickerField";
import { RichVisualEditor } from "./RichVisualEditor";
import { CmsSeoMonitorPanel } from "./CmsSeoMonitorPanel";
import type {
  CmsFeatureCard,
  CmsFeaturesGlobal,
  CmsHighlightCard,
  CmsLocale,
  CmsMediaRecord,
  CmsWorkspaceData,
} from "@/types/cms";

export type GlobalKind =
  | "home-hero"
  | "features"
  | "fleet-capabilities"
  | "coverage-network"
  | "industries"
  | "contact-us"
  | "site-seo"
  | "google-tag-manager"
  | "about-us";

interface CmsGlobalsModuleProps {
  kind: GlobalKind;
  workspace: CmsWorkspaceData;
  onSaveGlobals: (nextGlobals: CmsWorkspaceData["globals"]) => Promise<void>;
  onMediaUploaded: (media: CmsMediaRecord) => void;
  locale: CmsLocale;
  darkMode: boolean;
  onNotify: (msg: string) => void;
}

const ICON_OPTIONS = [
  "ShieldCheck",
  "Sparkles",
  "Clock",
  "KeyRound",
  "MapPin",
  "Building2",
  "CheckCircle2",
  "Star",
  "Zap",
  "Globe",
  "Lock",
  "Wallet",
];

export function CmsGlobalsModule({
  kind,
  workspace,
  onSaveGlobals,
  onMediaUploaded,
  locale,
  darkMode,
  onNotify,
}: CmsGlobalsModuleProps) {
  const isAr = locale === "ar";
  const [globals, setGlobals] = useState<CmsWorkspaceData["globals"]>(workspace.globals);
  const [saving, setSaving] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setGlobals(workspace.globals);
  }, [workspace.globals, kind]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveGlobals(globals);
      // Also mirror Contact Us to legacy /api/cms/contact endpoint for guest app compatibility
      if (kind === "contact-us") {
        await fetch(cmsPath("/api/cms/contact"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: globals.contactUs.phone,
            email: globals.contactUs.supportEmail,
            whatsapp: globals.contactUs.whatsapp,
            addressEn: globals.contactUs.address.en,
            addressAr: globals.contactUs.address.ar,
          }),
        }).catch(() => null);
      }
      onNotify(isAr ? "تم حفظ الإعدادات بنجاح" : "Configuration saved successfully");
    } catch {
      onNotify("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs outline-none transition ${
    darkMode
      ? "bg-[#11131A] border-[#2A2F3E] text-white focus:border-blue-500"
      : "bg-white border-[#D1D5DB] text-[#111827] focus:border-[#2563EB]"
  }`;

  const cardCls = `rounded-xl border p-5 space-y-4 ${
    darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-[#E5E7EB]"
  }`;

  const HeaderBar = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div
      className={`sticky top-14 z-20 -mx-2 px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
        darkMode ? "bg-[#11131A]/95 border-[#222634]" : "bg-white/95 border-[#E5E7EB] shadow-xs"
      } backdrop-blur`}
    >
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-xs text-gray-500">
          {subtitle} • <span className="text-[#2563EB] font-medium">{locale === "en" ? "English (en)" : "العربية (ar)"}</span>
        </p>
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        <span>{saving ? "Saving..." : "Save"}</span>
      </button>
    </div>
  );

  // ==================== 1. HOME HERO (Screenshot 12) ====================
  if (kind === "home-hero") {
    const hero = globals.homeHero;
    const patchHero = (patch: Partial<typeof hero>) =>
      setGlobals((g) => ({ ...g, homeHero: { ...g.homeHero, ...patch } }));

    return (
      <div className="space-y-5 max-w-4xl">
        <HeaderBar title="Home Hero" subtitle="Configure primary hero banner, headlines, and CTA buttons" />
        <div className={cardCls}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Badge ({locale.toUpperCase()})</label>
            <input
              value={hero.badge[locale]}
              dir={isAr ? "rtl" : "ltr"}
              onChange={(e) => patchHero({ badge: { ...hero.badge, [locale]: e.target.value } })}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title Line 1 ({locale.toUpperCase()}) *</label>
              <input
                value={hero.titleLine1[locale]}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) => patchHero({ titleLine1: { ...hero.titleLine1, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title Line 2 ({locale.toUpperCase()})</label>
              <input
                value={hero.titleLine2[locale]}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) => patchHero({ titleLine2: { ...hero.titleLine2, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description ({locale.toUpperCase()})</label>
            <textarea
              rows={3}
              dir={isAr ? "rtl" : "ltr"}
              value={hero.description[locale]}
              onChange={(e) => patchHero({ description: { ...hero.description, [locale]: e.target.value } })}
              className={inputCls}
            />
          </div>
          <MediaPickerField
            label="Hero Image"
            helperText={isAr ? "الأبعاد المثالية: 1920 × 1080 بكسل (16:9) بجودة عالية للواجهة الرئيسية (JPG, PNG, WebP)" : "Recommended: 1920 × 1080 px (16:9 aspect ratio) | High-definition landscape (JPG, PNG, WebP, max 3MB)"}
            value={hero.heroImage}
            onChange={(url) => patchHero({ heroImage: url })}
            mediaLibrary={workspace.media}
            onMediaUploaded={onMediaUploaded}
            darkMode={darkMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-sm font-semibold">Profile / Primary CTA Button</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Label ({locale.toUpperCase()})</label>
              <input
                value={hero.profileButton.label[locale]}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) =>
                  patchHero({
                    profileButton: {
                      ...hero.profileButton,
                      label: { ...hero.profileButton.label, [locale]: e.target.value },
                    },
                  })
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">URL</label>
              <input
                value={hero.profileButton.url}
                onChange={(e) => patchHero({ profileButton: { ...hero.profileButton, url: e.target.value } })}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={hero.profileButton.openInNewTab}
                onChange={(e) =>
                  patchHero({ profileButton: { ...hero.profileButton, openInNewTab: e.target.checked } })
                }
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Open in New Tab</span>
            </label>
          </div>

          <div className={cardCls}>
            <h3 className="text-sm font-semibold">Contact / Secondary CTA Button</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Label ({locale.toUpperCase()})</label>
              <input
                value={hero.contactButton.label[locale]}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) =>
                  patchHero({
                    contactButton: {
                      ...hero.contactButton,
                      label: { ...hero.contactButton.label, [locale]: e.target.value },
                    },
                  })
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">URL</label>
              <input
                value={hero.contactButton.url}
                onChange={(e) => patchHero({ contactButton: { ...hero.contactButton, url: e.target.value } })}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={hero.contactButton.openInNewTab}
                onChange={(e) =>
                  patchHero({ contactButton: { ...hero.contactButton, openInNewTab: e.target.checked } })
                }
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Open in New Tab</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 2. FEATURES / FLEET CAPABILITIES / INDUSTRIES (Screenshot 13) ====================
  if (kind === "features" || kind === "fleet-capabilities" || kind === "industries") {
    const mapKey: "features" | "fleetCapabilities" | "industries" =
      kind === "features"
        ? "features"
        : kind === "fleet-capabilities"
        ? "fleetCapabilities"
        : "industries";
    const section: CmsFeaturesGlobal = globals[mapKey];
    const titleLabel =
      kind === "features"
        ? "Features"
        : kind === "fleet-capabilities"
        ? "Fleet Capabilities"
        : "Industries";

    const updateSection = (patch: Partial<CmsFeaturesGlobal>) =>
      setGlobals((g) => ({ ...g, [mapKey]: { ...g[mapKey], ...patch } }));

    const updateCard = (id: string, patch: Partial<CmsFeatureCard>) =>
      updateSection({
        cards: section.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });

    const addCard = () => {
      const nextCard: CmsFeatureCard = {
        id: `card-${Date.now()}`,
        badge: { en: "Highlight", ar: "ميزة" },
        icon: "Sparkles",
        title: { en: "New Feature Card", ar: "بطاقة جديدة" },
        description: { en: "Describe this capability clearly.", ar: "اشرح هذه الميزة بوضوح." },
        metaText: { en: "24/7 Support", ar: "دعم على مدار الساعة" },
        metaIcon: "CheckCircle2",
      };
      updateSection({ cards: [...section.cards, nextCard] });
    };

    return (
      <div className="space-y-5 max-w-4xl">
        <HeaderBar title={titleLabel} subtitle="Manage section visibility, headings, and repeatable feature cards" />
        <div className={cardCls}>
          <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={section.showSection}
              onChange={(e) => updateSection({ showSection: e.target.checked })}
              className="w-4 h-4 accent-[#2563EB]"
            />
            <span>Show Section on Homepage</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title ({locale.toUpperCase()})</label>
              <input
                value={section.title[locale]}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) => updateSection({ title: { ...section.title, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">SLA / Section Badge ({locale.toUpperCase()})</label>
              <input
                value={section.slaBadge[locale]}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) => updateSection({ slaBadge: { ...section.slaBadge, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Subtitle ({locale.toUpperCase()})</label>
            <textarea
              rows={2}
              dir={isAr ? "rtl" : "ltr"}
              value={section.subtitle[locale]}
              onChange={(e) => updateSection({ subtitle: { ...section.subtitle, [locale]: e.target.value } })}
              className={inputCls}
            />
          </div>
        </div>

        {/* Repeatable Collapsible Cards */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Feature Cards ({section.cards.length})</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const map: Record<string, boolean> = {};
                  section.cards.forEach((c) => (map[c.id] = true));
                  setCollapsedCards(map);
                }}
                className="text-xs text-gray-500 hover:text-[#2563EB]"
              >
                Collapse All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setCollapsedCards({})}
                className="text-xs text-gray-500 hover:text-[#2563EB]"
              >
                Show All
              </button>
              <button
                type="button"
                onClick={addCard}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Card
              </button>
            </div>
          </div>

          {section.cards.map((card, idx) => {
            const isCollapsed = Boolean(collapsedCards[card.id]);
            return (
              <div
                key={card.id}
                className={`rounded-xl border overflow-hidden ${
                  darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-[#E5E7EB]"
                }`}
              >
                <div
                  className={`px-4 py-3 flex items-center justify-between border-b ${
                    darkMode ? "bg-[#181B24] border-[#222634]" : "bg-[#F9FAFB] border-[#E5E7EB]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCollapsedCards((p) => ({ ...p, [card.id]: !p[card.id] }))}
                    className="flex items-center gap-2 text-xs font-semibold text-left"
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    <span>
                      {String(idx + 1).padStart(2, "0")} — {card.title[locale] || "Untitled Card"}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateSection({
                          cards: [
                            ...section.cards,
                            { ...card, id: `card-${Date.now()}` },
                          ],
                        })
                      }
                      className="p-1.5 rounded hover:bg-gray-500/10 text-gray-500"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSection({ cards: section.cards.filter((c) => c.id !== card.id) })}
                      className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-4 space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Badge ({locale.toUpperCase()})</label>
                        <input
                          value={card.badge[locale]}
                          onChange={(e) =>
                            updateCard(card.id, { badge: { ...card.badge, [locale]: e.target.value } })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Icon</label>
                        <select
                          value={card.icon}
                          onChange={(e) => updateCard(card.id, { icon: e.target.value })}
                          className={inputCls}
                        >
                          {ICON_OPTIONS.map((ic) => (
                            <option key={ic} value={ic}>
                              {ic}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Meta Text ({locale.toUpperCase()})</label>
                        <input
                          value={card.metaText[locale]}
                          onChange={(e) =>
                            updateCard(card.id, { metaText: { ...card.metaText, [locale]: e.target.value } })
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Title ({locale.toUpperCase()})</label>
                      <input
                        value={card.title[locale]}
                        dir={isAr ? "rtl" : "ltr"}
                        onChange={(e) =>
                          updateCard(card.id, { title: { ...card.title, [locale]: e.target.value } })
                        }
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Description ({locale.toUpperCase()})</label>
                      <textarea
                        rows={2}
                        dir={isAr ? "rtl" : "ltr"}
                        value={card.description[locale]}
                        onChange={(e) =>
                          updateCard(card.id, { description: { ...card.description, [locale]: e.target.value } })
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==================== 3. COVERAGE NETWORK (Screenshot 14) ====================
  if (kind === "coverage-network") {
    const cov = globals.coverageNetwork;
    const patchCov = (patch: Partial<typeof cov>) =>
      setGlobals((g) => ({ ...g, coverageNetwork: { ...g.coverageNetwork, ...patch } }));

    const updateHighlight = (id: string, patch: Partial<CmsHighlightCard>) =>
      patchCov({
        highlightCards: cov.highlightCards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });

    return (
      <div className="space-y-5 max-w-4xl">
        <HeaderBar title="Coverage Network" subtitle="Configure Kingdom coverage metrics and highlight stat cards" />
        <div className={cardCls}>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={cov.showSection}
                onChange={(e) => patchCov({ showSection: e.target.checked })}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Show Section</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={cov.showSecondaryCards}
                onChange={(e) => patchCov({ showSecondaryCards: e.target.checked })}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Show Secondary Cards</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title ({locale.toUpperCase()})</label>
              <input
                value={cov.title[locale]}
                onChange={(e) => patchCov({ title: { ...cov.title, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Badge ({locale.toUpperCase()})</label>
              <input
                value={cov.badge[locale]}
                onChange={(e) => patchCov({ badge: { ...cov.badge, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description ({locale.toUpperCase()})</label>
            <textarea
              rows={2}
              value={cov.description[locale]}
              onChange={(e) => patchCov({ description: { ...cov.description, [locale]: e.target.value } })}
              className={inputCls}
            />
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Highlight Stat Cards ({cov.highlightCards.length})</h3>
            <button
              type="button"
              onClick={() =>
                patchCov({
                  highlightCards: [
                    ...cov.highlightCards,
                    {
                      id: `hl-${Date.now()}`,
                      value: "100%",
                      label: { en: "New Metric", ar: "مؤشر جديد" },
                      description: { en: "Metric description", ar: "وصف المؤشر" },
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Highlight
            </button>
          </div>

          <div className="space-y-3">
            {cov.highlightCards.map((hl) => (
              <div
                key={hl.id}
                className={`p-3.5 rounded-lg border grid grid-cols-1 md:grid-cols-12 gap-3 items-end ${
                  darkMode ? "border-[#2A2F3E] bg-[#11131A]" : "border-gray-200 bg-[#F9FAFB]"
                }`}
              >
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-medium">Value</label>
                  <input
                    value={hl.value}
                    onChange={(e) => updateHighlight(hl.id, { value: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[11px] font-medium">Label ({locale.toUpperCase()})</label>
                  <input
                    value={hl.label[locale]}
                    onChange={(e) => updateHighlight(hl.id, { label: { ...hl.label, [locale]: e.target.value } })}
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[11px] font-medium">Description ({locale.toUpperCase()})</label>
                  <input
                    value={hl.description[locale]}
                    onChange={(e) =>
                      updateHighlight(hl.id, { description: { ...hl.description, [locale]: e.target.value } })
                    }
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      patchCov({ highlightCards: cov.highlightCards.filter((x) => x.id !== hl.id) })
                    }
                    className="p-2 rounded text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== 4. CONTACT US (Screenshot 19) ====================
  if (kind === "contact-us") {
    const c = globals?.contactUs || {
      phone: "",
      address: { en: "", ar: "" },
      supportEmail: "",
      generalEmail: "",
      businessEmail: "",
      facebook: "",
      instagram: "",
      whatsapp: "",
    };
    const patchC = (patch: Partial<typeof c>) =>
      setGlobals((g) => ({ ...g, contactUs: { ...(g.contactUs || c), ...patch } }));

    return (
      <div className="space-y-5 max-w-4xl">
        <HeaderBar title="Contact Us" subtitle="Manage public phone, physical address, emails, and direct social channels" />
        <div className={cardCls}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Phone Number</label>
              <input value={c.phone || ""} onChange={(e) => patchC({ phone: e.target.value })} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Address ({locale.toUpperCase()})</label>
              <input
                value={c.address?.[locale] || ""}
                dir={isAr ? "rtl" : "ltr"}
                onChange={(e) => patchC({ address: { ...(c.address || { en: "", ar: "" }), [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Support Email</label>
              <input value={c.supportEmail || ""} onChange={(e) => patchC({ supportEmail: e.target.value })} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">General Email</label>
              <input value={c.generalEmail || ""} onChange={(e) => patchC({ generalEmail: e.target.value })} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Business Email</label>
              <input value={c.businessEmail || ""} onChange={(e) => patchC({ businessEmail: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-[#222634]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Facebook URL</label>
              <input value={c.facebook || ""} onChange={(e) => patchC({ facebook: e.target.value })} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Instagram URL</label>
              <input value={c.instagram || ""} onChange={(e) => patchC({ instagram: e.target.value })} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">WhatsApp Link / Number</label>
              <input value={c.whatsapp || ""} onChange={(e) => patchC({ whatsapp: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 5. SITE SEO (Screenshot 20) ====================
  if (kind === "site-seo") {
    const seo = globals.siteSeo;
    const patchSeo = (patch: Partial<typeof seo>) =>
      setGlobals((g) => ({ ...g, siteSeo: { ...g.siteSeo, ...patch } }));

    return (
      <div className="space-y-5 max-w-4xl">
        <HeaderBar title="Site SEO" subtitle="Global metadata, Open Graph, Twitter Card, Social Profiles, and Robots indexing" />

        {/* General */}
        <div className={cardCls}>
          <h3 className="text-sm font-semibold">General SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Site Name ({locale.toUpperCase()})</label>
              <input
                value={seo.siteName[locale]}
                onChange={(e) => patchSeo({ siteName: { ...seo.siteName, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Default Title ({locale.toUpperCase()})</label>
              <input
                value={seo.defaultTitle[locale]}
                onChange={(e) => patchSeo({ defaultTitle: { ...seo.defaultTitle, [locale]: e.target.value } })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Default Description ({locale.toUpperCase()})</label>
            <textarea
              rows={2}
              value={seo.defaultDescription[locale]}
              onChange={(e) =>
                patchSeo({ defaultDescription: { ...seo.defaultDescription, [locale]: e.target.value } })
              }
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Keywords ({locale.toUpperCase()})</label>
            <input
              value={seo.keywords[locale]}
              onChange={(e) => patchSeo({ keywords: { ...seo.keywords, [locale]: e.target.value } })}
              className={inputCls}
            />
          </div>
        </div>

        {/* Open Graph / Facebook */}
        <div className={cardCls}>
          <h3 className="text-sm font-semibold">Open Graph / Facebook</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">OG Title ({locale.toUpperCase()})</label>
              <input
                value={seo.openGraph.title[locale]}
                onChange={(e) =>
                  patchSeo({
                    openGraph: { ...seo.openGraph, title: { ...seo.openGraph.title, [locale]: e.target.value } },
                  })
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Canonical Site URL</label>
              <input
                value={seo.openGraph.url}
                onChange={(e) => patchSeo({ openGraph: { ...seo.openGraph, url: e.target.value } })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">OG Description ({locale.toUpperCase()})</label>
            <textarea
              rows={2}
              value={seo.openGraph.description[locale]}
              onChange={(e) =>
                patchSeo({
                  openGraph: {
                    ...seo.openGraph,
                    description: { ...seo.openGraph.description, [locale]: e.target.value },
                  },
                })
              }
              className={inputCls}
            />
          </div>
          <MediaPickerField
            label="Open Graph Default Image (Facebook, WhatsApp, LinkedIn, X)"
            helperText={isAr ? "الأبعاد المثالية: 1200 × 630 بكسل (نسبة 1.91:1) | صورة واضحة عالية الدقة لمشاركة الروابط على واتساب وفيسبوك وإكس ولينكدإن (JPG, PNG, WebP حتى 2MB)" : "Recommended: 1200 × 630 px (1.91:1 aspect ratio) | Perfect for WhatsApp, Facebook, X, and LinkedIn preview cards (JPG, PNG, WebP up to 2MB)"}
            value={seo.openGraph.image}
            onChange={(url) => patchSeo({ openGraph: { ...seo.openGraph, image: url } })}
            mediaLibrary={workspace.media}
            onMediaUploaded={onMediaUploaded}
            darkMode={darkMode}
          />
        </div>

        {/* Twitter / X */}
        <div className={cardCls}>
          <h3 className="text-sm font-semibold">Twitter / X</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Twitter Handle</label>
              <input
                value={seo.twitter.handle}
                onChange={(e) => patchSeo({ twitter: { ...seo.twitter, handle: e.target.value } })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Card Type</label>
              <select
                value={seo.twitter.card}
                onChange={(e) => patchSeo({ twitter: { ...seo.twitter, card: e.target.value } })}
                className={inputCls}
              >
                <option value="summary_large_image">summary_large_image</option>
                <option value="summary">summary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Social Profiles & Robots */}
        <div className={cardCls}>
          <h3 className="text-sm font-semibold">Social Profiles (Schema sameAs)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["facebook", "instagram", "linkedin", "twitter", "youtube", "tiktok", "pinterest"] as const).map(
              (net) => (
                <div key={net} className="space-y-1">
                  <label className="text-xs font-medium capitalize">{net}</label>
                  <input
                    value={seo.socialProfiles[net]}
                    onChange={(e) =>
                      patchSeo({
                        socialProfiles: { ...seo.socialProfiles, [net]: e.target.value },
                      })
                    }
                    placeholder={`https://${net}.com/qafnest`}
                    className={inputCls}
                  />
                </div>
              )
            )}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-[#222634] flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={seo.robots.noIndex}
                onChange={(e) => patchSeo({ robots: { ...seo.robots, noIndex: e.target.checked } })}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Robots: No Index</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={seo.robots.noFollow}
                onChange={(e) => patchSeo({ robots: { ...seo.robots, noFollow: e.target.checked } })}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Robots: No Follow</span>
            </label>
          </div>
        </div>

        {/* Dynamic robots.txt & sitemap.xml Monitor */}
        <CmsSeoMonitorPanel
          darkMode={darkMode}
          cardCls={cardCls}
          inputCls={inputCls}
          sitemapEnabled={seo.robots.sitemapEnabled !== false}
          customRules={seo.robots.customRules || ""}
          onChangeSitemapEnabled={(enabled) =>
            patchSeo({ robots: { ...seo.robots, sitemapEnabled: enabled } })
          }
          onChangeCustomRules={(rules) =>
            patchSeo({ robots: { ...seo.robots, customRules: rules } })
          }
          onSaveGlobals={handleSave}
        />
      </div>
    );
  }

  // ==================== 6. GOOGLE TAG MANAGER (Screenshot 21) ====================
  if (kind === "google-tag-manager") {
    const gtm = globals.gtm;
    const trimmedGtmId = gtm.gtmId.trim();
    const isValidGtm = /^GTM-[A-Z0-9]+$/i.test(trimmedGtmId);
    const isActiveLive = Boolean(gtm.enabled && isValidGtm);
    return (
      <div className="space-y-5 max-w-3xl">
        <HeaderBar title="Google Tag Manager" subtitle="Manage live GTM analytics container injection across all public QafNest pages" />
        <div className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={gtm.enabled}
                onChange={(e) =>
                  setGlobals((g) => ({ ...g, gtm: { ...g.gtm, enabled: e.target.checked } }))
                }
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Enable Google Tag Manager</span>
            </label>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isActiveLive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-gray-500/15 text-gray-500"
              }`}
            >
              {isActiveLive ? "Synced & Active on qafnest.com" : "Inactive"}
            </span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">GTM Container ID</label>
            <input
              value={gtm.gtmId}
              onChange={(e) =>
                setGlobals((g) => ({ ...g, gtm: { ...g.gtm, gtmId: e.target.value } }))
              }
              placeholder="GTM-XXXXXXX"
              className={`${inputCls} font-mono`}
            />
            {trimmedGtmId && !isValidGtm && (
              <p className="text-[11px] font-semibold text-rose-500">
                Invalid format. Container ID must start with GTM- followed by letters/numbers (e.g. GTM-ABC1234).
              </p>
            )}
            <p className="text-[11px] text-gray-500">
              Format: GTM-XXXXXXX. When enabled and saved, QafNest injects both the &lt;head&gt; script, &lt;noscript&gt; fallback, and automatic SPA page_view events into window.dataLayer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 7. ABOUT US (Screenshot 22) ====================
  const about = globals.aboutUs;
  const patchAbout = (patch: Partial<typeof about>) =>
    setGlobals((g) => ({ ...g, aboutUs: { ...g.aboutUs, ...patch } }));

  return (
    <div className="space-y-5 max-w-4xl">
      <HeaderBar title="About Us" subtitle="Edit QafNest brand narrative, visual content, and page-level SEO" />
      <div className={cardCls}>
        <label className="text-xs font-medium">About Us Content ({locale.toUpperCase()})</label>
        <RichVisualEditor
          value={about.content[locale]}
          onChange={(html) => patchAbout({ content: { ...about.content, [locale]: html } })}
          darkMode={darkMode}
          dir={isAr ? "rtl" : "ltr"}
          mediaLibrary={workspace.media}
        />
      </div>

      <div className={cardCls}>
        <h3 className="text-sm font-semibold">SEO Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Meta Title ({locale.toUpperCase()})</label>
            <input
              value={about.metaTitle[locale]}
              onChange={(e) => patchAbout({ metaTitle: { ...about.metaTitle, [locale]: e.target.value } })}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Canonical URL</label>
            <input
              value={about.canonicalUrl}
              onChange={(e) => patchAbout({ canonicalUrl: e.target.value })}
              placeholder="https://qafnest.com/about"
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Meta Description ({locale.toUpperCase()})</label>
          <textarea
            rows={2}
            value={about.metaDescription[locale]}
            onChange={(e) =>
              patchAbout({ metaDescription: { ...about.metaDescription, [locale]: e.target.value } })
            }
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Keywords ({locale.toUpperCase()})</label>
          <input
            value={about.keywords[locale]}
            onChange={(e) => patchAbout({ keywords: { ...about.keywords, [locale]: e.target.value } })}
            className={inputCls}
          />
        </div>

        <MediaPickerField
          label="Open Graph Image"
          helperText={isAr ? "الأبعاد المثالية: 1200 × 630 بكسل (1.91:1) لمشاركة صفحة من نحن على الشبكات الاجتماعية" : "Recommended: 1200 × 630 px (1.91:1 aspect ratio) for social sharing"}
          value={about.ogImage}
          onChange={(url) => patchAbout({ ogImage: url })}
          mediaLibrary={workspace.media}
          onMediaUploaded={onMediaUploaded}
          darkMode={darkMode}
        />

        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={about.noIndex}
            onChange={(e) => patchAbout({ noIndex: e.target.checked })}
            className="w-4 h-4 accent-[#2563EB]"
          />
          <span>No Index (Hide About page from search engines)</span>
        </label>
      </div>
    </div>
  );
}

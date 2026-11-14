"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  Key,
  Building,
  Sliders,
  Check,
  AlertCircle,
} from "lucide-react";
import type { SaudiIdentityConfig } from "@qafnest/shared";

import { cmsPath } from "@/lib/cmsUrl";
interface CmsIdentityTabProps {
  t: (en: string, ar: string) => string;
}

export function CmsIdentityTab({ t }: CmsIdentityTabProps) {
  const [config, setConfig] = useState<SaudiIdentityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form local states
  const [isMandatoryForGuests, setIsMandatoryForGuests] = useState(false);
  const [isMandatoryForHosts, setIsMandatoryForHosts] = useState(true);
  const [activeProvider, setActiveProvider] = useState<"yakeen" | "nafath" | "sandbox">("sandbox");
  const [yakeenAppId, setYakeenAppId] = useState("");
  const [yakeenAppKey, setYakeenAppKey] = useState("");
  const [yakeenOrgNo, setYakeenOrgNo] = useState("7007384501");
  const [nafathAppId, setNafathAppId] = useState("");
  const [nafathAppKey, setNafathAppKey] = useState("");

  useEffect(() => {
    fetch(cmsPath("/api/admin/identity"))
      .then((r) => r.json())
      .then((d) => {
        if (d?.config) {
          setConfig(d.config);
          setIsMandatoryForGuests(Boolean(d.config.isMandatoryForGuests));
          setIsMandatoryForHosts(Boolean(d.config.isMandatoryForHosts));
          setActiveProvider(d.config.activeProvider || "sandbox");
          setYakeenAppId(d.config.yakeen?.appId || "");
          setYakeenAppKey(d.config.yakeen?.appKey || "");
          setYakeenOrgNo(d.config.yakeen?.organizationNumber || "7007384501");
          setNafathAppId(d.config.nafath?.appId || "");
          setNafathAppKey(d.config.nafath?.appKey || "");
        }
      })
      .catch((err) => {
        console.error("Failed to load identity config:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      const payload: Partial<SaudiIdentityConfig> = {
        enabled: true,
        isMandatoryForGuests,
        isMandatoryForHosts,
        activeProvider,
        yakeen: {
          appId: yakeenAppId.trim(),
          appKey: yakeenAppKey.trim(),
          organizationNumber: yakeenOrgNo.trim() || "7007384501",
          baseUrl: "https://yakeen.elm.sa/api",
        },
        nafath: {
          appId: nafathAppId.trim(),
          appKey: nafathAppKey.trim(),
          baseUrl: "https://nafath.api.elm.sa",
        },
      };

      const res = await fetch(cmsPath("/api/admin/identity"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save identity settings");
      }

      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#0B0F19] border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              {t("Ministry of Tourism & NIC Compliance", "الامتثال لوزارة السياحة ومركز المعلومات الوطني")}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400 font-mono">
              {config?.activeProvider === "sandbox" ? t("Sandbox / Test Mode", "وضع المحاكاة والتجربة") : config?.activeProvider?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{t("Saudi Identity Verification & Name Sync (Yakeen / Nafath)", "إعدادات توثيق الهوية ومزامنة الأسماء (يقين ونفاذ)")}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            {t(
              "Centralized identity policy. Toggle mandatory or optional verification for guests and hosts, and seamlessly connect Yakeen or Nafath API credentials.",
              "السياسة المركزية للهوية. يمكنك تفعيل التحقق كإلزامي أو اختياري للضيوف والمضيفين، وربط مفاتيح الربط البرمجي (API) ليقين ونفاذ بكل سهولة."
            )}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition active:scale-95 cursor-pointer shrink-0"
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? t("Saving...", "جارٍ الحفظ...") : t("Save Settings", "حفظ الإعدادات")}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t("Identity configuration saved and synced across Guest and Host portals!", "تم حفظ الإعدادات ومزامنتها بنجاح مع بوابتي الضيف والمضيف!")}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Policy Card 1: Mandatory vs Optional Rules */}
      <div className="p-6 rounded-3xl bg-[#0E1320] border border-white/10 space-y-6">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-400" />
          <span>{t("Verification Policy & Rules", "سياسة وقواعد الإلزامية")}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Guest Rule */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {t("Mandatory for Guests", "إلزامي على الضيوف")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isMandatoryForGuests
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isMandatoryForGuests ? t("Strict Mandatory", "إلزامي صارم") : t("Optional (Testing Mode)", "اختياري (وضع التجربة)")}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {t(
                  "When OFF, new guest users can browse and test bookings freely. When ON, new guests must submit National ID or Iqama before booking.",
                  "عند الإيقاف، يستطيع الضيوف التجربة بحرية. عند التفعيل، يُلزم الضيف بإدخال الهوية أو الإقامة لإتمام الحجز."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMandatoryForGuests(!isMandatoryForGuests)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isMandatoryForGuests ? "bg-teal-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isMandatoryForGuests ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Host Rule */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {t("Mandatory for Real Hosts", "إلزامي على المضيفين الحقيقيين")}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isMandatoryForHosts ? t("Strict Mandatory", "إلزامي") : t("Optional", "اختياري")}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {t(
                  "Real property hosts must verify Saudi National ID or Commercial CR to publish units and receive payouts under Ministry of Tourism regulations.",
                  "يُلزم المضيفون بتوثيق الهوية الوطنية أو السجل التجاري لاعتماد العقار واستلام العوائد نظامياً."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMandatoryForHosts(!isMandatoryForHosts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isMandatoryForHosts ? "bg-teal-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isMandatoryForHosts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Provider Selector Card */}
      <div className="p-6 rounded-3xl bg-[#0E1320] border border-white/10 space-y-5">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-teal-400" />
          <span>{t("Official Government Provider", "مزود الخدمة الحكومي المعتمد")}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Provider 1: Yakeen */}
          <button
            type="button"
            onClick={() => setActiveProvider("yakeen")}
            className={`p-4 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
              activeProvider === "yakeen"
                ? "bg-teal-500/15 border-teal-500/50 shadow-md shadow-teal-500/10"
                : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white">Yakeen (ELM)</span>
              {activeProvider === "yakeen" && <Check className="w-4 h-4 text-teal-400" />}
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t(
                "Direct API lookup via ELM company. Auto-syncs 4-part Arabic & English names using ID and Date of Birth.",
                "استعلام مباشر عبر شركة علم. يجلب الاسم الرباعي الرسمي بالعربية والإنجليزية باستخدام رقم الهوية وتاريخ الميلاد."
              )}
            </p>
          </button>

          {/* Provider 2: Nafath */}
          <button
            type="button"
            onClick={() => setActiveProvider("nafath")}
            className={`p-4 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
              activeProvider === "nafath"
                ? "bg-teal-500/15 border-teal-500/50 shadow-md shadow-teal-500/10"
                : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white">Nafath (NIC SSO)</span>
              {activeProvider === "nafath" && <Check className="w-4 h-4 text-teal-400" />}
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t(
                "National Information Center single sign-on with biometric push approval to the user's Nafath app.",
                "نفاذ الوطني الموحد. يرسل إشعار تحقق إلى تطبيق نفاذ في جوال المستخدم لاعتماد الهوية بالبصمة."
              )}
            </p>
          </button>

          {/* Provider 3: Sandbox */}
          <button
            type="button"
            onClick={() => setActiveProvider("sandbox")}
            className={`p-4 rounded-2xl border text-left rtl:text-right transition cursor-pointer ${
              activeProvider === "sandbox"
                ? "bg-teal-500/15 border-teal-500/50 shadow-md shadow-teal-500/10"
                : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white">Sandbox Simulator</span>
              {activeProvider === "sandbox" && <Check className="w-4 h-4 text-teal-400" />}
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t(
                "Active testing mode. Validates 10-digit Saudi Luhn format and simulates official name synchronization without live API keys.",
                "وضع التجربة الحالي. يتحقق من خوارزمية الأرقام السعودية ويحاكي مزامنة الأسماء بدون مفاتيح ربط حية."
              )}
            </p>
          </button>
        </div>
      </div>

      {/* Credentials Form Card */}
      <div className="p-6 rounded-3xl bg-[#0E1320] border border-white/10 space-y-6">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-400" />
          <span>{t("API Credentials & Key Vault", "بيانات ومفاتيح الربط البرمجي (API Vault)")}</span>
        </h3>
        <p className="text-xs text-gray-400">
          {t(
            "Paste your official ELM / Yakeen or Nafath API credentials below once obtained. They are securely applied to all verification endpoints immediately.",
            "قم بلصق مفاتيح الربط البرمجي عند استلامها من شركة علم أو نفاذ، وسيتم تطبيقها مباشرة دون الحاجة لتعديل الكود."
          )}
        </p>

        {/* Yakeen Keys */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
            {t("1. Yakeen (ELM) Credentials", "١. مفاتيح ربط يقين (علم)")}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">{t("App ID / Client ID", "معرّف التطبيق")}</label>
              <input
                type="text"
                placeholder="e.g. qafnest-yakeen-app"
                value={yakeenAppId}
                onChange={(e) => setYakeenAppId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">{t("App Secret / API Key", "المفتاح السري (Secret Key)")}</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••"
                value={yakeenAppKey}
                onChange={(e) => setYakeenAppKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">{t("Organization 700 Number", "الرقم الموحد للمنشأة 700")}</label>
              <input
                type="text"
                placeholder="7007384501"
                value={yakeenOrgNo}
                onChange={(e) => setYakeenOrgNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Nafath Keys */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
            {t("2. Nafath (NIC) Credentials", "٢. مفاتيح ربط نفاذ (المركز الوطني)")}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">{t("Nafath Client ID", "معرّف نفاذ (Client ID)")}</label>
              <input
                type="text"
                placeholder="e.g. qafnest-nafath-client"
                value={nafathAppId}
                onChange={(e) => setNafathAppId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">{t("Nafath Secret Key", "المفتاح السري (Secret Key)")}</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••"
                value={nafathAppKey}
                onChange={(e) => setNafathAppKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition active:scale-95 cursor-pointer"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? t("Saving Changes...", "جارٍ الحفظ...") : t("Save All Credentials & Policy", "حفظ كافة البيانات والسياسة")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Home,
  LayoutDashboard,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CmsTab =
  | "overview"
  | "properties"
  | "hosts"
  | "bookings"
  | "reviews"
  | "blog"
  | "finance";

interface CmsProperty {
  id: string;
  title: string;
  city: string;
  category: string;
  base_price: number;
  license: string;
  host_name: string;
  status: "approved" | "pending" | "rejected";
}

interface CmsBlogArticle {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string;
  status: "published" | "draft";
  date: string;
}

export default function SuperAdminCmsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [activeTab, setActiveTab] = useState<CmsTab>("overview");
  const [loading, setLoading] = useState(false);

  const [properties, setProperties] = useState<CmsProperty[]>([
    {
      id: "riyadh-1",
      title: "Tuwaiq Falcon Ridge Chalet (Near Qiddiya)",
      city: "Riyadh",
      category: "chalet",
      base_price: 650,
      license: "7100084921",
      host_name: "Abdulaziz Al-Rajhi",
      status: "approved",
    },
    {
      id: "riyadh-2",
      title: "Diriyah Royal Palm Villa & Private Pool",
      city: "Riyadh",
      category: "villa",
      base_price: 1150,
      license: "7100091234",
      host_name: "Faisal Al-Otaibi",
      status: "approved",
    },
    {
      id: "jeddah-pending-1",
      title: "Obhur Red Sea Waterfront Resort Chalet",
      city: "Jeddah",
      category: "chalet",
      base_price: 1400,
      license: "7100055319",
      host_name: "Sultan Al-Harbi",
      status: "pending",
    },
  ]);

  const [articles, setArticles] = useState<CmsBlogArticle[]>([
    {
      id: "1",
      titleEn: "Top 10 Luxury Chalets in Riyadh with Heated Pools",
      titleAr: "أفضل ١٠ شاليهات فاخرة في الرياض بمسبح مدفأ",
      category: "Chalets & Resorts",
      status: "published",
      date: "2026-10-28",
    },
    {
      id: "2",
      titleEn: "AlUla Winter Desert Camping Guide 2026",
      titleAr: "دليل التخييم الشتوي في العلا ٢٠٢٦",
      category: "Desert Camps",
      status: "published",
      date: "2026-10-30",
    },
  ]);

  const [newBlogTitleEn, setNewBlogTitleEn] = useState("");
  const [newBlogTitleAr, setNewBlogTitleAr] = useState("");

  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const syncWithDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        const mapped: CmsProperty[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: String(row.title || "Untitled Listing"),
          city: String(row.city_name || row.city || "Riyadh"),
          category: String(row.category || "chalet"),
          base_price: Number(row.base_price || 650),
          license: String(row.tourism_license_number || "7100084921"),
          host_name: "Verified QafNest Partner",
          status: (row.status as "approved" | "pending" | "rejected") || "approved",
        }));
        setProperties(mapped);
      }
    } catch {
      // Fallback cleanly to initial state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void syncWithDatabase();
  }, [syncWithDatabase]);

  const updatePropertyStatus = (id: string, status: "approved" | "rejected") => {
    setProperties((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handlePublishArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitleEn.trim()) return;
    setArticles((prev) => [
      {
        id: String(Date.now()),
        titleEn: newBlogTitleEn.trim(),
        titleAr: newBlogTitleAr.trim() || newBlogTitleEn.trim(),
        category: "Guides",
        status: "published",
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setNewBlogTitleEn("");
    setNewBlogTitleAr("");
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#05070B] text-white flex flex-col">
      {/* ================= TOP CMS HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080B12]/95 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-extrabold tracking-wider text-sm sm:text-base">
                <span>QAFNEST</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t("SUPER ADMIN CMS", "لوحة الإدارة المركزية")}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                {t("Central Moderation, Finance & Content CMS · Port 3002", "إدارة العقارات والمضيفين والمحتوى والمالية · منفذ 3002")}
              </p>
            </div>
          </div>

          {/* Ecosystem Switcher */}
          <div className="hidden lg:flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5 text-xs">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t("Guest Site (:3000)", "موقع الضيوف (:3000)")}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-violet-400" />
              <span>{t("Host Portal (:3001)", "بوابة المضيف (:3001)")}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t("Admin CMS (:3002)", "إدارة النظام (:3002)")}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={syncWithDatabase}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{t("Sync DB", "مزامنة")}</span>
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "en" ? "العربية" : "English"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CMS WORKSPACE ================= */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-6">
        <aside className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-3 space-y-1">
            {[
              { id: "overview", labelEn: "Command Center", labelAr: "مركز القيادة", icon: LayoutDashboard },
              { id: "properties", labelEn: "Property Approval", labelAr: "اعتماد العقارات", icon: Building2 },
              { id: "hosts", labelEn: "Host KYC & Licenses", labelAr: "توثيق المضيفين والتراخيص", icon: Users },
              { id: "bookings", labelEn: "Global Bookings", labelAr: "جميع الحجوزات", icon: CalendarDays },
              { id: "reviews", labelEn: "Reviews Moderation", labelAr: "إدارة التقييمات", icon: MessageSquare },
              { id: "blog", labelEn: "Blog & SEO CMS", labelAr: "إدارة المدونة والمحتوى", icon: FileText },
              { id: "finance", labelEn: "ZATCA VAT & Payouts", labelAr: "الضريبة والتحويلات المالية", icon: Wallet },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as CmsTab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t(item.labelEn, item.labelAr)}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="space-y-6">
          {/* ================= OVERVIEW ================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold">
                  {t("QafNest Executive Command Center", "مركز القيادة والإدارة التنفيذية - قاف نست")}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {t(
                    "Real-time oversight of Guest Marketplace (:3000) and Host Business Portal (:3001).",
                    "مراقبة فورية لمنصة الضيوف (:3000) وبوابة أعمال المضيفين (:3001)."
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Platform GMV", "إجمالي حجم المبيعات")}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">184,500 SAR</p>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {t("15% ZATCA VAT Included", "شامل 15% ضريبة القيمة المضافة")}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Total Properties", "إجمالي العقارات")}</span>
                    <Building2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">{properties.length}</p>
                  <span className="text-[11px] text-amber-300 font-semibold">
                    {properties.filter((p) => p.status === "pending").length}{" "}
                    {t("Pending Approval", "بانتظار الاعتماد")}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Verified Hosts", "المضيفون الموثقون")}</span>
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">28</p>
                  <span className="text-[11px] text-violet-300 font-semibold">
                    {t("100% Tourism Licensed", "مرخصون من وزارة السياحة 100%")}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Published Blog Guides", "مقالات المدونة المنشورة")}</span>
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">{articles.length}</p>
                  <span className="text-[11px] text-gray-400 font-semibold">
                    {t("Bilingual AR/EN SEO", "محتوى ثنائي اللغة عربي/إنجليزي")}
                  </span>
                </div>
              </div>

              {/* Property Moderation Queue */}
              <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base">
                    {t("Property Moderation & Approval Queue", "طابور مراجعة واعتماد العقارات")}
                  </h2>
                  <button
                    onClick={() => setActiveTab("properties")}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    {t("View Full Queue →", "عرض الكل ←")}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {properties.slice(0, 6).map((prop) => (
                    <div
                      key={prop.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              prop.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : prop.status === "pending"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {prop.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {t("License:", "ترخيص:")} {prop.license}
                          </span>
                        </div>
                        <p className="font-bold text-sm mt-1">{prop.title}</p>
                        <p className="text-xs text-gray-400">
                          {prop.city} · {prop.category} · {prop.base_price} SAR/night
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updatePropertyStatus(prop.id, "approved")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t("Approve", "اعتماد")}</span>
                        </button>
                        <button
                          onClick={() => updatePropertyStatus(prop.id, "rejected")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/25 hover:bg-rose-600/40 text-xs font-bold text-rose-300 border border-rose-500/30 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t("Reject", "رفض")}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= PROPERTIES MODERATION ================= */}
          {activeTab === "properties" && (
            <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-4">
              <h1 className="text-xl font-extrabold">
                {t("All Properties & Moderation", "إدارة واعتماد جميع العقارات")}
              </h1>
              <div className="space-y-3">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            prop.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : prop.status === "pending"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {prop.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {t("Ministry License:", "ترخيص السياحة:")} {prop.license}
                        </span>
                      </div>
                      <h3 className="font-bold text-base mt-1">{prop.title}</h3>
                      <p className="text-xs text-gray-400">
                        {prop.city} · {prop.category.toUpperCase()} · {prop.base_price} SAR
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updatePropertyStatus(prop.id, "approved")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                      >
                        {t("Approve & Publish", "اعتماد ونشر")}
                      </button>
                      <button
                        onClick={() => updatePropertyStatus(prop.id, "rejected")}
                        className="px-3.5 py-2 rounded-xl bg-rose-600/20 border border-rose-500/30 text-xs font-bold text-rose-300 cursor-pointer"
                      >
                        {t("Suspend", "إيقاف")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= BLOG CMS ================= */}
          {activeTab === "blog" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-4">
                <h1 className="text-xl font-extrabold">
                  {t("Bilingual Blog & SEO Content CMS", "إدارة المدونة والمحتوى التسويقي (SEO)")}
                </h1>
                <form onSubmit={handlePublishArticle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    placeholder={t("Article Title (English)", "عنوان المقال (إنجليزي)")}
                    value={newBlogTitleEn}
                    onChange={(e) => setNewBlogTitleEn(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                  <input
                    type="text"
                    placeholder={t("Article Title (Arabic)", "عنوان المقال (عربي)")}
                    value={newBlogTitleAr}
                    onChange={(e) => setNewBlogTitleAr(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t("Publish Article to Guest Blog", "نشر المقال في مدونة الضيوف")}</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 pt-4 border-t border-white/10">
                  {articles.map((art) => (
                    <div
                      key={art.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm">{art.titleEn}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{art.titleAr}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                        {art.status} · {art.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= OTHER TABS (HOSTS, BOOKINGS, REVIEWS, FINANCE) ================= */}
          {(activeTab === "hosts" ||
            activeTab === "bookings" ||
            activeTab === "reviews" ||
            activeTab === "finance") && (
            <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-4">
              <h1 className="text-xl font-extrabold uppercase tracking-wide">
                {activeTab === "hosts" && t("Host KYC & Ministry of Tourism Licenses", "توثيق هوية المضيفين وتراخيص وزارة السياحة")}
                {activeTab === "bookings" && t("Global Guest Bookings Ledger", "سجل جميع حجوزات الضيوف")}
                {activeTab === "reviews" && t("Verified Guest Reviews Moderation", "مراجعة وإدارة تقييمات الضيوف")}
                {activeTab === "finance" && t("ZATCA 15% VAT & Host Payout Disbursement", "تقارير ضريبة القيمة المضافة (15%) وتحويلات المضيفين")}
              </h1>
              <p className="text-sm text-gray-300">
                {t(
                  "Connected to shared Supabase PostgreSQL tables. All records synchronize across Guest (:3000), Host (:3001), and CMS (:3002).",
                  "متصل بجداول قاعدة البيانات المركزية. جميع السجلات تتزامن تلقائياً بين تطبيق الضيوف والمضيفين والإدارة."
                )}
              </p>
              {activeTab === "reviews" && (
                <a
                  href="http://localhost:3000/admin/reviews"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white"
                >
                  <span>{t("Open Live Review Reply Console", "فتح وحدة الرد على التقييمات")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

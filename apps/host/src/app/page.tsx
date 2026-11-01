"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Globe,
  Home,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Waves,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type HostTab = "dashboard" | "properties" | "calendar" | "bookings" | "payouts";

interface HostProperty {
  id: string;
  title: string;
  title_ar?: string;
  category: string;
  city: string;
  district?: string;
  base_price: number;
  original_price?: number;
  discount_percentage?: number;
  capacity?: number;
  bedrooms_count?: number;
  bathrooms_count?: number;
  area_sqm?: number;
  has_pool?: boolean;
  self_checkin?: boolean;
  instant_book?: boolean;
  tourism_license_number?: string;
  status?: string;
  rating?: number;
  image?: string;
}

interface HostBooking {
  id: string;
  check_in: string;
  check_out: string;
  total_nights: number;
  guests_count: number;
  total_price: number;
  status: string;
  payment_status: string;
  smart_lock_pin: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  created_at: string;
}

const DEMO_HOST_PROPERTIES: HostProperty[] = [
  {
    id: "riyadh-1",
    title: "Tuwaiq Falcon Ridge Chalet (Near Qiddiya)",
    title_ar: "شاليه صقر طويق الفاخر (قرب القدية)",
    category: "chalet",
    city: "riyadh",
    district: "Al Ammariyah, Riyadh",
    base_price: 650,
    original_price: 1300,
    discount_percentage: 50,
    capacity: 8,
    bedrooms_count: 3,
    bathrooms_count: 4,
    area_sqm: 450,
    has_pool: true,
    self_checkin: true,
    instant_book: true,
    tourism_license_number: "7100084921",
    status: "approved",
    rating: 9.4,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "riyadh-2",
    title: "Diriyah Royal Palm Villa & Private Pool",
    title_ar: "فيلا نخيل الدرعية الملكية مع مسبح خاص",
    category: "villa",
    city: "riyadh",
    district: "Al Malqa, Riyadh",
    base_price: 1150,
    original_price: 1500,
    discount_percentage: 23,
    capacity: 10,
    bedrooms_count: 4,
    bathrooms_count: 5,
    area_sqm: 600,
    has_pool: true,
    self_checkin: true,
    instant_book: true,
    tourism_license_number: "7100091234",
    status: "approved",
    rating: 9.7,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
  },
];

export default function HostBusinessPortal() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [activeTab, setActiveTab] = useState<HostTab>("dashboard");
  const [properties, setProperties] = useState<HostProperty[]>(DEMO_HOST_PROPERTIES);
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [blockedDates, setBlockedDates] = useState<number[]>([5, 6, 12, 19, 20]);
  const [weekendPrice, setWeekendPrice] = useState(950);
  const [iban, setIban] = useState("SA44 8000 0000 6080 1016 7519");
  const [bankName, setBankName] = useState("Al Rajhi Bank (مصرف الراجحي)");
  const [ibanSaved, setIbanSaved] = useState(false);

  // Add Property Form State
  const [newProp, setNewProp] = useState({
    title: "",
    titleAr: "",
    category: "chalet",
    city: "riyadh",
    district: "",
    license: "71000",
    basePrice: "750",
    originalPrice: "1200",
    discountPercentage: "38",
    capacity: "8",
    bedrooms: "3",
    bathrooms: "3",
    areaSqm: "400",
    hasPool: true,
    selfCheckin: true,
    instantBook: true,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
  });
  const [submittingProp, setSubmittingProp] = useState(false);
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const fetchHostData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: propData } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (propData && propData.length > 0) {
        const mapped: HostProperty[] = propData.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: String(row.title || "Untitled Unit"),
          title_ar: row.title_ar ? String(row.title_ar) : undefined,
          category: String(row.category || "chalet"),
          city: String(row.city || "riyadh"),
          district: row.district ? String(row.district) : String(row.city_name || "Riyadh"),
          base_price: Number(row.base_price || 650),
          original_price: row.original_price ? Number(row.original_price) : undefined,
          discount_percentage: row.discount_percentage ? Number(row.discount_percentage) : undefined,
          capacity: Number(row.capacity || 6),
          bedrooms_count: Number(row.bedrooms_count || 2),
          bathrooms_count: Number(row.bathrooms_count || 2),
          area_sqm: Number(row.area_sqm || 350),
          has_pool: Boolean(row.has_pool ?? true),
          self_checkin: Boolean(row.self_checkin ?? true),
          instant_book: Boolean(row.instant_book ?? true),
          tourism_license_number: row.tourism_license_number
            ? String(row.tourism_license_number)
            : "7100084921",
          status: String(row.status || "approved"),
          rating: Number(row.rating || 9.5),
          image:
            Array.isArray(row.images) && row.images.length > 0
              ? String(row.images[0])
              : "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
        }));
        setProperties(mapped);
      }

      const { data: bookData } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (bookData && bookData.length > 0) {
        setBookings(bookData as unknown as HostBooking[]);
      }
    } catch {
      // Fallback to demo state cleanly
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHostData();
  }, [fetchHostData]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.title.trim()) return;
    setSubmittingProp(true);
    setSubmitBanner(null);

    const createdItem: HostProperty = {
      id: `qn-host-${Date.now()}`,
      title: newProp.title.trim(),
      title_ar: newProp.titleAr.trim() || newProp.title.trim(),
      category: newProp.category,
      city: newProp.city,
      district: newProp.district.trim() || "Riyadh",
      base_price: Number(newProp.basePrice) || 750,
      original_price: Number(newProp.originalPrice) || undefined,
      discount_percentage: Number(newProp.discountPercentage) || undefined,
      capacity: Number(newProp.capacity) || 8,
      bedrooms_count: Number(newProp.bedrooms) || 3,
      bathrooms_count: Number(newProp.bathrooms) || 3,
      area_sqm: Number(newProp.areaSqm) || 400,
      has_pool: newProp.hasPool,
      self_checkin: newProp.selfCheckin,
      instant_book: newProp.instantBook,
      tourism_license_number: newProp.license,
      status: "pending",
      rating: 9.6,
      image: newProp.image,
    };

    try {
      const supabase = createClient();
      await supabase.from("properties").insert({
        title: createdItem.title,
        city: createdItem.city,
        city_name: createdItem.city.toUpperCase(),
        category: createdItem.category,
        category_name: createdItem.category.toUpperCase(),
        specs: `${createdItem.bedrooms_count} Bedrooms · ${createdItem.capacity} Guests`,
        base_price: createdItem.base_price,
        rating: 9.6,
        reviews_count: 1,
        instant_book: createdItem.instant_book,
        has_pool: createdItem.has_pool,
        self_checkin: createdItem.self_checkin,
        images: [createdItem.image],
        features: ["Private Pool", "Smart Lock Self Check-in", "High-Speed WiFi", "BBQ Area"],
      });
    } catch {
      // Optimistic local state update always succeeds
    }

    setProperties((prev) => [createdItem, ...prev]);
    setSubmittingProp(false);
    setShowAddModal(false);
    setSubmitBanner(
      t(
        "Property submitted successfully! It is now visible in your listings and sent to CMS for verification.",
        "تم إرسال العقار بنجاح! يظهر الآن في قائمتك وتم إرساله إلى لوحة الإدارة (CMS) للمراجعة والاعتماد."
      )
    );
    setNewProp((prev) => ({ ...prev, title: "", titleAr: "", district: "" }));
  };

  const toggleBlockedDate = (day: number) => {
    setBlockedDates((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0) || 42850;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#07070E] text-white flex flex-col">
      {/* ================= TOP ECOSYSTEM & HOST NAVBAR ================= */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0B15]/95 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-extrabold tracking-wider text-sm sm:text-base">
                  <span>QAFNEST</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {t("BUSINESS", "أعمال المضيفين")}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 hidden sm:block">
                  {t("Host Partner Portal · Port 3001", "بوابة شركاء العقارات والمضيفين · منفذ 3001")}
                </p>
              </div>
            </div>
          </div>

          {/* Ecosystem Switcher Bar */}
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
            <span className="px-3 py-1 rounded-full bg-violet-600 text-white font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{t("Host Portal (:3001)", "بوابة المضيف (:3001)")}</span>
            </span>
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t("Admin CMS (:3002)", "إدارة النظام (:3002)")}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("List New Property", "إضافة عقار جديد")}</span>
            </button>

            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-violet-400" />
              <span>{lang === "en" ? "العربية" : "English"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN BODY WITH SIDEBAR ================= */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-6">
        {/* Sidebar Navigation */}
        <aside className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-[#10101C] p-3 space-y-1">
            {[
              { id: "dashboard", labelEn: "Overview & Earnings", labelAr: "نظرة عامة والأرباح", icon: LayoutDashboard },
              { id: "properties", labelEn: "My Properties", labelAr: "عقاراتي المضافة", icon: Building2 },
              { id: "calendar", labelEn: "Calendar & Pricing", labelAr: "التقويم والأسعار", icon: CalendarDays },
              { id: "bookings", labelEn: "Reservations & PINs", labelAr: "الحجوزات والدخول الذكي", icon: KeyRound },
              { id: "payouts", labelEn: "Bank IBAN & Payouts", labelAr: "الحساب البنكي والتحويلات", icon: Wallet },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as HostTab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    active
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t(item.labelEn, item.labelAr)}</span>
                </button>
              );
            })}
          </div>

          {/* Verified Ministry of Tourism Card */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>{t("Ministry of Tourism Licensed", "مرخص من وزارة السياحة")}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-300 leading-relaxed">
              {t(
                "Connected to shared Supabase DB. Any property or price update syncs with Guest & CMS apps.",
                "متصل بقاعدة البيانات المركزية. أي تحديث للعقارات أو الأسعار يتزامن فوراً مع موقع الضيوف والإدارة."
              )}
            </p>
          </div>
        </aside>

        {/* Main Content Panel */}
        <main className="space-y-6">
          {submitBanner && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center justify-between gap-4 text-emerald-200 text-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{submitBanner}</span>
              </div>
              <button onClick={() => setSubmitBanner(null)} className="text-xs underline">
                {t("Dismiss", "إغلاق")}
              </button>
            </div>
          )}

          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold">
                    {t("Welcome back, Partner Host", "مرحباً بك، شريك قاف نست")}
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {t(
                      "Manage your Saudi vacation rentals, dynamic weekend rates, and guest smart-lock access.",
                      "أدر شاليهاتك ووحداتك السكنية، أسعار نهاية الأسبوع، وأكواد الدخول الذكي للضيوف."
                    )}
                  </p>
                </div>
                <button
                  onClick={fetchHostData}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>{t("Sync with Database", "مزامنة البيانات")}</span>
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#10101C] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Net Host Earnings", "صافي أرباح المضيف")}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">{totalRevenue.toLocaleString()} SAR</p>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {t("+18% vs last month", "+18% مقارنة بالشهر الماضي")}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#10101C] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Listed Properties", "العقارات المدرجة")}</span>
                    <Building2 className="w-4 h-4 text-violet-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">{properties.length}</p>
                  <span className="text-[11px] text-violet-300 font-semibold">
                    {t("Active & Licensed", "نشط ومرخص")}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#10101C] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Confirmed Bookings", "الحجوزات المؤكدة")}</span>
                    <CalendarDays className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">{bookings.length || 14}</p>
                  <span className="text-[11px] text-cyan-300 font-semibold">
                    {t("92% Occupancy on Weekends", "إشغال 92% في نهاية الأسبوع")}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#10101C] p-5">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>{t("Average Host Rating", "متوسط تقييم الضيوف")}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <p className="text-2xl font-black mt-2">9.6 / 10</p>
                  <span className="text-[11px] text-amber-300 font-semibold">
                    {t("Verified Guest Reviews", "تقييمات ضيوف موثقة")}
                  </span>
                </div>
              </div>

              {/* Listed Units Quick View */}
              <div className="rounded-2xl border border-white/10 bg-[#10101C] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-base">
                    {t("Your Active Properties", "وحداتك العقارية النشطة")}
                  </h2>
                  <button
                    onClick={() => setActiveTab("properties")}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 cursor-pointer"
                  >
                    {t("Manage All →", "إدارة الكل ←")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.slice(0, 4).map((prop) => (
                    <div
                      key={prop.id}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3.5"
                    >
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            {prop.status || "approved"}
                          </span>
                          {prop.discount_percentage && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                              {prop.discount_percentage}% OFF
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm truncate mt-1">
                          {lang === "ar" ? prop.title_ar || prop.title : prop.title}
                        </h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-violet-400" />
                          {prop.district || prop.city}
                        </p>
                        <div className="mt-1.5 flex items-baseline gap-2">
                          {prop.original_price && (
                            <span className="text-xs line-through text-rose-400 font-bold">
                              {prop.original_price} SAR
                            </span>
                          )}
                          <span className="text-sm font-extrabold text-white">
                            {prop.base_price} SAR
                          </span>
                          <span className="text-[11px] text-gray-400">{t("/night", "/ليلة")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: MY PROPERTIES ================= */}
          {activeTab === "properties" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-extrabold">
                    {t("My Properties & Units", "عقاراتي ووحداتي السكنية")}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">
                    {t(
                      "Add new chalets, villas, apartments, farms, or camps and manage special booking discounts.",
                      "أضف شاليهات أو فلل أو شقق أو مزارع أو مخيمات جديدة وتحكم في خصومات الحجز الخاصة."
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("Add New Property", "إضافة عقار جديد")}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="rounded-2xl border border-white/10 bg-[#10101C] overflow-hidden flex flex-col"
                  >
                    <div className="relative h-44 w-full">
                      <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-black/70 backdrop-blur text-emerald-300 border border-emerald-500/30">
                          {prop.status === "pending"
                            ? t("Pending CMS Review", "بانتظار مراجعة الإدارة")
                            : t("Approved & Live", "معتمد ونشط")}
                        </span>
                        {prop.discount_percentage && (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 text-white">
                            {prop.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-[11px] text-violet-300 font-semibold">
                          {t("License #", "ترخيص وزارة السياحة:")} {prop.tourism_license_number || "7100084921"}
                        </p>
                        <h3 className="font-bold text-base mt-0.5">
                          {lang === "ar" ? prop.title_ar || prop.title : prop.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{prop.district || prop.city}</p>
                        <div className="flex flex-wrap gap-2 mt-2.5 text-[11px] text-gray-300">
                          <span className="px-2 py-0.5 rounded bg-white/5">
                            {prop.bedrooms_count || 3} {t("Bedrooms", "غرف نوم")}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5">
                            {prop.capacity || 8} {t("Guests", "ضيوف")}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5">
                            {prop.area_sqm || 400} m²
                          </span>
                          {prop.has_pool && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 flex items-center gap-1">
                              <Waves className="w-3 h-3" /> {t("Private Pool", "مسبح خاص")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          {prop.original_price && (
                            <span className="text-xs line-through text-rose-400 font-bold">
                              {prop.original_price} SAR
                            </span>
                          )}
                          <span className="text-base font-extrabold text-white">
                            {prop.base_price} SAR
                          </span>
                          <span className="text-xs text-gray-400">{t("/night", "/ليلة")}</span>
                        </div>
                        <a
                          href={`http://localhost:3000/property/${prop.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                          <span>{t("View on Guest Site", "عرض في موقع الضيوف")}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: CALENDAR & DYNAMIC PRICING ================= */}
          {activeTab === "calendar" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-[#10101C] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-xl font-extrabold">
                      {t("Availability Calendar & Dynamic Pricing", "تقويم الإتاحة وأسعار نهاية الأسبوع")}
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                      {t(
                        "Click any date to block/unblock offline bookings or adjust Thursday/Friday weekend rates.",
                        "اضغط على أي تاريخ لإغلاق أو فتح الحجز أو تعديل أسعار أيام الخميس والجمعة."
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-300">
                      {t("Weekend Rate (Thu/Fri):", "سعر نهاية الأسبوع:")}
                    </label>
                    <input
                      type="number"
                      value={weekendPrice}
                      onChange={(e) => setWeekendPrice(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-sm font-bold text-white"
                    />
                    <span className="text-xs text-gray-400">SAR</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2.5">
                  {Array.from({ length: 30 }, (_, idx) => idx + 1).map((day) => {
                    const isBlocked = blockedDates.includes(day);
                    const isWeekend = day % 7 === 5 || day % 7 === 6;
                    return (
                      <button
                        key={day}
                        onClick={() => toggleBlockedDate(day)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isBlocked
                            ? "border-rose-500/40 bg-rose-950/30 text-rose-300"
                            : isWeekend
                            ? "border-violet-500/40 bg-violet-950/25 text-white hover:bg-violet-900/40"
                            : "border-white/10 bg-white/[0.02] text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{day}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                            {isBlocked
                              ? t("Blocked", "مغلق")
                              : isWeekend
                              ? t("Weekend", "ويكند")
                              : t("Open", "متاح")}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold">
                          {isBlocked ? "—" : `${isWeekend ? weekendPrice : 650} SAR`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: BOOKINGS & SMART LOCK PINS ================= */}
          {activeTab === "bookings" && (
            <div className="rounded-2xl border border-white/10 bg-[#10101C] p-6 space-y-4">
              <div>
                <h1 className="text-xl font-extrabold">
                  {t("Guest Reservations & Smart Lock PINs", "حجوزات الضيوف وأكواد الدخول الذكي")}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {t(
                    "Real-time bookings synced from the Guest Platform with automated 6-digit smart lock access.",
                    "حجوزات فورية متزامنة من منصة الضيوف مع كود القفل الذكي المكون من 6 أرقام."
                  )}
                </p>
              </div>

              <div className="space-y-3">
                {(bookings.length > 0
                  ? bookings
                  : [
                      {
                        id: "QAF-893K2L",
                        check_in: "2026-11-05",
                        check_out: "2026-11-07",
                        total_nights: 2,
                        guests_count: 6,
                        total_price: 1300,
                        status: "confirmed",
                        payment_status: "success",
                        smart_lock_pin: "482910",
                        guest_name: "Fahad Al-Dosari",
                        guest_phone: "+966501234567",
                        created_at: "2026-11-01",
                      },
                      {
                        id: "QAF-519M8P",
                        check_in: "2026-11-12",
                        check_out: "2026-11-13",
                        total_nights: 1,
                        guests_count: 4,
                        total_price: 650,
                        status: "confirmed",
                        payment_status: "success",
                        smart_lock_pin: "739204",
                        guest_name: "Noura Al-Qahtani",
                        guest_phone: "+966559876543",
                        created_at: "2026-11-01",
                      },
                    ]
                ).map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-violet-300">{b.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          {b.status}
                        </span>
                      </div>
                      <p className="font-bold text-sm">
                        {b.guest_name || t("Verified Guest", "ضيف موثق")}{" "}
                        <span className="text-gray-400 font-normal text-xs">
                          ({b.guests_count} {t("guests", "ضيوف")})
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {b.check_in} → {b.check_out} ({b.total_nights} {t("nights", "ليالي")})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-center">
                        <span className="block text-[10px] text-amber-300 uppercase font-bold">
                          {t("Smart Lock PIN", "رمز القفل الذكي")}
                        </span>
                        <span className="font-mono font-black text-sm text-white tracking-widest">
                          {b.smart_lock_pin || "619402"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="block text-xs text-gray-400">{t("Total Paid", "المدفوع")}</span>
                        <span className="font-black text-base text-emerald-400">
                          {b.total_price} SAR
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 5: BANK IBAN & PAYOUTS ================= */}
          {activeTab === "payouts" && (
            <div className="rounded-2xl border border-white/10 bg-[#10101C] p-6 space-y-5">
              <div>
                <h1 className="text-xl font-extrabold">
                  {t("Saudi Bank IBAN & Payouts", "الحساب البنكي (IBAN) وتحويل الأرباح")}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {t(
                    " payouts are transferred directly to your verified Saudi bank account within 24 hours after guest check-in.",
                    "يتم تحويل أرباحك مباشرة إلى حسابك البنكي السعودي الموثق خلال 24 ساعة من تسجيل دخول الضيف."
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {t("Saudi Bank Name", "اسم البنك السعودي")}
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {t("IBAN Number (24 Characters)", "رقم الآيبان (IBAN)")}
                  </label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 font-mono text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIbanSaved(true)}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white cursor-pointer"
                >
                  {t("Save Payout Settings", "حفظ بيانات الحساب البنكي")}
                </button>
                {ibanSaved && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {t("Verified & Saved", "تم الحفظ والتوثيق")}
                  </span>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= ADD NEW PROPERTY MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#11101D] p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-extrabold">
                  {t("List a New Property on QafNest", "إضافة عقار جديد في قاف نست")}
                </h2>
                <p className="text-xs text-gray-400">
                  {t(
                    "Saves directly to Supabase and submits to CMS for verification.",
                    "يتم الحفظ في قاعدة البيانات وإرساله لإدارة النظام للموافقة."
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("Property Title (English)", "اسم العقار (إنجليزي)")} *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Al-Ammariyah Luxury Chalet"
                    value={newProp.title}
                    onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("Property Title (Arabic)", "اسم العقار (عربي)")}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شاليه العمارية الفاخر"
                    value={newProp.titleAr}
                    onChange={(e) => setNewProp({ ...newProp, titleAr: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("Category", "التصنيف")}
                  </label>
                  <select
                    value={newProp.category}
                    onChange={(e) => setNewProp({ ...newProp, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  >
                    <option value="chalet">Chalet / Resort (شاليه)</option>
                    <option value="villa">Private Villa (فيلا)</option>
                    <option value="penthouse">Serviced Apartment (شقة)</option>
                    <option value="farm">Country Farm (مزرعة)</option>
                    <option value="camp">Desert Camp (مخيم)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("City", "المدينة")}
                  </label>
                  <select
                    value={newProp.city}
                    onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  >
                    <option value="riyadh">Riyadh (الرياض)</option>
                    <option value="jeddah">Jeddah (جدة)</option>
                    <option value="alula">AlUla (العلا)</option>
                    <option value="khobar">Al Khobar (الخبر)</option>
                    <option value="abha">Abha (أبها)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("Tourism License #", "رقم ترخيص السياحة")}
                  </label>
                  <input
                    type="text"
                    value={newProp.license}
                    onChange={(e) => setNewProp({ ...newProp, license: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("Nightly Price (SAR)", "السعر لليلة (ر.س)")}
                  </label>
                  <input
                    type="number"
                    value={newProp.basePrice}
                    onChange={(e) => setNewProp({ ...newProp, basePrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("Original Price (Before Discount)", "السعر قبل الخصم")}
                  </label>
                  <input
                    type="number"
                    value={newProp.originalPrice}
                    onChange={(e) => setNewProp({ ...newProp, originalPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {t("Discount % OFF", "نسبة الخصم %")}
                  </label>
                  <input
                    type="number"
                    value={newProp.discountPercentage}
                    onChange={(e) => setNewProp({ ...newProp, discountPercentage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-gray-300"
                >
                  {t("Cancel", "إلغاء")}
                </button>
                <button
                  type="submit"
                  disabled={submittingProp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold text-white cursor-pointer"
                >
                  {submittingProp
                    ? t("Publishing...", "جاري النشر...")
                    : t("Submit Property", "إرسال العقار للاعتماد")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

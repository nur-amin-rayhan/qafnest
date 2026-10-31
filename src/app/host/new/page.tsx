"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Plus, UploadCloud, X } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import HostModal from "@/components/modals/HostModal";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { en: "Basics", ar: "البيانات الأساسية" },
  { en: "Description", ar: "الوصف" },
  { en: "Rooms", ar: "الغرف والسعة" },
  { en: "Amenities", ar: "المرافق والخدمات" },
  { en: "Photos", ar: "صور العقار" },
  { en: "Pricing & calendar", ar: "الأسعار والتقويم" },
  { en: "License & review", ar: "الترخيص والمراجعة" },
];

const CITIES = [
  { id: "riyadh", en: "Riyadh", ar: "الرياض" },
  { id: "jeddah", en: "Jeddah", ar: "جدة" },
  { id: "alula", en: "AlUla", ar: "العلا" },
  { id: "khobar", en: "Al Khobar", ar: "الخبر" },
  { id: "abha", en: "Abha", ar: "أبها" },
  { id: "taif", en: "Taif", ar: "الطائف" },
  { id: "mecca", en: "Makkah", ar: "مكة المكرمة" },
  { id: "dammam", en: "Dammam", ar: "الدمام" },
  { id: "alhafuf", en: "Alhafuf", ar: "الهفوف" },
  { id: "tabuk", en: "Tabuk", ar: "تبوك" },
  { id: "buraidah", en: "Buraidah", ar: "بريدة" },
];

const CATEGORIES = [
  { id: "chalet", en: "Chalet & Resort", ar: "شاليه ومنتجع" },
  { id: "villa", en: "Private Villa", ar: "فيلا خاصة" },
  { id: "farm", en: "Country Farm", ar: "مزرعة ريفية" },
  { id: "camp", en: "Desert Camp", ar: "مخيم صحراوي" },
  { id: "penthouse", en: "Serviced Penthouse", ar: "بنتهاوس وشقق مخدومة" },
];

const AMENITIES = [
  { en: "Private pool", ar: "مسبح خاص" },
  { en: "Wi-Fi", ar: "واي فاي سريع" },
  { en: "Air conditioning", ar: "تكييف مركزي" },
  { en: "Kitchen", ar: "مطبخ متكامل" },
  { en: "Parking", ar: "موقف سيارات خاص" },
  { en: "BBQ", ar: "جلسة شواء خارجية" },
  { en: "Outdoor seating", ar: "جلسة خارجية" },
  { en: "Smart TV", ar: "شاشة ذكية" },
  { en: "Family friendly", ar: "مناسب للعائلات" },
  { en: "Mountain view", ar: "إطلالة جبلية" },
  { en: "Sea view", ar: "إطلالة بحرية" },
  { en: "Self check-in", ar: "دخول ذاتي ذكي" },
];

const inputClass = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-white";
const labelClass = "block text-sm font-semibold text-gray-800 dark:text-gray-200";

function daysBetween(start: string, end: string) {
  const dates: string[] = [];
  const date = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  while (date <= last && dates.length < 366) {
    dates.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return dates;
}

export default function NewHostListingPage() {
  const router = useRouter();
  const { user, refreshProfile, openAuthModal } = useAuth();
  const { language } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: "", category: "chalet", city: "riyadh", district: "", description: "",
    capacity: 4, bedrooms: 1, livingRooms: 1, areaSqm: 50,
    amenities: [] as string[], hasPool: false, instantBook: false, selfCheckin: false,
    weekdayPrice: 500, weekendPrice: 650, checkinTime: "15:00", checkoutTime: "12:00",
    blockedFrom: "", blockedUntil: "", tourismLicense: "",
  });
  const supabase = useMemo(() => createClient(), []);

  const label = (en: string, ar: string) => language === "ar" ? ar : en;

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const goNext = () => {
    setError(null);
    if (step === 0 && (!form.title.trim() || !form.city || !form.district.trim())) {
      setError(label("Add a title, city and district to continue.", "أدخل عنوان العقار والمدينة والحي للمتابعة."));
      return;
    }
    if (step === 1 && form.description.trim().length < 30) {
      setError(label("Write at least 30 characters describing your stay.", "اكتب وصفاً لا يقل عن 30 حرفاً للعقار."));
      return;
    }
    if (step === 4 && files.length === 0) {
      setError(label("Upload at least one property photo.", "قم برفع صورة واحدة على الأقل للعقار."));
      return;
    }
    if (step === 5 && form.weekdayPrice < 1) {
      setError(label("Enter a valid nightly price.", "أدخل سعراً صحيحاً لليلة."));
      return;
    }
    if (step < STEPS.length - 1) setStep((current) => current + 1);
  };

  const submitListing = async () => {
    setError(null);
    if (!user) {
      setError(label("Sign in with your mobile number before submitting the listing.", "سجل الدخول برقم جوالك قبل إرسال العقار."));
      openAuthModal("signup", "host");
      return;
    }
    if (!form.tourismLicense.trim()) {
      setError(label("Enter your Ministry of Tourism license number for verification.", "أدخل رقم ترخيص وزارة السياحة للتحقق من العقار."));
      return;
    }
    if (Boolean(form.blockedFrom) !== Boolean(form.blockedUntil) || (form.blockedFrom && form.blockedUntil < form.blockedFrom)) {
      setError(label("Choose a valid start and end date for blocked dates, or leave both empty.", "اختر تاريخ بداية ونهاية صحيح للفترات المغلقة."));
      return;
    }

    setSaving(true);
    let propertyId: string | null = null;
    const uploadedPaths: string[] = [];
    try {
      const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName || null,
        phone: user.phone || null,
        role: "host",
        host_status: "pending",
      }, { onConflict: "id" });
      if (profileError) throw profileError;

      const categoryName = form.category[0].toUpperCase() + form.category.slice(1);
      const { data: property, error: insertError } = await supabase.from("properties").insert({
        host_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        category_name: categoryName,
        city: form.city,
        city_name: form.city[0].toUpperCase() + form.city.slice(1),
        district: form.district.trim(),
        specs: `${form.bedrooms} Bedrooms · Up to ${form.capacity} Guests`,
        base_price: form.weekdayPrice,
        weekday_price: form.weekdayPrice,
        weekend_price: form.weekendPrice,
        checkin_time: form.checkinTime,
        checkout_time: form.checkoutTime,
        capacity: form.capacity,
        bedrooms_count: form.bedrooms,
        living_rooms_count: form.livingRooms,
        area_sqm: form.areaSqm,
        features: form.amenities,
        has_pool: form.hasPool,
        instant_book: form.instantBook,
        self_checkin: form.selfCheckin,
        is_licensed: false,
        is_approved: false,
        images: [],
      }).select("id").single();
      if (insertError) throw insertError;
      propertyId = property.id;

      const imageUrls: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${user.id}/${property.id}/${Date.now()}-${index}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("qafnest-properties").upload(path, file, {
          cacheControl: "3600", upsert: false, contentType: file.type,
        });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        imageUrls.push(supabase.storage.from("qafnest-properties").getPublicUrl(path).data.publicUrl);
      }

      const { error: updateError } = await supabase.from("properties").update({ images: imageUrls }).eq("id", property.id);
      if (updateError) throw updateError;

      if (form.blockedFrom && form.blockedUntil) {
        const availability = daysBetween(form.blockedFrom, form.blockedUntil).map((date) => ({
          property_id: property.id, date, is_available: false,
        }));
        const { error: availabilityError } = await supabase.from("property_availability").insert(availability);
        if (availabilityError) throw availabilityError;
      }

      const { error: licenseError } = await supabase.from("host_license_submissions").insert({
        host_id: user.id,
        property_id: property.id,
        license_number: form.tourismLicense.trim(),
      });
      if (licenseError) throw licenseError;

      await supabase.auth.updateUser({ data: { role: "host" } });
      await refreshProfile(user.id);
      setSubmitted(true);
    } catch (submitError) {
      if (uploadedPaths.length) await supabase.storage.from("qafnest-properties").remove(uploadedPaths);
      if (propertyId) await supabase.from("properties").delete().eq("id", propertyId);
      setError(submitError instanceof Error ? submitError.message : label("We couldn't submit the listing. Please try again.", "تعذر حفظ اللستنج. يرجى المحاولة لاحقاً."));
    } finally {
      setSaving(false);
    }
  };

  const addFiles = (selection: FileList | null) => {
    if (!selection) return;
    const selected = Array.from(selection);
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setError(label("Use JPG, PNG, WebP or AVIF photos under 10 MB each.", "استخدم صور بصيغة JPG أو PNG أو WebP بحجم أقل من 10 ميجابايت."));
      return;
    }
    if (files.length + selected.length > 12) {
      setError(label("Upload up to 12 photos.", "يمكنك رفع حتى 12 صورة كحد أقصى."));
      return;
    }
    setError(null);
    setFiles((current) => [...current, ...selected]);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-32 text-gray-900 dark:bg-[#08070D] dark:text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              {label("QafNest Host Portal", "بوابة مضيفي قف نست")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              {label("List your property", "سجل عقارك")}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {label(
                "Complete seven short steps. Your listing stays private until our team verifies it.",
                "أكمل سبع خطوات قصيرة. سيبقى عقارك خاصاً حتى يتحقق فريقنا من الترخيص."
              )}
            </p>
          </div>

          {submitted ? (
            <section className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-400/20 dark:bg-[#12101a] sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Check />
              </span>
              <h2 className="mt-4 text-2xl font-bold">
                {label("Listing sent for verification", "تم إرسال العقار للتحقق بنجاح")}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                {label(
                  "Your property and license details were saved. It will appear in public search after the host team approves the submission.",
                  "تم حفظ تفاصيل العقار والترخيص. سيظهر العقار في نتائج البحث العامة بعد مراجعة الفريق والاعتماد."
                )}
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 transition"
              >
                {label("Back to QafNest", "العودة للرئيسية")}
              </button>
            </section>
          ) : (
            <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_18px_55px_rgba(70,35,130,0.08)] dark:border-white/10 dark:bg-[#12101a] sm:p-8">
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-4 text-xs font-bold">
                  <span>
                    {label(`Step ${step + 1} of ${STEPS.length}`, `الخطوة ${step + 1} من ${STEPS.length}`)}
                  </span>
                  <span className="text-violet-600 dark:text-violet-300">
                    {STEPS[step][language === "ar" ? "ar" : "en"]}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-700 transition-all"
                    style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="mt-3 hidden grid-cols-7 gap-2 sm:grid">
                  {STEPS.map((item, index) => (
                    <span
                      key={item.en}
                      className={`truncate text-[10px] ${
                        index === step ? "font-bold text-violet-700 dark:text-violet-300" : "text-gray-400"
                      }`}
                    >
                      {item[language === "ar" ? "ar" : "en"]}
                    </span>
                  ))}
                </div>
              </div>

              {step === 0 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={`${labelClass} sm:col-span-2`}>
                    {label("Property title", "عنوان العقار")}
                    <input
                      className={inputClass}
                      value={form.title}
                      onChange={(event) => setField("title", event.target.value)}
                      placeholder={label("A quiet chalet with a private pool", "شاليه هادئ بمسبح خاص وحديقة")}
                      maxLength={100}
                    />
                  </label>
                  <label className={labelClass}>
                    {label("Property type", "نوع العقار")}
                    <select
                      className={inputClass}
                      value={form.category}
                      onChange={(event) => setField("category", event.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-gray-900 text-white">
                          {cat[language === "ar" ? "ar" : "en"]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    {label("City", "المدينة")}
                    <select
                      className={inputClass}
                      value={form.city}
                      onChange={(event) => setField("city", event.target.value)}
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                          {c[language === "ar" ? "ar" : "en"]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={`${labelClass} sm:col-span-2`}>
                    {label("District / neighborhood", "الحي أو المنطقة")}
                    <input
                      className={inputClass}
                      value={form.district}
                      onChange={(event) => setField("district", event.target.value)}
                      placeholder={label("e.g. Al Ammariyah or Obhur", "مثال: العمارية أو أبحر الشمالية")}
                    />
                  </label>
                </div>
              )}

              {step === 1 && (
                <label className={labelClass}>
                  {label("Describe the stay", "وصف العقار وتجربة الإقامة")}
                  <textarea
                    className={`${inputClass} min-h-44 resize-y`}
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    placeholder={label(
                      "Describe the rooms, setting, guest experience and anything useful before booking.",
                      "صف الغرف، الجلسات الخارجية، مستوى الخصوصية وكل ما يهم الضيف قبل الحجز."
                    )}
                    maxLength={3000}
                  />
                  <span className="mt-1 block text-xs font-normal text-gray-500">{form.description.length}/3000</span>
                </label>
              )}

              {step === 2 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>
                    {label("Maximum guests", "أقصى عدد للضيوف")}
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={50}
                      value={form.capacity}
                      onChange={(event) => setField("capacity", Number(event.target.value))}
                    />
                  </label>
                  <label className={labelClass}>
                    {label("Bedrooms", "عدد غرف النوم")}
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      max={30}
                      value={form.bedrooms}
                      onChange={(event) => setField("bedrooms", Number(event.target.value))}
                    />
                  </label>
                  <label className={labelClass}>
                    {label("Living rooms / Majlis", "عدد الصالات والمجالس")}
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      max={20}
                      value={form.livingRooms}
                      onChange={(event) => setField("livingRooms", Number(event.target.value))}
                    />
                  </label>
                  <label className={labelClass}>
                    {label("Area (m²)", "المساحة الإجمالية (م²)")}
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={10000}
                      value={form.areaSqm}
                      onChange={(event) => setField("areaSqm", Number(event.target.value))}
                    />
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {AMENITIES.map((amenity) => (
                    <label
                      key={amenity.en}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(amenity.en)}
                        onChange={(event) =>
                          setField(
                            "amenities",
                            event.target.checked
                              ? [...form.amenities, amenity.en]
                              : form.amenities.filter((item) => item !== amenity.en)
                          )
                        }
                        className="h-4 w-4 accent-violet-700"
                      />
                      {amenity[language === "ar" ? "ar" : "en"]}
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-white/10">
                    <input
                      type="checkbox"
                      checked={form.hasPool}
                      onChange={(event) => setField("hasPool", event.target.checked)}
                      className="h-4 w-4 accent-violet-700"
                    />
                    {label("Private swimming pool", "مسبح خاص")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-white/10">
                    <input
                      type="checkbox"
                      checked={form.instantBook}
                      onChange={(event) => setField("instantBook", event.target.checked)}
                      className="h-4 w-4 accent-violet-700"
                    />
                    {label("Instant booking (No waiting for host approval)", "حجز فوري (تأكيد تلقائي)")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-white/10">
                    <input
                      type="checkbox"
                      checked={form.selfCheckin}
                      onChange={(event) => setField("selfCheckin", event.target.checked)}
                      className="h-4 w-4 accent-violet-700"
                    />
                    {label("Smart lock self check-in PIN", "دخول ذاتي برمز القفل الذكي")}
                  </label>
                </div>
              )}

              {step === 4 && (
                <div>
                  <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-6 text-center dark:border-violet-400/30 dark:bg-violet-400/5">
                    <UploadCloud className="h-9 w-9 text-violet-600 dark:text-violet-300" />
                    <strong className="mt-3 text-sm">
                      {label("Choose property photos", "اختر صور العقار")}
                    </strong>
                    <span className="mt-1 text-xs text-gray-500">
                      {label("JPG, PNG or WebP · up to 12 images · 10 MB each", "JPG أو PNG أو WebP · حتى 12 صورة · أقل من 10 ميجابايت")}
                    </span>
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      onChange={(event) => addFiles(event.target.files)}
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs dark:bg-white/5"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => document.getElementById("more-property-photos")?.click()}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300"
                  >
                    <Plus className="h-4 w-4" />
                    {label("Add more photos", "إضافة المزيد من الصور")}
                  </button>
                  <input
                    id="more-property-photos"
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    onChange={(event) => addFiles(event.target.files)}
                  />
                </div>
              )}

              {step === 5 && (
                <div>
                  <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                    {label(
                      "Set weekday and weekend rates, your usual arrival times and any dates you cannot host.",
                      "حدد أسعار وسط الأسبوع ونهاية الأسبوع، وأوقات تسجيل الوصول والمغادرة والتواريخ المغلقة."
                    )}
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className={labelClass}>
                      {label("Weekday rate (SAR / night)", "سعر وسط الأسبوع (ر.س / ليلة)")}
                      <input
                        className={inputClass}
                        type="number"
                        min={1}
                        value={form.weekdayPrice}
                        onChange={(event) => setField("weekdayPrice", Number(event.target.value))}
                      />
                    </label>
                    <label className={labelClass}>
                      {label("Weekend rate (SAR / night)", "سعر نهاية الأسبوع (ر.س / ليلة)")}
                      <input
                        className={inputClass}
                        type="number"
                        min={1}
                        value={form.weekendPrice}
                        onChange={(event) => setField("weekendPrice", Number(event.target.value))}
                      />
                    </label>
                    <label className={labelClass}>
                      {label("Check-in time", "وقت تسجيل الوصول")}
                      <input
                        className={inputClass}
                        type="time"
                        value={form.checkinTime}
                        onChange={(event) => setField("checkinTime", event.target.value)}
                      />
                    </label>
                    <label className={labelClass}>
                      {label("Check-out time", "وقت تسجيل المغادرة")}
                      <input
                        className={inputClass}
                        type="time"
                        value={form.checkoutTime}
                        onChange={(event) => setField("checkoutTime", event.target.value)}
                      />
                    </label>
                    <label className={labelClass}>
                      {label("Block dates from", "إغلاق التواريخ من")}
                      <input
                        className={inputClass}
                        type="date"
                        value={form.blockedFrom}
                        onChange={(event) => setField("blockedFrom", event.target.value)}
                      />
                    </label>
                    <label className={labelClass}>
                      {label("Through and including", "إلى تاريخ")}
                      <input
                        className={inputClass}
                        type="date"
                        value={form.blockedUntil}
                        onChange={(event) => setField("blockedUntil", event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-5">
                  <label className={labelClass}>
                    {label("Ministry of Tourism license number", "رقم ترخيص وزارة السياحة")}
                    <input
                      className={inputClass}
                      required
                      value={form.tourismLicense}
                      onChange={(event) => setField("tourismLicense", event.target.value)}
                      placeholder={label("Enter the license number exactly as issued", "أدخل رقم الترخيص كما هو صادر من الوزارة")}
                    />
                  </label>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                    {label(
                      "Your license details are sent for host verification. The listing remains hidden from guests until it is approved by the QafNest team.",
                      "يتم التحقق من رخصة وزارة السياحة لضمان موثوقية المنصة. سيبقى العقار مخفياً حتى يتم اعتماده من فريق قف نست."
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                    <h2 className="font-bold">{label("Review Details", "مراجعة البيانات")}</h2>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-gray-500">{label("Property", "العقار")}</dt>
                        <dd className="font-semibold">{form.title || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{label("Location", "الموقع")}</dt>
                        <dd className="font-semibold">{form.district ? `${form.district}, ` : ""}{form.city}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{label("Capacity", "السعة")}</dt>
                        <dd className="font-semibold">
                          {form.capacity} {label("guests", "ضيوف")} · {form.bedrooms} {label("bedrooms", "غرف نوم")}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{label("Nightly rates", "الأسعار")}</dt>
                        <dd className="font-semibold">{form.weekdayPrice} / {form.weekendPrice} SAR</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{label("Photos", "الصور")}</dt>
                        <dd className="font-semibold">
                          {files.length} {label("uploaded", "تم رفعها")}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{label("License", "الترخيص")}</dt>
                        <dd className="font-semibold">{form.tourismLicense || label("Not entered", "لم يُدخل")}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                  {error}
                </p>
              )}
              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5 dark:border-white/10">
                <button
                  type="button"
                  disabled={step === 0 || saving}
                  onClick={() => { setError(null); setStep((current) => current - 1); }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:invisible dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {label("Back", "السابق")}
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 transition"
                  >
                    {label("Continue", "المتابعة")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitListing}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 transition disabled:opacity-60"
                  >
                    {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {user ? label("Submit for verification", "إرسال العقار للاعتماد") : label("Sign in & submit", "تسجيل الدخول والإرسال")}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <AuthModal />
      <HostModal />
    </>
  );
}

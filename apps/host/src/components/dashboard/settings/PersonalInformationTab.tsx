"use client";

import React, { useState } from "react";
import { User, CheckCircle2, ShieldCheck, Camera, Loader2 } from "lucide-react";
import type { HostProfileSettings, BaseTabProps } from "./types";

interface PersonalInformationTabProps extends BaseTabProps {
  profile: HostProfileSettings;
  onSave: (data: Partial<HostProfileSettings>) => Promise<void>;
}

const SAUDI_CITIES = [
  { en: "Riyadh", ar: "الرياض" },
  { en: "Jeddah", ar: "جدة" },
  { en: "AlUla", ar: "العلا" },
  { en: "Dammam", ar: "الدمام" },
  { en: "Khobar", ar: "الخبر" },
  { en: "Mecca", ar: "مكة المكرمة" },
  { en: "Medina", ar: "المدينة المنورة" },
  { en: "Taif", ar: "الطائف" },
  { en: "Abha", ar: "أبها" },
  { en: "Tabuk", ar: "تبوك" },
];

export function PersonalInformationTab({
  profile,
  onSave,
  lang,
  t,
  isSaving,
}: PersonalInformationTabProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [city, setCity] = useState(profile.city || "الرياض");
  const [nationalId, setNationalId] = useState(profile.nationalId);
  const [idType, setIdType] = useState<HostProfileSettings["idType"]>(
    profile.idType || "national_id"
  );
  const [bio, setBio] = useState(profile.bio);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city,
      nationalId: nationalId.trim(),
      idType,
      bio: bio.trim(),
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "H";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Header Card with Avatar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative group">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[#4F2396] to-violet-800 text-white text-xl font-black shadow-md shadow-violet-950/20">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={fullName || "Host Avatar"}
                    className="h-full w-full object-cover rounded-3xl"
                  />
                ) : (
                  <span>{getInitials(fullName)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = prompt(
                    t("Enter avatar image URL:", "أدخل رابط صورة الملف الشخصي:")
                  );
                  if (url) void onSave({ avatarUrl: url.trim() });
                }}
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                title={t("Change profile photo", "تغيير صورة الملف الشخصي")}
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {fullName || t("Verified Host Partner", "مضيف شريك معتمد")}
                </h3>
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t("Verified SAMA Host", "مضيف موثق")}</span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t(
                  "Manage your public host identity, legal Saudi ID details, and direct contact channels.",
                  "إدارة هويتك المعتمدة كمضيف، بيانات الهوية الوطنية أو السجل التجاري، وقنوات التواصل."
                )}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-violet-50/70 dark:bg-purple-950/60 border border-violet-100 dark:border-purple-800 px-4 py-2.5 text-xs font-bold text-violet-900 dark:text-purple-300">
            <ShieldCheck size={16} className="text-[#4F2396] dark:text-purple-400" />
            <span>{t("National Identity Protected", "هوية وطنية مشفرة ومحمية")}</span>
          </div>
        </div>

        {/* 2. Form Grid Fields */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              {t("Host Full Name (Arabic / English)", "الاسم الكامل للمضيف (رباعي)")}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("e.g. Full Legal Name", "مثال: الاسم الكامل للمضيف")}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
              />
              <User
                size={16}
                className="absolute top-3.5 rtl:left-3.5 ltr:right-3.5 text-slate-400 dark:text-slate-500"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              {t("Verified Saudi Mobile Phone", "رقم الجوال السعودي المعتمد")}
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                readOnly={Boolean(profile.phone)}
                aria-readonly={Boolean(profile.phone)}
                value={phone}
                onChange={(e) => {
                  if (!profile.phone) setPhone(e.target.value);
                }}
                placeholder="+966 5X XXX XXXX"
                className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition focus:border-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
                  profile.phone ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600 dark:text-slate-400" : "bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900"
                }`}
              />
              {Boolean(profile.phone) && (
                <span className="absolute top-3 rtl:left-3.5 ltr:right-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {t("Verified", "موثق")}
                </span>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              {t("Email Address", "البريد الإلكتروني للإشعارات والفواتير")}
            </label>
            <div className="relative">
              <input
                type="email"
                readOnly={Boolean(profile.email)}
                aria-readonly={Boolean(profile.email)}
                value={email}
                onChange={(e) => {
                  if (!profile.email) setEmail(e.target.value);
                }}
                placeholder="host@qafnest.com"
                className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition focus:border-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
                  profile.email ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600 dark:text-slate-400" : "bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900"
                }`}
              />
              {Boolean(profile.email) && (
                <span className="absolute top-3 rtl:left-3.5 ltr:right-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {t("Linked", "مربوط")}
                </span>
              )}
            </div>
          </div>

          {/* Primary City */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              {t("City / Region of Operation", "المدينة الرئيسية للتشغيل")}
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            >
              {SAUDI_CITIES.map((c) => (
                <option key={c.en} value={lang === "ar" ? c.ar : c.en}>
                  {lang === "ar" ? c.ar : c.en}
                </option>
              ))}
            </select>
          </div>

          {/* ID Type Selection */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              {t("Identity Document Type", "نوع وثيقة الإثبات")}
            </label>
            <select
              value={idType}
              onChange={(e) =>
                setIdType(e.target.value as HostProfileSettings["idType"])
              }
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            >
              <option value="national_id">{t("Saudi National ID", "هوية وطنية سعودية")}</option>
              <option value="iqama">{t("Resident Iqama", "إقامة نظامية للمقيمين")}</option>
              <option value="commercial_registration">
                {t("Commercial Registration / Freelance License", "سجل تجاري / وثيقة عمل حر")}
              </option>
            </select>
          </div>

          {/* National ID / Document Number */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              {idType === "commercial_registration"
                ? t("Commercial Registration Number (10 digits)", "رقم السجل التجاري / وثيقة العمل الحر")
                : t("National / Resident ID Number (10 digits)", "رقم الهوية الوطنية / الإقامة (10 أرقام)")}
            </label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="1XXXXXXXXX"
              maxLength={10}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            />
          </div>

          {/* Bio / Host Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              {t("Host Bio / Overview", "نبذة تعريفية عن المضيف ومواصفات الضيافة")}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t(
                "Write a brief introduction for guests about your properties and hosting experience...",
                "اكتب نبذة موجزة للضيوف عن خبرتك في إدارة الوحدات السكنية والترحيب بهم..."
              )}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 p-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {/* 3. Action Footer */}
        <div className="mt-8 flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-violet-950/20 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("Saving Changes...", "جارٍ الحفظ...")}</span>
              </>
            ) : (
              <span>{t("Save Personal Information", "حفظ وتحديث البيانات")}</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}


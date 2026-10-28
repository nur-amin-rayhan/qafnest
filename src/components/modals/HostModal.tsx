"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function HostModal() {
  const { hostModalOpen, closeHostModal, language } = useApp();
  const [propType, setPropType] = useState("chalet");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!hostModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      language === "ar"
        ? `🎉 شكراً لك ${name || "شريكنا العزيز"} لانضمامك إلى شبكة مضيفي قف نست!\nسيتواصل معك فريق توثيق العقارات عبر الرقم ${phone} خلال ساعتين للتحقق من ترخيص العقار.`
        : `🎉 Thank you ${name || "Partner"} for joining QafNest Host Network!\nOur dedicated onboarding team will contact you at ${phone} within 2 hours to verify your property license.`
    );
    closeHostModal();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={closeHostModal}
    >
      <div
        className="glass-strong glow-border max-w-lg w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeHostModal}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 h-8 w-8 rounded-full glass flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="text-[11px] uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400 font-bold mb-1 block">
          {language === "ar" ? "الاستضافة مع قف نست" : "Host with QafNest"}
        </span>
        <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {language === "ar" ? "سجّل عقارك وابدأ بجني الأرباح" : "List Your Property"}
        </h3>
        <p className="text-xs text-gray-600 dark:text-muted/70 mb-5">
          {language === "ar"
            ? "حقق دخلاً يصل إلى 45,000 ر.س شهرياً مع حماية وتأمين كامل للمضيف."
            : "Start earning up to 45,000 SAR monthly with full host protection."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-muted mb-1">
              {language === "ar" ? "نوع العقار" : "Property Type"}
            </label>
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-surface/[0.05] border border-gray-200 dark:border-white/10 px-4 py-2.5 text-gray-900 dark:text-fg focus:outline-none focus:border-violet-400 cursor-pointer"
            >
              <option value="chalet" className="bg-gray-900 text-white">
                {language === "ar" ? "شاليه ومنتجع" : "Chalet & Resort"}
              </option>
              <option value="villa" className="bg-gray-900 text-white">
                {language === "ar" ? "فيلا خاصة" : "Private Villa"}
              </option>
              <option value="farm" className="bg-gray-900 text-white">
                {language === "ar" ? "مزرعة ريفية" : "Country Farm"}
              </option>
              <option value="camp" className="bg-gray-900 text-white">
                {language === "ar" ? "مخيم / قبة صحراوية" : "Desert Camp / Caravan"}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-muted mb-1">
              {language === "ar" ? "المدينة / المنطقة" : "City / Region"}
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={language === "ar" ? "مثال: الرياض، العمارية أو جدة، أبحر" : "e.g. Riyadh, Al-Ammariyah or Jeddah, Obhur"}
              className="w-full rounded-xl bg-gray-50 dark:bg-surface/[0.05] border border-gray-200 dark:border-white/10 px-4 py-2.5 text-gray-900 dark:text-fg placeholder:text-gray-400 dark:placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-muted mb-1">
              {language === "ar" ? "اسم المالك / المسؤول" : "Owner / Manager Name"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "ar" ? "الاسم الكامل" : "Your Full Name"}
              className="w-full rounded-xl bg-gray-50 dark:bg-surface/[0.05] border border-gray-200 dark:border-white/10 px-4 py-2.5 text-gray-900 dark:text-fg placeholder:text-gray-400 dark:placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-muted mb-1">
              {language === "ar" ? "رقم الجوال (نشط على واتساب)" : "Mobile Phone (WhatsApp Active)"}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 5X XXX XXXX"
              className="w-full rounded-xl bg-gray-50 dark:bg-surface/[0.05] border border-gray-200 dark:border-white/10 px-4 py-2.5 text-gray-900 dark:text-fg placeholder:text-gray-400 dark:placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{language === "ar" ? "إرسال العقار للتحقق والاعتماد" : "Submit Property for Host Verification"}</span>
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}

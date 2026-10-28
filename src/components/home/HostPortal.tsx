"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Shield, CalendarCheck, Banknote, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import MagneticButton from "@/components/ui/MagneticButton";

const RATES_BY_TYPE: Record<number, { nameEn: string; nameAr: string; rate: number }> = {
  1: { nameEn: "Chalet with Private Pool", nameAr: "شاليه بمسبح خاص", rate: 1850 },
  2: { nameEn: "Private Luxury Villa", nameAr: "فيلا خاصة فاخرة", rate: 2900 },
  3: { nameEn: "Heritage Organic Farm", nameAr: "مزرعة ريفية تراثية", rate: 2200 },
  4: { nameEn: "Desert Glamping Camp", nameAr: "مخيم صحراوي فاخر", rate: 1450 },
};

export default function HostPortal() {
  const { openHostModal, language, t } = useApp();

  const [typeIndex, setTypeIndex] = useState(2);
  const [nights, setNights] = useState(12);

  const currentType = RATES_BY_TYPE[typeIndex];
  const monthlyEarnings = currentType.rate * nights;

  return (
    <section id="host" className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="glass-strong glow-border rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-fuchsia-300 mb-4">
                <Key className="w-3.5 h-3.5 text-fuchsia-400" />
                {t.host.badge}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                {t.host.title} <br />
                <span className="text-gradient">{t.host.titleHighlight}</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-muted/80 font-light leading-relaxed mb-6">
                {t.host.sub}
              </p>

              {/* Host Perks */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-900 dark:text-white">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    {language === "ar"
                      ? "ضمان حماية المضيف والعقار بقيمة تصل إلى 1,000,000 ر.س"
                      : "1,000,000 SAR Property Host Protection Guarantee"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-900 dark:text-white">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    {language === "ar"
                      ? "تحكم كامل ومباشر في التقويم وتحديد الأسعار وقبول الحجوزات"
                      : "Complete control over calendar pricing & booking approval"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-900 dark:text-white">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    {language === "ar"
                      ? "تحويلات بنكية مباشرة وسريعة إلى حساب الآيبان السعودي الخاص بك"
                      : "Instant bi-weekly direct bank transfers to your Saudi IBAN"}
                  </span>
                </div>
              </div>

              <MagneticButton
                onClick={openHostModal}
                className="px-8 py-3.5 text-xs tracking-wider"
              >
                <span>{t.host.cta}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </MagneticButton>
            </motion.div>

            {/* Interactive Host Earnings Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="glass glow-border rounded-3xl p-6 sm:p-8 border border-violet-400/20 relative overflow-hidden"
            >
              <span className="text-[10px] uppercase tracking-wider font-bold text-violet-400 block mb-1">
                {t.host.earningsTitle}
              </span>
              <div className="font-display text-4xl sm:text-5xl font-bold text-gradient mb-2">
                {monthlyEarnings.toLocaleString()} {language === "ar" ? "ر.س" : "SAR"}
              </div>
              <p className="text-xs text-gray-500 dark:text-muted/70 mb-6">
                {t.host.earningsSub}
              </p>

              {/* Sliders */}
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500 dark:text-muted">
                      {language === "ar" ? "نوع العقار:" : "Property Category:"}
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {language === "ar" ? currentType.nameAr : currentType.nameEn}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={typeIndex}
                    onChange={(e) => setTypeIndex(parseInt(e.target.value))}
                    className="w-full accent-fuchsia-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500 dark:text-muted">
                      {language === "ar" ? "الليالي المحجوزة شهرياً:" : "Estimated Booked Nights / Month:"}
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {language === "ar" ? `${nights} ليالٍ` : `${nights} Nights`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="25"
                    value={nights}
                    onChange={(e) => setNights(parseInt(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

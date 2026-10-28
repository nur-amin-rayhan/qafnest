"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Reviews() {
  const { language, t } = useApp();

  const LOCALIZED_REVIEWS = [
    {
      quote:
        language === "ar"
          ? "كان حجز شاليه عطلة نهاية الأسبوع في الرياض عبر قف نست في غاية السهولة. الدخول الذكي الفوري، نظافة المسبح، وتقسيط تابي جعلتها أفضل إجازة عائلية."
          : "Booking our Riyadh weekend chalet through QafNest was effortless. The instant check-in, spotless pool, and Tabby installment option made it the best family getaway.",
      author: language === "ar" ? "طارق المنصور" : "Tariq Al-Mansoor",
      location:
        language === "ar"
          ? "الرياض · أقام في شاليه العمارية الملكي"
          : "Riyadh · Stayed at Al-Ammariyah Chalet",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&crop=face",
    },
    {
      quote:
        language === "ar"
          ? "فيلا أبحر الشاطئية كانت بخصوصية تامة ونظافة فائقة. توثيق وترخيص وزارة السياحة يمنح راحة بال تامة. خدمة عملاء ممتازة وراقية!"
          : "The Obhur seaside villa was completely private and clean. Having the Ministry of Tourism guarantee gives true peace of mind. Outstanding customer care!",
      author: language === "ar" ? "نوف الحربي" : "Nouf Al-Harbi",
      location:
        language === "ar"
          ? "جدة · أقامت في فيلا ساحل البحر الأحمر"
          : "Jeddah · Stayed at Red Sea Shoreline Villa",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&crop=face",
    },
    {
      quote:
        language === "ar"
          ? "تجربة المخيم الفاخر في العلا كانت خيالية وفوق الوصف. مراقبة النجوم بجوار الموقد وخدمة العشاء الخاصة كانت في غاية الروعة."
          : "Our glamping pavilion in AlUla was out of this world. Stargazing by the firepit while enjoying private dinner service was truly exceptional.",
      author: language === "ar" ? "إلينا روستوفا" : "Elena Rostova",
      location:
        language === "ar"
          ? "دبي · أقامت في مخيم العلا الصحراوي"
          : "Dubai · Stayed at AlUla Desert Camp",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&fit=crop&crop=face",
    },
  ];

  return (
    <section id="reviews" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 fill-fuchsia-400 text-fuchsia-400"
              />
            ))}
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-violet-600 dark:text-violet-300 block mb-2">
            {t.reviews.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t.reviews.title}{" "}
            <span className="text-gradient font-serif italic font-normal">
              {t.reviews.titleHighlight}
            </span>
          </h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-muted/70 font-light">
            {t.reviews.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LOCALIZED_REVIEWS.map((rev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
              data-cursor="hover"
              className="glass glow-border rounded-3xl p-8 relative flex flex-col justify-between group hover:-translate-y-2 hover:shadow-glow transition-all duration-500 overflow-hidden"
            >
              {/* Corner radial glow accents from reference */}
              <div
                className="pointer-events-none absolute left-0 top-0 h-28 w-28 scale-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 z-10"
                style={{
                  transformOrigin: "0 0",
                  background: "radial-gradient(circle at 0 0, rgba(168,85,247,0.3) 0%, transparent 70%)",
                }}
              />
              <div
                className="pointer-events-none absolute right-0 bottom-0 h-28 w-28 scale-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 z-10"
                style={{
                  transformOrigin: "100% 100%",
                  background: "radial-gradient(circle at 100% 100%, rgba(232,121,249,0.25) 0%, transparent 70%)",
                }}
              />

              <p className="font-serif italic text-lg text-gray-800 dark:text-white/90 leading-relaxed mb-6">
                &ldquo;{rev.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-violet-400/40 shrink-0">
                  <Image
                    src={rev.avatar}
                    alt={rev.author}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-fg">{rev.author}</h4>
                  <p className="text-xs text-gray-500 dark:text-muted/70">{rev.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  CreditCard,
  Headphones,
  Star,
  SlidersHorizontal,
  Camera,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Guarantee() {
  const { language, t } = useApp();

  const PILLARS = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-fuchsia-400" />,
      bg: "bg-fuchsia-600/20 border-fuchsia-400/30",
      title:
        language === "ar"
          ? "حجز فوري ومؤكد"
          : "Instant & Guaranteed Reservation",
      desc:
        language === "ar"
          ? "حجزك مؤكد بنسبة 100%. يضمن التزامن الحي لتقويم الحجوزات عدم وجود حجز مزدوج، ونضمن لك إقامة بديلة فاخرة فوراً في حال حدوث أي طارئ."
          : "Your reservation is 100% guaranteed. Live calendar sync eliminates double booking, and in rare host cancellations, we relocate you to an equal or upgraded luxury stay immediately.",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-violet-400" />,
      bg: "bg-violet-600/20 border-violet-400/30",
      title:
        language === "ar"
          ? "طرق دفع آمنة ومرنة"
          : "Safe & Flexible Payment Methods",
      desc:
        language === "ar"
          ? "بوابات دفع آمنة ومعتمدة من البنك المركزي السعودي (ساما). ادفع عبر مدى، آبل باي، أو قسّم فاتورتك على 4 دفعات بدون فوائد مع تابي."
          : "Multiple and secure payment gateways approved by the Saudi Central Bank (SAMA). Pay with Mada, Apple Pay, or split with Tabby into 4 zero-interest installments.",
    },
    {
      icon: <Headphones className="w-6 h-6 text-emerald-400" />,
      bg: "bg-emerald-600/20 border-emerald-400/30",
      title:
        language === "ar"
          ? "خدمة عملاء استثنائية 24/7"
          : "Outstanding Customer Service",
      desc:
        language === "ar"
          ? "فريق دعم محلي ثنائي اللغة متاح 24/7 عبر الهاتف والواتساب للإجابة على استفساراتكم وضمان استلام المفاتيح وتجربة إقامة مثالية."
          : "We support you throughout the week 24/7. Dedicated bilingual guest concierge available on phone and WhatsApp to resolve inquiries, assist key handovers, and ensure perfection.",
    },
    {
      icon: <Star className="w-6 h-6 text-amber-400" />,
      bg: "bg-amber-600/20 border-amber-400/30",
      title:
        language === "ar"
          ? "تقييمات حقيقية وموثوقة"
          : "Trusted & Certified Reviews",
      desc:
        language === "ar"
          ? "تقييمات وآراء حقيقية من ضيوف أقاموا بالفعل في الوحدات. لا تقييمات وهمية، كل تقييم مرتبط بحجز حقيقي ومكتمل."
          : "Certified reviews and comments from verified guests who physically completed their stay. No fabricated ratings or unverified testimonials.",
    },
    {
      icon: <SlidersHorizontal className="w-6 h-6 text-cyan-400" />,
      bg: "bg-cyan-600/20 border-cyan-400/30",
      title:
        language === "ar"
          ? "بحث ذكي ومتقدم"
          : "Advanced and Intelligent Search",
      desc:
        language === "ar"
          ? "خصص بحثك بدقة وفق احتياجات عائلتك: مسبح خاص، ألعاب مائية للأطفال، دخول ذاتي ذكي، أو مساحات مخصصة للمناسبات."
          : "Tailor your search to your specific family needs: heated pool, private children's water games, single or family section, self check-in smart lock, or event capacity.",
    },
    {
      icon: <Camera className="w-6 h-6 text-purple-400" />,
      bg: "bg-purple-600/20 border-purple-400/30",
      title:
        language === "ar"
          ? "صور وفيديوهات تحاكي الواقع"
          : "Photos & 360° Media Mimicking Reality",
      desc:
        language === "ar"
          ? "صور وفيديوهات واقعية تم التقاطها بواسطة فريق التوثيق الميداني المعتمد لدينا، مع تفاصيل المساحات بدقة لضمان عدم وجود أي مفاجآت."
          : "See photos that mimic reality from your place. Our field verification team captures high-definition architectural photos and layout dimensions so there are no surprises upon arrival.",
    },
  ];

  return (
    <section id="guarantee" className="py-20 relative bg-surface/[0.02] border-y border-violet-400/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300 mb-3 border border-violet-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
            {t.guarantee.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t.guarantee.title} <span className="text-gradient">{t.guarantee.titleHighlight}</span>
          </h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-muted/70 font-light">
            {t.guarantee.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              data-cursor="hover"
              className="glass glow-border rounded-3xl p-6 relative group hover:-translate-y-2 hover:shadow-glow transition-all duration-500 overflow-hidden"
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

              <div
                className={`h-12 w-12 rounded-2xl ${p.bg} border flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-transform`}
              >
                {p.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-fg mb-1">
                {p.title}
              </h3>
              <p className="text-muted/70 text-xs font-light leading-relaxed">
                {p.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

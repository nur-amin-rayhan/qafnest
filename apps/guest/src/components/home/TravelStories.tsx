"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function TravelStories() {
  const { language } = useApp();

  const LOCALIZED_STORIES = [
    {
      id: "story-1",
      title:
        language === "ar"
          ? "العمارية: الملاذ العصري في الرياض لشاليهات المسابح المدفأة"
          : "Al-Ammariyah: The Modern Riyadh Retreat for Heated Pool Chalets",
      tag: language === "ar" ? "وجهات الرياض" : "Riyadh Getaway",
      readTime: language === "ar" ? "قراءة ٤ دقائق" : "4 min read",
      summary:
        language === "ar"
          ? "لماذا أصبح هذا الوادي الهادئ شمال الدرعية الوجهة المفضلة للعائلات في عطلات نهاية الأسبوع بعيداً عن صخب المدينة."
          : "Why this serene valley north of Diriyah has become Saudi Arabia’s favorite destination for private family weekends away from city lights.",
      author: language === "ar" ? "فريق تحرير قف نست" : "QafNest Editorial Team",
      image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&fit=crop",
    },
    {
      id: "story-2",
      title:
        language === "ar"
          ? "كورنيش أبحر: فلل شاطئية خاصة مع مراسي يخوت وإطلالة بحرية"
          : "Obhur Waterfront: Private Villas with Direct Sea Access & Yacht Docks",
      tag: language === "ar" ? "ساحل جدة" : "Jeddah Coast",
      readTime: language === "ar" ? "قراءة ٥ دقائق" : "5 min read",
      summary:
        language === "ar"
          ? "دليلك الشامل لحجز إقامات ساحلية خاصة على خور أبحر مع تجارب الجت سكي واستئجار القوارب والاستجمام."
          : "Everything you need to know about booking private coastal residences along Obhur Creek for jet-skiing, boat rentals, and coastal serenity.",
      author: language === "ar" ? "مجلة البحر الأحمر" : "Red Sea Living",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&fit=crop",
    },
    {
      id: "story-3",
      title:
        language === "ar"
          ? "العلا ليلاً: تجارب تخييم فاخرة تحت سماء مرصعة بالنجوم"
          : "AlUla After Dark: Glamping Under Celestial Skies & Ancient Canyons",
      tag: language === "ar" ? "التراث والصحراء" : "Heritage & Desert",
      readTime: language === "ar" ? "قراءة ٣ دقائق" : "3 min read",
      summary:
        language === "ar"
          ? "تعرف على القباب الجيوديسية المعمارية المذهلة بين صخور وجبال العلا التي تعود لآلاف السنين."
          : "Step inside architecturally breathtaking geodesic domes nestled between 2,000-year-old sandstone cliffs and unpolluted starry nights.",
      author: language === "ar" ? "مستكشفو التراث" : "Heritage Explorers",
      image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&fit=crop",
    },
  ];

  return (
    <section id="stories" className="py-20 relative bg-surface/[0.01]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300 mb-3 border border-violet-500/20">
              <Compass className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              {language === "ar" ? "دليل الوجهات والتجارب المحلية" : "Local Travel Guides"}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {language === "ar" ? (
                <>
                  اكتشف <span className="text-gradient">المملكة العربية السعودية.</span>
                </>
              ) : (
                <>
                  Discover <span className="text-gradient">Saudi Arabia.</span>
                </>
              )}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-muted/70 font-light max-w-xl">
              {language === "ar"
                ? "أسرار ووجهات عطلات نهاية الأسبوع وبرامج سياحية مختارة بعناية من خبراء الضيافة في الرياض، جدة، والعلا."
                : "Insider secrets, weekend itineraries, and destination guides curated by local hospitality connoisseurs across Riyadh, Jeddah, and AlUla."}
            </p>
          </div>

          <Link
            href="#destinations"
            className="text-xs font-bold text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>
              {language === "ar" ? "استكشف أكثر من ١٠ وجهات سعودية" : "Explore All 10+ Saudi Regions"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {/* 3 Editorial Stories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LOCALIZED_STORIES.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              data-cursor="hover"
              className="glass glow-border rounded-3xl overflow-hidden group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-glow flex flex-col justify-between relative"
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

              <div className="relative h-56 overflow-hidden">
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                <span className="absolute top-4 left-4 rtl:left-auto rtl:right-4 glass px-3 py-1 rounded-full text-[11px] font-bold text-fuchsia-300 border border-fuchsia-400/30">
                  {story.tag} · {story.readTime}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 dark:text-fg mb-2 group-hover:text-fuchsia-400 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-muted/80 leading-relaxed mb-4">
                    {story.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-muted">
                  <span>{language === "ar" ? `بقلم: ${story.author}` : `By ${story.author}`}</span>
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-300 group-hover:text-fuchsia-500 dark:group-hover:text-white font-semibold">
                    <span>{language === "ar" ? "قراءة الدليل" : "Read Guide"}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

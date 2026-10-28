"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Waves, ShieldCheck, Trees, Tent, ArrowRight } from "lucide-react";
import { LIFESTYLE_COLLECTIONS } from "@/data/properties";
import { useApp } from "@/context/AppContext";

export default function LifestyleCollections() {
  const { setSelectedCategory } = useApp();

  const handleSelectCollection = (type: string) => {
    setSelectedCategory(type);
    const propertiesEl = document.getElementById("properties");
    if (propertiesEl) {
      propertiesEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case "waves":
        return <Waves className="w-5 h-5" />;
      case "shield-check":
        return <ShieldCheck className="w-5 h-5" />;
      case "trees":
        return <Trees className="w-5 h-5" />;
      case "tent":
        return <Tent className="w-5 h-5" />;
      default:
        return <Waves className="w-5 h-5" />;
    }
  };

  return (
    <section id="collections" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-300 mb-3 border border-violet-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              Curated Vacation Homes · احجز منزلك الثاني
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg">
              Book Your <span className="text-gradient">Second Home.</span>
            </h2>
            <p className="mt-2 text-sm text-muted/70 font-light max-w-xl">
              Wherever your destination is across Saudi Arabia, find your private sanctuary custom-tailored for family gatherings, quiet relaxation, and celebrations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Click any collection to filter accommodations:</span>
          </div>
        </div>

        {/* 4 Curated Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LIFESTYLE_COLLECTIONS.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => handleSelectCollection(col.type)}
              data-cursor="hover"
              className="glass glow-border rounded-3xl p-6 group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-glow relative overflow-hidden flex flex-col justify-between h-[360px]"
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

              <div className="absolute inset-0">
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-30"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-fuchsia-300 shadow-glow">
                  {getIcon(col.icon)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 glass px-2.5 py-1 rounded-full">
                  {col.countTag}
                </span>
              </div>

              <div className="relative z-10">
                <span className="text-[11px] font-semibold text-fuchsia-300 block mb-1">
                  {col.subtitle}
                </span>
                <h3 className="font-display text-xl font-bold text-fg mb-2 group-hover:text-fuchsia-300 transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs text-muted/80 leading-relaxed mb-4">
                  {col.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300 group-hover:text-white transition-colors">
                  <span>Explore Stays</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { DESTINATIONS } from "@/data/properties";
import { useApp } from "@/context/AppContext";

export default function Destinations() {
  const { setSelectedCity } = useApp();

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    const propertiesEl = document.getElementById("properties");
    if (propertiesEl) {
      propertiesEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="destinations" className="pt-10 pb-4 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-300 mb-2 border border-violet-500/20 shadow-glow"
            >
              <MapPin className="w-3.5 h-3.5 text-fuchsia-400" />
              Destinations Across The Kingdom · وجهات استثنائية
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg"
            >
              Explore by <span className="text-gradient">Destination.</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs text-muted/70 max-w-sm"
          >
            Discover curated chalets, seaside villas, and mountain retreats across the major tourism hubs of Saudi Arabia.
          </motion.p>
        </div>

        {/* Destination Cards Grid with Staggered Cascading Timing */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {DESTINATIONS.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: (i % 5) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => handleSelectCity(dest.city)}
              data-cursor="hover"
              className="glass glow-border rounded-2xl p-4 group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-glow relative overflow-hidden flex flex-col justify-between h-48"
            >
              {/* Corner radial glow accents from reference */}
              <div
                className="pointer-events-none absolute left-0 top-0 h-24 w-24 scale-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 z-10"
                style={{
                  transformOrigin: "0 0",
                  background: "radial-gradient(circle at 0 0, rgba(168,85,247,0.35) 0%, transparent 70%)",
                }}
              />
              <div
                className="pointer-events-none absolute right-0 bottom-0 h-24 w-24 scale-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 z-10"
                style={{
                  transformOrigin: "100% 100%",
                  background: "radial-gradient(circle at 100% 100%, rgba(232,121,249,0.3) 0%, transparent 70%)",
                }}
              />

              <div className="absolute inset-0">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-30"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <span className="text-[10px] font-bold text-violet-200 glass px-2 py-0.5 rounded-full">
                  {dest.count}+ Stays
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="font-display text-base font-bold text-fg group-hover:text-fuchsia-300 transition-colors">
                  {dest.name}
                </h3>
                <p className="text-[11px] text-muted/80 truncate mb-1">
                  {dest.subtitle}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-violet-300 group-hover:text-white transition-colors">
                  <span>Explore Stays</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

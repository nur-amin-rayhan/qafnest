"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, ArrowRight } from "lucide-react";
import { STORIES } from "@/data/properties";

export default function TravelStories() {
  return (
    <section id="stories" className="py-20 relative bg-surface/[0.01]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-300 mb-3 border border-violet-500/20">
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              Local Travel Guides · مدونة السفر واكتشف السعودية
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg">
              Discover <span className="text-gradient">Saudi Arabia.</span>
            </h2>
            <p className="mt-2 text-sm text-muted/70 font-light max-w-xl">
              Insider secrets, weekend itineraries, and destination guides curated by local hospitality connoisseurs across Riyadh, Jeddah, and AlUla.
            </p>
          </div>

          <Link
            href="#destinations"
            className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Explore All 10+ Saudi Regions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Editorial Stories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STORIES.map((story, i) => (
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
                <span className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[11px] font-bold text-fuchsia-300 border border-fuchsia-400/30 backdrop-blur-md">
                  {story.tag} · {story.readTime}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-fg mb-2 group-hover:text-fuchsia-300 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs text-muted/80 leading-relaxed mb-4">
                    {story.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-muted">
                  <span>By {story.author}</span>
                  <span className="flex items-center gap-1 text-violet-300 group-hover:text-white font-semibold">
                    Read Guide <ArrowRight className="w-3 h-3" />
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

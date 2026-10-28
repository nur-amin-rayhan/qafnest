"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Percent, Zap, Star, ArrowRight } from "lucide-react";
import { DEALS } from "@/data/properties";
import { useApp } from "@/context/AppContext";

export default function LastMinuteDeals() {
  const { formatPrice, formatTabby, openBookingModal } = useApp();

  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 38,
    seconds: 25,
  });

  useEffect(() => {
    let totalSeconds = 14 * 3600 + 38 * 60 + 25;
    const interval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="deals" className="py-20 relative bg-surface/[0.02] border-t border-violet-400/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header with Real-Time Countdown Timer */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-fuchsia-300 mb-3 border border-fuchsia-500/20">
              <span className="h-2 w-2 rounded-full bg-fuchsia-400 animate-pulse" />
              Limited Weekend Availability · عروض اللحظة الأخيرة
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg">
              Last-Minute Deals & <span className="text-gradient">Weekend Getaways.</span>
            </h2>
            <p className="mt-2 text-sm text-muted/70 font-light max-w-xl">
              From warm family gatherings to spontaneous weekend escapes with friends, enjoy up to 40% OFF continuous offers on verified chalets, farms, and villas.
            </p>
          </div>

          {/* Live Countdown Timer */}
          <div className="glass glow-border rounded-2xl px-5 py-3 flex items-center gap-4 shrink-0 bg-violet-950/20">
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Flash Ends In:
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono font-bold text-lg text-white">
              <div className="text-center">
                <span className="text-gradient text-xl">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="block text-[9px] text-muted font-sans font-normal uppercase">
                  Hrs
                </span>
              </div>
              <span className="text-violet-400">:</span>
              <div className="text-center">
                <span className="text-gradient text-xl">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="block text-[9px] text-muted font-sans font-normal uppercase">
                  Min
                </span>
              </div>
              <span className="text-violet-400">:</span>
              <div className="text-center">
                <span className="text-gradient text-xl">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="block text-[9px] text-muted font-sans font-normal uppercase">
                  Sec
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DEALS.map((deal, i) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              data-cursor="hover"
              className="glass glow-border rounded-3xl overflow-hidden group flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:shadow-glow relative"
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
              {/* Discount Badge Ribbon */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
                <span className="px-3 py-1 rounded-full bg-rose-500/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1 backdrop-blur-sm pointer-events-auto">
                  <Percent className="w-3 h-3" /> {deal.discountPercentage}% OFF
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1 pointer-events-auto">
                  <Zap className="w-2.5 h-2.5 text-emerald-400" /> Instant Book
                </span>
              </div>

              {/* Image Area */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={deal.image}
                  alt={deal.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-black/20" />
                <span className="absolute bottom-3 right-3 glass px-3 py-1 rounded-full text-xs font-semibold text-white/90">
                  {deal.location}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-semibold text-violet-300">
                      {deal.categoryName}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-fg">
                      <Star className="w-3.5 h-3.5 fill-fuchsia-400 text-fuchsia-400" />
                      <span>{deal.rating}</span>
                      <span className="text-[10px] text-muted/60">
                        ({deal.reviewsCount})
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-bold text-fg mb-2 group-hover:text-fuchsia-300 transition-colors">
                    {deal.title}
                  </h3>
                  <p className="text-xs text-muted/80 leading-relaxed mb-4">
                    {deal.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5 text-[11px] text-muted">
                    {deal.amenities.map((amenity, i) => (
                      <span key={i} className="glass px-2.5 py-1 rounded-md">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing & Tabby Split */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-xs text-muted/60 line-through mr-1.5">
                        {formatPrice(deal.originalPrice)}
                      </span>
                      <span className="font-display text-2xl font-bold text-gradient">
                        {formatPrice(deal.discountPrice)}
                      </span>
                      <span className="text-xs text-muted"> / night</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold glass px-2 py-0.5 rounded">
                      Save {formatPrice(deal.savings)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted mb-4 bg-surface/[0.03] p-2 rounded-xl border border-white/5">
                    <span className="text-[11px] text-violet-300 font-semibold">
                      Or 4 monthly splits with Tabby
                    </span>
                    <span className="font-bold text-fg">
                      {formatTabby(deal.discountPrice)}
                    </span>
                  </div>

                  <button
                    onClick={() => openBookingModal(deal.title, deal.discountPrice)}
                    className="w-full py-3 rounded-full bg-luxe-gradient text-white text-xs font-bold uppercase tracking-wider shadow-glow hover:shadow-glow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Claim Flash Deal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

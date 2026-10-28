"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ShieldCheck, Zap, Heart, ArrowRight } from "lucide-react";
import { PROPERTIES, Property } from "@/data/properties";
import { useApp } from "@/context/AppContext";

export default function PropertiesGrid() {
  const {
    selectedCity,
    selectedCategory,
    instantOnly,
    poolOnly,
    selfCheckinOnly,
    wishlist,
    toggleWishlist,
    formatPrice,
    formatTabby,
    openBookingModal,
  } = useApp();

  const filteredProperties = PROPERTIES.filter((p: Property) => {
    if (selectedCity !== "all" && p.city !== selectedCity) return false;
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (instantOnly && !p.instantBook) return false;
    if (poolOnly && !p.hasPool) return false;
    if (selfCheckinOnly && !p.selfCheckin) return false;
    return true;
  });

  return (
    <section id="properties" className="pt-6 pb-20 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="text-xs uppercase font-bold tracking-widest text-violet-300 block mb-1"
            >
              Handpicked Sanctuaries · مساكن مختارة
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg"
            >
              Featured Chalets, <span className="text-gradient">Villas & Farms.</span>
            </motion.h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-violet-300 border border-violet-400/20 shadow-glow">
              {filteredProperties.length} Verified Accommodations Available
            </span>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredProperties.length === 0 ? (
          <div className="glass glow-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <p className="text-sm text-muted/80 mb-4">
              No accommodations match your current filter selection. Try resetting filters or selecting another city.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map((item, idx) => {
              const isWishlisted = wishlist.includes(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.6, delay: (idx % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  data-cursor="hover"
                  className="property-card glass glow-border rounded-3xl overflow-hidden group flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:shadow-glow relative"
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
                  {/* Top Badges & Wishlist */}
                  <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      {item.isLicensed && (
                        <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Licensed</span>
                        </span>
                      )}
                      {item.instantBook && (
                        <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-fuchsia-300 border border-fuchsia-400/30 flex items-center gap-0.5 shadow-sm">
                          <Zap className="w-2.5 h-2.5 text-fuchsia-400" />
                          <span>Instant</span>
                        </span>
                      )}
                    </div>

                    {/* Wishlist Heart */}
                    <button
                      onClick={() => toggleWishlist(item.id)}
                      className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-rose-400 transition-colors pointer-events-auto cursor-pointer"
                      aria-label="Add to wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isWishlisted
                            ? "fill-rose-500 text-rose-500"
                            : "text-white"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Image Container */}
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-black/20" />
                    <span className="absolute bottom-2.5 right-2.5 glass px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white/90">
                      {item.cityName}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-violet-300">
                          {item.categoryName}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-fg">
                          <Star className="w-3.5 h-3.5 fill-fuchsia-400 text-fuchsia-400" />
                          <span>{item.rating}</span>
                          <span className="text-[10px] text-muted/60">
                            ({item.reviewsCount})
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-base font-bold text-fg group-hover:text-fuchsia-300 transition-colors mb-1 line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="text-xs text-muted/70 mb-3">{item.specs}</p>

                      {/* Amenities Chips */}
                      <div className="flex flex-wrap gap-1 mb-4 text-[10px] text-muted">
                        {item.features.map((feat, i) => (
                          <span key={i} className="glass px-2 py-0.5 rounded-md">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price & Booking Trigger */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="flex items-baseline justify-between mb-1">
                        <div>
                          <span className="font-display text-xl font-bold text-gradient">
                            {formatPrice(item.basePrice)}
                          </span>
                          <span className="text-xs text-muted"> / night</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold glass px-2 py-0.5 rounded">
                          Tax Inc.
                        </span>
                      </div>

                      {/* Tabby 4-month Split */}
                      <div className="flex items-center justify-between text-[11px] text-muted mb-3 bg-surface/[0.03] p-1.5 rounded-lg border border-white/5">
                        <span className="text-violet-300 font-medium">
                          Or with Tabby:
                        </span>
                        <span className="font-bold text-fg">
                          {formatTabby(item.basePrice)}
                        </span>
                      </div>

                      <button
                        onClick={() => openBookingModal(item.title, item.basePrice)}
                        className="w-full py-2.5 rounded-full bg-luxe-gradient text-white text-xs font-bold uppercase tracking-wider shadow-glow hover:shadow-glow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Book Instant</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

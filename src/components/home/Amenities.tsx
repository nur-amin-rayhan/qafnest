"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Utensils, Sparkles, Anchor, BellRing } from "lucide-react";

export default function Amenities() {
  const AMENITIES = [
    {
      title: "Private Gastronomy",
      desc: "Personal Michelin-trained culinary masters preparing bespoke banquets in your villa kitchen.",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&fit=crop",
      icon: <Utensils className="w-5 h-5 text-fuchsia-400" />,
    },
    {
      title: "Wellness & Spa Sanctuary",
      desc: "Heated thermal pools, private Turkish hammams, and therapeutic organic treatments.",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&fit=crop",
      icon: <Sparkles className="w-5 h-5 text-violet-400" />,
    },
    {
      title: "Private Yacht & Marine",
      desc: "Direct jetty berthing with bespoke Red Sea boat excursions, sunset sails, and diving safaris.",
      image: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=600&fit=crop",
      icon: <Anchor className="w-5 h-5 text-cyan-400" />,
    },
    {
      title: "24/7 Dedicated Butler",
      desc: "Unobtrusive yet attentive hospitality specialists attending to your family's every desire.",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&fit=crop",
      icon: <BellRing className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <section id="amenities" className="py-20 relative overflow-hidden bg-surface/[0.01]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-bold tracking-widest text-violet-300 block mb-2">
            Curated Indulgence · تجارب استثنائية
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg">
            Resort Amenities & <span className="text-gradient">Experiences.</span>
          </h2>
          <p className="mt-3 text-sm text-muted/70 font-light">
            Elevate your private stay beyond accommodation with bespoke gastronomy, personal wellness, and round-the-clock royal hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AMENITIES.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              data-cursor="hover"
              className="glass glow-border rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-2 hover:shadow-glow transition-all duration-500 flex flex-col justify-between h-[340px]"
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
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-25"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="h-10 w-10 rounded-xl bg-violet-600/30 border border-violet-400/30 flex items-center justify-center mb-4 shadow-glow">
                  {item.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-fg mb-2 group-hover:text-fuchsia-300 transition-colors">
                  {item.title}
                </h3>
              </div>

              <p className="relative z-10 text-xs text-muted/80 leading-relaxed font-light">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

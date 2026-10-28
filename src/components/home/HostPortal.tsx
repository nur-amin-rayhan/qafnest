"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Shield, CalendarCheck, Banknote, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import MagneticButton from "@/components/ui/MagneticButton";

const RATES_BY_TYPE: Record<number, { name: string; rate: number }> = {
  1: { name: "Chalet with Private Pool", rate: 1850 },
  2: { name: "Private Luxury Villa", rate: 2900 },
  3: { name: "Heritage Organic Farm", rate: 2200 },
  4: { name: "Desert Glamping Camp", rate: 1450 },
};

export default function HostPortal() {
  const { openHostModal } = useApp();

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
                Host Portal · انضم كمضيف
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg mb-4">
                Share Your Property. <br />
                <span className="text-gradient">Earn with QafNest.</span>
              </h2>
              <p className="text-sm text-muted/80 font-light leading-relaxed mb-6">
                Turn your luxury villa, private chalet, or farm into continuous high-yield revenue. We handle guest verification, damage insurance, and automated payouts.
              </p>

              {/* Host Perks */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-fg">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span>1,000,000 SAR Property Host Protection Guarantee</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-fg">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Complete control over calendar pricing & booking approval</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-fg">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <span>Instant bi-weekly direct bank transfers to your Saudi IBAN</span>
                </div>
              </div>

              <MagneticButton
                onClick={openHostModal}
                className="px-8 py-3.5 text-xs tracking-wider"
              >
                <span>List Your Property</span>
                <ArrowRight className="w-4 h-4" />
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
              <span className="text-[10px] uppercase tracking-wider font-bold text-violet-300 block mb-1">
                Estimated Monthly Earnings
              </span>
              <div className="font-display text-4xl sm:text-5xl font-bold text-gradient mb-2">
                {monthlyEarnings.toLocaleString()} ﷼
              </div>
              <p className="text-xs text-muted/70 mb-6">
                Based on seasonal average occupancy rates in Riyadh & Jeddah.
              </p>

              {/* Sliders */}
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted">Property Category:</span>
                    <span className="text-white font-semibold">
                      {currentType.name}
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
                    <span className="text-muted">Estimated Booked Nights / Month:</span>
                    <span className="text-white font-semibold">
                      {nights} Nights
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

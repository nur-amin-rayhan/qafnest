"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Apple } from "lucide-react";

export default function SafePayments() {
  return (
    <section id="payments" className="py-12 border-t border-violet-400/10 bg-surface/[0.03]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Accreditation & Security */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4 text-center lg:text-left"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-glow">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-fg flex items-center gap-2 justify-center lg:justify-start">
                <span>Safe & Certified Payment Methods</span>
                <span className="text-[10px] text-emerald-400 glass px-2 py-0.5 rounded-full font-mono">
                  SAMA Regulated
                </span>
              </h4>
              <p className="text-xs text-muted/70 font-light">
                Multiple secure payment channels with 256-Bit SSL Bank-Grade Encryption & 100% money-back arrival guarantee.
              </p>
            </div>
          </motion.div>

          {/* Right: Payment Method Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {/* Mada */}
            <div className="glass px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:border-emerald-400/40 transition-colors shadow-sm" data-cursor="hover">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-xs text-white tracking-wide">
                مدى mada
              </span>
            </div>

            {/* Apple Pay */}
            <div className="glass px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:border-white/40 transition-colors shadow-sm" data-cursor="hover">
              <Apple className="w-4 h-4 text-white" />
              <span className="font-bold text-xs text-white">Apple Pay</span>
            </div>

            {/* Tabby */}
            <div className="glass px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-white/10 hover:border-emerald-400/40 transition-colors shadow-sm" data-cursor="hover">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-xs text-emerald-300">tabby</span>
              <span className="text-[9px] text-muted ml-0.5">4 splits</span>
            </div>

            {/* Tamara */}
            <div className="glass px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-white/10 hover:border-fuchsia-400/40 transition-colors shadow-sm" data-cursor="hover">
              <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
              <span className="font-bold text-xs text-fuchsia-300">tamara</span>
              <span className="text-[9px] text-muted ml-0.5">4 splits</span>
            </div>

            {/* STC Pay */}
            <div className="glass px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:border-purple-400/40 transition-colors shadow-sm" data-cursor="hover">
              <span className="font-bold text-xs text-purple-300">stc pay</span>
            </div>

            {/* Visa / Mastercard */}
            <div className="glass px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:border-cyan-400/40 transition-colors shadow-sm" data-cursor="hover">
              <span className="font-bold text-xs text-cyan-300 font-mono">VISA</span>
              <span className="text-white/40">|</span>
              <span className="font-bold text-xs text-amber-300 font-mono">
                Mastercard
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

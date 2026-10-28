"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";
import { FAQS } from "@/data/properties";

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-300 mb-3 border border-violet-500/20 shadow-glow"
          >
            <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
            Frequently Asked Questions · الأسئلة الشائعة
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg"
          >
            Got Questions? <span className="text-gradient">We’ve Got Answers.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-sm text-muted/70 font-light"
          >
            Everything you need to know about booking, self check-in smart locks, Ministry of Tourism regulations, and Tabby split payments.
          </motion.p>
        </div>

        {/* FAQ Accordion Items */}
        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`glass glow-border rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? "border-violet-400/40 shadow-glow" : ""
                }`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display font-bold text-base sm:text-lg text-fg">
                    {faq.question}
                  </span>
                  <div
                    className={`h-8 w-8 rounded-full glass flex items-center justify-center text-violet-300 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-luxe-gradient text-white shadow-glow" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-muted/80 leading-relaxed border-t border-white/5 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

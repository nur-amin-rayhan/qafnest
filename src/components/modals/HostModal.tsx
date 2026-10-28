"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function HostModal() {
  const { hostModalOpen, closeHostModal } = useApp();
  const [propType, setPropType] = useState("chalet");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!hostModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `🎉 Thank you ${name || "Partner"} for joining QafNest Host Network!\nOur dedicated onboarding team will contact you at ${phone} within 2 hours to verify your property license.`
    );
    closeHostModal();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={closeHostModal}
    >
      <div
        className="glass-strong glow-border max-w-lg w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeHostModal}
          className="absolute top-5 right-5 h-8 w-8 rounded-full glass flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="text-[11px] uppercase tracking-widest text-fuchsia-400 font-bold mb-1 block">
          Host with QafNest · انضم كمضيف
        </span>
        <h3 className="font-display text-2xl font-bold text-fg mb-1">
          List Your Property
        </h3>
        <p className="text-xs text-muted/70 mb-5">
          Start earning up to 45,000 SAR monthly with full host protection.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              Property Type
            </label>
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value)}
              className="w-full rounded-xl bg-surface/[0.05] border border-white/10 px-4 py-2.5 text-fg focus:outline-none focus:border-violet-400 cursor-pointer"
            >
              <option value="chalet" className="bg-gray-900 text-white">
                Chalet & Resort (شاليه أو منتجع)
              </option>
              <option value="villa" className="bg-gray-900 text-white">
                Private Villa (فيلا خاصة)
              </option>
              <option value="farm" className="bg-gray-900 text-white">
                Country Farm (مزرعة خاصة)
              </option>
              <option value="camp" className="bg-gray-900 text-white">
                Desert Camp / Caravan (مخيم أو كرفان)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              City / Region
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Riyadh, Al-Ammariyah or Jeddah, Obhur"
              className="w-full rounded-xl bg-surface/[0.05] border border-white/10 px-4 py-2.5 text-fg placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              Owner / Manager Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full rounded-xl bg-surface/[0.05] border border-white/10 px-4 py-2.5 text-fg placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              Mobile Phone (WhatsApp Active)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 5X XXX XXXX"
              className="w-full rounded-xl bg-surface/[0.05] border border-white/10 px-4 py-2.5 text-fg placeholder:text-muted/40 focus:outline-none focus:border-violet-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-luxe-gradient text-white font-bold text-sm tracking-wide shadow-glow hover:shadow-glow-lg transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Submit Property for Host Verification</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

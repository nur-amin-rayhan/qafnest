"use client";

import { useApp } from "@/context/AppContext";
import { Sparkles, Palmtree, Home, Trees, Tent, Building2 } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Stays", icon: Sparkles },
  { id: "chalet", label: "Chalets & Resorts", icon: Palmtree },
  { id: "villa", label: "Private Villas", icon: Home },
  { id: "farm", label: "Country Farms", icon: Trees },
  { id: "camp", label: "Desert Camps", icon: Tent },
  { id: "penthouse", label: "Serviced Apartments", icon: Building2 },
];

export default function CategoryPills() {
  const { selectedCategory, setSelectedCategory } = useApp();

  const handleSelect = (id: string) => {
    setSelectedCategory(id);
    const propertiesEl = document.getElementById("properties");
    if (propertiesEl) {
      propertiesEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="pt-4 pb-2 relative z-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`category-pill shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold glass border transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "border-violet-400/80 bg-violet-600/35 text-white shadow-glow"
                    : "border-white/10 text-muted hover:border-violet-400/40 hover:text-fg hover:bg-surface/[0.04]"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-fuchsia-300" : "text-muted"
                  }`}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

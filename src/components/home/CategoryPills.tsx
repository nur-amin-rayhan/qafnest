"use client";

import { useApp } from "@/context/AppContext";

const CATEGORIES = [
  { id: "all", label: "All Properties", ar: "الكل" },
  { id: "chalet", label: "Chalets & Resorts", ar: "شاليهات ومنتجعات" },
  { id: "villa", label: "Private Villas", ar: "فلل خاصة" },
  { id: "farm", label: "Country Farms", ar: "مزارع واستراحات" },
  { id: "camp", label: "Desert Camps", ar: "مخيمات فاخرة" },
  { id: "penthouse", label: "Sky Penthouses", ar: "بنتهاوس" },
];

export default function CategoryPills() {
  const { selectedCategory, setSelectedCategory } = useApp();

  return (
    <section className="pt-6 pb-2 relative z-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-pill shrink-0 px-4 py-2 rounded-full text-xs font-semibold glass border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "border-violet-400/80 bg-violet-600/30 text-white shadow-glow"
                    : "border-white/10 text-muted hover:border-violet-400/40 hover:text-fg"
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] text-muted/60 font-normal">
                  ({cat.ar})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

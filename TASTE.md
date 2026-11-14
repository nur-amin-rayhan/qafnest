# Taste Skill Specification · TASTE.md
> Based on the `Taste Skill` by LeonLnx. Provides an "Art Director's Eye" to eliminate sterile, generic AI templates by tuning three critical visual dimensions: **Boldness**, **Motion Intensity**, and **Visual Density**.

---

## 1. The Three Dimensions of Taste

```
       [ BOLDNESS ]              [ MOTION INTENSITY ]              [ VISUAL DENSITY ]
  Subtle  ───○─── Expressive     Static ───○─── Dynamic      Compact ───○─── Airy
  (Deliberate Contrast)         (Physics-based Springs)    (Context-aware Rhythm)
```

---

## 2. Dimension 1: Boldness (Scale: 1 – 10 · QafNest Setting: 8.5)

### Principles:
- **High Typographic Contrast**: Instead of having all headings blend into the page with similar medium weights, headlines have distinct character (Bold/Black DIN Next Arabic paired with Extrabold GeistVF).
- **Confident Whitespace**: Bold designs aren't cluttered; they use negative space intentionally to frame luxury properties.
- **Accented Hierarchy**: Only key value propositions and call-to-actions receive accent treatment; the rest is calm, restrained luxury.
- **Surface Elevation**: Layered depth (Obsidian background `#06060B` -> Container `#0A0A14` -> Card `#0E0E1A`) creates a tangible spatial hierarchy.

---

## 3. Dimension 2: Motion Intensity (Scale: 1 – 10 · QafNest Setting: 7.0)

### Motion Personality: *Tactile Luxury & Physics-based Fluidity*
Never use robotic linear transitions (`transition: all 0.3s linear`). Every interactive motion is calibrated using physics spring curves:

### Standard Spring Presets:
```typescript
export const tasteMotion = {
  // Snappy micro-interactions (buttons, pills, switches)
  snappySpring: {
    type: "spring",
    stiffness: 450,
    damping: 30,
    mass: 0.8,
  },
  
  // Gentle surface elevates (cards, dropdowns, modals)
  gentleSpring: {
    type: "spring",
    stiffness: 300,
    damping: 26,
    mass: 1.0,
  },
  
  // Staggered reveals (lists, property grids)
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  },
  
  // Fade and slide item
  fadeInUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};
```

### Accessibility (Reduced Motion):
- If `prefers-reduced-motion: reduce` is detected, all transforms and spring physics instantly fall back to instantaneous or simple opacity fades (`duration: 0.15s`).

---

## 4. Dimension 3: Visual Density (Context-Aware Tuning)

Rather than forcing a single rigid density everywhere, QafNest implements **three context-calibrated density tiers**:

| Context / Portal | Density Tier | Card Padding | Grid Gap | Element Height | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Guest Discovery (`apps/guest`)** | **Airy / Luxury** (`0.8`) | `p-6 lg:p-8` | `gap-6 lg:gap-8` | `h-12` (`48px`) | Immersive vacation discovery, high emotion, breathing room |
| **Host Portal (`apps/host`)** | **Balanced** (`1.0`) | `p-5 lg:p-6` | `gap-4 lg:gap-6` | `h-11` (`44px`) | Efficient listing creation, calendar management, clear forms |
| **Admin & CMS (`apps/cms`, `admin`)** | **Compact Data** (`1.3`) | `p-3 lg:p-4` | `gap-3` | `h-9` (`36px` desktop / 44px touch) | High information throughput, audit queues, financial ledger |

---

## 5. Summary Matrix for Developers & AI Agents

When authoring new UI components:
1. **Check Boldness**: Does this element have clear visual conviction and hierarchy, or is it timid and washed out?
2. **Check Motion**: Does this component feel tactile with spring feedback, or is it either static or unnaturally sluggish?
3. **Check Density**: Does the padding and gap match the portal context (Airy for Guest, Balanced for Host, Compact for Admin)?


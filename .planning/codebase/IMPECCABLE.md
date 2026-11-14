# Impeccable Design Quality & Anti-Slop Specification · IMPECCABLE.md
> Based on the `pbakaus/impeccable` design standard. Defines the 59 Anti-Slop Rules, automated audit criteria, and polish commands to eliminate tacky AI cliches and deliver world-class production craft.

---

## 1. The Impeccable Philosophy

AI coding agents left unguided produce "Statistical Average UI" (saturated purple gradients, raw emojis in cards, missing loading states, broken focus rings). **Impeccable** enforces strict automated guardrails to ensure every interface looks crafted by senior human product designers and frontend architects.

---

## 2. The 59 Anti-Slop Design Rules

### Group A: Typography & Content (Rules 1 – 12)
1. **No Gradient Headline Slop**: Never apply `bg-clip-text text-transparent bg-gradient-to-r` with saturated purple-blue to long headlines. Use solid high-contrast white (`#FFFFFF`) with optional single-word brand accent.
2. **No Emoji Icon Slop**: Never use raw emojis (🚀, 💡, ⚡, 💎, 🏖️) as icons inside feature cards, table headers, or buttons. Use crisp Lucide React icons with uniform `strokeWidth={1.75}`.
3. **No Blind Font Usage**: Avoid applying generic Inter across every element. Pair characterful Display fonts with crisp Body fonts and dedicated Arabic typefaces (`DINNextLTArabic`).
4. **Line-Length Discipline**: Never allow body copy paragraphs to span full-width displays without containment (`max-w-2xl` / `max-w-prose` max 65–75 characters per line).
5. **Clear Typographic Scale**: H1, H2, and H3 must have unmistakable size, weight, and letter-spacing differentials (never have H2 look virtually identical to H1).
6. **Optical Tracking**: Tighten letter-spacing on large headlines (`tracking-tight` / `-0.02em`) and loosen tracking on small uppercase metadata (`tracking-wider` / `+0.05em`).
7. **Tabular Numerals for Financials**: Any monetary amounts (SAR), percentages, and dates must use tabular numerals (`tabular-nums` or `font-mono`) to prevent visual jitter on updates.
8. **Sentence Casing**: Use sentence casing for body text, button labels, and feature descriptions. Avoid uppercase shout-styling except on micro category badges.
9. **Bilingual Baseline Alignment**: Arabic text and Latin text in mixed interfaces must optically share the same baseline; ensure `line-height` accounts for Arabic diacritics and tall ascenders.
10. **No Orphan Words**: Prevent single words wrapping to their own line at the end of paragraphs (`text-wrap: balance` or `text-wrap: pretty`).
11. **Semantic Text Hierarchy**: Don't use bold weights (`font-bold`) for secondary metadata or muted timestamps.
12. **Contrast Safe Text**: Text contrast must meet WCAG AA at minimum (4.5:1 for normal text, 3:1 for large text). Never use low-opacity gray on dark gray backgrounds.

### Group B: Color, Surfaces & Borders (Rules 13 – 24)
13. **Dark Canvas Depth**: Avoid pure flat `#000000` or muddy dark gray. Build depth with layered obsidian (`#06060B` canvas, `#0E0E1A` cards, `#161626` hover states).
14. **Hairline Glass Borders**: Instead of muddy drop-shadows on dark themes, use crisp 1px borders with subtle opacity (`border border-white/[0.08]`).
15. **Ambient Luminance over Heavy Drop Shadows**: Use soft, colored ambient glows (`rgba(124, 58, 237, 0.15)`) layered behind elevated cards instead of aggressive black shadows.
16. **Semantic Color Purity**:
    - **Emerald / Green**: Exclusively for verified licenses, instant bookings, positive financial yield, and completed statuses.
    - **Amber / Gold**: Exclusively for guest star ratings, pending actions, and warnings.
    - **Rose / Red**: Exclusively for cancellations, destructive actions, and input validation errors.
    - **Violet / Purple**: Exclusively for QafNest brand signature moments.
17. **No Hard-coded Contrast Clashes**: Colors must be managed through design tokens or CSS custom properties, never random uncalibrated inline hex values.
18. **Visible Disabled States**: Disabled buttons and inputs must remain legible (`opacity-50 cursor-not-allowed`) while visually signalling inactive state.
19. **Light Mode Elevation**: In light mode, elevate white cards with crisp 1px border (`border-slate-200`) and soft ambient shadow (`shadow-sm`).
20. **Interactive Border Hover**: Cards must illuminate their border slightly on hover (`hover:border-violet-500/40`) to reinforce affordance.
21. **Card Visual Weight**: Avoid heavy black borders inside cards that segment content unnecessarily. Use subtle dividers (`divide-white/[0.06]`).
22. **Consistent Color Harmony**: Never combine more than 2 distinct accent colors in a single card or modal.
23. **Selection Styling**: Custom text selection highlighting (`selection:bg-violet-500/30 selection:text-white`) matching the brand identity.
24. **Backdrop Filter Fallback**: Any `backdrop-blur` surface must declare an opaque or semi-opaque fallback background for browsers without backdrop-filter support.

### Group C: Interactivity, Buttons & States (Rules 25 – 36)
25. **Mandatory 4-State Interactivity**: Every button, link, and tab must declare:
    - Default state
    - Hover state (`hover:...`)
    - Active / Pressed state (`active:scale-[0.98]`)
    - Focus-Visible state (`focus-visible:ring-2`)
26. **Vercel Minimum Touch Target**: Every interactive button, link, and form control must measure at least **44 × 44 pixels** on mobile (`min-h-[44px] min-w-[44px]` or adequate padding).
27. **Never Kill Focus Outlines**: Never write `outline-none` without an immediate `focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2`.
28. **Mandatory Submit Loading State**: Any button that triggers a mutation, API call, or form submission must display a loading spinner, `disabled={isLoading}`, and `aria-busy={isLoading}`.
29. **Button Affordance**: Buttons must look like buttons. Avoid flat text links acting as primary call-to-actions without pill or rounded rectangle containment.
30. **No Fake Disabled Buttons**: Don't leave buttons clickable when required inputs are empty without giving immediate inline feedback.
31. **Hover Lift Physics**: Card hovers should feel tactile (`hover:-translate-y-0.5 transition-all duration-200 ease-out`).
32. **Cursor Pointer Everywhere Interactive**: Any clickable card, dropdown, or custom toggle must explicitly declare `cursor-pointer`.
33. **Instant Interactive Feedback**: Use immediate visual acknowledgment for clicks (ripple, micro scale, or color flash).
34. **Accessible Icon Buttons**: Every button containing only an icon must have an explicit `aria-label` describing the action.
35. **Form Error Clarity**: Error states must show clear error text directly beneath the field, not merely turning the border red.
36. **Dropdown Escape & Outside Click**: All modals, popovers, and dropdown menus must close when the user presses `Escape` or clicks outside.

### Group D: Layout, Spacing & Viewport (Rules 37 – 48)
37. **No Viewport Zoom Locking**: Strictly prohibit `user-scalable=no` or `maximum-scale=1.0` in Next.js viewport configurations. Users must be able to zoom up to 5x for accessibility.
38. **4px / 8px Grid Adherence**: Spacing must follow the 4px modular scale (`gap-1`, `gap-2`, `gap-4`, `gap-6`, `gap-8`, `gap-12`). No random arbitrary margins.
39. **No Horizontal Scroll on Mobile**: Every container must have `overflow-x-hidden` or fluid responsive sizing (`max-w-full`) to prevent horizontal layout breaks on mobile.
40. **Sticky Header Clearance**: Fixed/sticky navigation headers must not overlap modal dialogs, drawers, or mobile bottom sheets (proper z-index scale: nav 40, modal 50, toast 60).
41. **Card Aspect Ratios**: Property preview photos must maintain uniform aspect ratios (`aspect-[16/10]` or `aspect-[4/3]`) to prevent layout shifts (CLS).
42. **Fluid Responsive Grids**: Grids must adapt gracefully: 1 col on mobile, 2 cols on tablet, 3-4 cols on desktop (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
43. **Consistent Container Margins**: Mobile pages must maintain at least `16px` (`px-4`) side padding; desktop must center in `max-w-7xl mx-auto px-6 lg:px-8`.
44. **No Empty States Without Action**: Empty states (e.g., "No properties found", "No bookings yet") must include an icon, helpful message, and clear call-to-action button.
45. **Skeleton Loading Over Blank Screen**: Never show a blank page while fetching; render skeleton cards matching the exact layout of the target components.
46. **Consistent Radius Nesting**: An inner element's border-radius must be smaller than the parent container's radius (`R_inner = R_outer - padding`).
47. **Modal Scroll Containment**: Modals must trap scroll (`overflow-y-auto max-h-[85vh]`) so scrolling within the modal does not scroll the background page.
48. **Drawer & Sheet Mobile Ergonomics**: On mobile devices, bottom sheets are preferred over center modals for thumb-friendly reachability.

### Group E: Accessibility, Motion & Performance (Rules 49 – 59)
49. **Reduced Motion Respect**: Always respect `prefers-reduced-motion`. In Tailwind use `motion-reduce:transition-none motion-reduce:transform-none` or Framer Motion's `useReducedMotion()`.
50. **Image Alt Text Discipline**: Every `<Image>` or `<img>` must supply a descriptive `alt` attribute. If purely decorative, mark with `alt="" aria-hidden="true"`.
51. **Semantic HTML Landmarks**: Every page must have proper landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`.
52. **Heading Level Sequence**: Never skip heading levels (e.g., jumping from `<h1>` directly to `<h3>` or `<h4>`).
53. **Keyboard Tab Navigation**: Every interactive control must be reachable and operable via the `Tab` and `Enter`/`Space` keys.
54. **Form Field Labels**: Every form field must have an associated `<label>` (either wrapping or linked via `htmlFor`/`id`).
55. **No Flash of Unstyled Content (FOUC)**: Use `suppressHydrationWarning` on `<html>` and inline theme detection scripts for dark/light mode switching.
56. **Optimized Next.js Image Component**: Use Next.js `<Image />` with `sizes`, `priority` on hero images (LCP), and `loading="lazy"` on below-the-fold assets.
57. **High Contrast Focus Rings**: Focus ring color must contrast sharply against the surface (e.g. violet-400 against dark obsidian, or blue-600 against white).
58. **Clear Close Targets**: Modal and drawer close buttons must be prominent and placed consistently at the top corner with minimum 44px tap target.
59. **Live Announcer for Toast / Alerts**: Dynamic toast notifications and validation banners must include `role="alert"` or `aria-live="polite"` for screen readers.

---

## 3. Automated Impeccable Audit Script

The automated auditing engine is available via:
```bash
# Run design audit across all apps
npm run design:audit

# Run audit and auto-fix supported violations
npm run design:fix
```


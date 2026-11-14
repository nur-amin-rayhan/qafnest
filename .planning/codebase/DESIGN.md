# QafNest Design System · DESIGN.md
> Adapted from the VoltAgent Awesome Design (`DESIGN.md`) standard for world-class web applications (Stripe, Linear, Vercel). Tailored specifically for QafNest — Luxury Hospitality & Vacation Rentals across the Kingdom of Saudi Arabia.

---

## 1. Brand Identity & Visual North Star

QafNest balances **high-end Middle Eastern hospitality with sleek modern digital craft**.
- **No generic AI tropes**: Never use oversaturated purple-to-cyan text gradients, generic Inter font everywhere without hierarchy, or emoji icons inside feature cards.
- **Atmosphere**: Deep Obsidian night (`#06060B`), warm desert moonlight accents, crystal hairline glass (`rgba(255, 255, 255, 0.08)`), and focused royal amethyst brand highlights (`#7C3AED` / `#9333EA`).
- **Bilingual Typographic Harmony**: Latin (Geist / Display) and Arabic (DIN Next LT Arabic) must align optically in line-height, visual weight, and baseline.

---

## 2. Color Palette (Tokens & Contrast Safe)

### 2.1 Dark Mode (Primary Ecosystem Palette)
| Token Name | Value | Purpose / Usage | WCAG Ratio vs BG |
| :--- | :--- | :--- | :--- |
| `bg-primary` | `#06060B` | Deep Obsidian base canvas | - |
| `bg-surface` | `#0A0A14` | Section containers, panels | 1.1:1 |
| `bg-card` | `#0E0E1A` | Elevated interactive cards | 1.3:1 |
| `bg-card-hover` | `#161626` | Card hover state with 1px border highlight | 1.5:1 |
| `bg-glass` | `rgba(20, 16, 34, 0.60)` | Backdropped navigation & overlays | Blurred |
| `fg-primary` | `#FFFFFF` | Headlines, critical prices, titles | **19.8:1 (AAA)** |
| `fg-secondary` | `rgba(255, 255, 255, 0.88)` | Body text, card descriptions, labels | **16.5:1 (AAA)** |
| `fg-muted` | `#94A3B8` | Metadata, timestamps, helper text | **6.8:1 (AA)** |
| `fg-subtle` | `#64748B` | Disabled placeholders, inactive icons | **4.6:1 (AA)** |
| `line-subtle` | `rgba(255, 255, 255, 0.08)` | Standard card and table dividing lines | - |
| `line-focus` | `rgba(168, 85, 247, 0.40)` | Interactive focus rings & hovered borders | - |

### 2.2 Brand & Status Accents
| Token Name | Hex | Usage |
| :--- | :--- | :--- |
| `brand-violet-base` | `#7C3AED` | Primary buttons, active tabs, main badges |
| `brand-violet-hover`| `#6D28D9` | Button hover state |
| `brand-violet-glow` | `rgba(124, 58, 237, 0.25)` | Ambient elevation glow behind hero assets |
| `status-emerald` | `#059669` | Verified badge, Instant Booking, Confirmed status |
| `status-amber` | `#D97706` | Star ratings, licenses pending, review warnings |
| `status-rose` | `#E11D48` | Cancellation alert, destructive actions, error |

### 2.3 Light Mode (Fallback / High-Contrast Daytime Mode)
| Token Name | Value | Purpose / Usage |
| :--- | :--- | :--- |
| `bg-light` | `#FFFFFF` | Clean architectural white canvas |
| `surface-light` | `#F8FAFC` | Section fills and sidebars |
| `card-light` | `#FFFFFF` | Elevated white cards with subtle shadow |
| `fg-light-primary` | `#0F172A` | Primary text (Slate 900) |
| `fg-light-muted` | `#475569` | Secondary & metadata (Slate 600) |
| `line-light` | `#E2E8F0` | Structural dividers (Slate 200) |

---

## 3. Typography Scale & Hierarchy

### 3.1 Font Families
- **Display & Latin Sans**: `GeistVF`, `system-ui`, `sans-serif`
- **Arabic Display & Body**: `DINNextLTArabic` (Light 300, Regular 400, Medium 500, Bold 700, Black 900)
- **Monospace & Financials**: `GeistMonoVF`, `JetBrains Mono`, `monospace` (SAR pricing, booking reference IDs, dates)

### 3.2 Scale & Leading
| Level | Desktop Size / Leading | Mobile Size / Leading | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | `56px` / `1.1` (`leading-none`) | `36px` / `1.15` | 800 (Extrabold) | `-0.025em` | Landing hero value prop |
| **Title 1 (H1)** | `40px` / `1.2` | `28px` / `1.25` | 700 (Bold) | `-0.02em` | Page header, major category |
| **Title 2 (H2)** | `28px` / `1.3` | `22px` / `1.3` | 600 (Semibold) | `-0.015em` | Section headings, modal titles |
| **Title 3 (H3)** | `20px` / `1.4` | `18px` / `1.4` | 600 (Semibold) | `-0.01em` | Property titles in cards |
| **Body Large** | `18px` / `1.6` | `16px` / `1.5` | 400 (Regular) | `normal` | Hero subtext, lead paragraphs |
| **Body Regular**| `15px` / `1.6` | `14px` / `1.5` | 400 (Regular) | `normal` | Descriptions, specifications |
| **Caption / Meta**| `13px` / `1.4` | `12px` / `1.4` | 500 (Medium) | `+0.01em` | Badges, city tags, amenities |
| **Micro** | `11px` / `1.3` | `11px` / `1.3` | 600 (Semibold) | `+0.03em` (Uppercase) | Status indicators, micro tags |

---

## 4. Spacing System (Strict 4px / 8px Modular Scale)

Never use arbitrary ad-hoc pixel values like `p-[19px]` or `gap-[13px]`. Use the unified 4px scale:
```
  Token     Pixels      Tailwind Class    Primary Application
  -------   -------     --------------    -------------------------------------
  space-1     4px       p-1 / gap-1       Icon-to-text micro spacing, badge padding
  space-2     8px       p-2 / gap-2       Button inner gap, input padding y
  space-3    12px       p-3 / gap-3       Compact card padding, list gap
  space-4    16px       p-4 / gap-4       Standard card padding, form field gap
  space-5    20px       p-5 / gap-5       Medium modal padding
  space-6    24px       p-6 / gap-6       Standard section padding, card spacing
  space-8    32px       p-8 / gap-8       Section divider spacing desktop
  space-12   48px       p-12 / gap-12     Page section margins
  space-16   64px       p-16 / gap-16     Hero section vertical padding
  space-24   96px       p-24 / gap-24     Major landing block separations
```

---

## 5. Border Radii & Geometry

Consistent geometric rhythm across all cards and interactive surfaces:
- **`rounded-md` (`6px`)**: Micro tags, dropdown menu items, tooltips.
- **`rounded-lg` (`8px`)**: Standard buttons, form input fields, date picker cells.
- **`rounded-xl` (`12px`)**: Sub-cards, media thumbnails, feature items.
- **`rounded-2xl` (`16px`)**: Property cards, pricing tables, drawer panels.
- **`rounded-3xl` (`24px`)**: Hero containers, booking checkout modals.
- **`rounded-full` (`9999px`)**: User avatars, filter pills, badge tags.

---

## 6. Elevation & Shadows

Avoid muddy black drop-shadows on dark canvases. Use **ambient luminance + crisp perimeter outlines**:
```css
/* Card Elevation */
box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.45);
border: 1px solid rgba(255, 255, 255, 0.08);

/* Elevated Hover */
box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 24px -2px rgba(124, 58, 237, 0.15);
border: 1px solid rgba(168, 85, 247, 0.35);

/* Floating Dropdown / Popover */
box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.75);
border: 1px solid rgba(255, 255, 255, 0.12);
backdrop-filter: blur(16px);
```

---

## 7. Component Patterns

### 7.1 Primary Action Button
- Minimum touch target: `44px` height (`min-h-[44px]`).
- Padding: `px-5 py-2.5`.
- Radius: `rounded-lg`.
- Focus Ring: `focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060B] focus-visible:outline-none`.
- Active Press: `active:scale-[0.98] transition-transform`.
- Loading State: Always shows spinner icon + `aria-busy="true"` + `disabled`.

### 7.2 Property Card
- Aspect ratio for preview photo: `16:10` or `4:3`.
- Price display: Prominent currency in SAR (`SAR 1,850 / night`) with clear typography.
- Status indicator: Subtle pill badge on top corner (`Verified Chalet`, `Instant Book`).

### 7.3 Iconography Standard
- **Always use Lucide React icons** (`lucide-react`) with consistent stroke (`strokeWidth={1.75}`).
- **Strictly prohibit raw emojis** (such as ⚡, 🚀, 🏡, 💰) as feature card icons.


---
name: RemeLearning
description: Spaced repetition against your own mistakes — an AI-powered English speaking coach
colors:
  primary: "#1D4ED8"
  primary-foreground: "#F4F8FC"
  secondary: "#DBEAFE"
  secondary-foreground: "#1E3A8A"
  accent-warm: "#C2410C"
  accent-warm-foreground: "#FFF7ED"
  background: "#F4F8FC"
  foreground: "#101B2D"
  card: "#FFFFFF"
  muted: "#EAF1FA"
  muted-foreground: "#56708A"
  destructive: "#DC2626"
  border: "#D3E3F3"
  sidebar: "#1E3A8A"
  sidebar-foreground: "#DCE8FB"
typography:
  heading:
    fontFamily: "Fredoka, sans-serif"
    fontWeight: 500
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Nunito Variable, sans-serif"
    fontWeight: 400
rounded:
  sm: "calc(1.15rem * 0.55)"
  md: "calc(1.15rem * 0.75)"
  lg: "1.15rem"
  xl: "calc(1.15rem * 1.3)"
  2xl: "calc(1.15rem * 1.7)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.625rem"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.primary}, transparent 20%)"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
  card-default:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  input-default:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.625rem"
---

# Design System: RemeLearning

## 1. Overview

**Creative North Star: "The Study Companion"**

RemeLearning is a calm-blue study surface that runs a warm, energetic pulse underneath it —
"Focused Blue" (the palette's own name in the codebase) carries the credibility and concentration
a learner needs to trust what the app tells them about their own mistakes, while the orange
accent, motion, and copy carry the encouragement. The two are deliberately split: **the base
palette earns trust, the accent and motion earn momentum.** This system explicitly rejects the
generic AI-SaaS dashboard look — no hero-metric tiles, no gradient text, no side-stripe accent
borders, no identical icon+heading+text card grids repeated down the page — and it rejects
childish gamification (mascots, confetti, badge walls). Energy here reads as *responsive and
warm*, not loud.

Every weak point or recommendation the app surfaces is evidence pulled from the learner's own
recordings; the interface should always make that traceability visible (which recording, how
often, how recently) rather than presenting a recommendation as generic advice.

**Key Characteristics:**
- Calm blue base (background, primary, sidebar) for trust and low cognitive load
- One warm orange accent (`accent-warm`) reserved for CTAs and celebratory/motivating moments
- Soft, generous corner radii (1.15rem base) — a rounded, approachable geometry (Fredoka headings reinforce this)
- Flat-plus-glow: nearly flat surfaces, with a soft colored glow (`shadow-clay`) reserved for elevated, primary elements
- Two-weight type system: Fredoka for headings (personality), Nunito for body (readability)

## 2. Colors

A calm, low-chroma blue base with a single warm accent — restrained-to-committed on the primary hue, with the warm accent used sparingly and deliberately.

### Primary
- **Focused Blue** (`#1D4ED8`): primary actions, links, active nav/tab states, focus rings. The trust anchor of the system — used deliberately, not washed across every surface.

### Secondary
- **Pale Sky** (`#DBEAFE` / text `#1E3A8A`): secondary buttons, selected chips, low-emphasis highlights that still read as "in the blue family."

### Tertiary
- **Ember Orange** (`#C2410C` / text `#FFF7ED`): the one warm accent in the system. Reserved for primary CTAs that need urgency or celebration (e.g. "start practice," a streak milestone, a completed recommendation) — never for routine UI chrome.

### Neutral
- **Frost Blue** (`#F4F8FC`): app background, lightly tinted toward the brand hue rather than true white.
- **Deep Ink Navy** (`#101B2D`): body text and headings — verified for AA contrast against Frost Blue.
- **Card White** (`#FFFFFF`): card and popover surfaces, the one true-white layer.
- **Muted Mist** (`#EAF1FA` / text `#56708A`): disabled states, secondary metadata, subtle section backgrounds.
- **Hairline Blue** (`#D3E3F3`): borders and input strokes — always a tint of the primary hue, never plain gray.
- **Deep Study Navy** (`#1E3A8A`, sidebar-only): the sidebar inverts to this dark navy, giving the app shell a distinct "control room" register from the light content surfaces.

### Named Rules
**The One Accent Rule.** Ember Orange (`accent-warm`) appears on at most one element per screen — the single primary CTA or a celebratory state. If two elements compete for it, one loses.

**The No-Gray-Text Rule.** Body and label text never drop to a flat neutral gray; `muted-foreground` (`#56708A`) is always a tint of the primary hue, kept at ≥4.5:1 contrast against its background.

## 3. Typography

**Display/Heading Font:** Fredoka (weights 500/600/700), with sans-serif fallback
**Body Font:** Nunito Variable, with sans-serif fallback

**Character:** Fredoka's rounded terminals give headings a friendly, slightly playful voice without tipping into a children's app; Nunito keeps body copy warm but highly legible at small sizes. The pairing is a geometric-vs-humanist contrast, not two similar sans-serifs stacked together.

### Hierarchy
- **Headline** (Fredoka, weight 600–700, tight tracking `-0.01em`): page titles, dashboard section headers.
- **Title** (Fredoka, weight 500, `text-base`/`text-sm`): card titles, dialog titles, field legends — anything carrying `[data-slot="*-title"]`.
- **Body** (Nunito, weight 400, `text-sm`/`text-base`): all prose and UI copy; cap prose blocks at 65–75ch.
- **Label** (Nunito, weight 500, `text-xs`/`text-sm`): form labels, badges, muted metadata (timestamps, counts).

### Named Rules
**The Two-Voice Rule.** Only two families exist in this system: Fredoka for anything that is a heading/title, Nunito for everything else. Never introduce a third family for "emphasis."

## 4. Elevation

Nearly flat at rest — most surfaces (inputs, muted panels, secondary buttons) carry no shadow at all, only a `ring-1 ring-foreground/10` hairline. Shadows are reserved as a **hybrid**: a soft, colored "clay" glow used only on the primary/elevated elements that most need to invite interaction (hero cards, primary CTAs, the active/focused element), not as ambient depth for every card.

### Shadow Vocabulary
- **`shadow-clay`** (inset highlight + soft blue-tinted glow, `box-shadow: inset 0 1px 0 …, 0 4px 10px -4px color-mix(in oklch, var(--primary), transparent 82%), 0 18px 36px -16px color-mix(in oklch, var(--primary), transparent 68%)`): the primary elevation treatment — a soft blue-tinted lift, used on the app's most important surface per screen.
- **`shadow-clay-warm`** (same construction, tinted with `accent-warm`): the celebratory variant — pairs with the One Accent Rule, used only where the warm accent itself is already present.

### Named Rules
**The Earned Glow Rule.** A card gets `shadow-clay` only if it's the single most important surface on its screen. Everything else stays flat with a hairline ring; if every card glows, none of them do.

## 5. Components

### Buttons
- **Shape:** `rounded-lg` at default size (`min(var(--radius-md), 10-12px)` at compact sizes) — soft corners, never fully pill-shaped, never sharp.
- **Primary:** `bg-primary` / `text-primary-foreground`, `hover:bg-primary/80`. The default action across the app.
- **Secondary:** `bg-secondary` / `text-secondary-foreground` — the Pale Sky treatment, for the second-priority action alongside a primary.
- **Outline / Ghost:** transparent or bordered, `hover:bg-muted` — for tertiary/low-emphasis actions (cancel, dismiss).
- **Destructive:** tinted `bg-destructive/10` with `text-destructive`, not a solid red fill — keeps destructive actions legible without shouting.
- **Hover / Focus:** all variants ease via `transition-all`; focus state is a 3px `ring-ring/50` plus a border color shift, never an outline-less focus state.

### Cards / Containers
- **Corner Style:** `rounded-xl` (~1.15rem), consistent with the system's soft-geometry rule.
- **Background:** Card White (`#FFFFFF`) on the Frost Blue app background — the one true-white layer in the system.
- **Shadow Strategy:** flat by default (`ring-1 ring-foreground/10` hairline only); `shadow-clay` reserved per the Earned Glow Rule.
- **Internal Padding:** `--card-spacing` token, 3–4 spacing units depending on `size` variant (`sm` vs `default`).

### Inputs / Fields
- **Style:** transparent background, `border-input` (Hairline Blue) stroke, `rounded-lg`.
- **Focus:** border shifts to `ring` color plus a 3px `ring-ring/50` glow — same focus language as buttons, for consistency.
- **Error:** `aria-invalid` swaps the border and ring to `destructive` at reduced opacity — never a full-saturation red border.

### Navigation (Sidebar)
- **Style:** inverts to Deep Study Navy (`#1E3A8A`) background with light foreground text — the one surface in the system that flips light/dark logic, giving the shell a distinct "control room" identity from the light content area.
- **States:** active/hover uses `sidebar-accent` (a low-opacity white wash), not the primary blue, since the sidebar itself is already blue.

## 6. Do's and Don'ts

### Do:
- **Do** keep Ember Orange (`#C2410C`) to one element per screen — the single primary CTA or a celebratory moment (Named Rule: The One Accent Rule).
- **Do** tint every neutral (background, muted, border) toward the primary blue hue rather than reaching for flat gray.
- **Do** reserve `shadow-clay` for the single most important surface per screen; everything else stays flat with a hairline ring.
- **Do** ground every weak-point/recommendation card in traceable evidence (source recording, frequency, recency) rather than presenting it as generic advice.
- **Do** carry energy through motion, copy, and the warm accent — not by widening the base palette's saturation.

### Don't:
- **Don't** use hero-metric-card templates, gradient text, or side-stripe colored borders (border-left/right accents) — explicit anti-references from PRODUCT.md.
- **Don't** repeat the identical icon+heading+text card grid across sections; vary structure per the content's actual shape.
- **Don't** add tiny uppercase eyebrows above every section — that scaffold is banned outright.
- **Don't** introduce mascots, confetti, or badge-wall gamification — energetic and playful stops short of childish.
- **Don't** drop body or label text to flat gray; `muted-foreground` must stay a blue-tinted, ≥4.5:1-contrast color.
- **Don't** add a third font family for "emphasis" — Fredoka (headings) and Nunito (body) are the whole system.

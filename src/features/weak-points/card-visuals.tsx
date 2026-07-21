import { AlertTriangle, AudioLines, BookOpen, CircleCheck, ClockFading, SpellCheck } from "lucide-react"
import type { ComponentType, SVGProps } from "react"
import type { Category } from "@/types/api"

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

interface DomainVisual {
  icon: IconComponent
  /** Tailwind classes for the round icon chip. Kept inside the existing teal-family
   * tokens (primary / secondary / foreground) so the three domains stay in the same
   * palette - the icon shape carries most of the differentiation, color is a second cue,
   * never the only one (see aria-label usage at the call sites). */
  chipClassName: string
}

// One icon + tonal chip per analysis domain. WeakPointCard and RecommendationCard both
// read from this single map so a domain always looks the same whether it's showing up as
// evidence (a weak point) or as a suggested fix (a recommendation) - the two card types are
// meant to read as siblings, not unrelated designs.
const DOMAIN_VISUALS: Record<Category, DomainVisual> = {
  vocabulary: { icon: BookOpen, chipClassName: "bg-primary text-primary-foreground" },
  grammar: { icon: SpellCheck, chipClassName: "bg-secondary text-secondary-foreground" },
  pronunciation: { icon: AudioLines, chipClassName: "bg-foreground/10 text-foreground" },
}

export function getDomainVisual(category: Category): DomainVisual {
  return DOMAIN_VISUALS[category]
}

export type ForgettingBand = "low" | "medium" | "high"

// Bands the raw 0-1 forgetting score into three tiers so severity reads as a real
// difference in a card's visual weight (badge tone, title weight, ring color) rather than
// only a number buried in a progress bar. The 0.66 cutoff mirrors the threshold the old
// "urgent" badge already used, extended downward with a 0.33 midpoint.
export function getForgettingBand(score: number): ForgettingBand {
  if (score >= 0.66) return "high"
  if (score >= 0.33) return "medium"
  return "low"
}

interface BandTone {
  icon: IconComponent
  badgeClassName: string
  ringClassName: string
}

// Deliberately never touches accent-warm: severity here is a routine, per-card signal that
// can appear many times on one screen, and the One Accent Rule reserves the warm accent for
// at most one element per screen (a genuine milestone/CTA), not for everyday risk labeling.
const BAND_TONES: Record<ForgettingBand, BandTone> = {
  high: {
    icon: AlertTriangle,
    badgeClassName: "bg-destructive/10 text-destructive",
    ringClassName: "ring-destructive/20",
  },
  medium: {
    icon: ClockFading,
    badgeClassName: "bg-secondary text-secondary-foreground",
    ringClassName: "ring-foreground/10",
  },
  low: {
    icon: CircleCheck,
    badgeClassName: "bg-muted text-muted-foreground",
    ringClassName: "ring-foreground/10",
  },
}

export function getBandTone(band: ForgettingBand): BandTone {
  return BAND_TONES[band]
}

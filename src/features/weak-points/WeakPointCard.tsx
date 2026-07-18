import { Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getBandTone, getDomainVisual, getForgettingBand } from "@/features/weak-points/card-visuals"
import { cn } from "@/lib/utils"
import type { WeakPoint } from "@/types/api"

interface WeakPointCardProps {
  weakPoint: WeakPoint
  /** Marks the single highest-forgetting-score item in the current view as the one to
   * tackle next - the only card per screen that earns the shadow-clay glow (Earned Glow
   * Rule) and the only place "the next primary action" is visually singled out. */
  isPriority?: boolean
}

export function WeakPointCard({ weakPoint, isPriority = false }: WeakPointCardProps) {
  const { t } = useTranslation()
  const percent = Math.min(100, Math.round(weakPoint.forgettingScore * 100))
  const band = getForgettingBand(weakPoint.forgettingScore)
  const tone = getBandTone(band)
  const domain = getDomainVisual(weakPoint.category)
  const DomainIcon = domain.icon
  const BandIcon = tone.icon

  return (
    <Card
      className={cn(
        isPriority ? "shadow-clay ring-1 ring-primary/15" : `ring-1 ${tone.ringClassName}`
      )}
    >
      <CardContent className="flex flex-col gap-3">
        {/* Header: domain icon (color/shape identifies vocabulary/grammar/pronunciation),
            title, and a severity badge that carries both an icon and text so risk is never
            conveyed by color alone. */}
        <div className="flex items-start gap-3">
          <span
            role="img"
            aria-label={t(`categories.${weakPoint.category}`)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              domain.chipClassName
            )}
          >
            <DomainIcon className="size-4.5" aria-hidden="true" />
          </span>
          <h3
            className={cn(
              "min-w-0 flex-1 truncate font-heading text-base leading-snug",
              band === "high" && "font-semibold"
            )}
          >
            {weakPoint.label}
          </h3>
          <Badge className={cn("shrink-0 gap-1", tone.badgeClassName)}>
            <BandIcon className="size-3.5" aria-hidden="true" />
            {t(`weakPoints.band.${band}`)}
          </Badge>
        </div>

        {/* The forgetting score itself, plus a plain-language explanation of what that
            number means for this item - the score is the one real "why is this here" signal
            the API exposes today, so it's spelled out rather than left as a bare decimal. */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("weakPoints.forgettingScore")}</span>
            <span className="font-medium tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t(`weakPoints.bandHint.${band}`)}
          </p>
        </div>

        {weakPoint.recommendation && (
          <div className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground/90">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <p>
              <span className="font-medium text-foreground">{t("weakPoints.recommendation")}: </span>
              {weakPoint.recommendation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

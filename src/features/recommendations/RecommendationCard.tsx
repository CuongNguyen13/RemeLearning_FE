import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getBandTone, getDomainVisual, getForgettingBand } from "@/features/weak-points/card-visuals"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Recommendation } from "@/types/api"

interface RecommendationCardProps {
  recommendation: Recommendation
  /** Marks the single highest-forgetting-score recommendation in the current view - mirrors
   * WeakPointCard's `isPriority` so the two card types stay visual siblings. */
  isPriority?: boolean
}

export function RecommendationCard({ recommendation, isPriority = false }: RecommendationCardProps) {
  const { t, i18n } = useTranslation()
  const band = getForgettingBand(recommendation.forgettingScore)
  const tone = getBandTone(band)
  const domain = getDomainVisual(recommendation.category)
  const DomainIcon = domain.icon
  const BandIcon = tone.icon

  return (
    <Card
      className={cn(
        isPriority ? "shadow-clay ring-1 ring-primary/15" : `ring-1 ${tone.ringClassName}`
      )}
    >
      <CardContent className="flex flex-col gap-3">
        {/* Same header shape as WeakPointCard: domain icon, title, severity badge - the
            weak point that this recommendation addresses and the recommendation itself
            should read as one visual family, not two unrelated card designs. */}
        <div className="flex items-start gap-3">
          {/* Domain chip, mirrored from WeakPointCard so the two card types read as siblings.
              Decorative — category name is conveyed by the badge and heading text. */}
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              domain.chipClassName
            )}
          >
            <DomainIcon className="size-4.5" />
          </span>
          <h3
            className={cn(
              "min-w-0 flex-1 truncate font-heading text-base leading-snug",
              band === "high" && "font-semibold"
            )}
          >
            {recommendation.label}
          </h3>
          <Badge className={cn("shrink-0 gap-1", tone.badgeClassName)}>
            <BandIcon className="size-3.5" aria-hidden="true" />
            {t(`weakPoints.band.${band}`)}
          </Badge>
        </div>

        {/* Real traceability: when this recommendation was last generated/updated, in the
            learner's own locale-relative phrasing (e.g. "2 days ago"). */}
        <p className="text-xs text-muted-foreground">
          {t("recommendations.updated", {
            time: formatRelativeTime(recommendation.updatedAt, i18n.language),
          })}
        </p>

        <p className="text-sm text-muted-foreground">{recommendation.recommendationText}</p>

        {recommendation.exercises.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t("recommendations.exercises")}
            </p>
            <ul className="flex flex-col gap-1.5">
              {recommendation.exercises.map((exercise, index) => (
                <li
                  key={index}
                  className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground/90"
                >
                  {exercise}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

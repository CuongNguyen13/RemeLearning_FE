import { Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDomainVisual } from "@/features/weak-points/card-visuals"
import { CardListSkeleton } from "@/features/weak-points/CardListSkeleton"
import { RecommendationCard } from "@/features/recommendations/RecommendationCard"
import { useLearnerRecommendations } from "@/features/recommendations/hooks"
import { useAuthStore } from "@/stores/auth-store"
import type { Category } from "@/types/api"

const CATEGORIES: Category[] = ["vocabulary", "grammar", "pronunciation"]

export function RecommendationsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError, refetch } = useLearnerRecommendations(user?.userId ?? "")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("recommendations.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("recommendations.subtitle")}</p>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite">
          <span className="sr-only">{t("common.loading")}</span>
          <CardListSkeleton />
        </div>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && (
        <Tabs defaultValue="vocabulary">
          <TabsList>
            {CATEGORIES.map((category) => {
              const Icon = getDomainVisual(category).icon
              return (
                <TabsTrigger key={category} value={category}>
                  <Icon className="size-4" aria-hidden="true" />
                  {t(`categories.${category}`)}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {CATEGORIES.map((category) => {
            // Same worst-first ordering as WeakPointsPage, so the two lists prioritize
            // consistently and the top card in each tab is the one that most needs action.
            const items = [...(data[category] ?? [])].sort(
              (a, b) => b.forgettingScore - a.forgettingScore
            )
            return (
              <TabsContent key={category} value={category}>
                {items.length === 0 ? (
                  <EmptyState
                    icon={<Lightbulb className="size-8 text-primary" aria-hidden="true" />}
                    title={t("recommendations.emptyTitle", { category: t(`categories.${category}`) })}
                    description={t("recommendations.emptyDescription")}
                  />
                ) : (
                  <RevealGroup className="flex flex-col gap-3">
                    {items.map((recommendation, index) => (
                      <RevealItem key={recommendation.itemId}>
                        <RecommendationCard recommendation={recommendation} isPriority={index === 0} />
                      </RevealItem>
                    ))}
                  </RevealGroup>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}

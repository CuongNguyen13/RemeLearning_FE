import { CircleCheckBig } from "lucide-react"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardListSkeleton } from "@/features/weak-points/CardListSkeleton"
import { getDomainVisual } from "@/features/weak-points/card-visuals"
import { WeakPointCard } from "@/features/weak-points/WeakPointCard"
import { useLearnerWeakPoints } from "@/features/weak-points/hooks"
import { useAuthStore } from "@/stores/auth-store"
import type { Category } from "@/types/api"

const CATEGORIES: Category[] = ["vocabulary", "grammar", "pronunciation"]

export function WeakPointsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError, refetch } = useLearnerWeakPoints(user?.userId ?? "")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("weakPoints.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("weakPoints.subtitle")}</p>
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
            // Worst-first ordering surfaces the item most in need of review at the top of
            // each tab, and lets the single highest-scoring card earn the shadow-clay glow
            // (Earned Glow Rule) as "the next thing to act on" for that skill.
            const items = [...(data[category] ?? [])].sort(
              (a, b) => b.forgettingScore - a.forgettingScore
            )
            return (
              <TabsContent key={category} value={category}>
                {items.length === 0 ? (
                  <EmptyState
                    icon={<CircleCheckBig className="size-8 text-accent-warm" aria-hidden="true" />}
                    title={t("weakPoints.emptyTitle", { category: t(`categories.${category}`) })}
                    description={t("weakPoints.emptyDescription")}
                  />
                ) : (
                  <RevealGroup className="flex flex-col gap-3">
                    {items.map((weakPoint, index) => (
                      <RevealItem key={weakPoint.itemId}>
                        <WeakPointCard weakPoint={weakPoint} isPriority={index === 0} />
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

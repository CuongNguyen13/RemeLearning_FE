import { Mic } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryProgressChart } from "@/features/dashboard/CategoryProgressChart"
import { useLearnerOverview } from "@/features/dashboard/hooks"
import { formatDate, formatRelativeTime } from "@/lib/format"
import { useAuthStore } from "@/stores/auth-store"
import type { CategoryProgress } from "@/types/api"

// Maps a raw API status string (e.g. "UPLOADED", "COMPLETED") to one of the three
// translated labels the learner actually cares about. The dashboard shows only a handful
// of recordings, so this simple lookup is sufficient — the full RecordingStatusBadge in
// RecordingsPage handles the complete status map with icons and colors.
type DashboardStatusTone = "processing" | "ready" | "failed" | "unknown"

const STATUS_TO_TONE: Record<string, DashboardStatusTone> = {
  uploaded: "processing",
  pending: "processing",
  queued: "processing",
  processing: "processing",
  transcribing: "processing",
  analyzing: "processing",
  ready: "ready",
  completed: "ready",
  analyzed: "ready",
  done: "ready",
  failed: "failed",
  error: "failed",
}

function recordingStatusLabel(
  status: string,
  t: (key: string) => string
): { label: string; tone: DashboardStatusTone } {
  const tone = STATUS_TO_TONE[status.toLowerCase()] ?? "unknown"
  const labelMap: Record<DashboardStatusTone, string> = {
    processing: t("recordings.statusProcessing"),
    ready: t("recordings.statusReady"),
    failed: t("recordings.statusFailed"),
    unknown: status,
  }
  return { label: labelMap[tone], tone }
}

// Picks the category with the most recently updated weak points, used to ground the practice
// callout in a specific, traceable piece of evidence rather than an abstract total.
function mostRecentProgress(categoryProgress: CategoryProgress[]): CategoryProgress | undefined {
  return [...categoryProgress]
    .filter((entry) => entry.weakPointCount > 0)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError, refetch } = useLearnerOverview(user?.userId ?? "")

  const hasRecordings = (data?.recentRecordings.length ?? 0) > 0
  const totalWeakPoints = data?.categoryProgress.reduce((sum, c) => sum + c.weakPointCount, 0) ?? 0
  const hasWeakPoints = totalWeakPoints > 0
  const recentProgress = data ? mostRecentProgress(data.categoryProgress) : undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("dashboard.welcome", { name: user?.name ?? "" })}
        </h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && !hasRecordings && (
        <RevealGroup>
          <RevealItem>
            {/* First-time learner: nothing has been analyzed yet, so replace the whole dashboard
                with one welcoming explanation of the loop instead of several blank-looking
                widgets - this is the single glowing, one-accent surface on this screen. */}
            <Card className="shadow-clay-warm">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-warm/10 text-accent-warm">
                  <Mic className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-medium">{t("dashboard.emptyTitle")}</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {t("dashboard.emptyDescription")}
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  render={<Link to="/recordings" />}
                  className="bg-accent-warm text-accent-warm-foreground hover:bg-accent-warm/90"
                >
                  {t("dashboard.uploadFirstCta")}
                </Button>
              </CardContent>
            </Card>
          </RevealItem>
        </RevealGroup>
      )}

      {data && hasRecordings && (
        <RevealGroup className="flex flex-col gap-6">
          <RevealItem>
            {/* The practice loop's next step, grounded in the learner's own data (how many weak
                points, which category, how recently) rather than an abstract stat tile. Glows
                only while it carries the one warm CTA, per the Earned Glow + One Accent rules. */}
            <Card className={hasWeakPoints ? "shadow-clay-warm" : undefined}>
              <CardHeader>
                <CardTitle>{t("dashboard.practiceCalloutTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {hasWeakPoints && recentProgress
                    ? t("dashboard.practiceCalloutSummary", {
                        count: totalWeakPoints,
                        category: t(`categories.${recentProgress.category}`),
                        time: formatRelativeTime(recentProgress.lastUpdated, i18n.language),
                      })
                    : t("dashboard.analysisPending")}
                </p>
                {hasWeakPoints && (
                  <Button
                    nativeButton={false}
                    render={<Link to="/practice" />}
                    className="shrink-0 bg-accent-warm text-accent-warm-foreground hover:bg-accent-warm/90"
                  >
                    {t("dashboard.practiceCalloutCta")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </RevealItem>

          <RevealItem>
            <CategoryProgressChart data={data.categoryProgress} />
          </RevealItem>

          <div className="grid gap-6 lg:grid-cols-2">
            <RevealItem>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t("dashboard.recentRecommendations")}</CardTitle>
                  <Link to="/recommendations" className="text-sm font-medium text-primary hover:underline">
                    {t("dashboard.viewAll")}
                  </Link>
                </CardHeader>
                <CardContent>
                  {data.recentRecommendations.length === 0 ? (
                    <EmptyState title={t("recommendations.empty")} />
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {data.recentRecommendations.slice(0, 5).map((rec) => (
                        <li
                          key={`${rec.category}-${rec.itemId}`}
                          className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{rec.label}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {rec.recommendationText}
                            </p>
                            {/* Traceability: ground this recommendation in why it exists - how
                                risky it is and how recently it was found. */}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("dashboard.recommendationMeta", {
                                score: Math.round(rec.forgettingScore * 100),
                                time: formatRelativeTime(rec.receivedAt, i18n.language),
                              })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {t(`categories.${rec.category}`)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </RevealItem>

            <RevealItem>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t("dashboard.recentRecordings")}</CardTitle>
                  <Link to="/recordings" className="text-sm font-medium text-primary hover:underline">
                    {t("dashboard.viewAll")}
                  </Link>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-3">
                    {data.recentRecordings.slice(0, 5).map((recording) => (
                      <li
                        key={recording.recordingId}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Mic className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="truncate text-sm font-medium">
                            {formatDate(recording.createdAt, i18n.language)}
                          </span>
                          <span
                            className="truncate font-mono text-xs text-muted-foreground"
                            title={recording.recordingId}
                          >
                            {t("dashboard.recordingLabel", {
                              id: recording.recordingId.slice(0, 8),
                            })}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={recordingStatusLabel(recording.status, t).tone === "failed" ? "destructive" : "secondary"}
                          >
                            {recordingStatusLabel(recording.status, t).label}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </RevealItem>
          </div>
        </RevealGroup>
      )}
    </div>
  )
}

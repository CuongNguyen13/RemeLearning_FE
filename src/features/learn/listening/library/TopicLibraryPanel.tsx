import { Ear, Lock } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { LoadingOverlay } from "@/components/common/LoadingOverlay"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionRunner } from "@/features/learn/listening/library/SectionRunner"
import { useListeningLibraryTopics, useStartListeningLibrarySection } from "@/features/learn/listening/library/hooks"
import { ApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import type { ListeningLibrarySection, ListeningLibraryTopicStatus } from "@/types/api"

interface TopicLibraryPanelProps {
  userId: string
  /**
   * Deep-link target from the merged-history "Làm lại" button - the panel auto-starts this
   * topic's Section once the topic list has loaded, provided it isn't LOCKED. Consumed exactly
   * once: {@link onInitialTopicHandled} fires right after the attempt (success or not) so the
   * caller can clear it and a later tab revisit doesn't re-trigger the auto-start.
   */
  initialTopicId?: number | null
  onInitialTopicHandled?: () => void
}

function statusVariant(status: ListeningLibraryTopicStatus): "default" | "secondary" | "outline" {
  if (status === "PASSED") return "default"
  if (status === "IN_PROGRESS") return "secondary"
  return "outline"
}

// Lists every seeded listening-library topic with this learner's own progression status - the same
// 4-state LOCKED/UNLOCKED/IN_PROGRESS/PASSED gating the grammar library uses (unlike vocabulary,
// which has no status concept). Starting a Section returns the whole passage/audio/question set in
// one call (unlike vocab's card-by-card Section, or grammar's separate theory-page route), so a
// started Section is just swapped in for the grid via local state rather than a route change.
export function TopicLibraryPanel({ userId, initialTopicId, onInitialTopicHandled }: TopicLibraryPanelProps) {
  const { t } = useTranslation()
  const { data: topics, isLoading, isError } = useListeningLibraryTopics(userId)
  const startSection = useStartListeningLibrarySection(userId)

  const [activeSection, setActiveSection] = useState<ListeningLibrarySection | null>(null)

  function handleStart(topicId: number) {
    startSection.mutate(topicId, {
      onSuccess: (section) => setActiveSection(section),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : t("learn.listening.library.startError")),
    })
  }

  // Auto-starts the "Làm lại" deep-link target once the topic list has loaded, exactly once - a
  // LOCKED topic (or one that no longer exists in the catalog) just falls through to the plain
  // topic grid below instead of erroring, since the learner's progress may have changed since the
  // history row was recorded. Guarded by a ref (not state) so this never re-fires on a later
  // re-render even if the parent is slow to clear initialTopicId via onInitialTopicHandled.
  const handledDeepLinkRef = useRef(false)
  useEffect(() => {
    if (handledDeepLinkRef.current || !topics || initialTopicId == null) return
    handledDeepLinkRef.current = true
    const target = topics.find((topic) => topic.id === initialTopicId)
    if (target && target.status !== "LOCKED") {
      handleStart(initialTopicId)
    }
    onInitialTopicHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, initialTopicId])

  if (activeSection) {
    return (
      <SectionRunner
        userId={userId}
        section={activeSection}
        onBackToTopics={() => setActiveSection(null)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState />
  }

  if (!topics || topics.length === 0) {
    return <EmptyState icon={<Ear className="size-6" />} title={t("learn.listening.library.emptyTitle")} />
  }

  const passedCount = topics.filter((topic) => topic.status === "PASSED").length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Progress value={topics.length === 0 ? 0 : Math.round((passedCount / topics.length) * 100)} />
        <span className="text-xs text-muted-foreground">
          {t("learn.listening.library.topicsPassed", { passed: passedCount, total: topics.length })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const locked = topic.status === "LOCKED"
          const isStartingThisTopic = startSection.isPending && startSection.variables === topic.id
          return (
            <Card key={topic.id} className={cn("relative", locked && "opacity-60")}>
              <LoadingOverlay show={isStartingThisTopic} label={t("common.generating")} />
              <CardContent className="flex flex-col gap-3 py-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{topic.name}</span>
                  {topic.level && <Badge variant="outline">{topic.level}</Badge>}
                </div>
                <Badge variant={statusVariant(topic.status)} className="w-fit">
                  {locked && <Lock className="size-3" />}
                  {t(`learn.listening.library.status.${topic.status}`)}
                </Badge>
                <Button
                  size="sm"
                  disabled={locked || startSection.isPending}
                  onClick={() => handleStart(topic.id)}
                >
                  {locked ? (
                    <>
                      <Lock /> {t("learn.listening.library.locked")}
                    </>
                  ) : (
                    t("learn.listening.library.startSection")
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

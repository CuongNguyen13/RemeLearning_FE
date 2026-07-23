import { Lock, Mic } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionRunner } from "@/features/learn/speaking/library/SectionRunner"
import { useSpeakingLibraryTopics, useStartSpeakingLibrarySection } from "@/features/learn/speaking/library/hooks"
import { ApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import type { SpeakingLibrarySection, SpeakingLibraryTopicStatus } from "@/types/api"

interface TopicLibraryPanelProps {
  userId: string
}

function statusVariant(status: SpeakingLibraryTopicStatus): "default" | "secondary" | "outline" {
  if (status === "PASSED") return "default"
  if (status === "IN_PROGRESS") return "secondary"
  return "outline"
}

// Lists every seeded speaking-library topic with this learner's own progression status - the same
// 4-state LOCKED/UNLOCKED/IN_PROGRESS/PASSED gating the listening/grammar libraries use. Starting a
// Section returns the whole pool of sample sentences for that topic in one call, so a started
// Section is just swapped in for the grid via local state rather than a route change.
export function TopicLibraryPanel({ userId }: TopicLibraryPanelProps) {
  const { t } = useTranslation()
  const { data: topics, isLoading, isError } = useSpeakingLibraryTopics(userId)
  const startSection = useStartSpeakingLibrarySection(userId)

  const [activeSection, setActiveSection] = useState<SpeakingLibrarySection | null>(null)

  function handleStart(topicId: number) {
    startSection.mutate(topicId, {
      onSuccess: (section) => setActiveSection(section),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : t("learn.speaking.library.startError")),
    })
  }

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
    return <EmptyState icon={<Mic className="size-6" />} title={t("learn.speaking.library.emptyTitle")} />
  }

  const passedCount = topics.filter((topic) => topic.status === "PASSED").length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Progress value={topics.length === 0 ? 0 : Math.round((passedCount / topics.length) * 100)} />
        <span className="text-xs text-muted-foreground">
          {t("learn.speaking.library.topicsPassed", { passed: passedCount, total: topics.length })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const locked = topic.status === "LOCKED"
          return (
            <Card key={topic.id} className={cn(locked && "opacity-60")}>
              <CardContent className="flex flex-col gap-3 py-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{topic.name}</span>
                  {topic.level && <Badge variant="outline">{topic.level}</Badge>}
                </div>
                <Badge variant={statusVariant(topic.status)} className="w-fit">
                  {locked && <Lock className="size-3" />}
                  {t(`learn.speaking.library.status.${topic.status}`)}
                </Badge>
                <Button
                  size="sm"
                  disabled={locked || startSection.isPending}
                  onClick={() => handleStart(topic.id)}
                >
                  {locked ? (
                    <>
                      <Lock /> {t("learn.speaking.library.locked")}
                    </>
                  ) : (
                    t("learn.speaking.library.startSection")
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

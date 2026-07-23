import { Lock, SpellCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useGrammarLibraryTopics } from "@/features/learn/grammar/library/hooks"
import { cn } from "@/lib/utils"
import type { GrammarLibraryTopicStatus } from "@/types/api"

interface TopicLibraryPanelProps {
  userId: string
}

function statusVariant(status: GrammarLibraryTopicStatus): "default" | "secondary" | "outline" {
  if (status === "PASSED") return "default"
  if (status === "IN_PROGRESS") return "secondary"
  return "outline"
}

// Lists all 60 fixed grammar topics in sequenceOrder, each locked until the previous one is PASSED.
// Clicking a card opens the topic's theory page (GrammarTopicContentPage) rather than starting a
// session directly - the session only starts once the learner has read the theory and clicks
// "Bắt đầu luyện tập" there.
export function TopicLibraryPanel({ userId }: TopicLibraryPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: topics, isLoading, isError } = useGrammarLibraryTopics(userId)

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
    return <EmptyState icon={<SpellCheck className="size-6" />} title={t("learn.grammar.library.emptyTitle")} />
  }

  const passedCount = topics.filter((topic) => topic.status === "PASSED").length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Progress value={topics.length === 0 ? 0 : Math.round((passedCount / topics.length) * 100)} />
        <span className="text-xs text-muted-foreground">
          {t("learn.grammar.library.topicsPassed", { passed: passedCount, total: topics.length })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const locked = topic.status === "LOCKED"
          return (
            <Card key={topic.topicId} className={cn(locked && "opacity-60")}>
              <CardContent className="flex flex-col gap-3 py-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{topic.name}</span>
                    {t(`learn.grammar.library.topicTranslations.${topic.code}`, { defaultValue: "" }) && (
                      <span className="text-xs text-muted-foreground">
                        ({t(`learn.grammar.library.topicTranslations.${topic.code}`)})
                      </span>
                    )}
                  </div>
                  {topic.level && <Badge variant="outline">{topic.level}</Badge>}
                </div>
                <Badge variant={statusVariant(topic.status)} className="w-fit">
                  {locked && <Lock className="size-3" />}
                  {t(`learn.grammar.library.status.${topic.status}`)}
                </Badge>
                <Button
                  size="sm"
                  disabled={locked}
                  onClick={() => navigate(`/learn/grammar/library/topics/${topic.topicId}`)}
                >
                  {locked ? (
                    <>
                      <Lock /> {t("learn.grammar.library.locked")}
                    </>
                  ) : (
                    t("learn.grammar.library.readTheory")
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

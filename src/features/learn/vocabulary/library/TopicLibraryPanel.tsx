import { BookMarked, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useStartVocabSection, useVocabLibraryTopics } from "@/features/learn/vocabulary/library/hooks"
import { ApiError } from "@/lib/http"

interface TopicLibraryPanelProps {
  userId: string
}

// Lists every seeded topic as a card (name, word count, mastered %) and lets the learner start a
// new Section on one - LLM top-up (if the topic is under-stocked) happens server-side inside
// startSection, so this component only needs to show a loading state while that call is pending.
export function TopicLibraryPanel({ userId }: TopicLibraryPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: topics, isLoading, isError } = useVocabLibraryTopics(userId)
  const startSection = useStartVocabSection(userId)

  function handleStart(topicId: number) {
    startSection.mutate(
      { topicId, request: {} },
      {
        // Starting a Section navigates to its own page rather than swapping tab content in
        // place - the started card is handed over via router state since there's no
        // GET-by-sectionId endpoint to refetch it from on a direct page load.
        onSuccess: (card) =>
          navigate(`/learn/vocabulary/section/${card.sectionId}`, { state: { card } }),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("learn.vocabulary.library.startError")),
      }
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
    return <EmptyState icon={<BookMarked className="size-6" />} title={t("learn.vocabulary.library.emptyTitle")} />
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => {
        const masteryPercent = topic.wordCount === 0 ? 0 : Math.round((topic.masteredCount / topic.wordCount) * 100)
        return (
          <Card key={topic.topicId}>
            <CardContent className="flex flex-col gap-3 py-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{topic.name}</span>
                {topic.level && <Badge variant="outline">{topic.level}</Badge>}
              </div>
              {topic.description && <p className="text-sm text-muted-foreground">{topic.description}</p>}
              <div className="flex flex-col gap-1">
                <Progress value={masteryPercent} />
                <span className="text-xs text-muted-foreground">
                  {t("learn.vocabulary.library.masteredOf", { mastered: topic.masteredCount, total: topic.wordCount })}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => handleStart(topic.topicId)}
                disabled={startSection.isPending}
              >
                <Wand2 /> {t("learn.vocabulary.library.startSection")}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

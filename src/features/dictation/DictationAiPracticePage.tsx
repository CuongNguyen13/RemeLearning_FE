import { ChevronLeft, Loader2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ErrorState } from "@/components/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dictationPracticeAudioUrl } from "@/api/learners"
import { AttemptResultPanel } from "@/features/dictation/AttemptResultPanel"
import {
  useAiPracticeDetail,
  useDictationFacets,
  useSubmitDictationAttempt,
} from "@/features/dictation/hooks"
import { SentenceDictationRunner } from "@/features/dictation/SentenceDictationRunner"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"
import type {
  DictationAttemptResult,
  DictationSentenceMistake,
} from "@/types/api"

// Standalone AI-practice page reached via /dictation/ai-practice/:practiceItemId - mirrors
// DictationLessonPage so both sections share the exact same sentence-by-sentence runner
// (listen → type → check per sentence, hint after enough listens, Web Audio seek).
type PageView = "runner" | "submitting" | "result"

interface PendingSubmission {
  fullTranscript: string
  mistakes: DictationSentenceMistake[]
}

export function DictationAiPracticePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.user?.userId ?? "")
  const { practiceItemId: practiceItemIdParam } = useParams<{ practiceItemId: string }>()
  const practiceItemId = practiceItemIdParam ? Number(practiceItemIdParam) : null

  const { data: facets } = useDictationFacets(userId)
  const {
    data: item,
    isLoading: itemLoading,
    isError: itemError,
    refetch: refetchItem,
  } = useAiPracticeDetail(userId, practiceItemId)
  const submitAttempt = useSubmitDictationAttempt(userId)

  const [view, setView] = useState<PageView>("runner")
  const [result, setResult] = useState<DictationAttemptResult | null>(null)
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null)

  function goToAiTab() {
    navigate("/dictation", { state: { tab: "ai" } })
  }

  function submitPendingAttempt(submission: PendingSubmission) {
    if (practiceItemId == null) return
    submitAttempt.mutate(
      {
        practiceItemId,
        userTranscript: submission.fullTranscript,
        sentenceMistakes: submission.mistakes.length > 0 ? submission.mistakes : undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          setView("result")
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("dictation.checkError")),
      }
    )
  }

  function handleRunnerComplete(fullTranscript: string, mistakes: DictationSentenceMistake[]) {
    const submission: PendingSubmission = { fullTranscript, mistakes }
    setPendingSubmission(submission)
    setView("submitting")
    submitPendingAttempt(submission)
  }

  if (practiceItemId == null || isNaN(practiceItemId)) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{t("dictation.aiEmpty")}</p>
        <Button variant="outline" onClick={goToAiTab}>
          <ChevronLeft /> {t("dictation.lessons.back")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Thin header: back to AI-practice tab, plus the item's topic when it has one. */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="h-9 w-fit" onClick={goToAiTab}>
          <ChevronLeft /> {t("dictation.lessons.back")}
        </Button>
        {item?.topic && <Badge variant="secondary">{item.topic}</Badge>}
      </div>

      {view === "runner" && (
        <>
          {itemError && <ErrorState onRetry={() => void refetchItem()} />}
          {(itemLoading || !item) && !itemError && (
            <div aria-busy="true" aria-live="polite" className="flex w-full max-w-2xl flex-col gap-5 rounded-2xl bg-card p-6 shadow-clay">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
              </div>
            </div>
          )}
          {item && !itemLoading && (
            <SentenceDictationRunner
              key={item.practiceItemId}
              clip={{
                clipId: item.practiceItemId,
                code: "",
                title: t("dictation.aiBadge"),
                audioUrl: item.audioUrl ?? "",
                scriptText: item.scriptText,
                sentences: item.sentences,
              }}
              audioSrc={dictationPracticeAudioUrl(userId, item.practiceItemId)}
              minListensForHint={facets?.minListensForHint ?? 1}
              onComplete={handleRunnerComplete}
            />
          )}
        </>
      )}

      {view === "submitting" && (
        submitAttempt.isError ? (
          <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl bg-card p-8 text-center shadow-clay">
            <p className="font-medium text-destructive">{t("dictation.submitError")}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={goToAiTab}>
                {t("dictation.result.backToLessons")}
              </Button>
              <Button
                onClick={() => pendingSubmission && submitPendingAttempt(pendingSubmission)}
              >
                {t("common.retry")}
              </Button>
            </div>
          </div>
        ) : (
          <div aria-busy="true" aria-live="polite" className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center shadow-clay">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("dictation.submitting")}</p>
          </div>
        )
      )}

      {view === "result" && result && (
        <AttemptResultPanel
          result={result}
          onBackToLessons={goToAiTab}
        />
      )}
    </div>
  )
}

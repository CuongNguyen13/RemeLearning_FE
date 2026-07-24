import { ChevronLeft } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/common/LoadingOverlay"
import { ErrorState } from "@/components/ErrorState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dictationClipAudioUrl } from "@/api/learners"
import { AttemptResultPanel } from "@/features/dictation/AttemptResultPanel"
import {
  useDictationClip,
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

// Standalone lesson practice page reached via /dictation/lesson/:clipId.
// The library page is now purely a browse surface; clicking a lesson navigates
// here so the runner owns the full viewport with no competing side rail.
type PageView = "runner" | "submitting" | "result"

interface PendingSubmission {
  fullTranscript: string
  mistakes: DictationSentenceMistake[]
}

export function DictationLessonPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.user?.userId ?? "")
  const { clipId: clipIdParam } = useParams<{ clipId: string }>()
  const clipId = clipIdParam ? Number(clipIdParam) : null

  const { data: facets } = useDictationFacets(userId)
  const { data: clip, isLoading: clipLoading, isError: clipError, refetch: refetchClip } =
    useDictationClip(userId, clipId, i18n.resolvedLanguage)
  const submitAttempt = useSubmitDictationAttempt(userId)

  const [view, setView] = useState<PageView>("runner")
  const [result, setResult] = useState<DictationAttemptResult | null>(null)
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null)

  // Submits (or resubmits, on retry) the learner's completed transcript. Kept separate from
  // handleRunnerComplete so a failed attempt can be retried without re-running the runner - on
  // failure the view drops back to "runner" (clearing the LoadingOverlay) instead of leaving the
  // learner stuck on an infinite spinner with no way to recover.
  function submitPendingAttempt(submission: PendingSubmission) {
    if (clipId == null) return
    setView("submitting")
    submitAttempt.mutate(
      {
        clipId,
        userTranscript: submission.fullTranscript,
        sentenceMistakes: submission.mistakes.length > 0 ? submission.mistakes : undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          setView("result")
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : t("dictation.checkError"))
          setView("runner")
        },
      }
    )
  }

  function handleRunnerComplete(fullTranscript: string, mistakes: DictationSentenceMistake[]) {
    if (clipId == null) return
    const submission: PendingSubmission = { fullTranscript, mistakes }
    setPendingSubmission(submission)
    submitPendingAttempt(submission)
  }

  if (clipId == null || isNaN(clipId)) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{t("dictation.lessons.empty")}</p>
        <Button variant="outline" onClick={() => navigate("/dictation")}>
          <ChevronLeft /> {t("dictation.lessons.back")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Thin header: back to library + clip title. */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="h-9 w-fit" onClick={() => navigate("/dictation")}>
          <ChevronLeft /> {t("dictation.lessons.back")}
        </Button>
      </div>

      {view !== "result" && (
        <>
          {clipError && <ErrorState onRetry={() => void refetchClip()} />}
          {(clipLoading || !clip) && !clipError && (
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
          {clip && !clipLoading && (
            <div className="relative">
              <SentenceDictationRunner
                key={clip.clipId}
                clip={clip}
                audioSrc={dictationClipAudioUrl(userId, clip.clipId)}
                minListensForHint={facets?.minListensForHint ?? 1}
                onComplete={handleRunnerComplete}
              />
              <LoadingOverlay show={view === "submitting"} label={t("common.grading")} />
              {/* The runner itself renders nothing once the learner has finished all sentences
                  (see SentenceDictationRunner's `if (!currentSentence) return null`), so a failed
                  submission needs its own recovery UI here rather than just hiding the overlay -
                  otherwise there'd be nothing left on screen to retry from. */}
              {view === "runner" && submitAttempt.isError && pendingSubmission && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-md bg-background/90 p-6 text-center backdrop-blur-sm">
                  <p className="font-medium text-destructive">{t("dictation.submitError")}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/dictation")}>
                      {t("dictation.result.backToLessons")}
                    </Button>
                    <Button onClick={() => submitPendingAttempt(pendingSubmission)}>
                      {t("common.retry")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {view === "result" && result && (
        <AttemptResultPanel
          result={result}
          onBackToLessons={() => navigate("/dictation")}
        />
      )}
    </div>
  )
}
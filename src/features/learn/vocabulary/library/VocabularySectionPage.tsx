import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ErrorState } from "@/components/ErrorState"
import { Button } from "@/components/ui/button"
import { getVocabLibraryWordAudioUrl } from "@/api/learners"
import { SectionResultPanel } from "@/features/learn/vocabulary/library/SectionResultPanel"
import { SectionRunner } from "@/features/learn/vocabulary/library/SectionRunner"
import { useSubmitVocabSectionAnswer } from "@/features/learn/vocabulary/library/hooks"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"
import type { SectionAnswerResult, SectionCard, SectionProgress } from "@/types/api"

type PageView = "running" | "done"

// Standalone Section-practice page reached via /learn/vocabulary/section/:sectionId, navigated to
// from TopicLibraryPanel once startVocabSection resolves. The starting card is handed over through
// router state (there is no GET-by-sectionId endpoint) - a direct load/refresh with no state simply
// sends the learner back to the topic list rather than fetching or crashing.
export function VocabularySectionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { sectionId: sectionIdParam } = useParams<{ sectionId: string }>()
  const sectionId = sectionIdParam ? Number(sectionIdParam) : null
  const userId = useAuthStore((state) => state.user?.userId ?? "")

  const initialCard = (location.state as { card?: SectionCard } | null)?.card ?? null
  const [view, setView] = useState<PageView>("running")
  const [currentCard, setCurrentCard] = useState<SectionCard | null>(initialCard)
  const [lastProgress, setLastProgress] = useState<SectionProgress | null>(null)
  const submitSectionAnswer = useSubmitVocabSectionAnswer(userId)
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null)

  // No starting card means this page was reached directly (refresh/deep-link), not via the topic
  // list's navigate() call - there's nothing to run, so bounce back rather than showing a dead page.
  useEffect(() => {
    if (!initialCard || sectionId == null) {
      navigate("/learn/vocabulary", { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stops any narration for the previous card before this card's audio (or the next advance) begins,
  // so two clips can never overlap.
  useEffect(() => {
    return () => {
      pendingAudioRef.current?.pause()
      pendingAudioRef.current = null
    }
  }, [])

  // Applies the graded result to page state - split out from handleSubmit so it can run either
  // immediately (wrong answer, or no audio to wait for) or only once the correct answer's audio
  // clip has finished playing.
  function advance(answeredCard: SectionCard, result: SectionAnswerResult) {
    setLastProgress(result.progress)
    if (result.completed) {
      setCurrentCard(null)
      setView("done")
      return
    }
    if (answeredCard.cardKind === "QUIZ") {
      toast[result.correct ? "success" : "error"](
        result.correct
          ? t("learn.vocabulary.library.correctToast")
          : t("learn.vocabulary.library.wrongToast", { answer: result.correctAnswer ?? "" })
      )
    }
    setCurrentCard(result.nextCard)
  }

  function handleSubmit(answer?: string) {
    if (!currentCard || sectionId == null) return
    const answeredCard = currentCard
    submitSectionAnswer.mutate(
      { sectionId, request: { submittedAnswer: answer } },
      {
        onSuccess: (result) => {
          // A correct QUIZ answer auto-plays the word's audio as positive reinforcement, using the
          // card that was just answered (before it's replaced by nextCard) - the learner only moves
          // on to the next card/finish screen once that clip finishes playing, not before.
          if (answeredCard.cardKind === "QUIZ" && result.correct && answeredCard.audioUrl) {
            const audio = new Audio(getVocabLibraryWordAudioUrl(userId, answeredCard.libraryWordId))
            pendingAudioRef.current = audio
            const finish = () => {
              if (pendingAudioRef.current === audio) pendingAudioRef.current = null
              advance(answeredCard, result)
            }
            audio.addEventListener("ended", finish, { once: true })
            audio.addEventListener("error", finish, { once: true })
            void audio.play().catch(finish)
            return
          }
          advance(answeredCard, result)
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("learn.vocabulary.library.answerError")),
      }
    )
  }

  if (!currentCard && view === "running") {
    return <ErrorState />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("learn.vocabulary.title")}</h1>
        <Button variant="ghost" onClick={() => navigate("/learn/vocabulary")}>
          {t("learn.vocabulary.library.backToTopics")}
        </Button>
      </div>

      {view === "running" && currentCard && (
        <SectionRunner
          userId={userId}
          card={currentCard}
          isSubmitting={submitSectionAnswer.isPending}
          onSubmit={handleSubmit}
        />
      )}
      {view === "done" && (
        <SectionResultPanel
          totalWords={lastProgress?.totalWords ?? 0}
          onBackToTopics={() => navigate("/learn/vocabulary")}
        />
      )}
    </div>
  )
}

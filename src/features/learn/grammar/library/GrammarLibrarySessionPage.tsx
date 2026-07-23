import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ErrorState } from "@/components/ErrorState"
import { Button } from "@/components/ui/button"
import { GrammarLibraryResultPanel } from "@/features/learn/grammar/library/GrammarLibraryResultPanel"
import { GrammarSessionRunner } from "@/features/learn/grammar/library/GrammarSessionRunner"
import {
  useFinishGrammarLibrarySession,
  useSubmitGrammarLibraryAnswer,
} from "@/features/learn/grammar/library/hooks"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"
import type { FinishGrammarSessionResponse, GrammarAnswerResult, StartGrammarSessionResponse } from "@/types/api"

type PageView = "running" | "done"

interface LocationState {
  session?: StartGrammarSessionResponse
  topicId?: number
}

// Standalone session-practice page reached via /learn/grammar/library/sessions/:sessionId, navigated
// to from GrammarTopicContentPage once startGrammarLibrarySession resolves. The session payload
// (questions) is handed over through router state (there is no GET-by-sessionId endpoint) - a direct
// load/refresh with no state simply sends the learner back to the grammar page rather than crashing.
export function GrammarLibrarySessionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const initialState = (location.state as LocationState | null) ?? null
  const userId = useAuthStore((state) => state.user?.userId ?? "")
  const topicId = initialState?.topicId ?? null

  const [view, setView] = useState<PageView>("running")
  const [session, setSession] = useState<StartGrammarSessionResponse | null>(initialState?.session ?? null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [finalResult, setFinalResult] = useState<FinishGrammarSessionResponse | null>(null)
  // Holds the just-submitted answer's correct/incorrect + VI explanation until the learner presses
  // "Next" - the session no longer advances on its own once the answer call resolves.
  const [pendingResult, setPendingResult] = useState<GrammarAnswerResult | null>(null)

  const submitAnswer = useSubmitGrammarLibraryAnswer(userId)
  const finishSession = useFinishGrammarLibrarySession(userId, topicId ?? -1)

  // No starting session means this page was reached directly (refresh/deep-link), not via the topic
  // content page's navigate() call - there's nothing to run, so bounce back rather than showing a
  // dead page.
  useEffect(() => {
    if (!initialState?.session || topicId == null) {
      navigate("/learn/grammar", { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFinish(sessionId: number) {
    finishSession.mutate(sessionId, {
      onSuccess: (result) => {
        if (result.passed) {
          setFinalResult(result)
          setView("done")
          return
        }
        // A wrong answer somewhere creates a RETRY session server-side, questions inlined - jump
        // straight into it rather than sending the learner back to the topic list.
        if (result.retrySession) {
          toast(t("learn.grammar.library.retryToast"))
          setSession(result.retrySession)
          setQuestionIndex(0)
          return
        }
        // Defensive fallback: not passed yet but no retry session came back - nothing runnable
        // left, so send the learner back to the topic page rather than showing a dead view.
        toast.error(t("learn.grammar.library.retryUnavailable"))
        navigate(`/learn/grammar/library/topics/${topicId}`, { replace: true })
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : t("learn.grammar.library.answerError")),
    })
  }

  function handleSubmit(answer: string) {
    if (!session) return
    const question = session.questions[questionIndex]
    if (!question) return
    submitAnswer.mutate(
      { sessionId: session.sessionId, request: { questionRef: question.questionRef, submittedAnswer: answer } },
      {
        // Feedback is shown inline by GrammarSessionRunner (see pendingResult below) - the session
        // only moves forward once the learner presses "Next" in handleNext.
        onSuccess: (result) => setPendingResult(result),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("learn.grammar.library.answerError")),
      }
    )
  }

  function handleNext() {
    if (!session) return
    setPendingResult(null)
    const nextIndex = questionIndex + 1
    if (nextIndex >= session.questions.length) {
      handleFinish(session.sessionId)
      return
    }
    setQuestionIndex(nextIndex)
  }

  const currentQuestion = session?.questions[questionIndex] ?? null

  if (view === "running" && (!session || !currentQuestion)) {
    return <ErrorState />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("learn.grammar.title")}</h1>
        <Button variant="ghost" onClick={() => navigate("/learn/grammar")}>
          {t("learn.grammar.library.backToTopics")}
        </Button>
      </div>

      {view === "running" && session && currentQuestion && (
        <GrammarSessionRunner
          question={currentQuestion}
          questionIndex={questionIndex}
          totalQuestions={session.questions.length}
          isSubmitting={submitAnswer.isPending || finishSession.isPending}
          answerResult={pendingResult}
          onSubmit={handleSubmit}
          onNext={handleNext}
        />
      )}
      {view === "done" && (
        <GrammarLibraryResultPanel
          correctCount={finalResult?.correctCount ?? 0}
          totalCount={finalResult?.totalCount ?? 0}
          nextTopicUnlocked={finalResult?.nextTopicUnlocked}
          onBackToTopics={() => navigate("/learn/grammar")}
        />
      )}
    </div>
  )
}

import { Check, Mic, PartyPopper, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { usePracticeNext, useSubmitPracticeRedo } from "@/features/practice/hooks"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"

// Quint ease-out: fast start, gentle settle - no bounce/elastic per the motion guidelines.
const EASE_OUT = [0.22, 1, 0.36, 1] as const
// How long the correct/incorrect confirmation holds before the next card slides in.
const FEEDBACK_PAUSE_MS = 550

type SelfAssessment = "correct" | "incorrect"

export function PracticePage() {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.user?.userId ?? "")
  const { data, isLoading, isError, refetch } = usePracticeNext(userId)
  const submitMutation = useSubmitPracticeRedo(userId)
  const reduceMotion = useReducedMotion()

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [feedback, setFeedback] = useState<SelfAssessment | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const feedbackTimeout = useRef<number | null>(null)

  // Clear any pending "advance to next card" timer so we never touch state after unmount.
  useEffect(() => {
    return () => {
      if (feedbackTimeout.current !== null) window.clearTimeout(feedbackTimeout.current)
    }
  }, [])

  const total = data?.length ?? 0
  const current = data?.[index]
  const finished = !!data && data.length > 0 && index >= data.length
  const forgettingPercent = current ? Math.round(current.forgettingScore * 100) : 0

  // Records the self-assessment, shows a brief correct/incorrect confirmation, then advances -
  // instant (no pause) under reduced motion so the flow never feels like it's waiting on us.
  function answer(correct: boolean) {
    if (!current || feedback) return
    setAnswers((prev) => ({ ...prev, [current.itemId]: correct }))
    setFeedback(correct ? "correct" : "incorrect")
    feedbackTimeout.current = window.setTimeout(
      () => {
        setFlipped(false)
        setFeedback(null)
        setIndex((i) => i + 1)
      },
      reduceMotion ? 0 : FEEDBACK_PAUSE_MS
    )
  }

  function toggleFlip() {
    if (feedback) return
    setFlipped((f) => !f)
  }

  function handleSubmit() {
    if (!data) return
    const attempts = data.map((item) => ({
      itemId: item.itemId,
      category: item.category,
      label: item.label,
      correct: answers[item.itemId] ?? false,
    }))

    submitMutation.mutate(attempts, {
      onSuccess: () => {
        toast.success(t("practice.submitSuccess"))
        setAnswers({})
        setIndex(0)
        void refetch()
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : t("practice.submitError"))
      },
    })
  }

  const correctCount = Object.values(answers).filter(Boolean).length
  const incorrectCount = Object.values(answers).length - correctCount
  const perfectRun = finished && correctCount > 0 && incorrectCount === 0

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full">
        <h1 className="text-3xl font-semibold tracking-tight">{t("practice.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("practice.subtitle")}</p>
      </div>

      {isLoading && (
        <div className="flex w-full max-w-md flex-col gap-3">
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {data && data.length === 0 && (
        <EmptyState
          icon={<Mic className="size-6" />}
          title={t("practice.empty")}
          description={t("practice.emptyDescription")}
          action={
            <Button
              nativeButton={false}
              render={<Link to="/recordings" />}
              className="h-11 bg-accent-warm text-accent-warm-foreground hover:bg-accent-warm/90"
            >
              {t("practice.emptyCta")}
            </Button>
          }
        />
      )}

      {data && data.length > 0 && !finished && current && (
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <div className="w-full">
            <Progress value={(index / total) * 100} />
            <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
              {t("practice.progress", { current: index + 1, total })}
            </p>
          </div>

          <div className="w-full [perspective:1200px]">
            <motion.div
              key={current.itemId}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
            >
              <motion.div
                role="button"
                tabIndex={0}
                aria-pressed={flipped}
                aria-disabled={!!feedback}
                aria-label={t("practice.flipAriaLabel")}
                onClick={toggleFlip}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggleFlip()
                  }
                }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE_OUT }}
                className="relative grid w-full cursor-pointer rounded-3xl [transform-style:preserve-3d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {/* Front: the weak point being drilled, grounded in why it's here */}
                <div className="col-start-1 row-start-1 flex min-h-72 flex-col items-center justify-center gap-3 rounded-3xl bg-card p-6 text-center shadow-clay [backface-visibility:hidden]">
                  <Badge variant="secondary">{t(`categories.${current.category}`)}</Badge>
                  <p className="font-heading text-2xl font-medium text-balance">
                    {current.label}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("practice.sourceCaption", { percent: forgettingPercent })}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("practice.tapToReveal")}</p>
                </div>
                {/* Back: the correct form / recommendation, revealed on flip */}
                <div className="col-start-1 row-start-1 flex min-h-72 flex-col items-center justify-center gap-3 rounded-3xl bg-primary p-6 text-center text-primary-foreground shadow-clay [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-sm font-medium opacity-80">{t("practice.gotItRight")}</p>
                  <p className="text-lg font-medium text-balance">
                    {current.recommendation || current.label}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="flex h-11 w-full items-center justify-center">
            <AnimatePresence mode="wait">
              {feedback ? (
                <motion.div
                  key="feedback"
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium ${
                    feedback === "correct"
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {feedback === "correct" ? (
                    <Check className="size-4" />
                  ) : (
                    <X className="size-4" />
                  )}
                  {feedback === "correct"
                    ? t("practice.feedbackCorrect")
                    : t("practice.feedbackIncorrect")}
                </motion.div>
              ) : (
                <div
                  key="actions"
                  className={`flex w-full items-center gap-3 transition-opacity ${
                    flipped ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!flipped}
                    className="h-11 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => answer(false)}
                  >
                    <X /> {t("practice.incorrect")}
                  </Button>
                  <Button
                    type="button"
                    disabled={!flipped}
                    className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => answer(true)}
                  >
                    <Check /> {t("practice.correct")}
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {finished && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
            className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-clay"
          >
            <motion.div
              initial={{ scale: reduceMotion ? 1 : 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.35,
                ease: EASE_OUT,
                delay: reduceMotion ? 0 : 0.1,
              }}
            >
              <PartyPopper className="size-10 text-accent-warm" />
            </motion.div>
            <p className="font-heading text-2xl font-medium">{t("practice.allDone")}</p>
            <p className="text-muted-foreground">
              {t("practice.resultsSummary", { correct: correctCount, incorrect: incorrectCount })}
            </p>
            {perfectRun ? (
              <p className="text-sm font-medium text-accent-warm">{t("practice.perfectRun")}</p>
            ) : (
              incorrectCount > 0 && (
                <p className="text-sm text-muted-foreground">{t("practice.reviewAgain")}</p>
              )
            )}
            <Button
              size="lg"
              disabled={submitMutation.isPending}
              onClick={handleSubmit}
              className="mt-2 h-11 bg-accent-warm text-accent-warm-foreground shadow-clay-warm hover:bg-accent-warm/90"
            >
              {submitMutation.isPending ? t("common.loading") : t("practice.submit")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { ArrowRight, Check, ChevronLeft, Headphones } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { AiSuggestions } from "@/features/dictation/AiSuggestions"
import { DiffView } from "@/features/dictation/DiffView"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { DictationAttemptResult } from "@/types/api"

// Shows the graded result of a submitted attempt: word diff, accuracy gauge, and AI suggestions,
// with navigation actions to move on. Shared by the sentence-runner and AI-practice flows.
//
// UI improvements over the previous version:
// - Accuracy shown as a filled progress gauge instead of a plain text percentage, so the
//   learner can scan it at a glance.
// - Diff view uses a two-tone word-by-word layout with clearer CORRECT vs INCORRECT contrast.
// - AI suggestions panel has a slim "AI-powered" badge header instead of just an icon+text row.
// - Navigation buttons are visually balanced: primary action (next lesson) vs secondary (back).
export function AttemptResultPanel({
  result,
  onNextLesson,
  onBackToLessons,
}: {
  result: DictationAttemptResult
  onNextLesson?: () => void
  onBackToLessons: () => void
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const isStrongMatch = result.accuracy >= 0.8
  const accuracyPercent = Math.round(result.accuracy * 100)

  return (
    <motion.div
      className="flex w-full max-w-2xl flex-col gap-5 rounded-2xl bg-card p-6 shadow-clay"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT }}
    >
      {/* Result header: verdict icon + accuracy gauge. */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              isStrongMatch
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isStrongMatch ? (
              <Check className="size-5" />
            ) : (
              <Headphones className="size-5" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-heading text-lg font-semibold">
              {isStrongMatch
                ? t("dictation.feedbackGreat")
                : t("dictation.feedbackRetry")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dictation.accuracy", { accuracy: accuracyPercent })}
            </p>
          </div>
        </div>

        {/* Accuracy gauge — a filled progress bar with percentage label. */}
        <div className="flex items-center gap-3">
          <Progress
            value={accuracyPercent}
            className={cn(
              "h-2 flex-1",
              isStrongMatch && "[&>div]:bg-primary",
              !isStrongMatch && accuracyPercent >= 50 && "[&>div]:bg-amber-500",
              !isStrongMatch && accuracyPercent < 50 && "[&>div]:bg-destructive/60"
            )}
            aria-label={t("dictation.accuracy", { accuracy: accuracyPercent })}
          />
          <span
            className={cn(
              "min-w-[3.5ch] text-sm font-bold tabular-nums",
              isStrongMatch && "text-primary",
              !isStrongMatch && accuracyPercent >= 50 && "text-amber-600 dark:text-amber-400",
              !isStrongMatch && accuracyPercent < 50 && "text-destructive"
            )}
          >
            {accuracyPercent}%
          </span>
        </div>
      </div>

      <Separator />

      {/* Word diff — rendered word-by-word with clear correct/incorrect styling. */}
      <DiffView diff={result.diff} extraLabel={t("dictation.extraWords")} />

      {/* AI suggestions — compact card with badge header. */}
      {result.aiSuggestions.length > 0 && (
        <AiSuggestions suggestions={result.aiSuggestions} />
      )}

      {/* Navigation actions. */}
      <div className="flex gap-2">
        <Button variant="outline" size="lg" className="h-12 flex-1 gap-2" onClick={onBackToLessons}>
          <ChevronLeft className="size-4.5" />
          {t("dictation.result.backToLessons")}
        </Button>
        {onNextLesson && (
          <Button size="lg" className="h-12 flex-1 gap-2" onClick={onNextLesson}>
            {t("dictation.result.nextLesson")}
            <ArrowRight className="size-4.5" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}


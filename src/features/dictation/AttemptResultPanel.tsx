import { Check, Headphones, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DictationAttemptResult } from "@/types/api"

const EASE_OUT = [0.22, 1, 0.36, 1] as const

// Shows the graded result of a submitted attempt: word diff, accuracy, and AI suggestions,
// with navigation actions to move on. Shared by the sentence-runner and AI-practice flows.
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

  return (
    <motion.div
      className="flex w-full max-w-md flex-col gap-3 rounded-3xl bg-card p-6 shadow-clay"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT }}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-sm font-medium",
          isStrongMatch ? "text-primary" : "text-muted-foreground"
        )}
      >
        {isStrongMatch ? <Check className="size-4" /> : <Headphones className="size-4" />}
        {isStrongMatch ? t("dictation.feedbackGreat") : t("dictation.feedbackRetry")}
      </div>
      <DiffView diff={result.diff} extraLabel={t("dictation.extraWords")} />
      <p className="text-sm font-medium text-muted-foreground">
        {t("dictation.accuracy", { accuracy: Math.round(result.accuracy * 100) })}
      </p>
      {result.aiSuggestions.length > 0 && <AiSuggestions suggestions={result.aiSuggestions} />}
      <div className="flex gap-2">
        <Button variant="outline" className="h-11 flex-1" onClick={onBackToLessons}>
          {t("dictation.result.backToLessons")}
        </Button>
        {onNextLesson && (
          <Button className="h-11 flex-1" onClick={onNextLesson}>
            {t("dictation.result.nextLesson")}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function AiSuggestions({ suggestions }: { suggestions: string[] }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl bg-accent-warm/10 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-accent-warm">
        <Sparkles className="size-4" /> {t("dictation.suggestionsTitle")}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {suggestions.map((suggestion, i) => (
          <li key={i}>{suggestion}</li>
        ))}
      </ul>
    </div>
  )
}

function DiffView({
  diff,
  extraLabel,
}: {
  diff: DictationAttemptResult["diff"]
  extraLabel: string
}) {
  const extras = diff.filter((slot) => slot.tag === "EXTRA")

  return (
    <div className="rounded-2xl bg-muted/50 p-4">
      <p className="text-lg leading-relaxed">
        {diff
          .filter((slot) => slot.tag !== "EXTRA")
          .map((slot, i) => (
            <span
              key={i}
              className={cn(
                "mr-1.5",
                slot.tag !== "CORRECT" && "rounded bg-destructive/10 text-destructive underline"
              )}
            >
              {slot.expectedWord}
            </span>
          ))}
      </p>
      {extras.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {extraLabel}: {extras.map((slot) => slot.actualWord).join(", ")}
        </p>
      )}
    </div>
  )
}

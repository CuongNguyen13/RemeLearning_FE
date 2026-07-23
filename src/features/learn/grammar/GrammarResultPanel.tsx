import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AttemptResultShell } from "@/features/learn/shared/AttemptResultShell"
import { cn } from "@/lib/utils"
import type { GrammarAttemptQuestionResult } from "@/types/api"

interface GrammarResultPanelProps {
  accuracy: number
  results: GrammarAttemptQuestionResult[]
  actionAdvice?: string[]
  onRetry?: () => void
}

export function GrammarResultPanel({ accuracy, results, actionAdvice, onRetry }: GrammarResultPanelProps) {
  const { t } = useTranslation()

  return (
    <AttemptResultShell score={accuracy} onRetry={onRetry}>
      <div className="flex flex-col gap-3">
        {results.map((result) => (
          <div
            key={result.index}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-3 text-sm",
              result.correct ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
            )}
          >
            <div className="flex items-start gap-2">
              {result.correct ? (
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <p className="flex-1">{result.prompt}</p>
            </div>
            {!result.correct && (
              <p className="pl-6 text-muted-foreground">
                {t("learn.grammar.yourAnswerWas", { answer: result.yourAnswer || t("learn.grammar.noAnswer") })}
              </p>
            )}
            <p className="pl-6 font-medium text-foreground">
              {t("learn.grammar.correctAnswerIs", { answer: result.correctAnswer })}
              {result.translation && ` (${result.translation})`}
            </p>
            {result.translationVi && (
              <p className="pl-6 text-muted-foreground">
                {t("learn.grammar.translationIs", { translation: result.translationVi })}
              </p>
            )}
          </div>
        ))}
      </div>

      {actionAdvice && actionAdvice.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-muted/60 p-3">
          <p className="text-xs font-medium text-primary">{t("learn.result.advice")}</p>
          <ul className="flex flex-col gap-1 text-sm text-foreground/90">
            {actionAdvice.map((advice, index) => (
              <li key={index}>{advice}</li>
            ))}
          </ul>
        </div>
      )}
    </AttemptResultShell>
  )
}

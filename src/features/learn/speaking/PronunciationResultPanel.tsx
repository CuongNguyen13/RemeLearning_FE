import { useTranslation } from "react-i18next"
import { AttemptResultShell } from "@/features/learn/shared/AttemptResultShell"
import { cn } from "@/lib/utils"
import type { WordScore } from "@/types/api"

interface PronunciationResultPanelProps {
  overall: number
  words: WordScore[]
  transcript: string
  weakPhonemes: string[]
  actionAdvice?: string[]
  onRetry?: () => void
}

// Colors each word red/amber/green by its GOP score, so weak spots are visually obvious at a
// glance before the learner reads the phoneme-level breakdown below.
function scoreColorClass(score: number): string {
  if (score >= 0.8) return "bg-primary/10 text-primary"
  if (score >= 0.5) return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  return "bg-destructive/10 text-destructive"
}

export function PronunciationResultPanel({
  overall,
  words,
  transcript,
  weakPhonemes,
  actionAdvice,
  onRetry,
}: PronunciationResultPanelProps) {
  const { t } = useTranslation()

  return (
    <AttemptResultShell score={overall} onRetry={onRetry}>
      <div className="flex flex-wrap gap-2">
        {words.map((word, index) => (
          <span
            key={index}
            title={word.phonemes.map((p) => `${p.ipa}: ${Math.round(p.score * 100)}%`).join(" · ")}
            className={cn("rounded-lg px-2 py-1 text-sm font-medium", scoreColorClass(word.score))}
          >
            {word.word}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl bg-muted/60 p-3">
        <p className="text-xs font-medium text-primary">{t("learn.speaking.yourTranscript")}</p>
        <p className="text-sm text-foreground/90">{transcript}</p>
      </div>

      {weakPhonemes.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-muted/60 p-3">
          <p className="text-xs font-medium text-primary">{t("learn.speaking.weakPhonemes")}</p>
          <div className="flex flex-wrap gap-1.5">
            {weakPhonemes.map((phoneme) => (
              <span key={phoneme} className="rounded-md bg-destructive/10 px-2 py-0.5 text-sm text-destructive">
                {phoneme}
              </span>
            ))}
          </div>
        </div>
      )}

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

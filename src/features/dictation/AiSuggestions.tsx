import { Sparkles, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"

// Shared AI suggestions panel — renders the list of suggestions returned by the dictation
// grading pipeline. Used by AttemptResultPanel to keep the presentation consistent across
// the library and AI-practice sentence-runner flows.
export function AiSuggestions({ suggestions }: { suggestions: string[] }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl bg-accent-warm/5 ring-1 ring-accent-warm/15">
      <div className="flex items-center gap-2 border-b border-accent-warm/10 px-4 py-2.5">
        <Sparkles className="size-4 text-accent-warm" />
        <span className="text-xs font-semibold uppercase tracking-wide text-accent-warm">
          {t("dictation.suggestionsTitle")}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent-warm/10 px-2 py-0.5 text-[0.65rem] font-medium text-accent-warm">
          <Sparkles className="size-2.5" />
          AI
        </span>
      </div>
      <ul className="space-y-1.5 px-4 py-3">
        {suggestions.map((suggestion, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-accent-warm/60" />
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  )
}
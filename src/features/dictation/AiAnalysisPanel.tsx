import { BookOpen, Ear, Sparkles, SpellCheck, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { DictationErrorCategory, DictationErrorEntry, DictationRootCauseGroup } from "@/types/api"

const CATEGORY_ICON: Record<DictationErrorCategory, typeof BookOpen> = {
  LEXICON: BookOpen,
  GRAMMAR: SpellCheck,
  PHONOLOGY: Ear,
}

const CATEGORY_LABEL_KEY: Record<DictationErrorCategory, string> = {
  LEXICON: "dictation.analysisCategoryLexicon",
  GRAMMAR: "dictation.analysisCategoryGrammar",
  PHONOLOGY: "dictation.analysisCategoryPhonology",
}

// Root-cause-classified AI analysis of a dictation attempt: a mistake-comparison table, one
// root-cause card per category that actually occurred (Vocabulary/Grammar/Phonology), and
// actionable advice. Replaces the old flat AiSuggestions list. Used by AttemptResultPanel and
// AttemptDetailDialog to keep the presentation consistent across the library, AI-practice, and
// history-detail flows.
export function AiAnalysisPanel({
  errorTable,
  rootCauses,
  actionAdvice,
}: {
  errorTable: DictationErrorEntry[]
  rootCauses: DictationRootCauseGroup[]
  actionAdvice: string[]
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      {errorTable.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-border/50">
          <div className="border-b border-border/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("dictation.analysisTableTitle")}
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-x-3 gap-y-1.5 px-4 py-3 text-sm">
            {errorTable.map((entry, i) => (
              <div key={i} className="contents">
                <span className="text-muted-foreground line-through decoration-destructive/40">
                  {entry.original}
                </span>
                <span>{entry.transcribed || "—"}</span>
                <span className="justify-self-end rounded-full bg-accent-warm/10 px-2 py-0.5 text-[0.65rem] font-medium text-accent-warm">
                  {t(CATEGORY_LABEL_KEY[entry.category])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rootCauses.map((group) => {
        const Icon = CATEGORY_ICON[group.category]
        return (
          <div key={group.category} className="rounded-2xl bg-accent-warm/5 p-4 ring-1 ring-accent-warm/15">
            <div className="mb-1.5 flex items-center gap-2">
              <Icon className="size-4 text-accent-warm" />
              <span className="text-xs font-semibold uppercase tracking-wide text-accent-warm">
                {t(CATEGORY_LABEL_KEY[group.category])}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{group.summary}</p>
          </div>
        )
      })}

      {actionAdvice.length > 0 && (
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
            {actionAdvice.map((advice, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-accent-warm/60" />
                {advice}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

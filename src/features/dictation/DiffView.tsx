import { cn } from "@/lib/utils"
import type { DictationAttemptResult } from "@/types/api"

// Shared word-diff renderer — displays the grading diff token by token, with correct words
// in foreground and incorrect ones highlighted in destructive. Extra words the learner typed
// are listed separately below. Used by AttemptResultPanel.
export function DiffView({
  diff,
  extraLabel,
}: {
  diff: DictationAttemptResult["diff"]
  extraLabel: string
}) {
  const extras = diff.filter((slot) => slot.tag === "EXTRA")
  const displayedTokens = diff.filter((slot) => slot.tag !== "EXTRA")

  return (
    <div className="rounded-2xl bg-muted/40 p-4">
      {/* Correct/incorrect word-by-word display. */}
      <p className="text-lg leading-relaxed tracking-wide">
        {displayedTokens.map((slot, i) => (
          <span
            key={i}
            className={cn(
              "mr-1.5 inline-block rounded px-1 py-0.5",
              slot.tag === "CORRECT"
                ? "text-foreground"
                : "bg-destructive/10 text-destructive decoration-destructive/50 underline decoration-1 underline-offset-2"
            )}
          >
            {slot.expectedWord}
          </span>
        ))}
      </p>

      {/* Extra words the learner typed that weren't in the original. */}
      {extras.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/5 p-2.5 text-sm">
          <span className="shrink-0 font-medium text-destructive">{extraLabel}:</span>
          <span className="text-muted-foreground">
            {extras.map((slot) => slot.actualWord).join(", ")}
          </span>
        </div>
      )}
    </div>
  )
}
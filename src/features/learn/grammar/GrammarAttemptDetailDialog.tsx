import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useGrammarAttemptDetail } from "@/features/learn/grammar/hooks"
import { GrammarResultPanel } from "@/features/learn/grammar/GrammarResultPanel"

interface GrammarAttemptDetailDialogProps {
  userId: string
  attemptId: number | null
  onOpenChange: (open: boolean) => void
}

// Read-only replay of one past grammar-practice attempt, reusing GrammarResultPanel (no onRetry)
// so a history row looks exactly like the result screen the learner saw right after submitting.
export function GrammarAttemptDetailDialog({ userId, attemptId, onOpenChange }: GrammarAttemptDetailDialogProps) {
  const { data, isLoading } = useGrammarAttemptDetail(userId, attemptId)

  return (
    <Dialog open={attemptId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.topic ?? "Grammar"}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div aria-busy="true" aria-live="polite" className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <GrammarResultPanel accuracy={data.accuracy} results={data.results} />
        )}
      </DialogContent>
    </Dialog>
  )
}

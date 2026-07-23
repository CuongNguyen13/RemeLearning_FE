import { PartyPopper } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SectionResultPanelProps {
  totalWords: number
  onBackToTopics: () => void
}

// Shown once a Section reaches completed=true (queue emptied naturally, or the learner finished
// early) - deliberately simple: the per-word mastery detail already lives in the topic list's
// updated mastery percentage (re-fetched via query invalidation), not repeated here.
export function SectionResultPanel({ totalWords, onBackToTopics }: SectionResultPanelProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <PartyPopper className="size-10 text-primary" />
        <p className="text-xl font-semibold">{t("learn.vocabulary.library.sectionDoneTitle")}</p>
        <p className="text-muted-foreground">
          {t("learn.vocabulary.library.sectionDoneSubtitle", { count: totalWords })}
        </p>
        <Button onClick={onBackToTopics}>{t("learn.vocabulary.library.backToTopics")}</Button>
      </CardContent>
    </Card>
  )
}

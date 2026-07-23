import { PartyPopper } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface GrammarLibraryResultPanelProps {
  correctCount: number
  totalCount: number
  nextTopicUnlocked?: boolean
  onBackToTopics: () => void
}

// Shown once a session reaches topicStatus === "PASSED" (every question, across the INITIAL session
// and any RETRY rounds, ended up correct) - mirrors vocabulary's SectionResultPanel, plus an extra
// note when the next topic in sequenceOrder just got unlocked.
export function GrammarLibraryResultPanel({
  correctCount,
  totalCount,
  nextTopicUnlocked,
  onBackToTopics,
}: GrammarLibraryResultPanelProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <PartyPopper className="size-10 text-primary" />
        <p className="text-xl font-semibold">{t("learn.grammar.library.passedTitle")}</p>
        <p className="text-muted-foreground">
          {t("learn.grammar.library.passedSubtitle", { correct: correctCount, total: totalCount })}
        </p>
        {nextTopicUnlocked && (
          <p className="text-sm font-medium text-primary">{t("learn.grammar.library.nextUnlocked")}</p>
        )}
        <Button onClick={onBackToTopics}>{t("learn.grammar.library.backToTopics")}</Button>
      </CardContent>
    </Card>
  )
}

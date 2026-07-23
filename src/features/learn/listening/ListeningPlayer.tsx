import { Headphones } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ListeningPlayerProps {
  audioUrl: string
}

// A plain native <audio> element with browser controls - simplest, most robust choice for
// whole-passage playback (unlike dictation's per-sentence SentenceDictationRunner, this skill has
// no need for programmatic seek/word-timing, so there's no reason to hand-roll a Web Audio player).
export function ListeningPlayer({ audioUrl }: ListeningPlayerProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Headphones className="size-4" aria-hidden="true" />
        {t("learn.listening.audioLabel")}
      </p>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- no captions source exists; the transcript is revealed after grading instead */}
      <audio controls className="w-full" src={audioUrl}>
        {t("learn.listening.audioUnsupported")}
      </audio>
    </div>
  )
}

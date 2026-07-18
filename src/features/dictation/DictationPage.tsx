import { Check, Headphones, Mic, PartyPopper, Sparkles, Wand2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { dictationClipAudioUrl, dictationPracticeAudioUrl } from "@/api/learners"
import {
  useAiPractice,
  useDictationFacets,
  useDictationHistory,
  useGenerateAiPractice,
  useStartDictationSession,
  useSubmitDictationAttempt,
} from "@/features/dictation/hooks"
import { ApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import type { DictationAttemptResult, DictationClip } from "@/types/api"

const ANY = "all"
// Quint ease-out: fast start, gentle settle - matches the practice flow's motion, no bounce/elastic.
const EASE_OUT = [0.22, 1, 0.36, 1] as const

export function DictationPage() {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.user?.userId ?? "")
  const [tab, setTab] = useState("library")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("dictation.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dictation.subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={(next) => typeof next === "string" && setTab(next)}>
        <TabsList>
          <TabsTrigger value="library">{t("dictation.tabLibrary")}</TabsTrigger>
          <TabsTrigger value="ai">{t("dictation.tabAi")}</TabsTrigger>
          <TabsTrigger value="history">{t("dictation.tabHistory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <LibrarySection userId={userId} />
        </TabsContent>
        <TabsContent value="ai" className="mt-6">
          <AiPracticeSection userId={userId} onGoToLibrary={() => setTab("library")} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <HistorySection userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --- Library section: browse by facets, dictate each real-audio clip ---

function LibrarySection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const { data: facets } = useDictationFacets(userId)
  const startSession = useStartDictationSession(userId)
  const submitAttempt = useSubmitDictationAttempt(userId)
  const reduceMotion = useReducedMotion()

  const [filters, setFilters] = useState<Record<string, string>>({})
  const [clips, setClips] = useState<DictationClip[] | null>(null)
  const [index, setIndex] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [result, setResult] = useState<DictationAttemptResult | null>(null)
  const [accuracies, setAccuracies] = useState<number[]>([])

  const current = clips?.[index]
  const finished = !!clips && clips.length > 0 && index >= clips.length

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toParam(key: string): string | undefined {
    return filters[key] && filters[key] !== ANY ? filters[key] : undefined
  }

  function handleStart() {
    startSession.mutate(
      {
        skill: toParam("skill"),
        level: toParam("level"),
        topic: toParam("topic"),
        examType: toParam("examType"),
        count: 5,
      },
      {
        onSuccess: (data) => {
          setClips(data)
          setIndex(0)
          setResult(null)
          setTranscript("")
          setAccuracies([])
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("dictation.startError")),
      }
    )
  }

  function handleCheck() {
    if (!current || !transcript.trim()) return
    submitAttempt.mutate(
      { clipId: current.clipId, userTranscript: transcript },
      {
        onSuccess: (data) => {
          setResult(data)
          setAccuracies((prev) => [...prev, data.accuracy])
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("dictation.checkError")),
      }
    )
  }

  function handleNext() {
    setIndex((i) => i + 1)
    setResult(null)
    setTranscript("")
  }

  function handleRestart() {
    setClips(null)
    setIndex(0)
    setResult(null)
    setTranscript("")
    setAccuracies([])
  }

  const averageAccuracy =
    accuracies.length > 0
      ? Math.round((accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length) * 100)
      : 0

  if (!clips) {
    return (
      <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-card p-6 shadow-clay">
        <FacetSelect
          label={t("dictation.filterExam")}
          value={filters.examType ?? ANY}
          options={facets?.examTypes ?? []}
          onChange={(v) => setFilter("examType", v)}
        />
        <FacetSelect
          label={t("dictation.filterSkill")}
          value={filters.skill ?? ANY}
          options={facets?.skills ?? []}
          onChange={(v) => setFilter("skill", v)}
        />
        <FacetSelect
          label={t("dictation.filterLevel")}
          value={filters.level ?? ANY}
          options={facets?.levels ?? []}
          onChange={(v) => setFilter("level", v)}
        />
        <FacetSelect
          label={t("dictation.filterTopic")}
          value={filters.topic ?? ANY}
          options={facets?.topics ?? []}
          onChange={(v) => setFilter("topic", v)}
        />
        <Button className="h-11" disabled={startSession.isPending} onClick={handleStart}>
          <Headphones /> {startSession.isPending ? t("common.loading") : t("dictation.start")}
        </Button>
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <EmptyState
        icon={<Headphones className="size-6" />}
        title={t("dictation.empty")}
        description={t("dictation.adjustFiltersHint")}
        action={
          <Button variant="outline" className="h-11" onClick={handleRestart}>
            {t("dictation.adjustFilters")}
          </Button>
        }
      />
    )
  }

  if (finished) {
    return (
      <SessionSummary
        averageAccuracy={averageAccuracy}
        onRestart={handleRestart}
        reduceMotion={!!reduceMotion}
      />
    )
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div>
        <Progress value={(index / clips.length) * 100} />
        <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
          {t("dictation.progress", { current: index + 1, total: clips.length })}
        </p>
      </div>

      {current && (
        <motion.div
          key={current.clipId}
          initial={{ opacity: 0, x: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
        >
          <RunnerCard
            audioSrc={dictationClipAudioUrl(userId, current.clipId)}
            audioKey={`clip-${current.clipId}`}
            badge={[current.examType, current.level, current.skill].filter(Boolean).join(" · ")}
            transcript={transcript}
            setTranscript={setTranscript}
            result={result}
            isChecking={submitAttempt.isPending}
            isLast={index + 1 >= clips.length}
            onCheck={handleCheck}
            onNext={handleNext}
          />
        </motion.div>
      )}
    </div>
  )
}

// --- AI practice section: Gemini-suggested sentences voiced by Supertonic, built from real misses ---

function AiPracticeSection({
  userId,
  onGoToLibrary,
}: {
  userId: string
  onGoToLibrary: () => void
}) {
  const { t } = useTranslation()
  const { data: items, isLoading } = useAiPractice(userId)
  const generate = useGenerateAiPractice(userId)
  const submitAttempt = useSubmitDictationAttempt(userId)
  const reduceMotion = useReducedMotion()

  const [index, setIndex] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [result, setResult] = useState<DictationAttemptResult | null>(null)

  const playable = (items ?? []).filter((item) => item.audioUrl)
  const current = playable[index]

  function handleGenerate() {
    generate.mutate(undefined, {
      onSuccess: () => {
        setIndex(0)
        setResult(null)
        setTranscript("")
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : t("dictation.aiError")),
    })
  }

  function handleCheck() {
    if (!current || !transcript.trim()) return
    submitAttempt.mutate(
      { practiceItemId: current.practiceItemId, userTranscript: transcript },
      {
        onSuccess: setResult,
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("dictation.checkError")),
      }
    )
  }

  function handleNext() {
    setIndex((i) => i + 1)
    setResult(null)
    setTranscript("")
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-accent-warm" />
        <p className="text-sm text-muted-foreground">{t("dictation.aiIntro")}</p>
      </div>

      <Button className="h-11" disabled={generate.isPending} onClick={handleGenerate}>
        <Wand2 /> {generate.isPending ? t("dictation.aiGenerating") : t("dictation.aiGenerate")}
      </Button>

      {!isLoading && playable.length === 0 && (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title={t("dictation.aiEmpty")}
          action={
            <Button variant="outline" className="h-11" onClick={onGoToLibrary}>
              <Headphones /> {t("dictation.goToLibrary")}
            </Button>
          }
        />
      )}

      {current && (
        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-medium text-muted-foreground">
            {t("dictation.progress", { current: index + 1, total: playable.length })}
          </p>
          <motion.div
            key={current.practiceItemId}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
          >
            <RunnerCard
              audioSrc={dictationPracticeAudioUrl(userId, current.practiceItemId)}
              audioKey={`practice-${current.practiceItemId}`}
              badge={t("dictation.aiBadge")}
              transcript={transcript}
              setTranscript={setTranscript}
              result={result}
              isChecking={submitAttempt.isPending}
              isLast={index + 1 >= playable.length}
              onCheck={handleCheck}
              onNext={handleNext}
            />
          </motion.div>
        </div>
      )}
    </div>
  )
}

// --- History section ---

function HistorySection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useDictationHistory(userId)

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <EmptyState
        icon={<Mic className="size-6" />}
        title={t("dictation.historyEmpty")}
      />
    )
  }

  return (
    <RevealGroup className="flex flex-col gap-3">
      {(data ?? []).map((entry) => (
        <RevealItem key={entry.attemptId}>
          <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-clay">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{entry.title ?? t("dictation.aiBadge")}</p>
              <p className="text-xs text-muted-foreground">
                {[entry.examType, entry.level, entry.skill].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Badge variant={entry.accuracy >= 0.8 ? "default" : "secondary"}>
              {t("dictation.accuracy", { accuracy: Math.round(entry.accuracy * 100) })}
            </Badge>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}

// --- Shared presentational pieces ---

function RunnerCard({
  audioSrc,
  audioKey,
  badge,
  transcript,
  setTranscript,
  result,
  isChecking,
  isLast,
  onCheck,
  onNext,
}: {
  audioSrc: string
  audioKey: string
  badge: string
  transcript: string
  setTranscript: (value: string) => void
  result: DictationAttemptResult | null
  isChecking: boolean
  isLast: boolean
  onCheck: () => void
  onNext: () => void
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const transcriptId = `dictation-transcript-${audioKey}`
  const isStrongMatch = !!result && result.accuracy >= 0.8

  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl bg-card p-6 shadow-clay">
      {badge && (
        <Badge variant="secondary" className="w-fit">
          {badge}
        </Badge>
      )}

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        key={audioKey}
        controls
        preload="metadata"
        className="w-full"
        src={audioSrc}
        aria-label={t("dictation.audioLabel")}
      />

      <label htmlFor={transcriptId} className="sr-only">
        {t("dictation.transcriptLabel")}
      </label>
      <Textarea
        id={transcriptId}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder={t("dictation.transcriptPlaceholder")}
        disabled={!!result}
        rows={4}
      />

      {!result ? (
        <Button className="h-11" disabled={!transcript.trim() || isChecking} onClick={onCheck}>
          {isChecking ? t("common.loading") : t("dictation.check")}
        </Button>
      ) : (
        <motion.div
          className="flex flex-col gap-3"
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
          <Button className="h-11" onClick={onNext}>
            {isLast ? t("dictation.finish") : t("dictation.next")}
          </Button>
        </motion.div>
      )}
    </div>
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

function SessionSummary({
  averageAccuracy,
  onRestart,
  reduceMotion,
}: {
  averageAccuracy: number
  onRestart: () => void
  reduceMotion: boolean
}) {
  const { t } = useTranslation()
  const perfectRun = averageAccuracy >= 90

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
      className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-clay"
    >
      <motion.div
        initial={{ scale: reduceMotion ? 1 : 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.35,
          ease: EASE_OUT,
          delay: reduceMotion ? 0 : 0.1,
        }}
      >
        <PartyPopper className="size-10 text-accent-warm" />
      </motion.div>
      <p className="font-heading text-2xl font-medium">{t("dictation.allDone")}</p>
      <p className="text-muted-foreground">
        {t("dictation.resultsSummary", { accuracy: averageAccuracy })}
      </p>
      {perfectRun && (
        <p className="text-sm font-medium text-accent-warm">{t("dictation.perfectRun")}</p>
      )}
      <Button
        size="lg"
        onClick={onRestart}
        className="mt-2 h-11 bg-accent-warm text-accent-warm-foreground shadow-clay-warm hover:bg-accent-warm/90"
      >
        {t("dictation.practiceAgain")}
      </Button>
    </motion.div>
  )
}

function FacetSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <Select value={value} onValueChange={(next) => onChange(next ?? ANY)}>
        <SelectTrigger className="h-11 w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("dictation.filterAll")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

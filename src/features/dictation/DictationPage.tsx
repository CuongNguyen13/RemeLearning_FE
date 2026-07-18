import { Check, ChevronLeft, Folder, Headphones, Mic, Sparkles, Wand2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { dictationClipAudioUrl, dictationPracticeAudioUrl } from "@/api/learners"
import { AttemptResultPanel } from "@/features/dictation/AttemptResultPanel"
import {
  useAiPractice,
  useDictationClip,
  useDictationFacets,
  useDictationFolderLessons,
  useDictationFolders,
  useDictationHistory,
  useGenerateAiPractice,
  useSubmitDictationAttempt,
} from "@/features/dictation/hooks"
import { SentenceDictationRunner } from "@/features/dictation/SentenceDictationRunner"
import { ApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import type { DictationAttemptResult, DictationLessonSummary } from "@/types/api"

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

// --- Library section: browse folders -> lessons -> sentence-by-sentence runner -> result ---

type LibraryView = "folders" | "lessons" | "runner" | "result"

function LibrarySection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const { data: facets } = useDictationFacets(userId)
  const submitAttempt = useSubmitDictationAttempt(userId)

  const [view, setView] = useState<LibraryView>("folders")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null)
  const [result, setResult] = useState<DictationAttemptResult | null>(null)

  const {
    data: folders,
    isLoading: foldersLoading,
    isError: foldersError,
    refetch: refetchFolders,
  } = useDictationFolders(userId)
  const {
    data: lessons,
    isLoading: lessonsLoading,
    isError: lessonsError,
    refetch: refetchLessons,
  } = useDictationFolderLessons(userId, selectedFolderId)
  const { data: clip, isError: clipError, refetch: refetchClip } = useDictationClip(
    userId,
    selectedClipId
  )

  function openFolder(folderId: string) {
    setSelectedFolderId(folderId)
    setView("lessons")
  }

  function openLesson(clipId: number) {
    setSelectedClipId(clipId)
    setResult(null)
    setView("runner")
  }

  function handleRunnerComplete(fullTranscript: string) {
    if (selectedClipId == null) return
    submitAttempt.mutate(
      { clipId: selectedClipId, userTranscript: fullTranscript },
      {
        onSuccess: (data) => {
          setResult(data)
          setView("result")
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("dictation.checkError")),
      }
    )
  }

  function goToNextLesson() {
    const currentIndex = (lessons ?? []).findIndex((lesson) => lesson.clipId === selectedClipId)
    const nextLesson = currentIndex >= 0 ? lessons?.[currentIndex + 1] : undefined
    if (nextLesson) {
      openLesson(nextLesson.clipId)
    } else {
      setView("lessons")
    }
  }

  if (view === "folders") {
    if (foldersError) {
      return <ErrorState onRetry={() => void refetchFolders()} />
    }
    if (!foldersLoading && (!folders || folders.length === 0)) {
      return <EmptyState icon={<Folder className="size-6" />} title={t("dictation.folders.empty")} />
    }
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("dictation.folders.title")}</h2>
        <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(folders ?? []).map((folder) => (
            <RevealItem key={folder.folderId}>
              <button
                type="button"
                onClick={() => openFolder(folder.folderId)}
                className="flex w-full flex-col gap-2 rounded-2xl bg-card p-5 text-left shadow-clay transition hover:shadow-clay-warm"
              >
                <Folder className="size-5 text-accent-warm" />
                <p className="font-medium">{folder.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("dictation.folders.lessonCount", { count: folder.lessonCount })}
                </p>
              </button>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    )
  }

  if (view === "lessons") {
    const currentFolder = folders?.find((folder) => folder.folderId === selectedFolderId)
    return (
      <div className="flex flex-col gap-3">
        <Button variant="ghost" className="h-9 w-fit" onClick={() => setView("folders")}>
          <ChevronLeft /> {t("dictation.lessons.back")}
        </Button>
        <h2 className="text-lg font-medium">{currentFolder?.name}</h2>
        {lessonsError ? (
          <ErrorState onRetry={() => void refetchLessons()} />
        ) : !lessonsLoading && (!lessons || lessons.length === 0) ? (
          <EmptyState icon={<Headphones className="size-6" />} title={t("dictation.lessons.empty")} />
        ) : (
          <RevealGroup className="flex flex-col gap-2">
            {(lessons ?? []).map((lesson) => (
              <RevealItem key={lesson.clipId}>
                <LessonRow lesson={lesson} onClick={() => openLesson(lesson.clipId)} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    )
  }

  if (view === "runner") {
    if (clipError) {
      return <ErrorState onRetry={() => void refetchClip()} />
    }
    if (!clip) return null
    return (
      <SentenceDictationRunner
        clip={clip}
        audioSrc={dictationClipAudioUrl(userId, clip.clipId)}
        minListensForHint={facets?.minListensForHint ?? 1}
        onComplete={handleRunnerComplete}
      />
    )
  }

  if (view === "result" && result) {
    const currentIndex = (lessons ?? []).findIndex((lesson) => lesson.clipId === selectedClipId)
    const hasNext = currentIndex >= 0 && currentIndex + 1 < (lessons ?? []).length
    return (
      <AttemptResultPanel
        result={result}
        onNextLesson={hasNext ? goToNextLesson : undefined}
        onBackToLessons={() => setView("lessons")}
      />
    )
  }

  return null
}

function LessonRow({
  lesson,
  onClick,
}: {
  lesson: DictationLessonSummary
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left shadow-clay transition hover:shadow-clay-warm"
    >
      <div className="flex flex-col gap-1">
        <p className="font-medium">{lesson.title}</p>
        <p className="text-xs text-muted-foreground">{lesson.code}</p>
      </div>
      <Headphones className="size-4 shrink-0 text-muted-foreground" />
    </button>
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

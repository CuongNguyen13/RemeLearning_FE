import {
  ChevronLeft,
  Clock,
  Folder,
  Headphones,
  Search,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { LoadingOverlay } from "@/components/common/LoadingOverlay"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import type { DictationLessonSummary } from "@/types/api"
import { AttemptDetailDialog } from "@/features/dictation/AttemptDetailDialog"
import { GenerateAiPracticeDialog } from "@/features/dictation/GenerateAiPracticeDialog"
import {
  useAiPractice,
  useDictationFolderLessons,
  useDictationFolders,
  useDictationHistory,
  useGenerateAiPracticeFromAttempt,
} from "@/features/dictation/hooks"
import { ApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

// Items per page for the 3×3 grid (3 columns × 3 rows).
const PAGE_SIZE = 9

// Simple pagination control — numbered page buttons with prev/next chevrons,
// rendered below the grid. Hides itself when totalPages ≤ 1.
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null

  // Build the visible page numbers: first, last, and a window of up to 3 around current.
  const pages: (number | "gap")[] = []
  const winStart = Math.max(2, page - 1)
  const winEnd = Math.min(totalPages - 1, page + 1)

  pages.push(1)
  if (winStart > 2) pages.push("gap")
  for (let p = winStart; p <= winEnd; p++) pages.push(p)
  if (winEnd < totalPages - 1) pages.push("gap")
  if (totalPages > 1) pages.push(totalPages)

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 pt-4">
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="icon"
            className="size-9 text-sm font-medium"
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        aria-label="Next page"
      >
        <ChevronLeft className="size-4 rotate-180" />
      </Button>
    </nav>
  )
}

// Lets a horizontal scroll gesture (trackpad swipe, or a mouse wheel that reports deltaX)
// page a grid forward/back, mirroring how a carousel responds to a swipe. Attached via a
// native (non-passive) listener because React's synthetic onWheel is passive by default,
// so calling preventDefault() from JSX would silently no-op. Only intercepts when the
// gesture is predominantly horizontal and past a small threshold, so ordinary vertical
// page scrolling over the grid is never hijacked. A short cooldown collapses one swipe's
// many wheel events into a single page turn.
function useHorizontalWheelPaging(canGoNext: boolean, canGoPrev: boolean, onNext: () => void, onPrev: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const cooling = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function handleWheel(event: WheelEvent) {
      const { deltaX, deltaY } = event
      if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 24) return
      const goingNext = deltaX > 0
      if ((goingNext && !canGoNext) || (!goingNext && !canGoPrev)) return
      event.preventDefault()
      if (cooling.current) return
      cooling.current = true
      if (goingNext) onNext()
      else onPrev()
      window.setTimeout(() => {
        cooling.current = false
      }, 450)
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [canGoNext, canGoPrev, onNext, onPrev])

  return ref
}

// One tile shape for every browsable grid on this page (folders, lessons, AI-generated
// items) - same size, same icon/title/meta slots - so switching tabs never resets the
// learner's sense of "this is the same kind of thing, just a different source." The meta
// row is always mounted (even with nothing to show) so tiles with a badge line and tiles
// without one still line up to the exact same height within a row.
interface GridTileProps {
  icon: LucideIcon
  tone?: "muted" | "warm"
  title: string
  meta?: ReactNode
  cornerBadge?: ReactNode
  onClick: () => void
}

function GridTile({ icon: Icon, tone = "muted", title, meta, cornerBadge, onClick }: GridTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Frosted glass tile: translucent card surface + backdrop blur + a bright top-edge
      // border catch the ambient page tint behind it, with a lift + glow on hover/focus.
      className="group relative flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-white/40 bg-card/60 p-8 text-center shadow-clay backdrop-blur-lg transition-all duration-200 ease-out hover:-translate-y-1 hover:border-white/70 hover:bg-card/75 hover:shadow-clay-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {cornerBadge != null && (
        <span className="absolute top-3 right-3 rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-bold tabular-nums text-primary">
          {cornerBadge}
        </span>
      )}
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full border border-white/50 backdrop-blur-md transition-colors duration-150 ease-out motion-reduce:transition-none",
          tone === "warm" ? "bg-accent-warm/10 group-hover:bg-accent-warm/20" : "bg-white/30 group-hover:bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "size-6 transition-transform duration-150 ease-out group-hover:scale-110 motion-reduce:transform-none",
            tone === "warm" ? "text-accent-warm" : "text-muted-foreground group-hover:text-primary"
          )}
        />
      </div>
      <p className="line-clamp-2 text-center font-medium leading-snug">{title}</p>
      {/* Always-mounted meta slot - keeps every tile's icon/title block at the same
          vertical position whether or not this particular item has badges to show. */}
      <div className="flex min-h-9 flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground">
        {meta}
      </div>
    </button>
  )
}

// Maps a CEFR level (A1..C2) to the coarse 3-tier label the UI shows; unrecognized/missing
// levels render nothing rather than a raw code the learner has no context for.
function levelLabel(level: string | null, t: (key: string) => string): string | null {
  if (!level) return null
  const upper = level.toUpperCase()
  if (upper === "A1" || upper === "A2") return t("dictation.lessons.levelBasic")
  if (upper === "B1" || upper === "B2") return t("dictation.lessons.levelIntermediate")
  if (upper === "C1" || upper === "C2") return t("dictation.lessons.levelAdvanced")
  return null
}

// One tile for a library lesson: level badge, sentence count (stands in for a duration
// estimate - no audio-length data is stored), and a progress readout reusing the learner's
// most-recent-attempt accuracy (the system has no "resume mid-lesson" concept, so this is
// not a % of the lesson completed - it's how accurately they did on their last full run).
// The progress row is always mounted, just made invisible pre-attempt, so every tile in the
// grid keeps the same height whether or not it has been practiced yet.
function LessonTile({ lesson, onClick }: { lesson: DictationLessonSummary; onClick: () => void }) {
  const { t } = useTranslation()
  const level = levelLabel(lesson.level, t)
  const attempted = lesson.attemptCount != null && lesson.attemptCount > 0
  const percent = attempted ? Math.round((lesson.latestAccuracy ?? 0) * 100) : 0
  const completed = attempted && percent >= 90

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-44 w-full flex-col gap-3 rounded-3xl border border-white/40 bg-card/60 p-6 text-left shadow-clay backdrop-blur-lg transition-all duration-200 ease-out hover:-translate-y-1 hover:border-white/70 hover:bg-card/75 hover:shadow-clay-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/30 backdrop-blur-md transition-colors duration-150 ease-out group-hover:bg-primary/15 motion-reduce:transition-none">
          <Headphones className="size-5 text-primary" />
        </div>
        {level && (
          <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
            {level}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <p className="line-clamp-2 font-medium leading-snug">{lesson.title}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {t("dictation.lessons.sentenceCount", { count: lesson.sentenceCount })}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Progress
          value={attempted ? percent : 0}
          className={cn("h-1.5 transition-opacity", !attempted && "opacity-0", completed && "[&>div]:bg-emerald-500")}
        />
        <p className="text-xs text-muted-foreground">
          {!attempted
            ? t("dictation.lessons.notStarted")
            : completed
              ? t("dictation.lessons.completed")
              : t("dictation.lessons.percentDone", { percent })}
        </p>
      </div>
    </button>
  )
}

// Wraps any browsable list into the shared paged-grid experience: 3×3 tiles, numbered
// pagination, and horizontal-wheel/trackpad paging with a directional slide - one
// implementation so folders, lessons, and AI items all page identically.
function PagedGrid<T>({
  items,
  page,
  onPageChange,
  renderItem,
  pageSize = PAGE_SIZE,
}: {
  items: T[]
  page: number
  onPageChange: (page: number) => void
  renderItem: (item: T, indexInPage: number, indexOverall: number) => ReactNode
  pageSize?: number
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const [direction, setDirection] = useState(1)

  // Clamp back to the last valid page if the list shrinks (e.g. a filter or regeneration).
  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages)
  }, [page, totalPages, onPageChange])

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 1), totalPages)
      setDirection(clamped > page ? 1 : -1)
      onPageChange(clamped)
    },
    [page, totalPages, onPageChange]
  )

  const wheelRef = useHorizontalWheelPaging(
    page < totalPages,
    page > 1,
    useCallback(() => goTo(page + 1), [goTo, page]),
    useCallback(() => goTo(page - 1), [goTo, page])
  )

  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return (
    <div ref={wheelRef} className="flex flex-col gap-3">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={page}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -32 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {pageItems.map((item, i) => renderItem(item, i, start + i))}
          </motion.div>
        </AnimatePresence>
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={goTo} />
      {totalPages > 1 && (
        <p className="text-center text-xs text-muted-foreground">{t("dictation.wheelHint")}</p>
      )}
    </div>
  )
}

export function DictationPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const userId = useAuthStore((state) => state.user?.userId ?? "")
  const [tab, setTab] = useState(
    () => (location.state as { tab?: string } | null)?.tab ?? "library"
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("dictation.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dictation.subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={(next) => typeof next === "string" && setTab(next)}>
        {/* Segmented glass control — frosted pill rail, active tab lifts into its own
            frosted-white pill with the same colored glow the lesson cards use. */}
        <TabsList className="h-auto gap-1 rounded-full border border-border/60 bg-muted/50 p-1.5 backdrop-blur-xl">
          <TabsTrigger
            value="library"
            className="rounded-full px-4 py-1.5 data-active:border data-active:border-white/60 data-active:bg-card/90 data-active:shadow-clay data-active:backdrop-blur-md"
          >
            {t("dictation.tabLibrary")}
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-full px-4 py-1.5 data-active:border data-active:border-white/60 data-active:bg-card/90 data-active:shadow-clay data-active:backdrop-blur-md"
          >
            {t("dictation.tabAi")}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-full px-4 py-1.5 data-active:border data-active:border-white/60 data-active:bg-card/90 data-active:shadow-clay data-active:backdrop-blur-md"
          >
            {t("dictation.tabHistory")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <LibraryBrowse userId={userId} />
        </TabsContent>
        <TabsContent value="ai" className="mt-6">
          <AiPracticeSection userId={userId} onGoToLibrary={() => setTab("library")} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <HistorySection userId={userId} onSwitchTab={setTab} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --- Library browse: folders grid → lessons grid, each paginated 3×3. Clicking
//     a lesson navigates to the standalone DictationLessonPage route. No inline
//     runner — running/submitting/result now lives on its own page. ---

type MasterMode = "folders" | "lessons"

function LibraryBrowse({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [masterMode, setMasterMode] = useState<MasterMode>("folders")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [folderPage, setFolderPage] = useState(1)
  const [lessonPage, setLessonPage] = useState(1)
  const [lessonSearch, setLessonSearch] = useState("")

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

  // Reset page when switching views
  function openFolder(folderId: string) {
    setSelectedFolderId(folderId)
    setMasterMode("lessons")
    setLessonPage(1)
    setLessonSearch("")
  }

  function backToFolders() {
    setMasterMode("folders")
    setSelectedFolderId(null)
    setLessonPage(1)
    setLessonSearch("")
  }

  function openLesson(clipId: number) {
    navigate(`/dictation/lesson/${clipId}`)
  }

  // --- folders grid ---

  if (masterMode === "folders") {
    if (foldersError) {
      return <ErrorState onRetry={() => void refetchFolders()} />
    }
    if (foldersLoading) {
      return (
        <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">{t("dictation.folders.title")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-3xl" />
            ))}
          </div>
        </div>
      )
    }
    if (!folders || folders.length === 0) {
      return <EmptyState icon={<Folder className="size-6" />} title={t("dictation.folders.empty")} />
    }

    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">{t("dictation.folders.title")}</h2>
        <PagedGrid
          items={folders}
          page={folderPage}
          onPageChange={setFolderPage}
          renderItem={(folder) => (
            <GridTile
              key={folder.folderId}
              icon={Folder}
              tone="warm"
              title={folder.name}
              meta={t("dictation.folders.lessonCount", { count: folder.lessonCount })}
              onClick={() => openFolder(folder.folderId)}
            />
          )}
        />
      </div>
    )
  }

  // --- lessons grid ---

  const currentFolder = folders?.find((folder) => folder.folderId === selectedFolderId)
  const lessonQuery = lessonSearch.trim().toLowerCase()
  const filteredLessons = !lessonQuery || !lessons
    ? lessons
    : lessons.filter((lesson) => lesson.title.toLowerCase().includes(lessonQuery))

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="ghost"
        className="h-9 w-fit gap-1.5 rounded-full border border-white/40 bg-card/50 backdrop-blur-md hover:border-white/70 hover:bg-card/70"
        onClick={backToFolders}
      >
        <ChevronLeft /> {t("dictation.lessons.back")}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-2 font-heading text-lg font-semibold">
          {currentFolder?.name}
          {lessons && lessons.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {t("dictation.folders.lessonCount", { count: lessons.length })}
            </span>
          )}
        </h2>
        {lessons && lessons.length > 0 && (
          <div className="relative w-full max-w-64 sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={lessonSearch}
              onChange={(e) => {
                setLessonSearch(e.target.value)
                setLessonPage(1)
              }}
              placeholder={t("dictation.lessons.searchPlaceholder")}
              className="pl-9"
              aria-label={t("dictation.lessons.searchPlaceholder")}
            />
          </div>
        )}
      </div>
      {lessonsError ? (
        <ErrorState onRetry={() => void refetchLessons()} />
      ) : lessonsLoading ? (
        <div aria-busy="true" aria-live="polite" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : !lessons || lessons.length === 0 ? (
        <EmptyState icon={<Headphones className="size-6" />} title={t("dictation.lessons.empty")} />
      ) : !filteredLessons || filteredLessons.length === 0 ? (
        <EmptyState icon={<Search className="size-6" />} title={t("dictation.lessons.searchEmpty")} />
      ) : (
        <PagedGrid
          items={filteredLessons}
          page={lessonPage}
          onPageChange={setLessonPage}
          renderItem={(lesson) => (
            <LessonTile key={lesson.clipId} lesson={lesson} onClick={() => openLesson(lesson.clipId)} />
          )}
        />
      )}
    </div>
  )
}

// --- AI practice section: Gemini-suggested passages voiced by Supertonic, built from real misses.
//     Browse-then-run just like the library: a grid of generated items, each opening its own
//     standalone page that runs the exact same sentence-by-sentence SentenceDictationRunner. ---

function AiPracticeSection({
  userId,
  onGoToLibrary,
}: {
  userId: string
  onGoToLibrary: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: items, isLoading } = useAiPractice(userId)
  const [page, setPage] = useState(1)

  const playable = (items ?? []).filter((item) => item.audioUrl)

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-start gap-3 rounded-2xl border border-white/40 bg-muted/50 p-4 backdrop-blur-lg">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-accent-warm" />
        <p className="text-sm text-muted-foreground">{t("dictation.aiIntro")}</p>
      </div>

      <GenerateAiPracticeDialog
        userId={userId}
        trigger={
          <Button className="h-12 w-full">
            <Wand2 /> {t("dictation.aiGenerate")}
          </Button>
        }
      />

      {isLoading && (
        <div aria-busy="true" aria-live="polite" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && playable.length === 0 && (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title={t("dictation.aiEmpty")}
          action={
            <Button variant="outline" className="h-12" onClick={onGoToLibrary}>
              <Headphones /> {t("dictation.goToLibrary")}
            </Button>
          }
        />
      )}

      {!isLoading && playable.length > 0 && (
        <PagedGrid
          items={playable}
          page={page}
          onPageChange={setPage}
          renderItem={(item, _indexInPage, indexOverall) => (
            <GridTile
              key={item.practiceItemId}
              icon={Sparkles}
              tone="warm"
              title={item.topic ?? t("dictation.aiPracticeItemTitle", { index: indexOverall + 1 })}
              meta={
                <>
                  <span>{t("dictation.aiBadge")}</span>
                  {[item.level, item.examType].filter(Boolean).map((facet) => (
                    <Badge key={facet} variant="outline" className="text-[0.65rem]">
                      {facet}
                    </Badge>
                  ))}
                </>
              }
              onClick={() => navigate(`/dictation/ai-practice/${item.practiceItemId}`)}
            />
          )}
        />
      )}
    </div>
  )
}

// --- History section ---

function HistorySection({ userId, onSwitchTab }: { userId: string; onSwitchTab: (tab: string) => void }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading } = useDictationHistory(userId)
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)
  const generateFromAttempt = useGenerateAiPracticeFromAttempt(userId)

  // Analyzes just this attempt's mistakes into new AI-practice sentences, then jumps to the AI tab.
  function handlePracticeWithAi(attemptId: number) {
    generateFromAttempt.mutate(
      { attemptId, translationLang: i18n.resolvedLanguage },
      {
        onSuccess: () => onSwitchTab("ai"),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : t("dictation.aiError")),
      }
    )
  }

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <EmptyState
        icon={<Headphones className="size-6" />}
        title={t("dictation.historyEmpty")}
      />
    )
  }

  return (
    <>
      <RevealGroup className="flex flex-col gap-3">
        {(data ?? []).map((entry) => {
          const accuracyPercent = Math.round(entry.accuracy * 100)
          const isStrong = accuracyPercent >= 80
          const hasClip = entry.clipId != null
          return (
            <RevealItem key={entry.attemptId}>
              {/* Each history row is a non-interactive card — clicking the card body
                  opens the detail dialog; two action buttons let the learner jump
                  straight to re-practicing the same lesson (if it's a library clip)
                  or to the AI practice tab. */}
              <div className="relative flex flex-col gap-3 rounded-2xl border border-white/40 bg-card/60 p-4 shadow-clay backdrop-blur-lg transition hover:border-white/70 hover:bg-card/75 hover:shadow-clay-warm">
                <button
                  type="button"
                  onClick={() => setSelectedAttemptId(entry.attemptId)}
                  className="flex w-full items-center gap-4 text-left"
                >
                  {/* Accuracy donut indicator — compact visual for scanning. */}
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                      isStrong
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : accuracyPercent >= 50
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-400"
                          : "bg-destructive/5 text-destructive ring-1 ring-destructive/10"
                    )}
                    aria-label={t("dictation.accuracy", { accuracy: accuracyPercent })}
                  >
                    {accuracyPercent}
                  </div>

                  {/* Attempt metadata. */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium">
                        {entry.title ?? t("dictation.aiBadge")}
                      </p>
                      <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
                        {entry.practiceType === "LIBRARY" ? t("dictation.libraryBadge") : t("dictation.aiBadge")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[entry.examType, entry.level, entry.skill].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  {/* Strong matches get a star accent per the One Accent Rule – only one per card. */}
                  {isStrong && (
                    <Star className="size-4 shrink-0 fill-accent-warm/30 text-accent-warm" aria-hidden="true" />
                  )}
                </button>

                {/* Bottom row: attempt count badge + action buttons. */}
                <div className="flex items-center justify-between gap-2">
                  {/* Attempt count — shows how many times this lesson has been practiced. */}
                  {entry.attemptCount != null && entry.attemptCount > 0 && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-bold tabular-nums text-muted-foreground">
                      {t("dictation.lessonAttemptCount", { count: entry.attemptCount })}
                    </span>
                  )}
                  {entry.attemptCount == null && <span /> /* spacer so buttons stay right-aligned */}

                  <div className="flex gap-2">
                    {/* "Làm lại" — only for library-clip attempts, navigates to the lesson page. */}
                    {hasClip && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => navigate(`/dictation/lesson/${entry.clipId}`)}
                      >
                        <Headphones className="size-3.5" />
                        {t("dictation.historyRedo")}
                      </Button>
                    )}
                    {/* "Luyện tập với AI" — analyzes this attempt's own mistakes into new
                        AI-practice sentences, then jumps to the AI tab. */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      disabled={generateFromAttempt.isPending && generateFromAttempt.variables?.attemptId === entry.attemptId}
                      onClick={() => handlePracticeWithAi(entry.attemptId)}
                    >
                      <Wand2 className="size-3.5" />
                      {t("dictation.goToAi")}
                    </Button>
                  </div>
                </div>

                <LoadingOverlay
                  show={generateFromAttempt.isPending && generateFromAttempt.variables?.attemptId === entry.attemptId}
                  label={t("common.generating")}
                />
              </div>
            </RevealItem>
          )
        })}
      </RevealGroup>

      {/* History detail dialog — only shown when a history row is clicked. It does NOT
          appear during active typing/practice; that interaction is on the lesson page
          which has no history rail at all. */}
      {selectedAttemptId != null && (
        <AttemptDetailDialog
          userId={userId}
          attemptId={selectedAttemptId}
          onOpenChange={(open) => !open && setSelectedAttemptId(null)}
        />
      )}
    </>
  )
}

import {
  ChevronLeft,
  Folder,
  Headphones,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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
        <TabsList>
          <TabsTrigger value="library">{t("dictation.tabLibrary")}</TabsTrigger>
          <TabsTrigger value="ai">{t("dictation.tabAi")}</TabsTrigger>
          <TabsTrigger value="history">{t("dictation.tabHistory")}</TabsTrigger>
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
  }

  function backToFolders() {
    setMasterMode("folders")
    setSelectedFolderId(null)
    setLessonPage(1)
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
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      )
    }
    if (!folders || folders.length === 0) {
      return <EmptyState icon={<Folder className="size-6" />} title={t("dictation.folders.empty")} />
    }

    const totalPages = Math.ceil(folders.length / PAGE_SIZE)
    const start = (folderPage - 1) * PAGE_SIZE
    const pageFolders = folders.slice(start, start + PAGE_SIZE)

    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">{t("dictation.folders.title")}</h2>
        <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageFolders.map((folder) => (
            <RevealItem key={folder.folderId}>
              <button
                type="button"
                onClick={() => openFolder(folder.folderId)}
                className="group flex w-full items-center gap-3 rounded-2xl bg-card p-5 text-left shadow-clay transition hover:shadow-clay-warm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-warm/10">
                  <Folder className="size-5 text-accent-warm transition-transform duration-150 ease-out group-hover:scale-110 motion-reduce:transform-none" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{folder.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("dictation.folders.lessonCount", { count: folder.lessonCount })}
                  </p>
                </div>
              </button>
            </RevealItem>
          ))}
        </RevealGroup>
        <Pagination page={folderPage} totalPages={totalPages} onPage={setFolderPage} />
      </div>
    )
  }

  // --- lessons grid ---

  const currentFolder = folders?.find((folder) => folder.folderId === selectedFolderId)
  return (
    <div className="flex flex-col gap-3">
      <Button variant="ghost" className="h-9 w-fit" onClick={backToFolders}>
        <ChevronLeft /> {t("dictation.lessons.back")}
      </Button>
      <h2 className="font-heading text-lg font-semibold">{currentFolder?.name}</h2>
      {lessonsError ? (
        <ErrorState onRetry={() => void refetchLessons()} />
      ) : lessonsLoading ? (
        <div aria-busy="true" aria-live="polite" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !lessons || lessons.length === 0 ? (
        <EmptyState icon={<Headphones className="size-6" />} title={t("dictation.lessons.empty")} />
      ) : (
        (() => {
          const totalPages = Math.ceil(lessons.length / PAGE_SIZE)
          const start = (lessonPage - 1) * PAGE_SIZE
          const pageLessons = lessons.slice(start, start + PAGE_SIZE)

          return (
            <>
              <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pageLessons.map((lesson) => (
                  <RevealItem key={lesson.clipId}>
                    <button
                      type="button"
                      onClick={() => openLesson(lesson.clipId)}
                      className="group relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl bg-card p-6 text-center shadow-clay transition hover:shadow-clay-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {/* Attempt count badge — shows how many times this lesson has been practiced,
                          anchored top-right so it doesn't compete with the title. */}
                      {lesson.attemptCount != null && lesson.attemptCount > 0 && (
                        <span className="absolute top-3 right-3 rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-bold tabular-nums text-primary">
                          {t("dictation.lessonAttemptCount", { count: lesson.attemptCount })}
                        </span>
                      )}
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 transition-colors duration-150 ease-out group-hover:bg-primary/10 motion-reduce:transition-none">
                        <Headphones className="size-6 text-muted-foreground transition-colors duration-150 ease-out group-hover:text-primary motion-reduce:transition-none" />
                      </div>
                      <p className="text-center font-medium leading-snug">{lesson.title}</p>
                    </button>
                  </RevealItem>
                ))}
              </RevealGroup>
              <Pagination page={lessonPage} totalPages={totalPages} onPage={setLessonPage} />
            </>
          )
        })()
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

  const playable = (items ?? []).filter((item) => item.audioUrl)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
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
        <div aria-busy="true" aria-live="polite" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
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
        <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {playable.map((item, index) => (
            <RevealItem key={item.practiceItemId}>
              <button
                type="button"
                onClick={() => navigate(`/dictation/ai-practice/${item.practiceItemId}`)}
                className="group flex w-full items-center gap-3 rounded-2xl bg-card p-5 text-left shadow-clay transition hover:shadow-clay-warm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-warm/10">
                  <Sparkles className="size-5 text-accent-warm transition-transform duration-150 ease-out group-hover:scale-110 motion-reduce:transform-none" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {item.topic ?? t("dictation.aiPracticeItemTitle", { index: index + 1 })}
                  </p>
                  <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                    <span>{t("dictation.aiBadge")}</span>
                    {[item.level, item.examType].filter(Boolean).map((facet) => (
                      <Badge key={facet} variant="outline" className="text-[0.65rem]">
                        {facet}
                      </Badge>
                    ))}
                  </p>
                </div>
              </button>
            </RevealItem>
          ))}
        </RevealGroup>
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
              <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-clay transition hover:shadow-clay-warm">
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

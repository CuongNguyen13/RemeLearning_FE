import {
  ChevronLeft,
  GraduationCap,
  Headphones,
  Languages,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Mic,
  Repeat2,
  Sparkles,
  User,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

// Standalone "Liquid Glass on Signal Teal" visual exploration of the dictation library
// screen: same content/IA as the real DictationPage + AppSidebar, but reskinned with a
// frosted-glass material (heavy backdrop-blur, translucent surfaces, specular borders)
// layered over the app's own teal/amber palette instead of a generic mesh-gradient. Not
// wired to routing/react-query/auth-store on purpose — it renders fixed demo content so it
// can be dropped in and previewed on its own.

interface NavItem {
  label: string
  icon: LucideIcon
  active?: boolean
}

const PRIMARY_ITEMS: NavItem[] = [
  { label: "nav.dashboard", icon: LayoutDashboard },
  { label: "nav.recordings", icon: Mic },
  { label: "nav.weakPoints", icon: ListChecks },
  { label: "nav.recommendations", icon: Sparkles },
]

const PRACTICE_ITEMS: NavItem[] = [
  { label: "nav.practice", icon: Repeat2 },
  { label: "nav.dictation", icon: Headphones, active: true },
]

const LESSON_TITLES = [
  "At home 1",
  "At home 2",
  "My favorite photographs",
  "Location",
  "Location 2",
  "Color",
]

const TABS = [
  { value: "library", label: "dictation.tabLibrary" },
  { value: "ai", label: "dictation.tabAi" },
  { value: "history", label: "dictation.tabHistory" },
] as const

type TabValue = (typeof TABS)[number]["value"]

function NavRow({ label, icon: Icon, active }: NavItem) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={cn(
        "group flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-medium outline-none transition-all duration-150 ease-out",
        "focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        active
          ? "border border-emerald-300/40 bg-white/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_8px_24px_-8px_rgba(45,212,191,0.45)]"
          : "border border-transparent text-white/65 hover:border-white/15 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "size-4.5 shrink-0 transition-transform duration-150 ease-out group-hover:scale-110",
          active && "text-emerald-300 drop-shadow-[0_0_6px_rgba(45,212,191,0.7)]"
        )}
        aria-hidden="true"
      />
      <span className="truncate">{t(label)}</span>
    </button>
  )
}

function SidebarContent() {
  const { t } = useTranslation()
  return (
    <>
      {/* Brand header */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-6">
        <div className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10">
          <GraduationCap className="size-5 text-emerald-200" aria-hidden="true" />
        </div>
        <span className="font-heading text-lg font-semibold tracking-tight text-white">
          {t("common.appName", "RemeLearning")}
        </span>
      </div>

      <nav aria-label={t("nav.primaryNavigation")} className="flex flex-1 flex-col overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-1">
          {PRIMARY_ITEMS.map((item) => (
            <NavRow key={item.label} {...item} />
          ))}
        </div>

        <div className="my-3 mx-3 h-px bg-white/10" role="separator" aria-orientation="horizontal" />

        <div className="flex flex-col gap-1">
          <p className="mb-1 px-4 text-[0.65rem] font-bold uppercase tracking-wider text-white/40">
            {t("nav.groupPractice")}
          </p>
          {PRACTICE_ITEMS.map((item) => (
            <NavRow key={item.label} {...item} />
          ))}
        </div>

        <div className="flex-1" />

        <div className="mx-3 mb-3 h-px bg-white/10" role="separator" aria-orientation="horizontal" />

        <div className="flex flex-col gap-1">
          <NavRow label="nav.profile" icon={User} />
          <button
            type="button"
            className="flex min-h-10 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-white/55 outline-none transition-all duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-white/40"
          >
            <Languages className="size-4.5 shrink-0" aria-hidden="true" />
            <span>Tiếng Việt</span>
          </button>
          <button
            type="button"
            className="flex min-h-10 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-white/55 outline-none transition-all duration-150 ease-out hover:bg-red-400/15 hover:text-red-200 focus-visible:ring-3 focus-visible:ring-white/40"
          >
            <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </nav>
    </>
  )
}

function GlassSidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  return (
    <>
      {/* Desktop rail — persistent, frosted dark glass. */}
      <aside className="relative hidden h-svh w-64 shrink-0 flex-col overflow-hidden border-r border-white/15 bg-black/20 backdrop-blur-2xl md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer — same glass panel, slides over the content with a blurred scrim. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative flex h-full w-64 max-w-[80vw] flex-col overflow-hidden border-r border-white/10 bg-black/40 backdrop-blur-2xl animate-in slide-in-from-left duration-200 motion-reduce:duration-0"
          >
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Đóng menu"
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 hover:text-white"
            >
              <X className="size-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}

function LessonCard({ title }: { title: string }) {
  return (
    <button
      type="button"
      className="group relative flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-white/25 bg-white/15 p-8 text-center backdrop-blur-lg shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_20px_45px_-24px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-white/45 hover:bg-white/[0.22] hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_24px_48px_-20px_rgba(45,212,191,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 transition-colors duration-150 ease-out group-hover:bg-white/25">
        <Headphones className="size-5 text-emerald-200" aria-hidden="true" />
      </div>
      <p className="line-clamp-2 font-medium text-white/90">{title}</p>
    </button>
  )
}

export function DictationGlassShowcase() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabValue>("library")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="relative flex min-h-svh w-full overflow-hidden bg-[#0b3b36] text-white">
      {/* Mesh-gradient backdrop in the app's own Signal Teal + amber hues, showing through
          every translucent glass surface layered on top of it. */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b3b36]" />
        <div className="absolute -top-1/3 -left-1/4 size-[65vw] rounded-full bg-teal-400/60 blur-[110px]" />
        <div className="absolute -top-1/5 right-[-10%] size-[55vw] rounded-full bg-emerald-300/45 blur-[120px]" />
        <div className="absolute bottom-[-25%] left-1/4 size-[55vw] rounded-full bg-amber-400/35 blur-[110px]" />
        <div className="absolute bottom-[-10%] right-0 size-[40vw] rounded-full bg-cyan-300/25 blur-[100px]" />
      </div>

      <GlassSidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="relative flex min-h-svh flex-1 flex-col overflow-y-auto">
        {/* Mobile top bar — brand + menu trigger, only shown below md. */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl md:hidden">
          <span className="font-heading text-base font-semibold tracking-tight">
            {t("common.appName", "RemeLearning")}
          </span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Mở menu"
            className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10"
          >
            <Menu className="size-4.5" />
          </button>
        </div>

        <main className="flex flex-1 flex-col gap-8 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
              {t("dictation.title")}
            </h1>
            <p className="max-w-2xl text-sm text-white/60">{t("dictation.subtitle")}</p>
          </div>

          {/* Segmented glass tab control */}
          <div
            role="tablist"
            aria-label={t("dictation.title")}
            className="inline-flex w-fit gap-1 rounded-full border border-white/10 bg-black/20 p-1.5 backdrop-blur-xl"
          >
            {TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={tab === item.value}
                onClick={() => setTab(item.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ease-out",
                  tab === item.value
                    ? "bg-white/15 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_4px_16px_-4px_rgba(255,255,255,0.25)]"
                    : "text-white/55 hover:text-white/80"
                )}
              >
                {t(item.label)}
              </button>
            ))}
          </div>

          {tab === "library" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70 backdrop-blur-md transition-colors duration-150 ease-out hover:border-white/25 hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft className="size-4" />
                  {t("dictation.lessons.back")}
                </button>
                <h2 className="font-heading text-lg font-semibold text-white">english-conversations</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {LESSON_TITLES.map((title) => (
                  <LessonCard key={title} title={title} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-3xl border border-white/15 bg-white/5 p-10 text-center text-white/50 backdrop-blur-lg">
              {t(tab === "ai" ? "dictation.aiIntro" : "dictation.historyEmpty")}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

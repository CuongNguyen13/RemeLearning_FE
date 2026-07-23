import {
  BookMarked,
  Ear,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mic,
  Repeat2,
  Sparkles,
  SpellCheck,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink, useNavigate } from "react-router-dom"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

// Primary navigation items — the core learning loop a learner moves through.
const PRIMARY_ITEMS: NavItem[] = [
  { to: "/", label: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/recordings", label: "nav.recordings", icon: Mic },
  { to: "/weak-points", label: "nav.weakPoints", icon: ListChecks },
  { to: "/recommendations", label: "nav.recommendations", icon: Sparkles },
]

// Practice & dictation — the action-oriented step after reviewing weak points.
const PRACTICE_ITEMS: NavItem[] = [
  { to: "/practice", label: "nav.practice", icon: Repeat2 },
  { to: "/dictation", label: "nav.dictation", icon: Headphones },
]

// Learn & practice — the 4 AI-guided skill practice routes (vocabulary/grammar/listening/
// speaking), each its own standalone page a recommendation or the sidebar can deep-link into.
const LEARN_ITEMS: NavItem[] = [
  { to: "/learn/vocabulary", label: "nav.learnVocabulary", icon: BookMarked },
  { to: "/learn/grammar", label: "nav.learnGrammar", icon: SpellCheck },
  { to: "/learn/listening", label: "nav.learnListening", icon: Ear },
  { to: "/learn/speaking", label: "nav.learnSpeaking", icon: Mic },
]

// Secondary items — learner identity and settings.
const SECONDARY_ITEMS: NavItem[] = [
  { to: "/profile", label: "nav.profile", icon: User },
]

interface AppSidebarProps {
  /** Controls the responsive display (e.g. `"hidden md:flex"` for the persistent desktop rail,
   * `"flex"` when reused inside the mobile drawer) - kept out of the base classes so both
   * consumers can opt into whichever visibility rule fits their context. */
  className?: string
  /** Called after a nav link is activated - used by the mobile drawer to close itself. */
  onNavigate?: () => void
}

// Shared nav link renderer — consistent shape, focus ring, and active/inactive states.
function NavItemLink({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
}: NavItem & { onNavigate?: () => void }) {
  const { t } = useTranslation()
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex min-h-11 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium outline-none transition-all duration-150 ease-out motion-reduce:transition-none",
          "focus-visible:ring-3 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          isActive
            ? "border border-white/15 bg-sidebar-accent text-white shadow-clay backdrop-blur-md"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )
      }
    >
      <Icon className="size-4.5 shrink-0 transition-transform duration-150 ease-out group-hover:scale-110 motion-reduce:transform-none" aria-hidden="true" />
      <span className="truncate">{t(label)}</span>
    </NavLink>
  )
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  return (
    <aside
      className={cn(
        "relative h-svh w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/92 text-sidebar-foreground backdrop-blur-2xl",
        className
      )}
    >
      {/* Ambient glows — soft decorative blurs that give the sidebar its frosted-glass depth.
          Sitting inside the sidebar's own stacking context (not real backdrop-see-through),
          so the glass reads consistently regardless of what's on the other side of the rail. */}
      <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-16 size-56 rounded-full bg-accent-warm/12 blur-3xl" />
      {/* Specular sheen — a faint top-down highlight, the glass cue that sells the material. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/8 to-transparent" />

      {/* Brand header — app icon + name, the visual anchor at the top of the sidebar. */}
      <div className="relative z-10 flex h-16 items-center gap-2.5 px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-accent">
          <GraduationCap className="size-5" aria-hidden="true" />
        </div>
        <span className="font-heading text-lg font-semibold tracking-tight">{t("common.appName")}</span>
      </div>

      <nav
        aria-label={t("nav.primaryNavigation")}
        className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 py-2"
      >
        {/* Primary section — the core learning loop: Dashboard → Recordings → Weak Points →
            Recommendations. No group label needed; the items themselves tell the story. */}
        <div className="flex flex-col gap-0.5">
          {PRIMARY_ITEMS.map((item) => (
            <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Separator between review and action sections. */}
        <div className="my-3 mx-3 h-px bg-sidebar-border" role="separator" aria-orientation="horizontal" />

        {/* Practice section — the action-oriented step: Practice + Dictation, with a compact
            label that reads as encouragement rather than a dry category name. */}
        <div className="flex flex-col gap-0.5">
          <p className="mb-1 px-4 text-[0.65rem] font-bold uppercase tracking-wider text-sidebar-foreground/50">
            {t("nav.groupPractice")}
          </p>
          {PRACTICE_ITEMS.map((item) => (
            <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Separator between practice and learn sections. */}
        <div className="my-3 mx-3 h-px bg-sidebar-border" role="separator" aria-orientation="horizontal" />

        {/* Learn & practice section — the 4 AI-guided skill routes, entry points for both
            direct browsing and a recommendation's "Practice now" deep-link. */}
        <div className="flex flex-col gap-0.5">
          <p className="mb-1 px-4 text-[0.65rem] font-bold uppercase tracking-wider text-sidebar-foreground/50">
            {t("nav.groupLearn")}
          </p>
          {LEARN_ITEMS.map((item) => (
            <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Spacer pushes secondary items to the bottom. */}
        <div className="flex-1" />

        {/* Separator before secondary items. */}
        <div className="mx-3 mb-3 h-px bg-sidebar-border" role="separator" aria-orientation="horizontal" />

        {/* Secondary section — profile, pushed to the bottom so primary navigation stays
            fixed in the upper portion of the sidebar. */}
        <div className="flex flex-col gap-0.5">
          {SECONDARY_ITEMS.map((item) => (
            <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Language switcher — anchored at the very base of the sidebar so it reads as a
            global setting rather than a per-screen control. Reuses the shared component
            with a sidebar-appropriate ghost styling. */}
        <div className="mt-1 flex justify-center pb-1">
          <LanguageSwitcher variant="sidebar" />
        </div>

        {/* Logout button — full-width ghost at the very base of the sidebar, visually
            distinct from nav links so it reads as a terminal action, not navigation. */}
        <button
          type="button"
          onClick={() => {
            logout()
            navigate("/login", { replace: true })
          }}
          className="flex min-h-10 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-sidebar-foreground/60 outline-none transition-all duration-150 ease-out hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-3 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar motion-reduce:transition-none"
        >
          <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
          <span>{t("common.logout")}</span>
        </button>
      </nav>
    </aside>
  )
}

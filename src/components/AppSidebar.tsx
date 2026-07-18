import {
  GraduationCap,
  Headphones,
  LayoutDashboard,
  ListChecks,
  Mic,
  Repeat2,
  Sparkles,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "nav.groupOverview",
    items: [{ to: "/", label: "nav.dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "nav.groupLearn",
    items: [
      { to: "/recordings", label: "nav.recordings", icon: Mic },
      { to: "/weak-points", label: "nav.weakPoints", icon: ListChecks },
      { to: "/recommendations", label: "nav.recommendations", icon: Sparkles },
      { to: "/practice", label: "nav.practice", icon: Repeat2 },
      { to: "/dictation", label: "nav.dictation", icon: Headphones },
    ],
  },
  {
    label: "nav.groupAccount",
    items: [{ to: "/profile", label: "nav.profile", icon: User }],
  },
]

interface AppSidebarProps {
  /** Controls the responsive display (e.g. `"hidden md:flex"` for the persistent desktop rail,
   * `"flex"` when reused inside the mobile drawer) - kept out of the base classes so both
   * consumers can opt into whichever visibility rule fits their context. */
  className?: string
  /** Called after a nav link is activated - used by the mobile drawer to close itself. */
  onNavigate?: () => void
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside
      className={cn(
        "relative h-full w-64 shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-16 size-56 rounded-full bg-accent-warm/10 blur-3xl" />

      <div className="relative z-10 flex h-16 items-center gap-2 px-6">
        <GraduationCap className="size-6" aria-hidden="true" />
        <span className="font-heading text-lg font-medium">{t("common.appName")}</span>
      </div>
      <nav
        aria-label={t("nav.primaryNavigation")}
        className="relative z-10 flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1.5">
            <p className="px-4 text-xs font-medium tracking-wide text-sidebar-foreground/70 uppercase">
              {t(group.label)}
            </p>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-150 ease-out motion-reduce:transition-none",
                    "focus-visible:ring-3 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    isActive
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )
                }
              >
                <Icon className="size-4.5" aria-hidden="true" />
                {t(label)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

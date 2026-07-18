import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileNav } from "@/layouts/MobileNav"
import { useAuthStore } from "@/stores/auth-store"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function AppLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-svh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-clay focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
      >
        {t("common.skipToContent")}
      </a>
      <AppSidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-2 border-b border-border/70 px-4 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav />
            <span className="font-heading font-medium">{t("common.appName")}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={user.name}
                className="ml-1 flex size-11 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-9 ring-2 ring-primary/20">
                  <AvatarImage src={user.photoUrl ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="max-w-48 truncate">
                  {user.name}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    navigate("/login", { replace: true })
                  }}
                >
                  <LogOut aria-hidden="true" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

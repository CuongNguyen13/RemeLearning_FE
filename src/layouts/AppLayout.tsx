import { useTranslation } from "react-i18next"
import { Navigate, Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { MobileNav } from "@/layouts/MobileNav"
import { useAuthStore } from "@/stores/auth-store"

// Full-height app shell: the sidebar now owns the entire viewport height (h-svh)
// and stretches edge-to-edge, carrying brand, nav, language switcher, and the
// profile entry at its base. The header bar is reduced to a mobile-only element
// so the desktop layout has no redundant top rail competing with the sidebar.
export function AppLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-svh overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-clay focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
      >
        {t("common.skipToContent")}
      </a>
      <AppSidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only header: the persistent sidebar is hidden below md, so this
            thin bar gives the mobile drawer a trigger and shows the app name. */}
        <header className="flex h-16 items-center gap-2 border-b border-border/70 px-4 md:hidden">
          <MobileNav />
          <span className="font-heading font-medium">{t("common.appName")}</span>
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

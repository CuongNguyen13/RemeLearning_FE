import { GraduationCap } from "lucide-react"
import { motion, MotionConfig } from "motion/react"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet } from "react-router-dom"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useAuthStore } from "@/stores/auth-store"

// A simple declining-then-recovering curve: the Ebbinghaus forgetting curve this app is
// built around, spaced-repetition style - the one visual detail meant to stick with a viewer.
// Purely decorative, so it's hidden from assistive tech.
function ForgettingCurve() {
  return (
    <svg
      viewBox="0 0 320 140"
      fill="none"
      className="w-full max-w-xs opacity-90"
      aria-hidden="true"
    >
      <path
        d="M4 20 C 70 20, 90 100, 140 108 C 160 110, 165 60, 190 55 C 220 48, 235 100, 260 104 C 280 106, 290 50, 316 44"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="6 10"
      />
      <circle cx="140" cy="108" r="6" fill="white" />
      <circle cx="190" cy="55" r="6" fill="white" />
      <circle cx="260" cy="104" r="6" fill="white" />
      <circle cx="316" cy="44" r="6" fill="white" />
    </svg>
  )
}

export function AuthLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <a
          href="#auth-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-clay focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
        >
          {t("common.skipToContent")}
        </a>
        <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
          <div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 size-96 translate-x-1/3 translate-y-1/4 rounded-full bg-accent-warm/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-2 text-lg font-heading font-medium">
            <GraduationCap className="size-6" aria-hidden="true" />
            {t("common.appName")}
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <ForgettingCurve />
            <div>
              <h1 className="font-heading text-4xl leading-tight font-semibold text-balance">
                {t("auth.tagline")}
              </h1>
              <p className="mt-3 max-w-sm text-sidebar-foreground/80">{t("auth.taglineBody")}</p>
            </div>
          </div>

          <p className="relative z-10 text-xs text-sidebar-foreground/75">
            {t("categories.vocabulary")} &middot; {t("categories.grammar")} &middot;{" "}
            {t("categories.pronunciation")}
          </p>
        </section>

        <main className="relative flex flex-col">
          <header className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2 font-heading font-medium lg:hidden">
              <GraduationCap className="size-5 text-primary" aria-hidden="true" />
              {t("common.appName")}
            </div>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </header>
          <div
            id="auth-main-content"
            tabIndex={-1}
            className="flex flex-1 items-center justify-center p-4 pb-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-sm"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </MotionConfig>
  )
}

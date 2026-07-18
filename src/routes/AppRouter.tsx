import { lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import { AuthLayout } from "@/layouts/AuthLayout"

const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = lazy(() =>
  import("@/features/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
)
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
)
const RecordingsPage = lazy(() =>
  import("@/features/recordings/RecordingsPage").then((m) => ({ default: m.RecordingsPage }))
)
const WeakPointsPage = lazy(() =>
  import("@/features/weak-points/WeakPointsPage").then((m) => ({ default: m.WeakPointsPage }))
)
const RecommendationsPage = lazy(() =>
  import("@/features/recommendations/RecommendationsPage").then((m) => ({
    default: m.RecommendationsPage,
  }))
)
const PracticePage = lazy(() =>
  import("@/features/practice/PracticePage").then((m) => ({ default: m.PracticePage }))
)
const DictationPage = lazy(() =>
  import("@/features/dictation/DictationPage").then((m) => ({ default: m.DictationPage }))
)
const ProfilePage = lazy(() =>
  import("@/features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage }))
)

function RouteFallback() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      {t("common.loading")}
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "/recordings", element: <RecordingsPage /> },
      { path: "/weak-points", element: <WeakPointsPage /> },
      { path: "/recommendations", element: <RecommendationsPage /> },
      { path: "/practice", element: <PracticePage /> },
      { path: "/dictation", element: <DictationPage /> },
      { path: "/profile", element: <ProfilePage /> },
    ],
  },
  { path: "*", element: <AppLayout /> },
])

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

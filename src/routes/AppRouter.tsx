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
const DictationLessonPage = lazy(() =>
  import("@/features/dictation/DictationLessonPage").then((m) => ({ default: m.DictationLessonPage }))
)
const DictationAiPracticePage = lazy(() =>
  import("@/features/dictation/DictationAiPracticePage").then((m) => ({ default: m.DictationAiPracticePage }))
)
const ProfilePage = lazy(() =>
  import("@/features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage }))
)
const VocabularyLearnPage = lazy(() =>
  import("@/features/learn/vocabulary/VocabularyLearnPage").then((m) => ({
    default: m.VocabularyLearnPage,
  }))
)
const VocabularySectionPage = lazy(() =>
  import("@/features/learn/vocabulary/library/VocabularySectionPage").then((m) => ({
    default: m.VocabularySectionPage,
  }))
)
const GrammarLearnPage = lazy(() =>
  import("@/features/learn/grammar/GrammarLearnPage").then((m) => ({
    default: m.GrammarLearnPage,
  }))
)
const GrammarTopicContentPage = lazy(() =>
  import("@/features/learn/grammar/library/GrammarTopicContentPage").then((m) => ({
    default: m.GrammarTopicContentPage,
  }))
)
const GrammarLibrarySessionPage = lazy(() =>
  import("@/features/learn/grammar/library/GrammarLibrarySessionPage").then((m) => ({
    default: m.GrammarLibrarySessionPage,
  }))
)
const ListeningLearnPage = lazy(() =>
  import("@/features/learn/listening/ListeningLearnPage").then((m) => ({
    default: m.ListeningLearnPage,
  }))
)
const SpeakingLearnPage = lazy(() =>
  import("@/features/learn/speaking/SpeakingLearnPage").then((m) => ({
    default: m.SpeakingLearnPage,
  }))
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
      { path: "/dictation/lesson/:clipId", element: <DictationLessonPage /> },
      { path: "/dictation/ai-practice/:practiceItemId", element: <DictationAiPracticePage /> },
      { path: "/learn/vocabulary", element: <VocabularyLearnPage /> },
      { path: "/learn/vocabulary/section/:sectionId", element: <VocabularySectionPage /> },
      { path: "/learn/grammar", element: <GrammarLearnPage /> },
      { path: "/learn/grammar/library/topics/:topicId", element: <GrammarTopicContentPage /> },
      { path: "/learn/grammar/library/sessions/:sessionId", element: <GrammarLibrarySessionPage /> },
      { path: "/learn/listening", element: <ListeningLearnPage /> },
      { path: "/learn/speaking", element: <SpeakingLearnPage /> },
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

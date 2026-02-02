import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { PageLoading } from '@/components/ui/Loading'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import QuizPage from '@/pages/quiz/QuizPage'
import DiaryListPage from '@/pages/diary/DiaryListPage'
import DiaryNewPage from '@/pages/diary/DiaryNewPage'
import DiaryDetailPage from '@/pages/diary/DiaryDetailPage'
import DiaryStatsPage from '@/pages/diary/DiaryStatsPage'
import PersonaPage from '@/pages/persona/PersonaPage'
import PersonaChatPage from '@/pages/persona/PersonaChatPage'
import FriendListPage from '@/pages/friend/FriendListPage'
import NotificationListPage from '@/pages/notification/NotificationListPage'
import PremiumPage from '@/pages/premium/PremiumPage'
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage'
import TermsOfServicePage from '@/pages/legal/TermsOfServicePage'
import { MentalDashboardPage, BookRecommendationPage, MentalReportPage } from '@/pages/mental'

function App() {
  const { isAuthenticated, isHydrated } = useAuthStore()

  // 아직 localStorage에서 상태 복원 중이면 로딩 표시
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoading />
      </div>
    )
  }

  return (
    <>
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        {/* Quiz page - without layout for fullscreen experience */}
        <Route path="/quiz" element={<QuizPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/diaries" element={<DiaryListPage />} />
          <Route path="/diaries/new" element={<DiaryNewPage />} />
          <Route path="/diaries/stats" element={<DiaryStatsPage />} />
          <Route path="/diaries/:id" element={<DiaryDetailPage />} />
          <Route path="/persona" element={<PersonaPage />} />
          <Route path="/persona/chat" element={<PersonaChatPage />} />
          <Route path="/persona/chat/:chatId" element={<PersonaChatPage />} />
          <Route path="/friends" element={<FriendListPage />} />
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/mental" element={<MentalDashboardPage />} />
          <Route path="/mental/books" element={<BookRecommendationPage />} />
          <Route path="/mental/reports" element={<MentalReportPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default App

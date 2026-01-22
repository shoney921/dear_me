import { Routes, Route, Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { PageLoading } from '@/components/ui/Loading'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DiaryListPage from '@/pages/diary/DiaryListPage'
import DiaryNewPage from '@/pages/diary/DiaryNewPage'
import DiaryDetailPage from '@/pages/diary/DiaryDetailPage'
import DiaryStatsPage from '@/pages/diary/DiaryStatsPage'
import PersonaPage from '@/pages/persona/PersonaPage'
import PersonaChatPage from '@/pages/persona/PersonaChatPage'
import FriendListPage from '@/pages/friend/FriendListPage'
import NotificationListPage from '@/pages/notification/NotificationListPage'
import PremiumPage from '@/pages/premium/PremiumPage'
import CharacterPage from '@/pages/character/CharacterPage'

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

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
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
          <Route path="/character" element={<CharacterPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

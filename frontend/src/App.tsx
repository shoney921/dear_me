import { Routes, Route, Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DiaryListPage from '@/pages/diary/DiaryListPage'
import DiaryNewPage from '@/pages/diary/DiaryNewPage'
import DiaryDetailPage from '@/pages/diary/DiaryDetailPage'
import PersonaPage from '@/pages/persona/PersonaPage'
import PersonaChatPage from '@/pages/persona/PersonaChatPage'
import FriendListPage from '@/pages/friend/FriendListPage'

function App() {
  const { isAuthenticated } = useAuthStore()

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
          <Route path="/diaries/:id" element={<DiaryDetailPage />} />
          <Route path="/persona" element={<PersonaPage />} />
          <Route path="/persona/chat" element={<PersonaChatPage />} />
          <Route path="/persona/chat/:chatId" element={<PersonaChatPage />} />
          <Route path="/friends" element={<FriendListPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

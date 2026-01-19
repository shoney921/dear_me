import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Layout } from '@/components/common/Layout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { PageLoading } from '@/components/common/Loading'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HomePage } from '@/pages/HomePage'
import { DiaryListPage } from '@/pages/diaries/DiaryListPage'
import { DiaryNewPage } from '@/pages/diaries/DiaryNewPage'
import { DiaryDetailPage } from '@/pages/diaries/DiaryDetailPage'
import { PersonaProfile } from '@/pages/persona/PersonaProfile'
import { ChatList } from '@/pages/persona/ChatList'
import { ChatRoom } from '@/pages/persona/ChatRoom'

function App() {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoading />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
          }
        />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/diaries" element={<DiaryListPage />} />
          <Route path="/diaries/new" element={<DiaryNewPage />} />
          <Route path="/diaries/:id" element={<DiaryDetailPage />} />

          {/* Persona routes */}
          <Route path="/persona" element={<PersonaProfile />} />
          <Route path="/persona/chat" element={<ChatList />} />
          <Route path="/persona/chat/:chatId" element={<ChatRoom />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

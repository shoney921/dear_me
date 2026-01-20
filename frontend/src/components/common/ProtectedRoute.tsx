import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { PageLoading } from '@/components/ui/Loading'

export default function ProtectedRoute() {
  const { isAuthenticated, isHydrated } = useAuthStore()

  // 아직 localStorage에서 상태 복원 중
  if (!isHydrated) {
    return <PageLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
